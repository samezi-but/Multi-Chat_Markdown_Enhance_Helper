// Enhanced Markdown Bold/Italic Fixer - Popup Settings Script

// Internationalization support
let currentLanguage = 'en';

// Get message from default i18n (browser locale)
const getMessage = (key, fallback = '') => {
    try {
        return chrome.i18n.getMessage(key) || fallback;
    } catch (_) {
        return fallback;
    }
};

// Runtime loaded locale messages cache
const localeCache = {};

// Load locale messages from _locales folder at runtime
const loadLocaleMessages = async (lang) => {
    if (localeCache[lang]) return localeCache[lang];
    try {
        const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
        const res = await fetch(url);
        const json = await res.json();
        // Flatten {key: {message, description}} to {key: message}
        localeCache[lang] = Object.fromEntries(
            Object.entries(json).map(([k, v]) => [k, v.message])
        );
        return localeCache[lang];
    } catch (e) {
        console.warn('Failed to load locale', lang, e);
        localeCache[lang] = {};
        return {};
    }
};

// Apply translations to elements with data-i18n attribute
const applyTranslations = async () => {
    const messages = await loadLocaleMessages(currentLanguage);
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const fallback = chrome.i18n.getMessage(key) || element.textContent;
        const message = messages[key] || fallback;
        if (message) element.textContent = message;
    });
};

// Setup collapsible sections
const setupCollapsibleSections = () => {
    const headers = document.querySelectorAll('.collapsible-header');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isCollapsed = content.classList.contains('collapsed');
            
            if (isCollapsed) {
                content.classList.remove('collapsed');
                header.classList.remove('collapsed');
            } else {
                content.classList.add('collapsed');
                header.classList.add('collapsed');
            }
        });
    });
};

// Load language preference
const loadLanguagePreference = async () => {
    try {
        const result = await chrome.storage.sync.get(['language']);
        currentLanguage = result.language || (navigator.language.startsWith('ja') ? 'ja' : 'en');
        
        // Apply browser locale if no preference stored
        if (!result.language) {
            await chrome.storage.sync.set({ language: currentLanguage });
        }
    } catch (error) {
        console.warn('Failed to load language preference:', error);
        currentLanguage = navigator.language.startsWith('ja') ? 'ja' : 'en';
    }
};

// Toggle language
const toggleLanguage = async () => {
    currentLanguage = currentLanguage === 'en' ? 'ja' : 'en';
    try {
        await chrome.storage.sync.set({ language: currentLanguage });
        // Reload popup to apply new language
        window.location.reload();
    } catch (error) {
        console.error('Failed to save language preference:', error);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const enabledToggle = document.getElementById('enabledToggle');
    const debugToggle = document.getElementById('debugToggle');
    const status = document.getElementById('status');
    const languageToggle = document.getElementById('languageToggle');
    
    // Load language preference and apply translations
    await loadLanguagePreference();
    await applyTranslations();
    
    // Setup collapsible sections
    setupCollapsibleSections();

    // Load current settings
    const loadSettings = async () => {
        try {
            const result = await chrome.storage.sync.get(['enabled', 'debug']);
            
            enabledToggle.checked = result.enabled !== undefined ? result.enabled : true;
            debugToggle.checked = result.debug !== undefined ? result.debug : false;
            
            updateStatus(getMessage('statusLoaded', '設定を読み込みました'), 'success');
        } catch (error) {
            console.error('Failed to load settings:', error);
            updateStatus(getMessage('statusLoadError', '設定の読み込みに失敗しました'), 'error');
        }
    };

    // Save settings
    const saveSettings = async () => {
        const settings = {
            enabled: enabledToggle.checked,
            debug: debugToggle.checked
        };

        try {
            await chrome.storage.sync.set(settings);
            
            // Notify content scripts of the change
            const tabs = await chrome.tabs.query({
                url: ['https://chatgpt.com/*', 'https://gemini.google.com/*']
            });
            
            let restoredContent = false;
            for (const tab of tabs) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateSettings',
                        settings: settings
                    });
                    if (response && response.restored) {
                        restoredContent = true;
                    }
                } catch (error) {
                    // Tab might not have the content script loaded, ignore
                    console.debug('Could not send message to tab:', tab.id);
                }
            }
            
            // Show appropriate status message
            if (!settings.enabled && restoredContent) {
                updateStatus(getMessage('statusRestored', '元のテキストに復元しました'), 'success');
            } else {
                updateStatus(getMessage('statusSaved', '設定を保存しました'), 'success');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            updateStatus(getMessage('statusError', '設定の保存に失敗しました'), 'error');
        }
    };

    // Update status message
    const updateStatus = (message, type = '') => {
        status.textContent = message;
        status.className = `status ${type}`;
        
        // Clear status after 2 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                status.textContent = '';
                status.className = 'status';
            }, 2000);
        }
    };

    // Event listeners
    enabledToggle.addEventListener('change', saveSettings);
    debugToggle.addEventListener('change', saveSettings);
    languageToggle.addEventListener('click', toggleLanguage);

    // Initialize
    await loadSettings();
    
    // Initial status message
    status.textContent = getMessage('statusLoading', '設定を読み込み中...');
});