"use server";

import fs from "fs";
import path from "path";
import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";

const CHATGPT_COOKIES_PATH = path.join(process.cwd(), "chatgpt-cookies.json");

/**
 * Puppeteer-based function to fetch ChatGPT's response,
 * mirroring the approach used in puppeteer-claude.ts by setting the innerText of the contenteditable field directly.
 */
export async function fetchFromChatGPT(prompt: string): Promise<string> {
  console.log("[fetchFromChatGPT] Starting Puppeteer for ChatGPT (non-headless)...");
  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled"
      ]
    });
    console.log("[fetchFromChatGPT] Browser launched successfully.");
  } catch (error) {
    console.error("[fetchFromChatGPT] Error launching Puppeteer:", error);
    throw error;
  }

  try {
    const page = await browser.newPage();
    console.log("[fetchFromChatGPT] New page created.");

    // Optionally set a viewport for consistency
    await page.setViewport({ width: 1280, height: 900 });

    // Load cookies if present
    if (fs.existsSync(CHATGPT_COOKIES_PATH)) {
      console.log("[fetchFromChatGPT] Found ChatGPT cookies, trying to set them.");
      const cookiesString = fs.readFileSync(CHATGPT_COOKIES_PATH, "utf-8");
      const parsedCookies = JSON.parse(cookiesString);
      if (Array.isArray(parsedCookies) && parsedCookies.length > 0) {
        await page.setCookie(...parsedCookies);
        console.log("[fetchFromChatGPT] Cookies set on page.");
      } else {
        console.warn("[fetchFromChatGPT] Cookie file exists but is empty or invalid.");
      }
    } else {
      console.warn("[fetchFromChatGPT] No cookies file found. Might need manual login.");
    }

    // Navigate to the chat page (user domain or official)
    const targetURL = "https://chatgpt.com/";
    console.log("[fetchFromChatGPT] Navigating to:", targetURL);
    await page.goto(targetURL, { waitUntil: "networkidle0" });
    console.log(`[fetchFromChatGPT] Page loaded => "${await page.title()}"`);
    console.log("[fetchFromChatGPT] Current URL =>", page.url());

    // Check if we might be stuck on login
    if (page.url().includes("/auth/login")) {
      console.warn("[fetchFromChatGPT] Possibly stuck on login page. Valid cookies or automated login needed.");
    }

    // Based on snippet, there's a visible <div contenteditable="true" id="prompt-textarea"> in the final DOM
    const contentEditableSelector = 'div#prompt-textarea.ProseMirror';
    console.log("[fetchFromChatGPT] Waiting for selector =>", contentEditableSelector);
    await page.waitForSelector(contentEditableSelector, { timeout: 45000 });
    console.log("[fetchFromChatGPT] Found contenteditable div for prompt.");

    // Insert the prompt by directly setting innerText, then press Enter
    await page.evaluate((selector: string, txt: string) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) el.innerText = txt;
    }, contentEditableSelector, prompt);

    console.log("[fetchFromChatGPT] Prompt inserted. Pressing Enter...");
    await page.focus(contentEditableSelector);
    await page.keyboard.press("Enter");

    // Wait/poll for the response
    const messageSelector = "div.group.w-full";
    let finalAnswer = "";

    // We'll detect if the text stabilizes for consecutive polls
    let stableCount = 0;
    let lastMessage = "";
    const requiredStableRounds = 3;

    for (let i = 0; i < 60; i++) {
      await delay(2000);

      const messages = await page.$$eval(messageSelector, (els) =>
        els.map((el) => el.textContent?.trim() || "")
      );

      if (messages.length > 0) {
        finalAnswer = messages[messages.length - 1];
      } else {
        finalAnswer = "";
      }

      // Check if there's a "Stop generating" button => means it's still streaming
      const isGenerating = await page.$$eval("button", (btns) =>
        btns.some((b) => b.textContent?.includes("Stop generating"))
      );

      if (finalAnswer === lastMessage) {
        stableCount++;
      } else {
        stableCount = 0;
        lastMessage = finalAnswer;
      }

      console.log(
        `[fetchFromChatGPT] Poll #${i + 1} => isGenerating=${isGenerating}, stableCount=${stableCount}, ` +
        `lastMessage="${finalAnswer.slice(0, 60)}..."`
      );

      // If no "Stop generating" button is visible and text hasn't changed for ~3 polls, we consider it done
      if (!isGenerating && stableCount >= requiredStableRounds && finalAnswer) {
        console.log("[fetchFromChatGPT] Text stabilized. Breaking loop.");
        break;
      }
    }

    // Save cookies
    try {
      const currentCookies = await page.cookies();
      fs.writeFileSync(CHATGPT_COOKIES_PATH, JSON.stringify(currentCookies, null, 2));
      console.log("[fetchFromChatGPT] Updated cookies saved.");
    } catch (err) {
      console.error("[fetchFromChatGPT] Error saving cookies:", err);
    }

    console.log("[fetchFromChatGPT] Final answer length =>", finalAnswer.length);
    return finalAnswer || "";
  } catch (error) {
    console.error("[fetchFromChatGPT] Error:", error);
    throw error;
  } finally {
    if (browser) {
      console.log("[fetchFromChatGPT] Closing browser...");
      await browser.close();
      console.log("[fetchFromChatGPT] Browser closed.");
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}