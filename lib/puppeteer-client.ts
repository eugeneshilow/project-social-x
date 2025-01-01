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
  // 1) Launch a browser (headless: false if you want to watch the browser)
  const browser = await puppeteer.launch({
    headless: true, 
  });

  try {
    const page = await browser.newPage();

    // 2) Load cookies from claude-cookies.json if available
    if (fs.existsSync(CLAUDE_COOKIES_PATH)) {
      const cookiesString = fs.readFileSync(CLAUDE_COOKIES_PATH, "utf-8");
      const parsedCookies = JSON.parse(cookiesString);
      await page.setCookie(...parsedCookies);
      console.log("Loaded cookies from claude-cookies.json");
    } else {
      console.warn("No claude-cookies.json found, might need to log in manually.");
    }

    // 3) Go directly to Claude's interface. This domain must match your cookie domain.
    await page.goto("https://claude.ai/new", { waitUntil: "networkidle0" });

    // 4) Check if you are logged in by looking for something that only appears when logged in.
    //    For example, maybe there's a unique selector that appears once logged in:
    const loginButton = await page.$("button#login-button");
    if (loginButton) {
      console.log("Detected login button. Possibly session is not valid or expired.");
      // You could choose to throw an error or attempt some manual login here.
    }

    // 5) Interact with the prompt box (this is placeholder logic).
    //    In reality, you'd find the correct selectors to type the prompt and retrieve the answer.
    console.log("Typing prompt (placeholder logic).");
    // Example: 
    // await page.type("textarea.someSelector", prompt);
    // await page.click("button.submitPrompt");

    // 6) Wait for answer. For instance, if there's a .message-bubble with the assistant's text:
    // await page.waitForSelector(".assistantMessage", { timeout: 15000 });
    // const assistantMessage = await page.$(".assistantMessage");
    // const answerText = await page.evaluate(el => el.textContent, assistantMessage);

    // For now, we mock the answer:
    const answerText = `Claude response (mock) for prompt: ${prompt}`;

    // 7) Optionally re-save cookies if they changed
    const currentCookies = await page.cookies();
    fs.writeFileSync(CLAUDE_COOKIES_PATH, JSON.stringify(currentCookies, null, 2));
    console.log("Re-saved cookies to claude-cookies.json");

    return answerText;
  } catch (error) {
    console.error("Error while fetching from Claude:", error);
    throw error;
  } finally {
    await browser.close();
  }
}