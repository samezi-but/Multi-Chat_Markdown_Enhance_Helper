// Enhanced Markdown Bold/Italic Fixer - Popup Settings Script

document.addEventListener('DOMContentLoaded', async () => {
    const enabledToggle = document.getElementById('enabledToggle');
    const debugToggle = document.getElementById('debugToggle');
    const status = document.getElementById('status');

    // Load current settings
    const loadSettings = async () => {
        try {
            const result = await chrome.storage.sync.get(['enabled', 'debug']);
            
            enabledToggle.checked = result.enabled !== undefined ? result.enabled : true;
            debugToggle.checked = result.debug !== undefined ? result.debug : true;
            
            updateStatus('設定を読み込みました', 'success');
        } catch (error) {
            console.error('Failed to load settings:', error);
            updateStatus('設定の読み込みに失敗しました', 'error');
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
            
            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateSettings',
                        settings: settings
                    });
                } catch (error) {
                    // Tab might not have the content script loaded, ignore
                    console.debug('Could not send message to tab:', tab.id);
                }
            }
            
            updateStatus('設定を保存しました', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            updateStatus('設定の保存に失敗しました', 'error');
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

    // Initialize
    await loadSettings();
});