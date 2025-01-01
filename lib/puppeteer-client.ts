"use server";

import fs from "fs";
import path from "path";
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

  let browser: puppeteer.Browser | undefined;
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
      // Could handle login here or throw
    }

    // 4) Insert prompt
    const contentEditableSelector = 'div[contenteditable="true"]';
    console.log("[fetchFromClaude] Waiting for contenteditable...");
    await page.waitForSelector(contentEditableSelector, { timeout: 15000 });

    console.log("[fetchFromClaude] Typing prompt...");
    await page.evaluate((selector, txt) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) throw new Error("[fetchFromClaude] contenteditable not found!");
      el.innerText = txt;
    }, contentEditableSelector, prompt);

    // We'll track messages by their container: "div.font-claude-message"
    const messageContainerSelector = "div.font-claude-message";

    // 5) Count old messages
    const oldCount = await page.$$eval(messageContainerSelector, (msgs) => msgs.length);
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
      newCount = await page.$$eval(messageContainerSelector, (msgs) => msgs.length);
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
      const stillStreaming = await page.$$eval('div[data-is-streaming="true"]', (els) => els.length);
      console.log(`[fetchFromClaude] Stream check #${j + 1}: stillStreamingCount=${stillStreaming}`);
      if (stillStreaming === 0) {
        console.log("[fetchFromClaude] data-is-streaming=false => message is complete!");
        break;
      }
    }

    // 8) Wait a second or two for the "Copy" button to appear
    console.log("[fetchFromClaude] Pausing 2s so copy button can appear...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 9) Attempt up to 5 times (1s each) to find/click the "Copy" button in the last container
    let finalAnswer = "";
    const maxButtonTries = 5;
    for (let k = 0; k < maxButtonTries; k++) {
      const containerHandles = await page.$$(messageContainerSelector);
      const lastContainer = containerHandles[containerHandles.length - 1];
      if (!lastContainer) {
        console.warn("[fetchFromClaude] Could not find the last message container!");
        break;
      }

      // We'll do a direct approach: check all 'button' elements for textContent == 'Copy'
      const buttons = await lastContainer.$$("button");
      let copyButtonFound = false;
      for (const btn of buttons) {
        const btnText = await btn.evaluate((el) => el.textContent?.trim() || "");
        if (btnText === "Copy") {
          console.log("[fetchFromClaude] Found the Copy button, clicking it now...");
          await btn.click();

          // Now read from clipboard
          console.log("[fetchFromClaude] Reading from navigator.clipboard...");
          finalAnswer = await page.evaluate(async () => {
            return await navigator.clipboard.readText();
          });

          console.log("[fetchFromClaude] finalAnswer from clipboard =>\n", finalAnswer);
          copyButtonFound = true;
          break;
        }
      }

      if (copyButtonFound) {
        break;
      } else {
        console.log(`[fetchFromClaude] Try #${k + 1}: No copy button found, waiting 1s...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // If for some reason finalAnswer is still empty, we’ll try a fallback: get text from DOM
    if (!finalAnswer) {
      console.warn("[fetchFromClaude] Copy button not found or copy failed; trying fallback...");
      finalAnswer = await lastMessageTextFallback(page, messageContainerSelector);
    }

    // 10) Save cookies
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
 * If we fail to find/click the copy button, as a fallback we can scrape the text from the last message container.
 */
async function lastMessageTextFallback(
  page: puppeteer.Page,
  messageContainerSelector: string
): Promise<string> {
  try {
    const containerHandles = await page.$$(messageContainerSelector);
    const lastContainer = containerHandles[containerHandles.length - 1];
    if (!lastContainer) {
      console.warn("[lastMessageTextFallback] Could not find the last message container!");
      return "";
    }

    const fallbackText = await lastContainer.evaluate((node) => node.innerText.trim());
    console.log("[lastMessageTextFallback] Fallback text =>\n", fallbackText);
    return fallbackText;
  } catch (error) {
    console.error("[lastMessageTextFallback] Error scraping last message text:", error);
    return "";
  }
}