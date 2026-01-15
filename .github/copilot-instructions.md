# POE Filter VSCode Extension - AI Agent Guide

## Project Purpose
This project develops a VSCode extension for editing Path of Exile 2 (POE2) item filters with intelligent syntax highlighting and autocompletion. The goal is to help players optimize their `.filter` files efficiently.

## Filter File Structure

### Core Syntax Pattern
POE2 filter files use a declarative block syntax:
```
Show/Hide # comment with metadata
    Condition1 operator value
    Condition2 operator value
    SetProperty value
    PlayEffect/PlayAlertSound
    MinimapIcon
```

**Key Components:**
- **Show/Hide**: Action keywords that determine item visibility
- **Metadata comments**: Follow `#` with tags like `$type->`, `$tier->`, `!tag`
  - **IMPORTANT**: `Show #` or `Hide #` followed by metadata is ONLY for FilterBlade.xyz organization
  - These are NOT standard POE filter syntax - they're FilterBlade's tracking/organization system
  - Regular POE filters just use `Show` or `Hide` without metadata
  - Standalone `#` lines are regular comments
- **Conditions**: Filter criteria (BaseType, Rarity, ItemLevel, StackSize, Sockets, Quality, Class, Corrupted, Mirrored, HasExplicitMod, AreaLevel)
- **Display properties**: SetFontSize, SetTextColor, SetBorderColor, SetBackgroundColor (RGBA values)
- **Audio/Visual**: PlayAlertSound, PlayEffect, MinimapIcon

### Strictness Tiers (0-6)
Filters in `POE 2 FILTERS/` demonstrate 7 strictness levels:
- **STOCK_0_Soft.filter**: Most permissive, shows nearly everything
- **STOCK_3_Strict.filter**: Balanced filtering for endgame
- **STOCK_6_Uber Plus Strict.filter**: Ultra-restrictive, hides low-value items

**Key difference**: Stricter filters convert `Show` blocks to `Hide` for low-tier items. Compare same sections across files to understand progressive filtering.

## Filter Organization

### Section Structure
Files use double-bracket section markers for navigation:
```
# [[0100]] Gold
# [[0200]] Exotic Bases
# [[0300]] Exceptional Items
#   [0301] Crafting and Chancing Bases
```
Section numbers follow priority order (lower = higher priority). Use these for quick navigation.

### Common Patterns

**Multi-condition blocks** combine item properties:
```
Show # %D6 $type->exoticbases $tier->commonexoticbaseshigh
    ItemLevel >= 82
    Rarity Normal Magic
    BaseType == "Breach Ring"
    SetTextColor 0 70 255 255
```

**BaseType lists** define specific items (often 50+ entries):
```
BaseType == "Adherent Cuffs" "Akoyan Spear" "Alpha Talisman" ...
```

**Tier-based decoration** uses metadata tags to track filter logic:
- `$type->` categorizes item type (gold, currency, gear, etc.) - FilterBlade.xyz only
- `$tier->` indicates value tier (t1-t6) - FilterBlade.xyz only
- `!tag` provides searchable identifiers - FilterBlade.xyz only
- **These metadata tags are FilterBlade's organization system, NOT part of core POE filter syntax**
- The game engine ignores everything after `#` on Show/Hide lines
- Users editing filters manually may not use these tags at all

## Extension Development Context

### Goal
Create `.filter` extension with:
1. **Syntax validation** - Detect and report filter syntax errors
2. **Color visualization** - Display RGB/RGBA colors inline and provide color picker for SetTextColor, SetBorderColor, SetBackgroundColor
3. **Syntax highlighting** - Highlight Show/Hide blocks, conditions, and display properties
4. **Autocompletion** for:
   - BaseType names (extracted from all 7 filter files in `POE 2 FILTERS/`)
   - Condition keywords and operators
   - Display properties and valid values
   - FilterBlade.xyz metadata conventions (`$type->`, `$tier->`, `!tag`)

### Key Principle
This extension supports **editing filters** - not generating them. Users come with existing filters (typically from FilterBlade.xyz) and need help customizing them.

### Data Extraction Strategy
Mine `POE 2 FILTERS/*.filter` files to:
- Extract all unique BaseType values (complete item database from all 7 strictness levels)
- Identify all Class categories (Boots, Weapons, Amulets, etc.)
- Document condition keywords and their valid operators
- Map metadata patterns used by FilterBlade.xyz

## Critical Conventions

1. **Indentation**: Use tabs for condition/property indentation under Show/Hide
2. **Color format**: Always RGBA (4 integers 0-255). Extension must visualize these colors inline
3. **Operator spacing**: Use `==` for equality, `>=`/`<=` for comparisons, no spaces around operators in values
4. **String lists**: Space-separated quoted strings for BaseType/Class
5. **FilterBlade metadata**: Comments like `# %D6 $type->... $tier->... !tag` are FilterBlade.xyz conventions - preserve them during edits
6. **Syntax validation**: Flag invalid keywords, malformed colors, incorrect operators, missing required properties

## Color Features
- **Inline visualization**: Show color swatches next to SetTextColor, SetBorderColor, SetBackgroundColor
- **Color picker**: Provide color picker UI when editing RGBA values
- **RGBA format**: Always maintain 4-component format (Red Green Blue Alpha, each 0-255)

## Testing Approach
Compare generated syntax against actual filter files in `POE 2 FILTERS/`. Valid filters must match NeverSink's formatting conventions (author of reference filters).

## External Dependencies
- **FilterBlade.xyz**: Online editor for these filters (reference implementation)
- **NeverSink's Filter repo**: Source of truth for POE2 filter syntax (github.com/NeverSinkDev/NeverSink-Filter-for-PoE2)

## Key Files
- `idea.txt`: Project requirements and feature scope
- `POE 2 FILTERS/STOCK_0_Soft.filter`: Most complete item list (least restrictive)
- `POE 2 FILTERS/STOCK_6_Uber Plus Strict.filter`: Shows maximum filtering (most restrictive)
