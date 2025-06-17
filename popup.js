// Enhanced Markdown Bold/Italic Fixer - Popup Settings Script

// Internationalization support
let currentLanguage = 'en';

// Get message from i18n or fallback
const getMessage = (key, fallback = '') => {
    try {
        return chrome.i18n.getMessage(key) || fallback;
    } catch (error) {
        return fallback;
    }
};

// Apply translations to elements with data-i18n attribute
const applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = getMessage(key, element.textContent);
        if (message) {
            element.textContent = message;
        }
    });
};

// Load language preference
const loadLanguagePreference = async () => {
    try {
        const result = await chrome.storage.sync.get(['language']);
        currentLanguage = result.language || navigator.language.startsWith('ja') ? 'ja' : 'en';
        
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
    applyTranslations();

    // Load current settings
    const loadSettings = async () => {
        try {
            const result = await chrome.storage.sync.get(['enabled', 'debug']);
            
            enabledToggle.checked = result.enabled !== undefined ? result.enabled : true;
            debugToggle.checked = result.debug !== undefined ? result.debug : true;
            
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