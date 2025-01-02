"use server";

import fs from "fs";
import path from "path";
import type { Browser, Frame, Page } from "puppeteer";
import puppeteer from "puppeteer";

const CHATGPT_COOKIES_PATH = path.join(process.cwd(), "chatgpt-cookies.json");

/**
 * A final debug approach to pressing ChatGPT's "Copy" button:
 * - Wait 30s or until "Stop generating" goes away
 * - Then attempt multi-try button click
 * - If empty, try highlight+copy
 * - If empty, fallback direct extraction
 * - Logs frames, attempts a mild shadow DOM check
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
        "--disable-blink-features=AutomationControlled"
      ]
    });
    console.log("[fetchFromChatGPT] Browser launched successfully.");
  } catch (err) {
    throw new Error("[fetchFromChatGPT] Failed launching => " + err);
  }

  try {
    const page = await browser.newPage();

    await patchClipboard(page);
    await loadCookiesIfAny(page, CHATGPT_COOKIES_PATH, "[fetchFromChatGPT]");

    console.log("[fetchFromChatGPT] Going to chatgpt.com...");
    await page.goto("https://chatgpt.com/", { waitUntil: "networkidle0" });
    console.log("[fetchFromChatGPT] Page =>", await page.title());

    // 1) Log frames to check if we need a child frame
    const frames = page.frames();
    console.log("[fetchFromChatGPT] Found frames =>", frames.map((f) => f.url()));

    // Insert prompt
    const contentSel = 'div#prompt-textarea.ProseMirror';
    await page.waitForSelector(contentSel, { timeout: 60000 });
    console.log("[fetchFromChatGPT] Found text area => setting prompt...");
    await page.evaluate((sel, txt) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (el) el.innerText = txt;
    }, contentSel, prompt);

    console.log("[fetchFromChatGPT] Pressing Enter...");
    await page.focus(contentSel);
    await page.keyboard.press("Enter");

    // 2) Wait logic => 30s max or 'Stop generating' vanish
    const start = Date.now();
    const maxMs = 30000;
    let sawStop = false;
    let done = false;
    while (!done) {
      await delay(2000);

      const isGen = await page.$$eval("button", (btns) =>
        btns.some((b) => b.textContent?.includes("Stop generating"))
      );
      if (isGen) {
        if (!sawStop) {
          console.log("[fetchFromChatGPT] 'Stop generating' => generation started");
          sawStop = true;
        } else {
          console.log("[fetchFromChatGPT] 'Stop generating' => still streaming");
        }
      } else {
        if (sawStop) {
          console.log("[fetchFromChatGPT] 'Stop generating' => vanished => wait 3s");
          await delay(3000);
          done = true;
          break;
        }
      }

      if ((Date.now() - start) >= maxMs) {
        console.warn("[fetchFromChatGPT] 30s max => forcibly proceed");
        done = true;
      }
    }

    // 3) Multi-try copy logic
    const copyResult = await multiTryChatGPTCopy(page);
    if (copyResult) {
      console.log(`[fetchFromChatGPT] Multi-try copy => success => length=${copyResult.length}`);
      await saveCookies(page, CHATGPT_COOKIES_PATH, "[fetchFromChatGPT]");
      return copyResult;
    }

    console.warn("[fetchFromChatGPT] Multi-try copy => empty => fallback highlight+copy...");
    const highlightText = await fallbackHighlightCopy(page);
    if (highlightText) {
      console.log(`[fetchFromChatGPT] highlight => length=${highlightText.length}`);
      await saveCookies(page, CHATGPT_COOKIES_PATH, "[fetchFromChatGPT]");
      return highlightText;
    }

    console.warn("[fetchFromChatGPT] highlight => empty => direct extraction...");
    const finalText = await fallbackDomExtraction(page, "div.group.w-full");
    console.log(`[fetchFromChatGPT] final => length=${finalText.length}`);
    await saveCookies(page, CHATGPT_COOKIES_PATH, "[fetchFromChatGPT]");
    return finalText;
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

//------------------ Patch Clipboard ------------------//
async function patchClipboard(page: Page) {
  await page.evaluateOnNewDocument(() => {
    console.log("[patchClipboard] Overwriting methods...");
    (window as any)._puppeteerClipboard = "";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
      (navigator.clipboard as any).writeText = async (data: string) => {
        console.log("[patchClipboard:writeText] => data len=", data.length);
        (window as any)._puppeteerClipboard = data;
        return orig(data);
      };
    }

    const origEC = document.execCommand;
    document.execCommand = function(cmd, showUI, val) {
      console.log("[patchClipboard:execCommand] =>", cmd);
      const ret = origEC.apply(this, [cmd, showUI, val]);
      if (cmd === "copy") {
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.toString()) {
          console.log("[patchClipboard:execCommand] => captured selection len=", sel.toString().length);
          (window as any)._puppeteerClipboard = sel.toString();
        } else {
          console.log("[patchClipboard:execCommand] => no selection");
        }
      }
      return ret;
    };
  });
}

//------------------ multiTryChatGPTCopy ------------------//
async function multiTryChatGPTCopy(page: Page): Promise<string> {
  console.log("[multiTryChatGPTCopy] => scanning last container multiple times");
  let final = "";
  // Updated class selector from div.group.w.full to div.group.w-full
  const containers = await page.$$("div.group.w-full");
  console.log(`[multiTryChatGPTCopy] => container count=${containers.length}`);
  if (!containers.length) return "";

  const lastContainer = containers[containers.length - 1];

  const maxTries = 5;
  for (let i = 0; i < maxTries; i++) {
    console.log(`[multiTryChatGPTCopy] Attempt #${i + 1}`);
    await delay(1000);

    // Evaluate the node
    const clicked = await lastContainer.evaluate((container) => {
      console.log("[multiTryChatGPTCopy:eval] container =>", container.outerHTML.slice(0, 200));
      // user XPATH
      const xPath = '/html/body/div[1]/div[2]//button[@aria-label="Copy" and @data-testid="copy-turn-action-button"]';
      const xpRes = document.evaluate(xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const xpBtn = xpRes.singleNodeValue as HTMLButtonElement | null;
      if (xpBtn) {
        console.log("[multiTryChatGPTCopy:eval] Found xpBtn =>", xpBtn.outerHTML.slice(0, 200));
        xpBtn.click();
        return "clickedXP";
      }

      // direct
      const direct = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Copy"][data-testid="copy-turn-action-button"]'
      );
      if (direct) {
        console.log("[multiTryChatGPTCopy:eval] Found direct =>", direct.outerHTML.slice(0, 200));
        direct.click();
        return "clickedDirect";
      }

      // fallback
      const btns = Array.from(container.querySelectorAll("button"));
      for (const b of btns) {
        const aria = b.getAttribute("aria-label") || "";
        if (aria.toLowerCase().includes("copy") || (b.textContent || "").includes("Copy")) {
          console.log("[multiTryChatGPTCopy:eval] Found fallback =>", b.outerHTML.slice(0, 200));
          b.click();
          return "clickedFallback";
        }
      }
      console.log("[multiTryChatGPTCopy:eval] no button found => none clicked");
      return "";
    });

    console.log("[multiTryChatGPTCopy] => clicked =>", clicked);
    if (clicked) {
      await delay(1500);
      let data = await page.evaluate(() => (window as any)._puppeteerClipboard);
      console.log("[multiTryChatGPTCopy] => read from _puppeteerClipboard =>", (data || "").slice(0, 50));
      if (typeof data === "string" && data.trim().length > 0) {
        final = data.trim();
        console.log(`[multiTryChatGPTCopy] => success => length=${final.length}`);
        break;
      } else {
        console.log("[multiTryChatGPTCopy] => clipboard empty => retry...");
      }
    } else {
      console.log("[multiTryChatGPTCopy] => not clicked => retry...");
    }
  }
  return final;
}

//------------------ fallbackHighlightCopy ------------------//
async function fallbackHighlightCopy(page: Page): Promise<string> {
  console.log("[fallbackHighlightCopy] => highlight entire last message => copy");
  // Updated class selector from div.group.w.full to div.group.w-full
  const containers = await page.$$("div.group.w-full");
  console.log("[fallbackHighlightCopy] => container count =>", containers.length);
  if (!containers.length) return "";

  const last = containers[containers.length - 1];
  await last.evaluate(() => {
    console.log("[fallbackHighlightCopy:eval] => highlighting node");
    const sel = window.getSelection && window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(document.activeElement || document.body);
    sel.addRange(range);
    document.execCommand("copy");
  });

  await delay(1000);
  let data = await page.evaluate(() => (window as any)._puppeteerClipboard);
  if (typeof data === "string") data = data.trim();
  console.log("[fallbackHighlightCopy] => read data =>", (data || "").slice(0, 50));
  return data || "";
}

//------------------ fallbackDomExtraction ------------------//
async function fallbackDomExtraction(page: Page, sel: string): Promise<string> {
  console.log("[fallbackDomExtraction] => direct text extraction =>", sel);
  const containers = await page.$$(sel);
  console.log("[fallbackDomExtraction] => containers =>", containers.length);
  if (!containers.length) return "";
  const last = containers[containers.length - 1];
  return await last.evaluate((node) => {
    const clean = (txt: string) => txt.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
    node.querySelectorAll("button, svg, .copy-button, [role='button']").forEach((el) => el.remove());
    const raw = node.textContent || "";
    console.log("[fallbackDomExtraction:eval] => raw =>", raw.slice(0, 100));
    return clean(raw);
  });
}

//------------------ cookie helpers ------------------//
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

//------------------ delay helper ------------------//
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}