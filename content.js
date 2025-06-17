// Enhanced Markdown Bold/Italic Fixer - Chrome Extension Content Script
// Converted from userscript to Chrome extension

(() => {
  "use strict";

  // Configuration - will be loaded from storage
  let CONFIG = {
    debug: true,
    enabled: true
  };

  // Load settings from Chrome storage
  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['debug', 'enabled']);
      CONFIG.debug = result.debug !== undefined ? result.debug : true;
      CONFIG.enabled = result.enabled !== undefined ? result.enabled : true;
    } catch (error) {
      console.warn('[Markdown Fixer] Failed to load settings:', error);
    }
  };

  // Constants
  const SKIP_ELEMENTS = "pre, code, kbd, samp, textarea, script, style";
  const PROCESSED_MARK = 'data-markdown-fixer-processed';
  const ORIGINAL_CONTENT_ATTR = 'data-original-content';

  // Enhanced regex patterns
  const RX_BOLD = /\*\*([\s\S]+?)\*\*/g;
  const RX_ITALIC = /(^|[^*])\*([^*\s][\s\S]*?)\*(?=[^*]|$)/g;

  // Safe HTML conversion with loop prevention
  const htmlConvert = (html) => {
    return html
      .replace(RX_BOLD, '<strong class="em-fix-bold">$1</strong>')
      .replace(RX_ITALIC, (_, p1, p2) => p1 + '<em class="em-fix-italic">' + p2 + "</em>");
  };

  // Fragment-based safe text conversion
  const convertTextNodeSafely = (node) => {
    if (!CONFIG.enabled) return;
    
    if (!node.parentElement || 
        node.parentElement.closest(SKIP_ELEMENTS) ||
        node.parentElement.hasAttribute(PROCESSED_MARK)) {
      return;
    }

    const text = node.textContent;
    if (!text.includes('*')) return;

    const parent = node.parentElement;
    if (!parent) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let hasChanges = false;

    // Process bold patterns
    let workingText = text;
    const boldMatches = [...workingText.matchAll(RX_BOLD)];
    
    if (boldMatches.length > 0) {
      hasChanges = true;
      lastIndex = 0;
      
      boldMatches.forEach(match => {
        // Add text before match
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(workingText.slice(lastIndex, match.index)));
        }
        
        // Add bold element
        const strong = document.createElement('strong');
        strong.className = 'em-fix-bold';
        strong.textContent = match[1];
        fragment.appendChild(strong);
        
        lastIndex = match.index + match[0].length;
      });
      
      // Add remaining text
      if (lastIndex < workingText.length) {
        fragment.appendChild(document.createTextNode(workingText.slice(lastIndex)));
      }
      
      // Update working text for italic processing
      workingText = fragment.textContent;
    }

    // Process italic patterns on remaining text
    if (workingText.includes('*')) {
      const italicMatches = [...workingText.matchAll(RX_ITALIC)];
      
      if (italicMatches.length > 0) {
        hasChanges = true;
        const newFragment = document.createDocumentFragment();
        lastIndex = 0;
        
        italicMatches.forEach(match => {
          // Add text before match
          if (match.index > lastIndex) {
            newFragment.appendChild(document.createTextNode(workingText.slice(lastIndex, match.index)));
          }
          
          // Add prefix if exists
          if (match[1]) {
            newFragment.appendChild(document.createTextNode(match[1]));
          }
          
          // Add italic element
          const em = document.createElement('em');
          em.className = 'em-fix-italic';
          em.textContent = match[2];
          newFragment.appendChild(em);
          
          lastIndex = match.index + match[0].length;
        });
        
        // Add remaining text
        if (lastIndex < workingText.length) {
          newFragment.appendChild(document.createTextNode(workingText.slice(lastIndex)));
        }
        
        // Replace fragment if we processed italics
        if (boldMatches.length > 0) {
          fragment.replaceChildren(...newFragment.childNodes);
        } else {
          fragment.appendChild(newFragment);
        }
      }
    }

    // Apply changes if any were made
    if (hasChanges) {
      // Store original content before replacement
      if (!parent.hasAttribute(ORIGINAL_CONTENT_ATTR)) {
        parent.setAttribute(ORIGINAL_CONTENT_ATTR, parent.innerHTML);
      }
      parent.replaceChild(fragment, node);
      parent.setAttribute(PROCESSED_MARK, 'true');
    }
  };

  // Element-level conversion for cross-boundary cases
  const patchElement = (el) => {
    if (!CONFIG.enabled) return;
    
    if (el.closest(SKIP_ELEMENTS) || 
        !el.textContent.includes("*") || 
        el.querySelector(SKIP_ELEMENTS) ||
        el.hasAttribute(PROCESSED_MARK)) {
      return;
    }

    const originalHTML = el.innerHTML;
    const convertedHTML = htmlConvert(originalHTML);
    
    if (convertedHTML !== originalHTML) {
      // Store original content before conversion
      if (!el.hasAttribute(ORIGINAL_CONTENT_ATTR)) {
        el.setAttribute(ORIGINAL_CONTENT_ATTR, originalHTML);
      }
      el.innerHTML = convertedHTML;
      el.setAttribute(PROCESSED_MARK, 'true');
    }
  };

  // Enhanced tree walker with both approaches
  const processNode = (root) => {
    if (!CONFIG.enabled) return;
    
    // First pass: individual text nodes (safer)
    const textWalker = document.createTreeWalker(
      root, 
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: node =>
          node.parentElement && !node.parentElement.closest(SKIP_ELEMENTS)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
      }
    );

    const textNodes = [];
    for (let node = textWalker.nextNode(); node; node = textWalker.nextNode()) {
      textNodes.push(node);
    }
    
    textNodes.forEach(convertTextNodeSafely);

    // Second pass: element-level for cross-boundary cases
    const elements = root.querySelectorAll("*");
    elements.forEach(patchElement);
  };

  // Restore original content for all processed elements
  const restoreOriginalContent = () => {
    const processedElements = document.querySelectorAll(`[${PROCESSED_MARK}]`);
    processedElements.forEach(el => {
      const originalContent = el.getAttribute(ORIGINAL_CONTENT_ATTR);
      if (originalContent) {
        el.innerHTML = originalContent;
        el.removeAttribute(PROCESSED_MARK);
        el.removeAttribute(ORIGINAL_CONTENT_ATTR);
      }
    });
  };

  // Apply or remove debug styles
  const updateDebugStyles = () => {
    const existingStyle = document.getElementById('markdown-fixer-debug-style');
    
    if (CONFIG.debug && CONFIG.enabled) {
      if (!existingStyle) {
        const style = document.createElement("style");
        style.id = 'markdown-fixer-debug-style';
        style.textContent = `
          strong.em-fix-bold { 
            background: rgba(255,255,0,0.25); 
            font-weight: 700; 
            border-radius: 2px;
            padding: 1px 2px;
          }
          em.em-fix-italic { 
            background: rgba(0,255,255,0.25); 
            font-style: italic; 
            border-radius: 2px;
            padding: 1px 2px;
          }
        `;
        document.head.appendChild(style);
      }
    } else if (existingStyle) {
      existingStyle.remove();
    }
  };

  // Enhanced mutation observer with Shadow DOM support
  const createObserver = (targetNode) => {
    return new MutationObserver(mutations => {
      if (!CONFIG.enabled) return;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(addedNode => {
          if (addedNode.nodeType === Node.TEXT_NODE) {
            convertTextNodeSafely(addedNode);
          } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
            processNode(addedNode);
          }
        });
      });
    });
  };

  let mainObserver = null;
  let shadowObserver = null;

  // Initialize the extension
  const initialize = async () => {
    await loadSettings();
    
    if (!CONFIG.enabled) return;
    
    // Initial processing
    if (document.body) {
      processNode(document.body);
    }

    // Apply debug styles
    updateDebugStyles();

    // Observe main document
    mainObserver = createObserver(document);
    mainObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });

    // Shadow DOM support for Gemini
    if (document.documentElement.shadowRoot) {
      shadowObserver = createObserver(document.documentElement.shadowRoot);
      shadowObserver.observe(document.documentElement.shadowRoot, {
        childList: true,
        subtree: true
      });
    }
  };

  // Listen for settings changes from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateSettings') {
      const wasEnabled = CONFIG.enabled;
      CONFIG = { ...CONFIG, ...request.settings };
      
      if (request.settings.enabled === false) {
        // Disable functionality and restore original content
        if (mainObserver) mainObserver.disconnect();
        if (shadowObserver) shadowObserver.disconnect();
        restoreOriginalContent();
        updateDebugStyles();
      } else if (request.settings.enabled === true) {
        if (!wasEnabled) {
          // Re-enable functionality from disabled state
          initialize();
        } else {
          // Just update debug styles if already enabled
          updateDebugStyles();
        }
      } else {
        // Update debug styles
        updateDebugStyles();
      }
      
      sendResponse({ success: true, restored: request.settings.enabled === false });
    }
  });

  // Cleanup function for potential memory leaks
  window.addEventListener('beforeunload', () => {
    if (mainObserver) mainObserver.disconnect();
    if (shadowObserver) shadowObserver.disconnect();
    // Restore original content before page unload
    restoreOriginalContent();
  });

  // Start the extension
  initialize();

})();