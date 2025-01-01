"use server";

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const CLAUDE_COOKIES_PATH = path.join(process.cwd(), "claude-cookies.json");

/**
 * fetchFromClaude
 * Launches Puppeteer, navigates to Claude, inserts user prompt,
 * waits for new message, returns the last message's text.
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
      // Potentially handle login or throw an error
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

    // 5) Count old messages: use "div.font-claude-message p"
    const messageSelector = "div.font-claude-message p";
    const oldCount = await page.$$eval(messageSelector, (msgs) => msgs.length);
    console.log("[fetchFromClaude] oldCount =", oldCount);

    // Press Enter
    console.log("[fetchFromClaude] Pressing Enter to submit prompt...");
    await page.focus(contentEditableSelector);
    await page.keyboard.press("Enter");

    // 6) Poll for new messages (2 minutes total)
    console.log("[fetchFromClaude] Polling for new messages up to 2 minutes...");

    let newCount = oldCount;
    const maxTries = 60; // each try is 2s => 120s total
    for (let i = 0; i < maxTries; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s
      newCount = await page.$$eval(messageSelector, (msgs) => msgs.length);
      console.log(`[fetchFromClaude] Try #${i + 1}: newCount=${newCount} oldCount=${oldCount}`);
      if (newCount > oldCount) break;
    }

    // 7) If no new message, return empty
    if (newCount <= oldCount) {
      console.warn("[fetchFromClaude] Timed out or no new messages arrived from Claude.");
      return "";
    }

    // 8) Get the last message's text
    const lastResponse = await page.evaluate((sel) => {
      const msgs = document.querySelectorAll(sel);
      const lastMsg = msgs[msgs.length - 1] as HTMLElement | null;
      return lastMsg?.innerText.trim() || "";
    }, messageSelector);

    console.log("[fetchFromClaude] lastResponse:\n", lastResponse);

    // 9) Save cookies
    const currentCookies = await page.cookies();
    fs.writeFileSync(CLAUDE_COOKIES_PATH, JSON.stringify(currentCookies, null, 2));
    console.log("[fetchFromClaude] Cookies saved to claude-cookies.json");

    return lastResponse;
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