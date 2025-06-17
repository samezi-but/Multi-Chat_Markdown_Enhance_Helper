// ==UserScript==
// @name         Gemini Markdown Bold Fixer (修正版v2)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Geminiのページで**テキスト**を安全に太字に変換します。無限ループ対策済み。
// @author       (あなたの名前)
// @match        https://gemini.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 処理済みであることを示すための目印（カスタムデータ属性）
    const PROCESSED_MARK = 'data-bold-fixer-processed';

    // テキストノードをスキャンして**を<strong>に変換する関数
    function makeBoldInNode(node) {
        // テキストノード以外、または処理済みの要素内はスキップ
        if (node.nodeType !== Node.TEXT_NODE || node.parentNode.hasAttribute(PROCESSED_MARK)) {
            return;
        }

        const text = node.textContent;
        // そもそも「**」が含まれていないテキストは高速にスキップ
        if (!text.includes('**')) {
            return;
        }

        // **text** のパターンにマッチするかを正規表現で確認
        const regex = /\*\*(.*?)\*\*/g;
        if (!regex.test(text)) {
            return;
        }

        // --- ここからが変換処理 ---
        const parent = node.parentNode;
        // 親要素がなければ処理中断
        if (!parent || /^(SCRIPT|STYLE|TEXTAREA)$/i.test(parent.tagName)) {
            return;
        }

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        // マッチした部分を<strong>タグに置き換えながら新しい要素群（fragment）を作成
        // lastIndexをリセットするために正規表現のtestを再実行
        regex.lastIndex = 0;
        while ((match = regex.exec(text)) !== null) {
            // マッチ部分より前のテキストを追加
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));

            // マッチした部分を<strong>要素で囲んで追加
            const strong = document.createElement('strong');
            strong.textContent = match[1]; // **と**の中身
            fragment.appendChild(strong);

            lastIndex = regex.lastIndex;
        }
        // 最後に残ったテキストを追加
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));

        // 元のテキストノードを、処理済みの新しいノード群に置き換える
        parent.replaceChild(fragment, node);

        // 親要素に「処理済み」の目印を付けて、二度とこの中を探さないようにする
        parent.setAttribute(PROCESSED_MARK, 'true');
    }

    // ページの変更を監視するMutationObserver
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
                // 追加されたのが要素ノードの場合、その中のテキストノードをすべて探索
                if (addedNode.nodeType === Node.ELEMENT_NODE) {
                    const treeWalker = document.createTreeWalker(addedNode, NodeFilter.SHOW_TEXT);
                    while (treeWalker.nextNode()) {
                        makeBoldInNode(treeWalker.currentNode);
                    }
                }
                // 追加されたのが直接テキストノードの場合
                else {
                    makeBoldInNode(addedNode);
                }
            }
        }
    });

    // 監視を開始
    observer.observe(document.body, {
        childList: true, // 子要素の追加・削除を監視
        subtree: true    // すべての子孫要素を監視
    });

})();