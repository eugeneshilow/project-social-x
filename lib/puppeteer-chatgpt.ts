"use server";

import fs from "fs";
import path from "path";
import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";

const CHATGPT_COOKIES_PATH = path.join(process.cwd(), "chatgpt-cookies.json");

/**
 * Puppeteer-based function to fetch ChatGPT's response.
 * Targets the contenteditable <div> to input text, based on the provided snippet.
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

    // Overwrite clipboard logic for debugging
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
    console.log("[fetchFromChatGPT] Clipboard overrides set up.");

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
    const targetURL = "https://chatgpt.com/"; // Example user domain per logs
    console.log("[fetchFromChatGPT] Navigating to:", targetURL);
    await page.goto(targetURL, { waitUntil: "networkidle0" });
    console.log(`[fetchFromChatGPT] Page loaded => "${await page.title()}"`);
    console.log("[fetchFromChatGPT] Current URL =>", page.url());

    // Check if we might be stuck on login
    if (page.url().includes("/auth/login")) {
      console.warn("[fetchFromChatGPT] Looks like we're on a login page. Automated login or valid cookies are needed.");
    }

    // Based on your snippet, there's a hidden <textarea> and a visible <div contenteditable="true" ... id="prompt-textarea">
    // So let's target that contenteditable div
    const contentEditableSelector = 'div#prompt-textarea.ProseMirror';
    console.log("[fetchFromChatGPT] Waiting for selector =>", contentEditableSelector);
    await page.waitForSelector(contentEditableSelector, { timeout: 45000 });
    console.log("[fetchFromChatGPT] Found contenteditable div. Attempting to click and type prompt...");

    // Click and type the prompt
    await page.click(contentEditableSelector);
    await page.keyboard.type(prompt, { delay: 50 });
    console.log("[fetchFromChatGPT] Prompt typed in the contenteditable.");

    // Press Enter
    await page.keyboard.press("Enter");
    console.log("[fetchFromChatGPT] Pressed Enter, waiting for response to generate...");

    // Wait/poll for the response
    const messageSelector = "div.group.w-full";
    let finalAnswer = "";
    for (let i = 0; i < 30; i++) {
      await delay(2000);

      // Attempt to find the last message from the assistant
      const messages = await page.$$eval(messageSelector, (els) =>
        els.map((el) => el.textContent?.trim() || "")
      );

      if (messages.length > 0) {
        finalAnswer = messages[messages.length - 1];
      }

      // Checking if there's a "Stop Generating" button => means it's still streaming
      const isGenerating = await page.$$eval("button", (btns) =>
        btns.some((b) => b.textContent?.includes("Stop generating"))
      );

      console.log(`[fetchFromChatGPT] Poll #${i + 1} => isGenerating=${isGenerating}, lastMessage="${finalAnswer.slice(0, 60)}..."`);

      if (!isGenerating && finalAnswer) {
        console.log("[fetchFromChatGPT] No 'Stop Generating' button found, likely done generating. Breaking loop.");
        break;
      }
    }

    // Save cookies after the conversation
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