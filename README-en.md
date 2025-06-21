# Multi-Chat Markdown Enhance Helper (for ChatGPT & Gemini)

> [日本語版](README.md)

A browser extension that automatically converts markdown-style emphasis (`**bold**` and `*italic*`) to proper HTML tags on ChatGPT and Gemini chat platforms.

## Features

- **Automatic Conversion**: `**bold**` → **bold**, `*italic*` → *italic*
- **Real-time Processing**: Converts text as you type or as it appears
- **Supported Sites**: ChatGPT (chatgpt.com) and Gemini (gemini.google.com)
- **Debug Mode**: Highlights converted text for debugging
- **Multi-language Support**: Japanese and English interface

## Installation

### Chrome Web Store (Recommended)
1. Install the extension from Chrome Web Store
2. Visit ChatGPT or Gemini
3. Conversion will start automatically

### Manual Installation
1. Download or clone this repository
2. Open Chrome extensions page (`chrome://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked extension"
5. Select the downloaded folder

## Usage

1. **Basic Usage**: After installing the extension, markdown syntax will be automatically converted on ChatGPT or Gemini

2. **Settings**: 
   - Click the extension icon to open the settings panel
   - Toggle automatic correction on/off
   - Toggle debug mode on/off

3. **Supported Syntax**:
   - `**bold text**` → **bold text**
   - `*italic text*` → *italic text*

## Technical Specifications

### Architecture
- **Manifest V3** compatible browser extension
- **Content Scripts** for DOM manipulation
- **MutationObserver** for real-time monitoring
- **TreeWalker** for efficient DOM traversal

### Key Files
- `content.js`: Main conversion logic
- `popup.html/js`: Settings panel UI
- `manifest.json`: Extension configuration
- `_locales/`: Internationalization files

### Conversion Logic
- **Bold**: `/\*\*([\s\S]+?)\*\*/g` → `<strong>$1</strong>`
- **Italic**: `/(^|[^*])\*([^*\s][\s\S]*?)\*(?=[^*]|$)/g` → `$1<em>$2</em>`

## Development

### Prerequisites
- Node.js (for icon generation)
- Python 3.x (for icon generation)

### Setup
```bash
git clone https://github.com/samezi-but/Multi-Chat_Markdown_Enhance_Helper.git
cd Multi-Chat_Markdown_Enhance_Helper
```

### Icon Generation
```bash
cd icons
python create_icons.py
```

### Testing
1. Load the extension into Chrome
2. Visit ChatGPT or Gemini
3. Test markdown syntax input
4. Use debug mode to verify conversion results

## Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.1
- Multi-language support (Japanese/English)
- UI improvements
- Enhanced stability

### v1.0.0
- Initial release
- ChatGPT and Gemini support
- Basic markdown conversion functionality