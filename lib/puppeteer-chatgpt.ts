"use server";

import fs from "fs";
import path from "path";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";

const CHATGPT_COOKIES_PATH = path.join(process.cwd(), "chatgpt-cookies.json");

/**
 * Instead of relying on 'Copy' buttons or highlight & copy,
 * we now directly parse the last assistant message from the DOM,
 * returning both:
 * 1) rawHTML: with tags (strong, em, etc.)
 * 2) plainText: with preserved blank lines for nicer Markdown spacing.
 */
export async function fetchFromChatGPT(prompt: string): Promise<string> {
  console.log("[fetchFromChatGPT] Starting Puppeteer (non-headless)...");
  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });
    console.log("[fetchFromChatGPT] Browser launched successfully.");
  } catch (err) {
    throw new Error("[fetchFromChatGPT] Failed launching => " + err);
  }

  try {
    const page = await browser.newPage();
    await loadCookiesIfAny(page, CHATGPT_COOKIES_PATH, "[fetchFromChatGPT]");

    console.log("[fetchFromChatGPT] Going to chatgpt.com...");
    await page.goto("https://chatgpt.com/", { waitUntil: "networkidle0" });
    console.log("[fetchFromChatGPT] Page =>", await page.title());

    // 1) Insert prompt if the text area is found
    const contentSel = 'div#prompt-textarea.ProseMirror';
    await page.waitForSelector(contentSel, { timeout: 60000 }).catch(() => {
      console.warn("[fetchFromChatGPT] Could not find the text area selector!");
    });

    const elExists = await page.$(contentSel);
    if (elExists) {
      console.log("[fetchFromChatGPT] Found text area => setting prompt...");
      await page.evaluate((sel, userPrompt) => {
        const el = document.querySelector<HTMLElement>(sel);
        if (el) el.innerText = userPrompt;
      }, contentSel, prompt);

      console.log("[fetchFromChatGPT] Pressing Enter...");
      await page.focus(contentSel);
      await page.keyboard.press("Enter");
    } else {
      console.log("[fetchFromChatGPT] No recognized text area found; continuing anyway...");
    }

    // 2) Wait up to 30s for generation to finish
    await waitForCompletion(page);

    // 3) Get the last assistant message
    const { rawHTML, strippedText } = await getLastAssistantMessage(page);
    console.log(
      `[fetchFromChatGPT] Extracted => rawHTML len=${rawHTML.length}, strippedText len=${strippedText.length}`
    );

    await saveCookies(page, CHATGPT_COOKIES_PATH, "[fetchFromChatGPT]");

    // Combine them in JSON
    const finalData = JSON.stringify({
      rawHTML,
      strippedText,
    });

    return finalData;
  } catch (err) {
    console.error("[fetchFromChatGPT] error =>", err);
    throw err;
  } finally {
    if (browser) {
      console.log("[fetchFromChatGPT] closing browser...");
      await browser.close();
    }
  }
}

/**
 * Wait up to 30s for "Stop generating" to vanish, meaning the AI is done responding.
 */
async function waitForCompletion(page: Page) {
  const start = Date.now();
  const maxMs = 240000;
  let sawStop = false;

  while (true) {
    await delay(2000);

    const isGenerating = await page.$$eval("button", (btns) =>
      btns.some((b) => b.textContent?.includes("Stop generating"))
    );
    if (isGenerating) {
      if (!sawStop) {
        console.log("[fetchFromChatGPT] 'Stop generating' => found => generation started");
        sawStop = true;
      } else {
        console.log("[fetchFromChatGPT] 'Stop generating' => still streaming");
      }
    } else {
      if (sawStop) {
        console.log("[fetchFromChatGPT] Generation ended => wait 3s for final text...");
        await delay(3000);
        break;
      }
    }

    if (Date.now() - start >= maxMs) {
      console.warn("[fetchFromChatGPT] 30s max => forcibly proceed");
      break;
    }
  }
}

/**
 * Get the last assistant message in ChatGPT's DOM, ignoring user messages.
 * Return raw HTML plus text with blank lines for paragraphs.
 */
async function getLastAssistantMessage(page: Page) {
  const allAssistantNodes = await page.$$(
    'div[data-message-author-role="assistant"]'
  );
  console.log(
    "[getLastAssistantMessage] => total assistant nodes =>",
    allAssistantNodes.length
  );

  if (!allAssistantNodes.length) {
    console.log("[getLastAssistantMessage] => no assistant containers found => returning empty");
    return { rawHTML: "", strippedText: "" };
  }

  const lastAssistant = allAssistantNodes[allAssistantNodes.length - 1];

  // Remove leftover buttons or icons
  await lastAssistant.evaluate((node) => {
    node
      .querySelectorAll("button, svg, .copy-button, [role='button']")
      .forEach((el) => el.remove());
  });

  // Extract raw HTML
  const rawHTML = await lastAssistant.evaluate((node) => node.innerHTML.trim());

  // Extract innerText while preserving paragraph spacing
  let textContent = await lastAssistant.evaluate(
    (node) => node.innerText || ""
  );
  // Convert multiple blank lines to a single blank line
  textContent = textContent
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { rawHTML, strippedText: textContent };
}

//------------------------------------------------------------------
// Cookie helpers
//------------------------------------------------------------------
async function loadCookiesIfAny(page: Page, cookiePath: string, label: string) {
  if (!fs.existsSync(cookiePath)) {
    console.warn(`${label} => no cookie file => might need manual login`);
    return;
  }
  try {
    const data = fs.readFileSync(cookiePath, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length) {
      await page.setCookie(...parsed);
      console.log(`${label} => cookies set on page.`);
    } else {
      console.warn(`${label} => cookie file invalid or empty`);
    }
  } catch (err) {
    console.warn(`${label} => error reading cookie file =>`, err);
  }
}

async function saveCookies(page: Page, cookiePath: string, label: string) {
  const newCookies = await page.cookies();
  fs.writeFileSync(cookiePath, JSON.stringify(newCookies, null, 2));
  console.log(`${label} => cookies saved.`);
}

/**
 * Generic delay helper
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}