"use server";

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const CLAUDE_COOKIES_PATH = path.join(process.cwd(), "claude-cookies.json");

// We'll insert the entire prompt at once, then press Enter.
export async function fetchFromClaude(prompt: string): Promise<string> {
  console.log("[fetchFromClaude] Starting Puppeteer with prompt:", prompt);

  let browser;
  try {
    console.log("[fetchFromClaude] Launching Puppeteer (non-headless)...");
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });
    console.log("[fetchFromClaude] Browser launched.");
  } catch (launchError) {
    console.error("[fetchFromClaude] Error launching Puppeteer:", launchError);
    throw launchError;
  }

  try {
    const page = await browser.newPage();
    console.log("[fetchFromClaude] New page created.");

    // 1) Load cookies if we have them
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
      console.log("[fetchFromClaude] Detected login button. Possibly invalid session.");
      // Possibly throw error or handle login here
    }

    // 4) Insert entire prompt text directly into contenteditable
    const contentEditableSelector = 'div[contenteditable="true"]';
    console.log("[fetchFromClaude] Waiting for contenteditable...");
    await page.waitForSelector(contentEditableSelector, { timeout: 15000 });

    console.log("[fetchFromClaude] Inserting prompt text all at once...");
    await page.evaluate(
      (selector, text) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!el) {
          throw new Error("[fetchFromClaude] Couldn’t find the contenteditable input!");
        }

        // Overwrite any existing text
        el.innerText = text;
      },
      contentEditableSelector,
      prompt
    );

    // 5) Focus the field (optional) and press Enter to send
    console.log("[fetchFromClaude] Pressing Enter to submit...");
    await page.focus(contentEditableSelector);
    await page.keyboard.press("Enter");

    // 6) Wait for response (placeholder)
    console.log("[fetchFromClaude] Waiting for Claude to respond... (placeholder)");

    // 7) Save cookies
    console.log("[fetchFromClaude] Saving cookies after browsing...");
    const currentCookies = await page.cookies();
    fs.writeFileSync(CLAUDE_COOKIES_PATH, JSON.stringify(currentCookies, null, 2));
    console.log("[fetchFromClaude] Cookies re-saved to claude-cookies.json");

    // Return a placeholder answer for demonstration.
    const answerText = `Claude response (mock) for prompt: ${prompt}`;
    return answerText;
  } catch (error) {
    console.error("[fetchFromClaude] Error while fetching from Claude:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("[fetchFromClaude] Browser closed.");
    }
  }
}