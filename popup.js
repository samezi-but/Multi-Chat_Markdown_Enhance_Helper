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
    // Get current locale from Chrome extension API
    const locale = chrome.i18n.getUILanguage().startsWith('ja') ? 'ja' : 'en';
    
    // Load appropriate message file based on current language setting
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        let message;
        
        if (currentLanguage === 'ja') {
            // Use Japanese messages
            message = getJapaneseMessage(key) || chrome.i18n.getMessage(key) || element.textContent;
        } else {
            // Use English messages
            message = getEnglishMessage(key) || chrome.i18n.getMessage(key) || element.textContent;
        }
        
        if (message) {
            element.textContent = message;
        }
    });
};

// Japanese messages
const getJapaneseMessage = (key) => {
    const messages = {
        'popupTitle': 'Multi-Chat Markdown Enhance Helper 設定',
        'markdownFixer': 'Multi-Chat Markdown Enhance Helper',
        'version': 'v1.0',
        'enableExtension': '自動修正の有効化',
        'enableExtensionDesc': 'エラー文字列を自動的に修正します。',
        'debugMode': 'デバッグモード',
        'debugModeDesc': '変換されたテキストをハイライト表示',
        'supportedSites': '対応サイト',
        'chatgpt': 'ChatGPT (chatgpt.com)',
        'gemini': 'Gemini (gemini.google.com)',
        'usage': '現在の対応内容',
        'bold': '太字',
        'italic': '斜体',
        'statusLoading': '設定を読み込み中...',
        'statusSaved': '設定を保存しました',
        'statusLoaded': '設定を読み込みました',
        'statusError': '設定の保存に失敗しました',
        'statusLoadError': '設定の読み込みに失敗しました',
        'languageToggle': 'Language / 言語',
        'statusRestored': '元のテキストに復元しました',
        'detailsInfo': '詳細情報'
    };
    return messages[key];
};

// English messages
const getEnglishMessage = (key) => {
    const messages = {
        'popupTitle': 'Multi-Chat Markdown Helper Settings',
        'markdownFixer': 'Multi-Chat Markdown Helper',
        'version': 'v1.0',
        'enableExtension': 'Enable Auto-Fix',
        'enableExtensionDesc': 'Automatically fix error strings',
        'debugMode': 'Debug Mode',
        'debugModeDesc': 'Highlight converted text with colors',
        'supportedSites': 'Supported Sites',
        'chatgpt': 'ChatGPT (chatgpt.com)',
        'gemini': 'Gemini (gemini.google.com)',
        'usage': 'Current Support',
        'bold': 'bold',
        'italic': 'italic',
        'statusLoading': 'Loading settings...',
        'statusSaved': 'Settings saved',
        'statusLoaded': 'Settings loaded',
        'statusError': 'Failed to save settings',
        'statusLoadError': 'Failed to load settings',
        'languageToggle': 'Language / 言語',
        'statusRestored': 'Original content restored',
        'detailsInfo': 'Details'
    };
    return messages[key];
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
    applyTranslations();
    
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