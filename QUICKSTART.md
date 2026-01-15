# POE Filter Extension - Quick Start Guide

## 🚀 Getting Started

Your POE Filter Editor extension is ready to use! Here's everything you need to know:

## Installation

### Option 1: From Marketplace
1. Open VS Code
2. Press `Ctrl+Shift+X` (Extensions)
3. Search for "POE Filter Editor"
4. Click "Install"

### Option 2: From VSIX File
1. Open VS Code
2. Press `Ctrl+Shift+X` (Extensions)
3. Click `...` menu → "Install from VSIX..."
4. Select `poe-filter-editor-0.1.0.vsix`

## Testing the Extension (Development)

### 1. Launch the Extension Host
Press `F5` or click "Run and Debug" → "Run Extension" to open a new VS Code window with your extension loaded.

### 2. Open a Filter File
In the Extension Development Host window:
- Open `example-test.filter` (or any `.filter` file)
- The extension will automatically activate

## Features Guide

### ✨ Syntax Highlighting
The extension provides rich syntax coloring:
- **Keywords**: `Show`, `Hide` in distinct colors
- **Conditions**: `BaseType`, `Class`, `ItemLevel` in light blue
- **Rarity Values**: Normal (white), Magic (blue), Rare (yellow), Unique (orange)
- **Effect Colors**: Bold highlighting for Red, Green, Blue, Orange, etc.
- **Comments**: Green for standalone `#` lines
- **FilterBlade Metadata**: Recognized but marked as organizational only

### 🎨 Color Features

#### Color Picker for RGB/RGBA Values
1. Click on any color values in `SetTextColor`, `SetBorderColor`, or `SetBackgroundColor`
2. A color picker will appear
3. Adjust colors visually and see changes immediately
4. Supports both RGB (3 values) and RGBA (4 values) formats

Example:
```
SetTextColor 255 200 100 255  ← Click to open color picker
SetBorderColor 255 0 0        ← Click to open color picker
```

#### Effect Color Visualization
- Colored squares (■) appear before color names in `PlayEffect` and `MinimapIcon`
- Each color shows its actual appearance in-game

### 🔗 BaseType Database Links

**Click any BaseType item** to open its page on poe2db.tw:

```
BaseType == "Abyssal Signet" "Breach Ring" "Thicket Bow"
             ^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^  ^^^^^^^^^^^^^
             Each is clickable!
```

- **Ctrl+Click** (Windows/Linux) or **Cmd+Click** (Mac) to open
- Works with multiple items in a list
- Automatically converts names to proper URLs

### 💡 Quick Actions (Lightbulb Menu)

#### Change Effect Colors
1. Click on any color name (Orange, Red, Blue, etc.) in `PlayEffect` or `MinimapIcon`
2. Press `Ctrl+.` (or click the lightbulb 💡)
3. See a menu with all 12 available colors
4. Click to instantly swap

#### Change Icon Shapes
1. Click on any shape name (Circle, Diamond, Star, etc.) in `MinimapIcon`
2. Press `Ctrl+.` (or click the lightbulb 💡)
3. See a menu with all 12 available shapes
4. Click to instantly swap

Example:
```
PlayEffect Orange     ← Lightbulb menu shows all colors
MinimapIcon 2 Cyan Diamond  ← Lightbulb menu for shapes
```

### 🔍 Smart Autocompletion

Press `Ctrl+Space` or just start typing for suggestions:

#### BaseType Names
```
BaseType "Aby↓        ← Autocomplete shows "Abyssal Signet"
```

#### Effect Colors & Shapes
```
PlayEffect ↓          ← Dropdown with Red, Green, Blue, Orange, etc.
MinimapIcon 2 Cyan ↓  ← Dropdown with Circle, Diamond, Star, etc.
```

#### Keywords & Conditions
```
Item↓                 ← Shows ItemLevel, etc.
Rarity ↓              ← Shows Normal, Magic, Rare, Unique
```

### 📖 Hover Documentation

**Hover over anything** to see detailed help:
- **Keywords**: Full descriptions from official POE docs
- **Colors**: Explanations of each effect color
- **Shapes**: What each minimap icon looks like
- **Modifiers**: What `Temp` does in `PlayEffect`
- **MinimapIcon Sizes**: Hover over 0, 1, or 2 to see size meanings
- **FilterBlade Metadata**: Warning that tags are organizational only

### ✅ Syntax Validation

Real-time error detection:

```
Show
	SetTextColor 300 255 255 255  # ❌ Error: value > 255
	SetBorderColor 255 255        # ❌ Error: needs 3 or 4 values
	UnknownKeyword test           # ⚠️ Warning: unknown keyword
```

Errors appear:
- In the editor with squiggly underlines
- In the Problems panel (`Ctrl+Shift+M`)

## Common Workflows

### Editing Existing Filters
1. Open your `.filter` file
2. Use `Ctrl+Click` on BaseTypes to check items on poe2db.tw
3. Use color picker to adjust RGB values visually
4. Use lightbulb menu to quickly swap colors/shapes

### Creating New Filter Rules
1. Type `Show` or `Hide`
2. Press `Ctrl+Space` for condition suggestions
3. Use autocomplete for BaseTypes and values
4. Click colors to pick visually
5. Hover for help on any keyword

### Organizing FilterBlade Filters
- The extension recognizes `# $type->` and `# $tier->` metadata
- These are preserved but marked as FilterBlade.xyz-specific
- The game ignores everything after `#` on Show/Hide lines

## File Structure

```
POE FILTER/
├── src/
│   └── extension.ts                # Main extension code
├── syntaxes/
│   └── poefilter.tmLanguage.json   # Syntax highlighting rules
├── themes/
│   └── poefilter-theme.json        # Custom color theme
├── package.json                    # Extension manifest
├── tsconfig.json                   # TypeScript config
├── example-test.filter             # Test file with all features
└── README.md                       # Full documentation
```

## Troubleshooting

### Extension not activating?
- Ensure file has `.filter` extension
- Check Developer Tools Console (`Help` → `Toggle Developer Tools`)

### Colors not showing?
- Ensure color values are separated by spaces
- Must be 3 or 4 values (RGB or RGBA)
- All values must be 0-255

### Links not working?
- Ensure item names are in quotes: `BaseType == "Abyssal Signet"`
- Use Ctrl+Click (Windows/Linux) or Cmd+Click (Mac)

### Autocompletion not appearing?
- Press `Ctrl+Space` to manually trigger
- Check that you're typing in a valid context

## Development Commands

If you're developing the extension:

```bash
# Compile TypeScript
npm run compile

# Watch for changes (auto-recompile)
npm run watch

# Package extension
vsce package --allow-missing-repository

# Install packaged extension
# Extensions view → ... menu → Install from VSIX
```

## Resources

- [POE Filter Documentation](https://www.pathofexile.com/item-filter/about)
- [FilterBlade.xyz](https://www.FilterBlade.xyz) - Online filter editor
- [poe2db.tw](https://poe2db.tw) - Item database
- [NeverSink's Filters](https://github.com/NeverSinkDev/NeverSink-Filter-for-PoE2)

---

**Happy filtering!** 🎮✨

For issues or suggestions, check the GitHub repository or create an issue.

Happy filtering! 🎮
