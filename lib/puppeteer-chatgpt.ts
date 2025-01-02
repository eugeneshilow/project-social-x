"use server";

import fs from "fs";
import path from "path";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";

const CHATGPT_COOKIES_PATH = path.join(process.cwd(), "chatgpt-cookies.json");

/**
 * This script tries to press ChatGPT's "Copy" button (like we do for Claude) multiple times.
 * If that fails, fallback to highlight+copy, then direct DOM extraction.
 * 
 * Sets a max of 30 seconds to detect "Stop generating" or forcibly proceed.
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
        "--disable-blink-features=AutomationControlled",
      ],
    });
    console.log("[fetchFromChatGPT] Browser launched successfully.");
  } catch (err) {
    throw new Error(`[fetchFromChatGPT] Failed launching browser => ${err}`);
  }

  try {
    const page = await browser.newPage();

    // 1) Overwrite Clipboard
    await patchClipboard(page);

    // 2) Load cookies
    await loadCookiesIfAny(page);

    // 3) Navigate
    console.log("[fetchFromChatGPT] Navigating to chatgpt.com...");
    await page.goto("https://chatgpt.com/", { waitUntil: "networkidle0" });
    console.log("[fetchFromChatGPT] Page =>", await page.title());

    // Insert prompt & press Enter
    const contentSel = 'div#prompt-textarea.ProseMirror';
    await page.waitForSelector(contentSel, { timeout: 60000 });
    console.log("[fetchFromChatGPT] Setting the prompt text...");
    await page.evaluate((sel: string, txt: string) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (el) el.innerText = txt;
    }, contentSel, prompt);

    console.log("[fetchFromChatGPT] Pressing Enter...");
    await page.focus(contentSel);
    await page.keyboard.press("Enter");

    // 4) Wait logic - 30s max
    console.log("[fetchFromChatGPT] Watching for 'Stop generating' or 30s max...");
    let sawStop = false;
    let done = false;
    const startTime = Date.now();
    const maxWaitMs = 30000;

    while (!done) {
      await delay(2000);

      const isGenerating = await page.$$eval("button", (btns) =>
        btns.some((b) => b.textContent?.includes("Stop generating"))
      );
      if (isGenerating) {
        if (!sawStop) {
          console.log("[fetchFromChatGPT] 'Stop generating' => generation started");
          sawStop = true;
        } else {
          console.log("[fetchFromChatGPT] 'Stop generating' => still streaming...");
        }
      } else {
        if (sawStop) {
          console.log("[fetchFromChatGPT] 'Stop generating' vanished => wait extra 3s then done");
          await delay(3000);
          done = true;
          break;
        }
      }

      if ((Date.now() - startTime) >= maxWaitMs) {
        console.warn("[fetchFromChatGPT] 30s max => forcibly proceed...");
        done = true;
      }
    }

    // 5) Attempt multi-try copy
    console.log("[fetchFromChatGPT] Attempt multi-try copy approach...");
    let finalAnswer = await multiTryChatGPTCopy(page);
    if (!finalAnswer) {
      console.warn("[fetchFromChatGPT] Copy approach => empty => fallback highlight+copy");
      finalAnswer = await fallbackHighlightCopy(page);
    }
    if (!finalAnswer) {
      console.warn("[fetchFromChatGPT] highlight => empty => final fallback => direct DOM extraction");
      finalAnswer = await fallbackDomExtraction(page, "div.group.w-full");
    }

    // 6) Save cookies
    await saveCookies(page);
    console.log(`[fetchFromChatGPT] done => length=${finalAnswer.length}`);
    return finalAnswer;
  } catch (err) {
    console.error("[fetchFromChatGPT] Error =>", err);
    throw err;
  } finally {
    if (browser) {
      console.log("[fetchFromChatGPT] closing browser...");
      await browser.close();
    }
  }
}

//----------------------------------------------------------------------------------------
// Patch clipboard to store copy into window._puppeteerClipboard
async function patchClipboard(page: Page) {
  await page.evaluateOnNewDocument(() => {
    console.log("[patchClipboard] Overwriting clipboard methods...");
    (window as any)._puppeteerClipboard = "";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
      (navigator.clipboard as any).writeText = async (data: string) => {
        (window as any)._puppeteerClipboard = data;
        return orig(data);
      };
    }

    const origExecCommand = document.execCommand;
    document.execCommand = function(cmd, showUI, val) {
      const ret = origExecCommand.apply(this, [cmd, showUI, val]);
      if (cmd === "copy") {
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.toString()) {
          (window as any)._puppeteerClipboard = sel.toString();
        }
      }
      return ret;
    };
  });
}

//----------------------------------------------------------------------------------------
// Load cookies if any
async function loadCookiesIfAny(page: Page) {
  if (fs.existsSync(CHATGPT_COOKIES_PATH)) {
    try {
      const data = fs.readFileSync(CHATGPT_COOKIES_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length) {
        await page.setCookie(...parsed);
        console.log("[fetchFromChatGPT] cookies set on page.");
      } else {
        console.warn("[fetchFromChatGPT] cookie file invalid or empty");
      }
    } catch (err) {
      console.warn("[fetchFromChatGPT] error reading cookie file =>", err);
    }
  } else {
    console.warn("[fetchFromChatGPT] no cookie file => might need manual login");
  }
}

//----------------------------------------------------------------------------------------
// Save cookies
async function saveCookies(page: Page) {
  const newCookies = await page.cookies();
  fs.writeFileSync(CHATGPT_COOKIES_PATH, JSON.stringify(newCookies, null, 2));
  console.log("[fetchFromChatGPT] cookies saved.");
}

//----------------------------------------------------------------------------------------
// multiTryChatGPTCopy => replicate "Claude" approach
async function multiTryChatGPTCopy(page: Page): Promise<string> {
  console.log("[multiTryChatGPTCopy] => scanning last container multiple times");
  let finalData = "";

  const containers = await page.$$("div.group.w-full");
  if (!containers.length) {
    console.warn("[multiTryChatGPTCopy] no containers => return empty");
    return "";
  }

  const lastContainer = containers[containers.length - 1];
  const maxTries = 5;

  for (let i = 0; i < maxTries; i++) {
    console.log(`[multiTryChatGPTCopy] attempt #${i+1}`);
    await delay(2000);

    const clicked = await lastContainer.evaluate((container) => {
      // XPATH
      const xPath = '/html/body/div[1]/div[2]//button[@aria-label="Copy" and @data-testid="copy-turn-action-button"]';
      const res = document.evaluate(xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const xBtn = res.singleNodeValue as HTMLButtonElement | null;
      if (xBtn) {
        xBtn.click();
        return "xPath";
      }

      // direct
      const directBtn = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Copy"][data-testid="copy-turn-action-button"]'
      );
      if (directBtn) {
        directBtn.click();
        return "directSel";
      }

      // fallback
      const buttons = Array.from(container.querySelectorAll("button"));
      for (const b of buttons) {
        const label = b.getAttribute("aria-label") || "";
        if (label.toLowerCase().includes("copy") || (b.textContent || "").includes("Copy")) {
          b.click();
          return "fallback-scan";
        }
      }
      return "";
    });

    if (clicked) {
      console.log(`[multiTryChatGPTCopy] => clicked => ${clicked}`);
      await delay(1000);
      let data = await page.evaluate(() => (window as any)._puppeteerClipboard);
      if (typeof data === "string") {
        data = data.trim();
        if (data.length > 0) {
          console.log(`[multiTryChatGPTCopy] => got text => length=${data.length}`);
          finalData = data;
          break;
        } else {
          console.log("[multiTryChatGPTCopy] => clipboard empty => retry");
        }
      }
    } else {
      console.log("[multiTryChatGPTCopy] => no button => retry");
    }
  }
  return finalData;
}

//----------------------------------------------------------------------------------------
// fallbackHighlightCopy => highlight entire last message => execCommand("copy")
async function fallbackHighlightCopy(page: Page): Promise<string> {
  console.log("[fallbackHighlightCopy] => highlight entire last message => copy");
  const containers = await page.$$("div.group.w.full");
  if (!containers.length) {
    console.warn("[fallbackHighlightCopy] => no containers => empty");
    return "";
  }
  const last = containers[containers.length - 1];

  await page.evaluate((node) => {
    const sel = window.getSelection && window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(node as Node);
    sel.addRange(range);
    document.execCommand("copy");
  }, last);

  await delay(1000);
  let data = await page.evaluate(() => (window as any)._puppeteerClipboard);
  if (typeof data === "string") data = data.trim();
  console.log("[fallbackHighlightCopy] => length", data?.length || 0);
  return data || "";
}

//----------------------------------------------------------------------------------------
// fallbackDomExtraction => direct text extraction
async function fallbackDomExtraction(page: Page, sel: string): Promise<string> {
  console.log("[fallbackDomExtraction] => direct text extraction from last container");
  const containers = await page.$$(sel);
  if (!containers.length) return "";
  const last = containers[containers.length - 1];
  return await last.evaluate((node) => {
    const clean = (txt: string) => txt.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
    node.querySelectorAll("button, svg, .copy-button, [role='button']").forEach((el) => el.remove());
    return clean(node.textContent || "");
  });
}

//----------------------------------------------------------------------------------------
// delay helper
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}