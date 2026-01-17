# POE Filter Editor

A Visual Studio Code extension for editing Path of Exile (POE1 & POE2) item filters with intelligent features.

## Compatibility

✅ **Works with both Path of Exile 1 and Path of Exile 2**

The filter syntax is identical across both games. This extension supports all standard filter keywords, conditions, and display properties used in both POE1 and POE2 filters.

### BaseType Database

The extension includes **292 BaseTypes** organized by game version:
- **POE1**: 214 unique items
- **POE2**: 78 unique items

**Default behavior**: Both POE1 and POE2 BaseTypes are loaded for autocomplete.

**Customization**: You can choose to load only POE1, only POE2, or both via extension settings. See [Extension Settings](#extension-settings) below.

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
- Path of Exile filter files (`.filter` extension)
- **Compatible with POE1 and POE2 filters**

## Known Limitations

- FilterBlade.xyz metadata (`$type->`, `$tier->`, `!tag`, `%XN`) is recognized but not validated
- BaseType autocompletion requires reference filters in the workspace
- poe2db.tw links may not work for all item names (URL format may vary)
- **Note**: While the filter syntax is identical, some item BaseTypes are game-specific (POE1 vs POE2)

## Extension Settings

This extension provides the following settings:

- **`poefilter.gameVersion`**: Choose which game's BaseTypes to include in autocomplete.
  - Type: String (enum)
  - Options: `"POE1"`, `"POE2"`, `"Both"`
  - Default: `"Both"`
  - Description: Controls which BaseType database to load (POE1: 214 items, POE2: 78 items, Both: 292 items)

- **`poefilter.customBaseTypes`**: Add custom BaseType items to autocomplete suggestions. These will be merged with the built-in BaseType list.
  - Type: Array of strings
  - Default: `[]`
  - Example: `["Custom Item Name", "Another Item"]`

- **`poefilter.excludedBaseTypes`**: Remove specific BaseType items from autocomplete suggestions.
  - Type: Array of strings
  - Default: `[]`
  - Example: `["Unwanted Item", "Another Item"]`

### How to Configure

1. Open Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "POE Filter"
3. Choose your game version (POE1, POE2, or Both)
4. Add or remove BaseTypes as needed

The extension comes with **214 POE1 BaseTypes** and **78 POE2 BaseTypes** (292 total). By default, both are loaded for maximum compatibility.

## Release Notes

### 0.1.3 (Latest)

**New Features:**
- 📋 **Filter Outline Navigation**: Sidebar panel showing all `[[XXXX]]` filter sections for quick navigation
- 🔊 **Sound Preview System**: Play alert sounds directly in VS Code with clickable ▶️ buttons
- 🎵 **Sound Selection Tools**: Autocomplete and quick actions for all 26 PlayAlertSound options
- 🔗 **Helpful Links Panel**: Sidebar with 15 community resources (wikis, tools, databases)
- ⚙️ **Volume Control**: Adjustable sound preview volume in settings
- 📖 **Sound Descriptions**: Hover tooltips showing sound names (Alchemy, Divine, Mirror, etc.)

**Includes 26 Alert Sounds:**
- Sounds 1-6: Standard game alert sounds
- Sounds 7-26: FilterBlade community sounds (requires FilterBlade audio pack in-game)

### 0.1.2

**New BaseType Management System:**
- 🎮 **Separated POE1 & POE2 Databases**: 214 POE1 items + 78 POE2 items = 292 total
- ⚙️ **Game Version Setting**: Choose POE1, POE2, or Both (Settings → "Poefilter: Game Version")
- 📝 **Custom BaseTypes**: Add your own items (Settings → "Poefilter: Custom Base Types")
- 🚫 **Exclude BaseTypes**: Remove unwanted items (Settings → "Poefilter: Excluded Base Types")
- 🔄 **Live Configuration**: All settings update instantly without reloading

**How to Configure:**
1. Press `Ctrl+,` (or `Cmd+,` on Mac) to open Settings
2. Search for "POE Filter"
3. Set "Game Version" to POE1, POE2, or Both
4. Add custom items to "Custom Base Types" array
5. Add unwanted items to "Excluded Base Types" array

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

### Reference & Community Resources

- **NeverSink's Filters**: https://www.filterblade.xyz - Reference filters and community filter editor
- **POE Official Documentation**: https://www.pathofexile.com/item-filter/about - Filter syntax documentation

### Item Databases & Tools

- **PoE Database (POE1)**: https://poedb.tw - Comprehensive POE1 database
- **PoE2 Database**: https://poe2db.tw - Comprehensive POE2 database  
- **Craft of Exile**: https://www.craftofexile.com - Crafting simulator and calculator
- **PoE & POE2 Economy**: https://poe.ninja - Market prices and economy tracking

### Game Information Resources

- **PoE Wiki**: https://www.poewiki.net/wiki/Path_of_Exile - Official Path of Exile wiki
- **PoE2 Wiki**: https://www.poewiki.net/wiki/Path_of_Exile_2 - Official Path of Exile 2 wiki
- **PoE Vault**: https://www.poe-vault.com - Guides and builds database
- **Maxroll PoE Guides**: https://maxroll.gg/poe - POE1 guides and builds
- **Maxroll PoE2 Guides**: https://maxroll.gg/poe2 - POE2 guides and builds

### Build Planning & Tools

- **Path of Building Community**: https://pathofbuilding.community - Build planning tool
- **PoHX Build Planner**: https://pohx.net - POE build resources and guides
- **Atziri's Temple Planner**: https://sulozor.github.io/#/atziri-temple - Atlas planning tool

### Trading Applications

- **Awakened PoE Trade**: https://snosme.github.io/awakened-poe-trade - POE1 trading overlay
- **Exiled Exchange 2**: https://kvan7.github.io/Exiled-Exchange-2/download - POE2 trading app

### Legal Notice

**DISCLAIMER**: This extension is an unofficial, community-created tool not affiliated with Grinding Gear Games. See `DISCLAIMER.txt` for full legal terms, liability information, and third-party tool policy details. By using this extension, you acknowledge the risks and agree to the terms outlined in the disclaimer.

**Audio Assets**: Alert sounds sourced from FilterBlade.xyz for filter testing purposes. These are not official game assets. See `DISCLAIMER.txt` for full audio asset disclosure.

## Contributing

Found a bug or have a feature request? Please open an issue on GitHub!

## License

MIT License - See LICENSE file for details

---

**Enjoy editing your POE2 filters with ease!** 🎮✨
