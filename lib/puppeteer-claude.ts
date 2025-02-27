"use server";

import fs from "fs";
import path from "path";
import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";

const CLAUDE_COOKIES_PATH = path.join(process.cwd(), "claude-cookies.json");

export async function fetchFromClaude(prompt: string): Promise<string> {
  console.log("[fetchFromClaude] Starting Puppeteer (non-headless)...");
  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: false, // see browser window
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });
    console.log("[fetchFromClaude] Browser launched successfully.");

    console.log("[fetchFromClaude] Overriding permissions for claude.ai...");
    await browser.defaultBrowserContext().overridePermissions("https://claude.ai", [
      "clipboard-read",
      "clipboard-write",
    ]);
    console.log("[fetchFromClaude] Clipboard permissions granted.");
  } catch (error) {
    console.error("[fetchFromClaude] Error launching Puppeteer:", error);
    throw error;
  }

  try {
    const page = await browser.newPage();

    // 1) Overwrite Clipboard API before site loads
    await page.evaluateOnNewDocument(() => {
      (window as any)._puppeteerClipboard = "";

      if (navigator.clipboard && navigator.clipboard.writeText) {
        const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
        (navigator.clipboard as any).writeText = async (data: string) => {
          (window as any)._puppeteerClipboard = data;
          return originalWriteText(data);
        };
      }

      const originalExecCommand = document.execCommand;
      document.execCommand = function (commandId, showUI, value) {
        const result = originalExecCommand.apply(this, [commandId, showUI, value]);
        if (commandId === "copy") {
          const selection = window.getSelection && window.getSelection();
          if (selection && selection.toString()) {
            (window as any)._puppeteerClipboard = selection.toString();
          }
        }
        return result;
      };
    });

    // 2) Load cookies
    if (fs.existsSync(CLAUDE_COOKIES_PATH)) {
      const cookiesString = fs.readFileSync(CLAUDE_COOKIES_PATH, "utf-8");
      const parsedCookies = JSON.parse(cookiesString);
      await page.setCookie(...parsedCookies);
      console.log("[fetchFromClaude] Cookies set on page.");
    }

    // 3) Navigate to Claude
    await page.goto("https://claude.ai/new", { waitUntil: "networkidle0" });
    console.log("[fetchFromClaude] Page loaded =>", await page.title());

    // 4) Check if logged in
    const loginButton = await page.$("button#login-button");
    if (loginButton) {
      console.warn("[fetchFromClaude] Possibly not logged in. Might fail if we need an authenticated user!");
    }

    // 5) Insert prompt
    const contentEditableSelector = 'div[contenteditable="true"]';
    await page.waitForSelector(contentEditableSelector, { timeout: 20000 });
    await page.evaluate(
      (selector: string, txt: string) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (el) el.innerText = txt;
      },
      contentEditableSelector,
      prompt
    );

    // 6) Count older messages
    const messageContainerSelector = "div.font-claude-message";
    const oldCount = await page.$$eval(messageContainerSelector, (msgs) => msgs.length);

    // Press Enter
    await page.focus(contentEditableSelector);
    await page.keyboard.press("Enter");

    // 7) Wait for new message
    let newCount = oldCount;
    for (let i = 0; i < 30; i++) {
      await delay(2000);
      newCount = await page.$$eval(messageContainerSelector, (msgs) => msgs.length);
      if (newCount > oldCount) break;
    }
    if (newCount <= oldCount) {
      console.warn("[fetchFromClaude] Timed out waiting for new message!");
      return "";
    }

    // 8) Wait until streaming ends
    for (let j = 0; j < 30; j++) {
      await delay(2000);
      const stillStreaming = await page.$$eval('div[data-is-streaming="true"]', (els) => els.length);
      if (stillStreaming === 0) break;
    }

    // 9) Wait a bit so Copy button definitely appears
    await delay(3000);

    // 10) Last container
    const containerHandles = await page.$$(messageContainerSelector);
    const lastContainer = containerHandles[containerHandles.length - 1];
    if (!lastContainer) {
      console.warn("[fetchFromClaude] No last container!");
      return "";
    }

    let finalAnswer = "";
    const maxButtonTries = 5;

    // 11) Attempt to click Copy button multiple times
    for (let k = 0; k < maxButtonTries; k++) {
      console.log(`[fetchFromClaude] Copy button detection attempt #${k + 1}`);
      await delay(2000);

      const clicked = await lastContainer.evaluate((container) => {
        const COPY_BUTTON_XPATH =
          '/html/body/div[3]/div/div/div[2]/div[1]/div[1]/div[2]/div/div/div[2]/div/div/div[1]/button[1]';
        const result = document.evaluate(COPY_BUTTON_XPATH, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const copyButton = result.singleNodeValue as HTMLButtonElement | null;
        if (copyButton) {
          copyButton.click();
          return true;
        }

        const buttons = Array.from(container.querySelectorAll("button"));
        const fallback = buttons.find((btn) => {
          const svg = btn.querySelector('svg[viewBox="0 0 256 256"]');
          const path = btn.querySelector('path[d^="M200,32H163.74"]');
          return svg && path && btn.textContent?.includes("Copy");
        });
        if (fallback) {
          fallback.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        await delay(1500);
        const data = await page.evaluate(() => (window as any)._puppeteerClipboard);
        if (data && typeof data === "string" && data.trim().length > 0) {
          finalAnswer = data;
          console.log(`[fetchFromClaude] Copied text length=${data.length}`);
          break;
        } else {
          console.log("[fetchFromClaude] Copy was clicked but no data in _puppeteerClipboard, retrying...");
        }
      } else {
        console.log("[fetchFromClaude] Copy button not found or not clicked, retrying...");
      }
    }

    // 12) Fallback to direct DOM extraction
    if (!finalAnswer) {
      console.warn("[fetchFromClaude] No data from copy, fallback to DOM extraction");
      finalAnswer = await lastMessageTextFallback(page, messageContainerSelector);
    }

    // 13) Save cookies
    const currentCookies = await page.cookies();
    fs.writeFileSync(CLAUDE_COOKIES_PATH, JSON.stringify(currentCookies, null, 2));

    return finalAnswer;
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

async function lastMessageTextFallback(page: any, messageSelector: string): Promise<string> {
  try {
    const containers = await page.$$(messageSelector);
    const last = containers[containers.length - 1];
    if (!last) return "";

    return await last.evaluate((node: Element) => {
      const clean = (text: string) => text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
      node.querySelectorAll("button, svg, .copy-button, [role='button']").forEach((el) => el.remove());
      return clean(node.textContent || "");
    });
  } catch (err) {
    console.error("[lastMessageTextFallback] Error:", err);
    return "";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}