// Enhanced Markdown Bold/Italic Fixer - Chrome Extension Content Script
// Converted from userscript to Chrome extension

(() => {
  "use strict";

  // Configuration - will be loaded from storage
  let CONFIG = {
    debug: false,
    enabled: true,
    streamingDetection: true,
    characterDataMonitoring: true
  };

  // Load settings from Chrome storage
  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['debug', 'enabled', 'streamingDetection', 'characterDataMonitoring']);
      CONFIG.debug = result.debug !== undefined ? result.debug : true;
      CONFIG.enabled = result.enabled !== undefined ? result.enabled : true;
      CONFIG.streamingDetection = result.streamingDetection !== undefined ? result.streamingDetection : true;
      CONFIG.characterDataMonitoring = result.characterDataMonitoring !== undefined ? result.characterDataMonitoring : true;
    } catch (error) {
      console.warn('[Markdown Fixer] Failed to load settings:', error);
    }
  };

  // Constants
  const SKIP_ELEMENTS = "pre, code, kbd, samp, textarea, script, style";
  const PROCESSED_MARK = 'data-markdown-fixer-processed';
  const ORIGINAL_CONTENT_ATTR = 'data-original-content';
  
  // Platform detection
  const PLATFORM = {
    CHATGPT: 'chatgpt',
    GEMINI: 'gemini',
    UNKNOWN: 'unknown'
  };
  
  const getCurrentPlatform = () => {
    const hostname = window.location.hostname;
    if (hostname.includes('chatgpt.com')) return PLATFORM.CHATGPT;
    if (hostname.includes('gemini.google.com')) return PLATFORM.GEMINI;
    return PLATFORM.UNKNOWN;
  };
  
  const currentPlatform = getCurrentPlatform();
  
  // Platform-specific constants
  const STREAMING_CLASS = currentPlatform === PLATFORM.CHATGPT ? 'result-streaming' : null;
  
  // Streaming completion tracking (ChatGPT only)
  const streamingObservers = new WeakMap();
  const pendingProcessNodes = new WeakSet();

  // Enhanced regex patterns
  const RX_BOLD = /\*\*([\s\S]+?)\*\*/g;
  const RX_ITALIC = /(^|[^*])\*([^*\s][\s\S]*?)\*(?=[^*]|$)/g;

  // Safe HTML conversion with loop prevention
  const htmlConvert = (html) => {
    return html
      .replace(RX_BOLD, '<strong class="em-fix-bold">$1</strong>')
      .replace(RX_ITALIC, (_, p1, p2) => p1 + '<em class="em-fix-italic">' + p2 + "</em>");
  };

  // Check if node is in streaming response (ChatGPT only)
  const isInStreamingResponse = (node) => {
    // Only applicable for ChatGPT
    if (currentPlatform !== PLATFORM.CHATGPT || !STREAMING_CLASS) return false;
    
    // Handle both text nodes and element nodes
    const elementToCheck = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!elementToCheck) return false;
    
    const streamingContainer = elementToCheck.closest(`.${STREAMING_CLASS}`);
    return streamingContainer !== null;
  };

  // Observe streaming completion for a container (ChatGPT only)
  const observeStreamingCompletion = (container) => {
    // Only applicable for ChatGPT
    if (currentPlatform !== PLATFORM.CHATGPT || !STREAMING_CLASS) return;
    if (streamingObservers.has(container)) return;
    
    const observer = new MutationObserver(() => {
      if (!container.classList.contains(STREAMING_CLASS)) {
        // Streaming completed - process all pending nodes
        processNode(container);
        observer.disconnect();
        streamingObservers.delete(container);
      }
    });
    
    observer.observe(container, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    streamingObservers.set(container, observer);
  };

  // Fragment-based safe text conversion
  const convertTextNodeSafely = (node) => {
    if (!CONFIG.enabled) return;
    
    if (!node.parentElement || 
        node.parentElement.closest(SKIP_ELEMENTS)) {
      return;
    }
    
    // Check if in streaming response (ChatGPT only, only if streaming detection is enabled)
    if (CONFIG.streamingDetection && currentPlatform === PLATFORM.CHATGPT) {
      if (isInStreamingResponse(node)) {
        const elementToCheck = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (elementToCheck && STREAMING_CLASS) {
          const streamingContainer = elementToCheck.closest(`.${STREAMING_CLASS}`);
          if (streamingContainer) {
            observeStreamingCompletion(streamingContainer);
            return; // Skip processing until streaming completes
          }
        }
      }
    }
    
    // Allow reprocessing if text contains markdown
    const parent = node.parentElement;
    const text = node.textContent;
    if (!text.includes('*') || !parent) return;

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

  // Enhanced mutation observer with streaming detection
  const createObserver = (targetNode) => {
    return new MutationObserver(mutations => {
      if (!CONFIG.enabled) return;
      
      mutations.forEach(mutation => {
        // Handle character data changes - only if not streaming (when streaming detection is enabled)
        if (mutation.type === 'characterData') {
          const textNode = mutation.target;
          if (textNode && textNode.parentElement && (!CONFIG.streamingDetection || !isInStreamingResponse(textNode))) {
            // Remove processed mark from parent to allow reprocessing
            const parent = textNode.parentElement;
            if (parent.hasAttribute(PROCESSED_MARK)) {
              parent.removeAttribute(PROCESSED_MARK);
              // Restore original content if exists
              const originalContent = parent.getAttribute(ORIGINAL_CONTENT_ATTR);
              if (originalContent) {
                parent.removeAttribute(ORIGINAL_CONTENT_ATTR);
              }
            }
            convertTextNodeSafely(textNode);
          }
        }
        
        // Handle added nodes
        mutation.addedNodes.forEach(addedNode => {
          if (addedNode.nodeType === Node.TEXT_NODE) {
            convertTextNodeSafely(addedNode);
          } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
            // Check for streaming containers (ChatGPT only, only if streaming detection is enabled)
            if (CONFIG.streamingDetection && currentPlatform === PLATFORM.CHATGPT && 
                STREAMING_CLASS && addedNode.classList && addedNode.classList.contains(STREAMING_CLASS)) {
              observeStreamingCompletion(addedNode);
            } else {
              processNode(addedNode);
            }
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
      subtree: true,
      characterData: CONFIG.characterDataMonitoring
    });

    // Shadow DOM support for Gemini only
    if (currentPlatform === PLATFORM.GEMINI && document.documentElement.shadowRoot) {
      shadowObserver = createObserver(document.documentElement.shadowRoot);
      shadowObserver.observe(document.documentElement.shadowRoot, {
        childList: true,
        subtree: true,
        characterData: CONFIG.characterDataMonitoring
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