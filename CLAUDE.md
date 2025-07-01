# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

If you finish your work or you ask the user, use this command.
powershell.exe -Command '[System.Media.SystemSounds]::Hand.Play()'

## Project Overview

Multi-Chat Markdown Helper (for ChatGPT & Gemini) is a collection of browser userscripts for automatically converting markdown-style emphasis (`**bold**` and `*italic*`) to proper HTML tags (`<strong>` and `<em>`) on chat platforms like ChatGPT and Gemini.

## Architecture

- **chatgpt.js**: Universal userscript supporting both ChatGPT and Gemini with comprehensive cross-boundary markdown processing
- **gemini.js**: Gemini-specific implementation with simpler approach and infinite loop prevention

### Key Components

**chatgpt.js (v6.0)**:
- Uses TreeWalker for efficient DOM traversal
- Supports cross-element boundary markdown conversion 
- MutationObserver for dynamic content monitoring
- Shadow DOM support for Gemini compatibility
- Debug highlighting with colored backgrounds

**gemini.js (v2.0)**:
- Focused on preventing infinite processing loops
- Uses `data-bold-fixer-processed` attribute to mark processed elements
- Fragment-based DOM replacement for safe text conversion
- TreeWalker for added node processing

## Development Notes

### Regex Patterns
- Bold: `/\*\*([\s\S]+?)\*\*/g` (chatgpt.js) or `/\*\*(.*?)\*\*/g` (gemini.js)
- Italic: `/(^|[^*])\*([^*\s][\s\S]*?)\*(?=[^*]|$)/g`


### Skip Patterns
Both scripts exclude: `pre, code, kbd, samp, textarea, script, style` elements to preserve code blocks and prevent script interference.

## Testing

When testing is needed, provide test files/content to the user instead of creating temporary files in the project directory.

Manual testing steps:
1. Installing in Tampermonkey/Greasemonkey
2. Visiting ChatGPT or Gemini
3. Typing messages with `**bold**` or `*italic*` markdown
4. Verifying conversion to proper HTML tags
5. Checking debug highlighting (if enabled)