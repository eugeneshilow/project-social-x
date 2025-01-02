"use server";

import fs from "fs";
import path from "path";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";

const CHATGPT_COOKIES_PATH = path.join(process.cwd(), "chatgpt-cookies.json");

/**
 * fetchFromChatGPT:
 * 1) Insert prompt, press Enter
 * 2) Immediately poll the last message text for stability or "Stop generating" disappearing
 * 3) Once done, highlight the last container, execCommand("copy"), read _puppeteerClipboard
 * 4) Fallback if empty
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
  } catch (err) {
    console.error("[fetchFromChatGPT] Error launching Puppeteer:", err);
    throw err;
  }

  try {
    const page = await browser.newPage();
    console.log("[fetchFromChatGPT] New page created.");

    // 1) Overwrite the Clipboard API
    await patchClipboardAPI(page);

    // 2) Load cookies
    await loadCookiesIfAny(page);

    // 3) Navigate
    console.log("[fetchFromChatGPT] Navigating to chatgpt.com...");
    await page.goto("https://chatgpt.com/", { waitUntil: "networkidle0" });
    console.log("[fetchFromChatGPT] Page loaded =>", await page.title());

    // 4) Insert prompt, press Enter
    const contentEditableSelector = 'div#prompt-textarea.ProseMirror';
    await page.waitForSelector(contentEditableSelector, { timeout: 60000 });
    await page.evaluate((selector, txt) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) el.innerText = txt;
    }, contentEditableSelector, prompt);

    await page.focus(contentEditableSelector);
    await page.keyboard.press("Enter");

    // 5) Immediately poll the text for up to 60 polls (120s)
    const messageSelector = "div.group.w-full";
    let lastAnswerText = "";
    let stableRounds = 0;
    let doneStopRounds = 0;
    let sawStop = false;
    let finalAnswer = "";

    for (let i = 0; i < 60; i++) {
      await delay(2000);

      // Check if "Stop generating" is present
      const isGenerating = await page.$$eval("button", (btns) =>
        btns.some((b) => b.textContent?.includes("Stop generating"))
      );
      if (isGenerating) {
        sawStop = true;
        doneStopRounds = 0;
      } else if (sawStop) {
        doneStopRounds++;
      }

      // Read the last message text
      const texts = await page.$$eval(messageSelector, (els) =>
        els.map((el) => el.textContent?.trim() || "")
      );
      finalAnswer = texts.length ? texts[texts.length - 1] : "";

      if (finalAnswer === lastAnswerText) {
        stableRounds++;
      } else {
        stableRounds = 0;
        lastAnswerText = finalAnswer;
      }

      console.log(
        `[fetchFromChatGPT] Poll #${i+1} => isGenerating=${isGenerating}, stableRounds=${stableRounds}, doneStopRounds=${doneStopRounds}, lastAnswerLen=${lastAnswerText.length}`
      );

      if ((stableRounds >= 3 && lastAnswerText.length > 0) || doneStopRounds >= 3) {
        console.log("[fetchFromChatGPT] Marking generation as done!");
        break;
      }
    }

    // 6) Wait a bit more
    await delay(3000);

    // 7) Highlight + copy the last message
    const containers = await page.$$(messageSelector);
    if (!containers.length) {
      console.warn("[fetchFromChatGPT] No containers. Fallback to direct DOM extraction...");
      return fallbackDomExtraction(page, messageSelector);
    }
    const lastContainer = containers[containers.length - 1];

    await highlightNodeAndCopy(page, lastContainer);
    await delay(1500);

    let copiedText = await page.evaluate(() => (window as any)._puppeteerClipboard);
    if (copiedText && typeof copiedText === "string") {
      copiedText = copiedText.trim();
      console.log(`[fetchFromChatGPT] highlight+copy => length ${copiedText.length}`);
    }

    // 8) Fallback if empty
    if (!copiedText) {
      console.warn("[fetchFromChatGPT] highlight+copy empty => fallback DOM extraction...");
      copiedText = await fallbackDomExtraction(page, messageSelector);
    }

    // 9) Save cookies
    await saveCookies(page);
    console.log(`[fetchFromChatGPT] Final text length => ${copiedText.length}`);
    return copiedText;
  } catch (err) {
    console.error("[fetchFromChatGPT] Error =>", err);
    throw err;
  } finally {
    if (browser) {
      console.log("[fetchFromChatGPT] Closing browser...");
      await browser.close();
      console.log("[fetchFromChatGPT] Browser closed.");
    }
  }
}

/** Patch the clipboard logic */
async function patchClipboardAPI(page: Page) {
  await page.evaluateOnNewDocument(() => {
    (window as any)._puppeteerClipboard = "";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      const origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      (navigator.clipboard as any).writeText = async (data: string) => {
        (window as any)._puppeteerClipboard = data;
        return origWriteText(data);
      };
    }

    const origExecCommand = document.execCommand;
    document.execCommand = function(cmd, showUI, value) {
      const result = origExecCommand.apply(this, [cmd, showUI, value]);
      if (cmd === "copy") {
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.toString()) {
          (window as any)._puppeteerClipboard = sel.toString();
        }
      }
      return result;
    };
  });
}

/** Load cookies if any */
async function loadCookiesIfAny(page: Page) {
  if (fs.existsSync(CHATGPT_COOKIES_PATH)) {
    console.log("[fetchFromChatGPT] Found ChatGPT cookies, applying...");
    const data = fs.readFileSync(CHATGPT_COOKIES_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length) {
      await page.setCookie(...parsed);
      console.log("[fetchFromChatGPT] cookies set on page.");
    } else {
      console.warn("[fetchFromChatGPT] cookie file invalid or empty");
    }
  } else {
    console.warn("[fetchFromChatGPT] no cookies file => might need login");
  }
}

/** Save cookies back */
async function saveCookies(page: Page) {
  const current = await page.cookies();
  fs.writeFileSync(CHATGPT_COOKIES_PATH, JSON.stringify(current, null, 2));
  console.log("[fetchFromChatGPT] cookies saved.");
}

/** highlight entire node, execCommand('copy') */
async function highlightNodeAndCopy(page: Page, nodeHandle: any) {
  await page.evaluate((node) => {
    const selection = window.getSelection && window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(node as Node);
    selection.addRange(range);
    document.execCommand("copy");
  }, nodeHandle);
}

/** fallback approach: direct DOM text extraction */
async function fallbackDomExtraction(page: Page, sel: string) {
  try {
    const containers = await page.$$(sel);
    if (!containers.length) return "";
    const last = containers[containers.length - 1];
    return await last.evaluate((node) => {
      const clean = (txt: string) => txt.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
      node.querySelectorAll("button, svg, .copy-button, [role='button']").forEach((el) => el.remove());
      return clean(node.textContent || "");
    });
  } catch (err) {
    console.error("[fallbackDomExtraction] error =>", err);
    return "";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}