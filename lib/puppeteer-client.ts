"use server";

import fs from "fs";
import path from "path";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";

const CLAUDE_COOKIES_PATH = path.join(process.cwd(), "claude-cookies.json");

/**
 * fetchFromClaude
 * 1. Launch Puppeteer
 * 2. Navigate & insert prompt
 * 3. Wait for new message
 * 4. Wait until streaming ends
 * 5. Pause briefly, then look for the copy button
 * 6. Click it, read the clipboard
 * 7. Return the text (paste into output)
 */
export async function fetchFromClaude(prompt: string): Promise<string> {
  console.log("[fetchFromClaude] Starting Puppeteer with prompt:\n", prompt);

  let browser: Browser | undefined;
  try {
    console.log("[fetchFromClaude] Launching Puppeteer (non-headless)...");
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled"
      ]
    });
    console.log("[fetchFromClaude] Browser launched successfully.");

    // NEW LINE: Override clipboard permissions for claude.ai
    console.log("[fetchFromClaude] Overriding permissions for claude.ai...");
    await browser.defaultBrowserContext().overridePermissions("https://claude.ai", [
      "clipboard-read",
      "clipboard-write"
    ]);
    console.log("[fetchFromClaude] Clipboard permissions granted.");

  } catch (error) {
    console.error("[fetchFromClaude] Error launching Puppeteer:", error);
    throw error;
  }

  try {
    const page = await browser.newPage();
    console.log("[fetchFromClaude] New page created.");

    // 1) Load cookies if present
    if (fs.existsSync(CLAUDE_COOKIES_PATH)) {
      console.log("[fetchFromClaude] Loading cookies from:", CLAUDE_COOKIES_PATH);
      const cookiesString = fs.readFileSync(CLAUDE_COOKIES_PATH, "utf-8");
      const parsedCookies = JSON.parse(cookiesString);
      await page.setCookie(...parsedCookies);
      console.log("[fetchFromClaude] Cookies set on page.");
    } else {
      console.warn("[fetchFromClaude] No claude-cookies.json found.");
    }

    // 2) Go to Claude
    console.log("[fetchFromClaude] Navigating to claude.ai/new...");
    await page.goto("https://claude.ai/new", { waitUntil: "networkidle0" });
    console.log("[fetchFromClaude] Page loaded =>", await page.title());

    // 3) Check if logged in
    const loginButton = await page.$("button#login-button");
    if (loginButton) {
      console.error("[fetchFromClaude] Possibly not logged in (login button detected).");
    }

    // 4) Insert prompt
    const contentEditableSelector = 'div[contenteditable="true"]';
    console.log("[fetchFromClaude] Waiting for contenteditable...");
    await page.waitForSelector(contentEditableSelector, { timeout: 15000 });

    console.log("[fetchFromClaude] Typing prompt...");
    await page.evaluate((selector: string, txt: string) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) throw new Error("[fetchFromClaude] contenteditable not found!");
      el.innerText = txt;
    }, contentEditableSelector, prompt);

    // We'll track messages by their container: "div.font-claude-message"
    const messageContainerSelector = "div.font-claude-message";

    // 5) Count old messages
    const oldCount = await page.$$eval(messageContainerSelector, (msgs: Element[]) => msgs.length);
    console.log("[fetchFromClaude] oldCount =", oldCount);

    // Press Enter
    console.log("[fetchFromClaude] Pressing Enter to submit prompt...");
    await page.focus(contentEditableSelector);
    await page.keyboard.press("Enter");

    // 6) Wait for new message container
    console.log("[fetchFromClaude] Waiting for new message container...");
    const maxNewMsgTries = 30; // up to ~60s
    let newCount = oldCount;

    for (let i = 0; i < maxNewMsgTries; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      newCount = await page.$$eval(messageContainerSelector, (msgs: Element[]) => msgs.length);
      console.log(`[fetchFromClaude] Check #${i + 1}: newCount=${newCount} oldCount=${oldCount}`);
      if (newCount > oldCount) {
        console.log("[fetchFromClaude] Found a new message container, waiting for streaming to finish...");
        break;
      }
    }
    if (newCount <= oldCount) {
      console.warn("[fetchFromClaude] Timed out or no new messages arrived from Claude.");
      return "";
    }

    // 7) Wait for data-is-streaming="true" to go away
    const maxStreamTries = 30; // up to ~60s
    for (let j = 0; j < maxStreamTries; j++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const stillStreaming = await page.$$eval('div[data-is-streaming="true"]', (els: Element[]) => els.length);
      console.log(`[fetchFromClaude] Stream check #${j + 1}: stillStreamingCount=${stillStreaming}`);
      if (stillStreaming === 0) {
        console.log("[fetchFromClaude] data-is-streaming=false => message is complete!");
        break;
      }
    }

    // 8) Wait a second or two for the "Copy" button to appear
    console.log("[fetchFromClaude] Pausing 2s so copy button can appear...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let finalAnswer = "";
    const maxButtonTries = 5;

    const containerHandles = await page.$$(messageContainerSelector);
    const lastContainer = containerHandles[containerHandles.length - 1];
    if (!lastContainer) {
      console.warn("[fetchFromClaude] Could not find the last message container!");
      finalAnswer = await lastMessageTextFallback(page, messageContainerSelector);
    } else {
      for (let k = 0; k < maxButtonTries; k++) {
        console.log(`[fetchFromClaude] Copy button detection attempt #${k + 1}`);
        
        try {
          // Wait for the button to be fully loaded
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Try to find and click the copy button using XPath
          const clicked = await lastContainer.evaluate((container) => {
            // The exact XPath for the copy button
            const COPY_BUTTON_XPATH = '/html/body/div[3]/div/div/div[2]/div[1]/div[1]/div[2]/div/div/div[2]/div/div/div[1]/button[1]';
            
            // Try XPath first
            const result = document.evaluate(
              COPY_BUTTON_XPATH,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            );
            
            const copyButton = result.singleNodeValue as HTMLButtonElement;
            if (copyButton) {
              copyButton.click();
              return true;
            }

            // Fallback: try to find by SVG content
            const buttons = Array.from(container.querySelectorAll('button'));
            const fallbackButton = buttons.find(btn => {
              const svg = btn.querySelector('svg[viewBox="0 0 256 256"]');
              const path = btn.querySelector('path[d^="M200,32H163.74"]');
              return svg && path && btn.textContent?.includes('Copy');
            });

            if (fallbackButton) {
              fallbackButton.click();
              return true;
            }

            return false;
          });

          if (clicked) {
            // Wait for clipboard
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Try to get clipboard content
            finalAnswer = await page.evaluate(async () => {
              try {
                return await navigator.clipboard.readText();
              } catch (e) {
                return '';
              }
            });

            if (finalAnswer && finalAnswer.length > 10) {
              console.log("[fetchFromClaude] Successfully got text from clipboard");
              break;
            }
          } else {
            console.log("[fetchFromClaude] Copy button not found, retrying...");
          }

          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (e) {
          console.error("[fetchFromClaude] Error in copy attempt:", e);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // If clipboard methods failed, fall back to direct text extraction
      if (!finalAnswer) {
        console.log("[fetchFromClaude] All clipboard attempts failed, falling back to text extraction...");
        finalAnswer = await lastMessageTextFallback(page, messageContainerSelector);
      }
    }

    // 9) Save cookies
    console.log("[fetchFromClaude] Saving cookies...");
    const currentCookies = await page.cookies();
    fs.writeFileSync(CLAUDE_COOKIES_PATH, JSON.stringify(currentCookies, null, 2));
    console.log("[fetchFromClaude] Cookies saved to claude-cookies.json");

    return finalAnswer || "";
  } catch (error) {
    console.error("[fetchFromClaude] Error:", error);
    throw error;
  } finally {
    if (browser) {
      console.log("[fetchFromClaude] Closing browser...");
      await browser.close();
      console.log("[fetchFromClaude] Browser closed.");
    }
  }
}

/**
 * lastMessageTextFallback
 * If we fail to click the correct button, we scrape text from the last message container as fallback.
 */
async function lastMessageTextFallback(
  page: Page,
  messageContainerSelector: string
): Promise<string> {
  try {
    const containerHandles = await page.$$(messageContainerSelector);
    const lastContainer = containerHandles[containerHandles.length - 1];
    if (!lastContainer) {
      console.warn("[lastMessageTextFallback] No container found!");
      return "";
    }

    return await lastContainer.evaluate((container) => {
      const cleanText = (text: string) => {
        return text
          .replace(/\s+/g, ' ')
          .replace(/\n+/g, '\n')
          .trim();
      };

      const selectors = [
        '[data-message-author-role="assistant"]',
        '[data-message-content="true"]',
        '.prose',
        '.whitespace-pre-wrap',
      ];

      for (const selector of selectors) {
        const element = container.querySelector(selector);
        if (element) {
          const clone = element.cloneNode(true) as Element;
          clone.querySelectorAll('button, svg, .copy-button, [role="button"], [data-message-author-role="user"]').forEach(el => el.remove());
          const text = cleanText(clone.textContent || '');
          if (text && !text.includes('svg') && !text.includes('xmlns') && text.length > 10) {
            return text;
          }
        }
      }

      const clone = container.cloneNode(true) as Element;
      clone.querySelectorAll('button, svg, .copy-button, [role="button"], [data-message-author-role="user"]').forEach(el => el.remove());
      return cleanText(clone.textContent || '');
    });
  } catch (error) {
    console.error("[lastMessageTextFallback] Error:", error);
    return "";
  }
}