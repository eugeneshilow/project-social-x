"use server";

import fs from "fs";
import path from "path";
import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";

const CHATGPT_COOKIES_PATH = path.join(process.cwd(), "chatgpt-cookies.json");

/**
 * Puppeteer-based function to fetch ChatGPT's response
 * It attempts to log in via cookies, then pastes the prompt and scrapes the response
 */
export async function fetchFromChatGPT(prompt: string): Promise<string> {
  console.log("[fetchFromChatGPT] Starting Puppeteer for ChatGPT (non-headless)...");
  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });
    console.log("[fetchFromChatGPT] Browser launched successfully.");

    console.log("[fetchFromChatGPT] Overriding permissions for chat.openai.com...");
    await browser.defaultBrowserContext().overridePermissions("https://chat.openai.com", [
      "clipboard-read",
      "clipboard-write",
    ]);
    console.log("[fetchFromChatGPT] Clipboard permissions granted.");
  } catch (error) {
    console.error("[fetchFromChatGPT] Error launching Puppeteer:", error);
    throw error;
  }

  try {
    const page = await browser.newPage();

    // Overwrite clipboard logic
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

    // Load cookies
    if (fs.existsSync(CHATGPT_COOKIES_PATH)) {
      const cookiesString = fs.readFileSync(CHATGPT_COOKIES_PATH, "utf-8");
      const parsedCookies = JSON.parse(cookiesString);
      await page.setCookie(...parsedCookies);
      console.log("[fetchFromChatGPT] Cookies set on page.");
    }

    await page.goto("https://chat.openai.com/chat", { waitUntil: "networkidle0" });
    console.log("[fetchFromChatGPT] Page loaded =>", await page.title());

    // If not logged in, user may see a login screen
    // We'll try to proceed anyway; might fail if not logged in
    const textareaSelector = 'textarea[data-id="root"]';
    await page.waitForSelector(textareaSelector, { timeout: 30000 });

    // Insert prompt
    await page.evaluate(
      (selector: string, txt: string) => {
        const el = document.querySelector<HTMLTextAreaElement>(selector);
        if (el) el.value = txt;
      },
      textareaSelector,
      prompt
    );

    // Press Enter
    await page.focus(textareaSelector);
    await page.keyboard.press("Enter");

    // Wait for an answer to appear
    const messageSelector = "div.flex.flex-col.items-center.text-sm";
    let finalAnswer = "";

    // We'll wait up to ~60 seconds (30 x 2s)
    for (let i = 0; i < 30; i++) {
      await delay(2000);

      // Attempt to find the last message from assistant
      const messages = await page.$$eval(messageSelector, (els) => {
        return els.map((el) => el.textContent?.trim() || "");
      });

      // The last text might be the assistant's answer
      if (messages.length > 0) {
        finalAnswer = messages[messages.length - 1];
      }

      // Check if there's a "Stop Generating" button or streaming in progress
      const isGenerating = await page.$$eval("button", (btns) =>
        btns.some((b) => b.textContent?.includes("Stop generating"))
      );
      if (!isGenerating) {
        // Possibly done generating
        break;
      }
    }

    // Fallback if no finalAnswer found
    if (!finalAnswer) {
      console.log("[fetchFromChatGPT] Fallback: no final answer in text, we'll do best to get last one");
    }

    // Attempt to copy final answer by selecting the text area, etc. 
    // (ChatGPT doesn't always have a direct copy button.)
    // We'll skip advanced copy button logic for now.

    // Save cookies
    const currentCookies = await page.cookies();
    fs.writeFileSync(CHATGPT_COOKIES_PATH, JSON.stringify(currentCookies, null, 2));

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