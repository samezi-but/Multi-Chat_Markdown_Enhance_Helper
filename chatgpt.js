// ==UserScript==
// @name         Emphasis Auto-Fixer v6 (ChatGPT & Gemini)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Replace stray * / ** with <em>/<strong> across node boundaries, both sites supported.
// @match        https://chatgpt.com/*
// @match        https://gemini.google.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  /* 変換対象外タグ */
  const SKIP = "pre, code, kbd, samp, textarea, script, style";

  /* 正規表現（<span> 断片も許容） */
  const RX_BOLD   = /\*\*([\s\S]+?)\*\*/g;
  const RX_ITALIC = /(^|[^*])\*([^*\s][\s\S]*?)\*(?=[^*]|$)/g;

  /* デバッグハイライト有無 */
  const DEBUG = true;

  /* HTML 置換   */
  const htmlConvert = html =>
    html.replace(RX_BOLD , '<strong class="em-fix-bold">$1</strong>')
        .replace(RX_ITALIC, (_, p1, p2) => p1 + '<em class="em-fix-italic">' + p2 + "</em>");

  /* テキストノード高速変換 */
  const textConvert = txt =>
    txt.replace(/\*\*([^*]+?)\*\*/g, '<strong class="em-fix-bold">$1</strong>')
       .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?=[^*]|$)/g,
                (_, p1, p2) => p1 + '<em class="em-fix-italic">' + p2 + '</em>');

  /* 個別テキストノード処理 */
  const patchText = n => {
    if (!n.parentElement || n.parentElement.closest(SKIP)) return;
    const out = textConvert(n.data);
    if (out === n.data) return;
    n.replaceWith(document.createRange().createContextualFragment(out));
  };

  /* 要素全体再変換（断片回収） */
  const patchElement = el => {
    if (el.closest(SKIP) || !el.textContent.includes("*") || el.querySelector(SKIP)) return;
    const out = htmlConvert(el.innerHTML);
    if (out !== el.innerHTML) el.innerHTML = out;
  };

  /* 再帰走査 */
  const walk = root => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: node =>
        node.parentElement && !node.parentElement.closest(SKIP)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
    });
    for (let t = tw.nextNode(); t; t = tw.nextNode()) patchText(t);
    root.querySelectorAll("*").forEach(patchElement);
  };

  /* 初回 */
  walk(document.body);

  /* 追加ノード監視（Shadow DOM 含む） */
  const observe = node => new MutationObserver(ms => {
    ms.forEach(m => m.addedNodes.forEach(a => {
      if (a.nodeType === Node.TEXT_NODE) patchText(a);
      else if (a.nodeType === Node.ELEMENT_NODE) walk(a);
    }));
  }).observe(node, { childList: true, subtree: true });

  observe(document);                           // 通常 DOM
  if (document.documentElement.shadowRoot) {   // ルート Shadow DOM（Gemini）
    observe(document.documentElement.shadowRoot);
  }

  /* デバッグ用ハイライト CSS */
  if (DEBUG) {
    const style = document.createElement("style");
    style.textContent = `
      strong.em-fix-bold { background: rgba(255,255,0,.35); font-weight:700; }
      em.em-fix-italic   { background: rgba(0,255,255,.35); font-style:italic; }
    `;
    document.head.appendChild(style);
  }
})();
