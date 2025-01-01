"use server";

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

/**
 * A sample Puppeteer client to fetch responses from Claude web UI.
 * This uses cookies from claude-cookies.json to skip the login flow.
 */

const CLAUDE_COOKIES_PATH = path.join(process.cwd(), "claude-cookies.json");

// This function returns the entire response text from Claude (mock placeholders).
export async function fetchFromClaude(prompt: string): Promise<string> {
  console.log("[fetchFromClaude] Starting Puppeteer with prompt:", prompt);

  let browser;
  try {
    // IMPORTANT: Use non-headless Chrome with some extra args so it can open properly on many systems
    console.log("[fetchFromClaude] Launching Puppeteer (non-headless)...");
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
      // If you have a custom local Chrome path, you can specify executablePath here:
      // executablePath: "/usr/bin/google-chrome",
    });

    console.log("[fetchFromClaude] Browser launched.");
  } catch (launchError) {
    console.error("[fetchFromClaude] Error launching puppeteer:", launchError);
    throw launchError;
  }

  try {
    const page = await browser.newPage();
    console.log("[fetchFromClaude] New page created.");

    // 2) Load cookies from claude-cookies.json if available
    if (fs.existsSync(CLAUDE_COOKIES_PATH)) {
      console.log("[fetchFromClaude] Loading cookies from:", CLAUDE_COOKIES_PATH);
      const cookiesString = fs.readFileSync(CLAUDE_COOKIES_PATH, "utf-8");
      const parsedCookies = JSON.parse(cookiesString);
      await page.setCookie(...parsedCookies);
      console.log("[fetchFromClaude] Cookies set on page.");
    } else {
      console.warn("[fetchFromClaude] No claude-cookies.json found, might need to log in manually.");
    }

    // 3) Go directly to Claude's interface. This domain must match your cookie domain.
    console.log("[fetchFromClaude] Navigating to claude.ai/new ...");
    await page.goto("https://claude.ai/new", { waitUntil: "networkidle0" });
    console.log("[fetchFromClaude] Page loaded:", await page.title());

    // 4) Check if you are logged in
    const loginButton = await page.$("button#login-button");
    if (loginButton) {
      console.log("[fetchFromClaude] Detected login button. Session may be invalid or expired.");
      // For real usage, you'd handle login or throw an error
    }

    // 5) Interact with the prompt box (this is placeholder logic).
    console.log("[fetchFromClaude] Typing prompt (placeholder logic).");
    // For example:
    // await page.type("textarea.someSelector", prompt);
    // await page.click("button.submitPrompt");

    // 6) Wait for answer (placeholder)
    // For example:
    // await page.waitForSelector(".assistantMessage", { timeout: 15000 });
    // const assistantMessage = await page.$(".assistantMessage");
    // const answerText = await page.evaluate(el => el.textContent, assistantMessage);

    // Mock the answer for now
    const answerText = `Claude response (mock) for prompt: ${prompt}`;

    // 7) Optionally re-save cookies if they changed
    console.log("[fetchFromClaude] Saving cookies after browsing...");
    const currentCookies = await page.cookies();
    fs.writeFileSync(CLAUDE_COOKIES_PATH, JSON.stringify(currentCookies, null, 2));
    console.log("[fetchFromClaude] Cookies re-saved to claude-cookies.json");

    console.log("[fetchFromClaude] Returning mock answer text.");
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