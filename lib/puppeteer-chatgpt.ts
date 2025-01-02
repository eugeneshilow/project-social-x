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
 * 2) plainText: stripped version suitable for Markdown.
 * 
 * We skip user messages and extra "kasha," focusing on the final assistant message only.
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

    // 1) Insert prompt
    const contentSel = 'div#prompt-textarea.ProseMirror';
    await page.waitForSelector(contentSel, { timeout: 60000 });
    console.log("[fetchFromChatGPT] Found text area => setting prompt...");
    await page.evaluate((sel, userPrompt) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (el) el.innerText = userPrompt;
    }, contentSel, prompt);

    console.log("[fetchFromChatGPT] Pressing Enter...");
    await page.focus(contentSel);
    await page.keyboard.press("Enter");

    // 2) Wait until "Stop generating" disappears or 30s pass
    await waitForCompletion(page);

    // 3) Parse the last assistant message, returning
    //    <rawHTML> plus <strippedText> as JSON, for example
    const { rawHTML, strippedText } = await getLastAssistantMessage(page);
    console.log(
      `[fetchFromChatGPT] Extracted => rawHTML len=${rawHTML.length}, strippedText len=${strippedText.length}`
    );

    await saveCookies(page, CHATGPT_COOKIES_PATH, "[fetchFromChatGPT]");

    // We'll return them combined or just store them in JSON
    // For now, let's embed them in a single string with a JSON structure
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
 * Uses our custom delay() instead of page.waitForTimeout().
 */
async function waitForCompletion(page: Page) {
  const start = Date.now();
  const maxMs = 30000;
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
 * Return both raw HTML (with tags) and plain text (for markdown).
 */
async function getLastAssistantMessage(page: Page) {
  const allContainers = await page.$$("div.group.w-full");
  console.log("[getLastAssistantMessage] => total containers =>", allContainers.length);

  // We'll filter out any container that has an input or might be recognized as user side
  const assistantHandles: Array<{
    handleIndex: number;
    handle: puppeteer.ElementHandle<Element>;
  }> = [];

  for (let i = 0; i < allContainers.length; i++) {
    const handle = allContainers[i];
    const isUser = await handle.evaluate((node) => {
      return !!node.querySelector("textarea, .ProseMirror, input");
    });
    if (!isUser) {
      assistantHandles.push({ handleIndex: i, handle });
    }
  }

  if (!assistantHandles.length) {
    console.log("[getLastAssistantMessage] => no assistant containers found => returning empty");
    return { rawHTML: "", strippedText: "" };
  }

  const lastAssistant = assistantHandles[assistantHandles.length - 1].handle;

  // Remove any leftover button, etc. from the DOM so they don’t appear in raw HTML
  await lastAssistant.evaluate((node) => {
    node.querySelectorAll("button, svg, .copy-button, [role='button']").forEach((el) => el.remove());
  });

  // Extract raw HTML
  const rawHTML = await lastAssistant.evaluate((node) => node.innerHTML.trim());

  // Extract stripped text
  const strippedText = await lastAssistant.evaluate(
    (node) => node.textContent?.replace(/\s+/g, " ").trim() || ""
  );

  return { rawHTML, strippedText };
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