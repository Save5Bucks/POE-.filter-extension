# POE Filter Editor

A Visual Studio Code extension for editing Path of Exile 2 item filters with intelligent features.

## Features

### ✨ Syntax Highlighting
- **Keywords**: `Show`, `Hide`, `Continue`, `Import`
- **Conditions**: `BaseType`, `Class`, `Rarity`, `ItemLevel`, `Quality`, `Sockets`, etc.
- **Display Properties**: `SetTextColor`, `SetBorderColor`, `SetBackgroundColor`, `SetFontSize`
- **Audio/Visual Effects**: `PlayAlertSound`, `PlayEffect`, `MinimapIcon`
- **Rarity Colors**: Normal (white), Magic (blue), Rare (yellow), Unique (orange)
- **FilterBlade.xyz Metadata**: Recognizes `$type->`, `$tier->`, `!tag`, and `%XN` patterns

### 🎨 Color Features
- **Inline Color Visualization**: See color swatches (■) directly next to effect colors in `PlayEffect` and `MinimapIcon`
- **Color Picker**: Click on RGB/RGBA values in `SetTextColor`, `SetBorderColor`, `SetBackgroundColor` to open a visual color picker
- **RGBA Support**: Full support for 3 or 4-component color values (Red Green Blue [Alpha])
- **Effect Color Recognition**: Highlights all 12 effect colors (Red, Green, Blue, Brown, White, Yellow, Cyan, Grey, Orange, Pink, Purple, Temp)

### 🔗 BaseType Links
- **Clickable Item Names**: Ctrl+Click (Cmd+Click on Mac) any quoted BaseType item to open its page on poe2db.tw
- **Smart URL Conversion**: Automatically converts item names to proper URL format
- **Multiple Items Support**: Each item in a list is individually clickable

### 💡 Quick Actions (Lightbulb Menu)
- **Color Changes**: Click on effect color names (Orange, Red, Blue, etc.) to see a menu with all 12 available colors
- **Shape Changes**: Click on minimap icon shapes (Circle, Diamond, Star, etc.) to see a menu with all 12 available shapes
- **One-Click Swap**: Instantly change colors or shapes without typing

### ✅ Syntax Validation
- Real-time error detection for:
  - Invalid color values (must be 0-255)
  - Incorrect number of color components (must be 3 or 4)
  - Unknown filter keywords
  - Malformed syntax

### 🚀 Smart Autocompletion
- **BaseType Names**: Complete list extracted from reference filters
- **Effect Colors**: Dropdown list of all 12 colors for `PlayEffect` and `MinimapIcon`
- **Icon Shapes**: Dropdown list of all 12 shapes for `MinimapIcon`
- **Rarity Values**: Normal, Magic, Rare, Unique with descriptions
- **Keywords & Operators**: All filter conditions with smart operator suggestions
- **Display Properties**: Snippets with placeholder values

### 📖 Comprehensive Hover Documentation
- **60+ Definitions**: Hover over any keyword, color, shape, or modifier for detailed explanations
- **Official POE Docs**: Information sourced from pathofexile.com/item-filter
- **FilterBlade Metadata Warnings**: Clear explanations that metadata tags are FilterBlade.xyz-specific
- **Usage Examples**: See syntax examples for every keyword
- **MinimapIcon Size Info**: Hover over size numbers (0, 1, 2) to see what each size means

## Usage

1. **Install the extension** from the VS Code marketplace or from a `.vsix` file
2. **Open any `.filter` file** - the extension activates automatically
3. **Start editing** with full syntax highlighting and validation
4. **Click on colors** to open the color picker
5. **Ctrl+Click BaseTypes** to view items on poe2db.tw
6. **Use lightbulb menu** (Ctrl+.) on colors/shapes to quickly change them
7. **Trigger autocomplete** with `Ctrl+Space` or by typing
8. **Hover over keywords** for documentation and examples

## Requirements

- Visual Studio Code 1.108.0 or higher
- Path of Exile 2 filter files (`.filter` extension)

## Known Limitations

- FilterBlade.xyz metadata (`$type->`, `$tier->`, `!tag`, `%XN`) is recognized but not validated
- BaseType autocompletion requires reference filters in the workspace
- poe2db.tw links may not work for all item names (URL format may vary)

## Extension Settings

This extension works out of the box with no configuration required.

## Release Notes

### 0.1.0 (Initial Release)

**Core Features:**
- Syntax highlighting with rarity-colored values
- Color visualization with inline swatches
- Color picker for RGB/RGBA values
- Syntax validation with error reporting

**Advanced Features:**
- BaseType linking to poe2db.tw database
- Quick action lightbulb menus for colors and shapes
- Smart autocompletion with context-aware suggestions
- 60+ hover definitions from official documentation
- FilterBlade.xyz metadata recognition and warnings
- Effect color decorator showing colored squares
- MinimapIcon size definitions (0=small, 1=medium, 2=large)

## Credits

- **Reference Filters**: NeverSink - https://www.FilterBlade.xyz
- **POE Filter Documentation**: https://www.pathofexile.com/item-filter/about
- **Item Database**: https://poe2db.tw

## Contributing

Found a bug or have a feature request? Please open an issue on GitHub!

## License

MIT License - See LICENSE file for details

---

**Enjoy editing your POE2 filters with ease!** 🎮✨
