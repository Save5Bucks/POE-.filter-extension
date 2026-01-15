# BaseTypes Data

This directory contains the built-in BaseType database used for autocomplete suggestions.

## Files

- **basetypes.json** - Organized list of BaseType items from both POE1 and POE2

## Structure

```json
{
  "POE1": ["array of POE1 BaseTypes"],
  "POE2": ["array of POE2 BaseTypes"]
}
```

## BaseTypes Management

### For Users

You don't need to edit this file directly. Instead, use VS Code settings:

**Choose game version:**
1. Open Settings (`Ctrl+,`)
2. Search for "POE Filter"
3. Set **"Poefilter: Game Version"** to POE1, POE2, or Both (default)

**Add custom BaseTypes:**
1. Open Settings (`Ctrl+,`)
2. Search for "POE Filter"
3. Add items to **"Poefilter: Custom Base Types"**

**Exclude BaseTypes:**
1. Open Settings (`Ctrl+,`)
2. Search for "POE Filter"
3. Add items to **"Poefilter: Excluded Base Types"**

## Current Database

- **POE1 BaseTypes**: 214 unique items
- **POE2 BaseTypes**: 78 unique items
- **Total**: 292 unique BaseTypes
- **Last Updated**: January 15, 2026

### Sources
- POE1: Extracted from NeverSink's POE1 filters (7 strictness levels)
- POE2: Extracted from NeverSink's POE2 filters (7 strictness levels)

### For Developers

To update the built-in basetypes.json:

1. Add POE filter files to a directory (e.g., `POE 2 FILTERS/`)
2. Run the extraction script:

```javascript
const fs = require('fs');
const path = require('path');

const filterDir = path.join(process.cwd(), 'POE 2 FILTERS');
const baseTypeSet = new Set();

if (fs.existsSync(filterDir)) {
    const files = fs.readdirSync(filterDir).filter(f => f.endsWith('.filter'));
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(filterDir, file), 'utf-8');
        const regex = /BaseType\s+==\s+"([^"]+)"/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            match[1].split('" "').forEach(item => baseTypeSet.add(item.trim()));
        }
    }
    
    const baseTypes = Array.from(baseTypeSet).sort();
    fs.writeFileSync('data/basetypes.json', JSON.stringify(baseTypes, null, 2));
    console.log(`Extracted ${baseTypes.length} unique BaseTypes`);
}
```

3. Rebuild the extension: `npm run compile`
4. Repackage: `vsce package`

## Current Database

- **Source**: POE2 filters (7 strictness levels)
- **Count**: 78 unique BaseTypes
- **Last Updated**: January 15, 2026

To add POE1 BaseTypes, extract from POE1 filter files and merge with the existing list.
