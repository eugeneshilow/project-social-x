"use server";

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const CLAUDE_COOKIES_PATH = path.join(process.cwd(), "claude-cookies.json");

// Now we’ll also type into the contenteditable area.
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

    // 1) Load cookies
    if (fs.existsSync(CLAUDE_COOKIES_PATH)) {
      console.log("[fetchFromClaude] Loading cookies from:", CLAUDE_COOKIES_PATH);
      const cookiesString = fs.readFileSync(CLAUDE_COOKIES_PATH, "utf-8");
      const parsedCookies = JSON.parse(cookiesString);
      await page.setCookie(...parsedCookies);
      console.log("[fetchFromClaude] Cookies set on page.");
    } else {
      console.warn("[fetchFromClaude] No claude-cookies.json found.");
    }

    // 2) Navigate to Claude
    console.log("[fetchFromClaude] Navigating to claude.ai/new...");
    await page.goto("https://claude.ai/new", { waitUntil: "networkidle0" });
    console.log("[fetchFromClaude] Page loaded =>", await page.title());

    // 3) If login button is present, session might be invalid
    const loginButton = await page.$("button#login-button");
    if (loginButton) {
      console.log("[fetchFromClaude] Detected login button. Possibly invalid session.");
      // Optionally throw an error or attempt login logic
    }

    // 4) Type into the contenteditable input
    console.log("[fetchFromClaude] Locating contenteditable input...");
    const contentEditableSelector = 'div[contenteditable="true"]';
    await page.waitForSelector(contentEditableSelector, { timeout: 15000 });
    const contentEditable = await page.$(contentEditableSelector);

    if (!contentEditable) {
      throw new Error("[fetchFromClaude] Couldn’t find the contenteditable input!");
    }

    console.log("[fetchFromClaude] Clicking contenteditable to focus...");
    await contentEditable.click({ clickCount: 1, delay: 100 });

    console.log("[fetchFromClaude] Typing prompt =>", prompt);
    await page.keyboard.type(prompt, { delay: 20 }); // small delay for realism

    // 5) Press Enter or click “Send” button (the below is placeholder logic).
    console.log("[fetchFromClaude] Pressing Enter to submit...");
    await page.keyboard.press("Enter");

    // 6) Wait for the response. This part depends on the real DOM structure.
    // For now, we mock the answer.
    console.log("[fetchFromClaude] Waiting for Claude to respond... (placeholder)");
    // e.g. await page.waitForSelector('.assistantMessage');

    // 7) Save cookies
    console.log("[fetchFromClaude] Saving cookies after browsing...");
    const currentCookies = await page.cookies();
    fs.writeFileSync(CLAUDE_COOKIES_PATH, JSON.stringify(currentCookies, null, 2));
    console.log("[fetchFromClaude] Cookies re-saved to claude-cookies.json");

    // Return a mock string for demonstration.
    // If you want to scrape the real reply, find the appropriate selector and extract textContent.
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