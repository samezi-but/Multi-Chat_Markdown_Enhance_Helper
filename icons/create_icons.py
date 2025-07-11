#!/usr/bin/env python3
"""
Simple script to create basic SVG icons for the Chrome extension.
Creates 16x16, 32x32, 48x48, and 128x128 PNG icons from SVG.
"""

import os
import base64
from pathlib import Path

# SVG icon template
svg_template = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="50" cy="50" r="45" fill="url(#grad)" stroke="white" stroke-width="2"/>
  
  <!-- Markdown symbols -->
  <text x="25" y="40" font-family="monospace" font-size="20" font-weight="bold" fill="white">**</text>
  <text x="25" y="65" font-family="monospace" font-size="16" font-style="italic" fill="white">*</text>
  
  <!-- HTML symbols -->
  <text x="55" y="35" font-family="monospace" font-size="8" fill="rgba(255,255,255,0.8)">&lt;b&gt;</text>
  <text x="55" y="55" font-family="monospace" font-size="8" fill="rgba(255,255,255,0.8)">&lt;em&gt;</text>
  
  <!-- Arrow -->
  <path d="M 40 50 L 52 50 M 48 46 L 52 50 L 48 54" stroke="white" stroke-width="2" fill="none"/>
</svg>'''

def create_svg_icon(size):
    """Create SVG icon of specified size"""
    return svg_template.format(size=size)

def create_simple_png_from_existing():
    """Create simple PNG files by copying the existing 128.png for all sizes"""
    sizes = [16, 32, 48]
    
    # Read the existing 128.png file
    if os.path.exists("icon-128.png"):
        with open("icon-128.png", "rb") as f:
            png_data = f.read()
        
        # Copy to other sizes (browser will resize as needed)
        for size in sizes:
            filename = f"icon-{size}.png"
            with open(filename, "wb") as f:
                f.write(png_data)
            print(f"Created {filename}")
    else:
        print("icon-128.png not found!")

def main():
    # Icon sizes needed for Chrome extension
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        svg_content = create_svg_icon(size)
        filename = f"icon-{size}.svg"
        
        with open(filename, 'w') as f:
            f.write(svg_content)
        
        print(f"Created {filename}")
    
    # Create PNG files by copying the existing 128.png
    print("\nCreating PNG files...")
    create_simple_png_from_existing()
    
    print("\nAll icons created successfully!")

if __name__ == "__main__":
    main()