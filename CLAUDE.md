# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

If you finish your works or you show to use message, use this command.
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

### DOM Manipulation Strategy
- **chatgpt.js**: Direct innerHTML replacement with regex + individual text node processing
- **gemini.js**: DocumentFragment-based replacement to avoid innerHTML parsing issues

### Skip Patterns
Both scripts exclude: `pre, code, kbd, samp, textarea, script, style` elements to preserve code blocks and prevent script interference.

## Testing

Test manually by:
1. Installing in Tampermonkey/Greasemonkey
2. Visiting ChatGPT or Gemini
3. Typing messages with `**bold**` or `*italic*` markdown
4. Verifying conversion to proper HTML tags
5. Checking debug highlighting (if enabled)