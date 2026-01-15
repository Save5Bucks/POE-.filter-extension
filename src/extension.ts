import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('POE Filter Editor extension activated');

    // Register color provider for inline color visualization
    const colorProvider = new FilterColorProvider();
    context.subscriptions.push(
        vscode.languages.registerColorProvider('poefilter', colorProvider)
    );

    // Register effect color decorator
    const effectColorDecorator = new EffectColorDecorator();
    context.subscriptions.push(effectColorDecorator);

    // Register completion provider for autocompletion
    const completionProvider = new FilterCompletionProvider(context);
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('poefilter', completionProvider, ' ', '=', '\t')
    );

    // Register hover provider for helpful hints
    const hoverProvider = new FilterHoverProvider();
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('poefilter', hoverProvider)
    );

    // Register code action provider for color suggestions
    const codeActionProvider = new FilterColorCodeActionProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider('poefilter', codeActionProvider, {
            providedCodeActionKinds: FilterColorCodeActionProvider.providedCodeActionKinds
        })
    );

    // Register document link provider for BaseType links to poe2db.tw
    const linkProvider = new FilterDocumentLinkProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentLinkProvider('poefilter', linkProvider)
    );

    // Register diagnostic provider for syntax validation
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('poefilter');
    context.subscriptions.push(diagnosticCollection);

    // Validate on open and change
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateDiagnostics(editor.document, diagnosticCollection);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.languageId === 'poefilter') {
                updateDiagnostics(e.document, diagnosticCollection);
            }
        })
    );
}

export function deactivate() {}

// Color Provider - Shows color swatches inline
class FilterColorProvider implements vscode.DocumentColorProvider {
    provideDocumentColors(document: vscode.TextDocument): vscode.ColorInformation[] {
        const colors: vscode.ColorInformation[] = [];
        const colorRegex = /\b(SetTextColor|SetBorderColor|SetBackgroundColor)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+))?/g;

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            let match;

            while ((match = colorRegex.exec(line.text)) !== null) {
                const r = parseInt(match[2]) / 255;
                const g = parseInt(match[3]) / 255;
                const b = parseInt(match[4]) / 255;
                const a = match[5] ? parseInt(match[5]) / 255 : 1;

                const range = new vscode.Range(
                    i,
                    match.index + match[1].length + 1,
                    i,
                    match.index + match[0].length
                );

                colors.push(new vscode.ColorInformation(range, new vscode.Color(r, g, b, a)));
            }
        }

        return colors;
    }

    provideColorPresentations(color: vscode.Color, context: { document: vscode.TextDocument; range: vscode.Range }): vscode.ColorPresentation[] {
        const r = Math.round(color.red * 255);
        const g = Math.round(color.green * 255);
        const b = Math.round(color.blue * 255);
        const a = Math.round(color.alpha * 255);

        const presentation = new vscode.ColorPresentation(`${r} ${g} ${b} ${a}`);
        return [presentation];
    }
}

// Completion Provider - Autocompletion
class FilterCompletionProvider implements vscode.CompletionItemProvider {
    private baseTypes: string[] = [];
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadBaseTypes();
        
        // Reload BaseTypes when configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('poefilter.gameVersion') ||
                e.affectsConfiguration('poefilter.customBaseTypes') || 
                e.affectsConfiguration('poefilter.excludedBaseTypes')) {
                this.loadBaseTypes();
            }
        });
    }

    private loadBaseTypes() {
        // Load built-in BaseTypes from data file
        const baseTypeSet = new Set<string>();
        
        try {
            const dataPath = path.join(this.context.extensionPath, 'data', 'basetypes.json');
            if (fs.existsSync(dataPath)) {
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
                const config = vscode.workspace.getConfiguration('poefilter');
                const gameVersion: string = config.get('gameVersion', 'Both');
                
                // Load based on game version setting
                if (gameVersion === 'POE1' || gameVersion === 'Both') {
                    if (data.POE1) {
                        data.POE1.forEach((type: string) => baseTypeSet.add(type));
                        console.log(`Loaded ${data.POE1.length} POE1 base types`);
                    }
                }
                
                if (gameVersion === 'POE2' || gameVersion === 'Both') {
                    if (data.POE2) {
                        data.POE2.forEach((type: string) => baseTypeSet.add(type));
                        console.log(`Loaded ${data.POE2.length} POE2 base types`);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading built-in base types:', error);
        }

        // Add custom BaseTypes from user settings
        const config = vscode.workspace.getConfiguration('poefilter');
        const customTypes: string[] = config.get('customBaseTypes', []);
        customTypes.forEach(type => baseTypeSet.add(type));
        
        if (customTypes.length > 0) {
            console.log(`Added ${customTypes.length} custom base types from settings`);
        }

        // Remove excluded BaseTypes from user settings
        const excludedTypes: string[] = config.get('excludedBaseTypes', []);
        excludedTypes.forEach(type => baseTypeSet.delete(type));
        
        if (excludedTypes.length > 0) {
            console.log(`Excluded ${excludedTypes.length} base types from settings`);
        }

        this.baseTypes = Array.from(baseTypeSet).sort();
        console.log(`Total available base types: ${this.baseTypes.length}`);
    }

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        const items: vscode.CompletionItem[] = [];

        // Show/Hide keywords
        if (position.character === 0 || linePrefix.trim() === '') {
            items.push(
                { label: 'Show', kind: vscode.CompletionItemKind.Keyword, detail: 'Show items matching conditions' },
                { label: 'Hide', kind: vscode.CompletionItemKind.Keyword, detail: 'Hide items matching conditions' }
            );
        }

        // Condition keywords
        const conditions = [
            'BaseType', 'Class', 'Rarity', 'ItemLevel', 'Quality', 'Sockets',
            'LinkedSockets', 'SocketGroup', 'HasExplicitMod', 'StackSize',
            'Identified', 'Corrupted', 'Mirrored', 'AreaLevel', 'DropLevel',
            'GemLevel', 'WaystoneTier', 'UnidentifiedItemTier', 'TwiceCorrupted',
            'Height', 'Width', 'MapTier', 'Continue'
        ];
        
        conditions.forEach(cond => {
            items.push({
                label: cond,
                kind: vscode.CompletionItemKind.Property,
                detail: 'Filter condition'
            });
        });

        // Display properties
        const displayProps = ['SetFontSize', 'SetTextColor', 'SetBorderColor', 'SetBackgroundColor'];
        displayProps.forEach(prop => {
            const snippet = prop.includes('Color') ? `${prop} \${1:255} \${2:255} \${3:255} \${4:255}` : `${prop} \${1:40}`;
            items.push({
                label: prop,
                kind: vscode.CompletionItemKind.Function,
                insertText: new vscode.SnippetString(snippet),
                detail: 'Display property'
            });
        });

        // Effects
        const effects = ['PlayAlertSound', 'PlayEffect', 'MinimapIcon', 'PlayAlertSoundPositional', 'CustomAlertSound'];
        effects.forEach(effect => {
            let snippet = effect;
            if (effect === 'PlayEffect') {
                snippet = `${effect} \${1|Red,Green,Blue,Brown,White,Yellow,Cyan,Grey,Orange,Pink,Purple|} \${2|Temp,|}`;
            } else if (effect === 'PlayAlertSound' || effect === 'PlayAlertSoundPositional') {
                snippet = `${effect} \${1:1} \${2:100}`;
            } else if (effect === 'MinimapIcon') {
                snippet = `${effect} \${1|0,1,2|} \${2|Red,Green,Blue,Brown,White,Yellow,Cyan,Grey,Orange,Pink,Purple|} \${3|Circle,Diamond,Hexagon,Square,Star,Triangle,Cross,Moon,Raindrop,Kite,Pentagon,UpsideDownHouse|}`;
            }
            items.push({
                label: effect,
                kind: vscode.CompletionItemKind.Function,
                insertText: new vscode.SnippetString(snippet),
                detail: 'Audio/Visual effect'
            });
        });

        // PlayEffect color suggestions
        if (linePrefix.includes('PlayEffect')) {
            const effectColors = ['Red', 'Green', 'Blue', 'Brown', 'White', 'Yellow', 'Cyan', 'Grey', 'Orange', 'Pink', 'Purple'];
            effectColors.forEach(color => {
                items.push({
                    label: color,
                    kind: vscode.CompletionItemKind.Color,
                    detail: `PlayEffect color: ${color}`,
                    insertText: color
                });
            });
            items.push({
                label: 'Temp',
                kind: vscode.CompletionItemKind.Keyword,
                detail: 'Temporary beam (only on drop)',
                insertText: 'Temp'
            });
        }

        // MinimapIcon color and shape suggestions
        if (linePrefix.includes('MinimapIcon')) {
            const iconColors = ['Red', 'Green', 'Blue', 'Brown', 'White', 'Yellow', 'Cyan', 'Grey', 'Orange', 'Pink', 'Purple'];
            iconColors.forEach(color => {
                items.push({
                    label: color,
                    kind: vscode.CompletionItemKind.Color,
                    detail: `Icon color: ${color}`,
                    insertText: color
                });
            });

            const iconShapes = ['Circle', 'Diamond', 'Hexagon', 'Square', 'Star', 'Triangle', 'Cross', 'Moon', 'Raindrop', 'Kite', 'Pentagon', 'UpsideDownHouse'];
            iconShapes.forEach(shape => {
                items.push({
                    label: shape,
                    kind: vscode.CompletionItemKind.EnumMember,
                    detail: `Icon shape: ${shape}`,
                    insertText: shape
                });
            });
        }

        // Rarity value suggestions
        if (linePrefix.includes('Rarity')) {
            const rarities = [
                { label: 'Normal', detail: 'White items', color: '#FFFFFF' },
                { label: 'Magic', detail: 'Blue items', color: '#8888FF' },
                { label: 'Rare', detail: 'Yellow items', color: '#FFFF77' },
                { label: 'Unique', detail: 'Orange items', color: '#AF6025' }
            ];
            rarities.forEach(rarity => {
                items.push({
                    label: rarity.label,
                    kind: vscode.CompletionItemKind.EnumMember,
                    detail: rarity.detail,
                    insertText: rarity.label
                });
            });
        }

        // BaseType suggestions
        if (linePrefix.includes('BaseType')) {
            this.baseTypes.forEach(baseType => {
                items.push({
                    label: baseType,
                    kind: vscode.CompletionItemKind.Value,
                    insertText: `"${baseType}"`,
                    detail: 'Item base type'
                });
            });
        }

        return items;
    }
}

// Code Action Provider for color and shape quick changes
class FilterColorCodeActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    private readonly effectColors = [
        'Red', 'Green', 'Blue', 'Brown', 'White', 'Yellow', 'Cyan', 'Grey', 'Orange', 'Pink', 'Purple', 'Temp'
    ];

    private readonly shapes = [
        'Circle', 'Diamond', 'Hexagon', 'Square', 'Star', 'Triangle', 'Cross', 'Moon', 'Raindrop', 'Kite', 'Pentagon', 'UpsideDownHouse'
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection
    ): vscode.CodeAction[] | undefined {
        const line = document.lineAt(range.start.line);
        const lineText = line.text;

        // Check if we're on a PlayEffect or MinimapIcon line
        if (!/^\s*(PlayEffect|MinimapIcon)/.test(lineText)) {
            return;
        }

        // Get the word at the cursor position
        const wordRange = document.getWordRangeAtPosition(range.start);
        if (!wordRange) {
            return;
        }

        const word = document.getText(wordRange);

        // Check if the word is a color name
        if (this.effectColors.includes(word)) {
            // Create code actions for each available color
            const actions: vscode.CodeAction[] = [];
            for (const color of this.effectColors) {
                if (color === word) {
                    continue; // Skip the current color
                }

                const action = new vscode.CodeAction(
                    `Change to ${color}`,
                    vscode.CodeActionKind.QuickFix
                );
                action.edit = new vscode.WorkspaceEdit();
                action.edit.replace(document.uri, wordRange, color);
                actions.push(action);
            }
            return actions;
        }

        // Check if the word is a shape name
        if (this.shapes.includes(word)) {
            // Create code actions for each available shape
            const actions: vscode.CodeAction[] = [];
            for (const shape of this.shapes) {
                if (shape === word) {
                    continue; // Skip the current shape
                }

                const action = new vscode.CodeAction(
                    `Change to ${shape}`,
                    vscode.CodeActionKind.QuickFix
                );
                action.edit = new vscode.WorkspaceEdit();
                action.edit.replace(document.uri, wordRange, shape);
                actions.push(action);
            }
            return actions;
        }

        return;
    }
}

// Document Link Provider for BaseType links to poe2db.tw or poedb.tw
class FilterDocumentLinkProvider implements vscode.DocumentLinkProvider {
    private baseTypesData: { POE1: string[], POE2: string[] } = { POE1: [], POE2: [] };

    constructor() {
        this.loadBaseTypes();
    }

    private loadBaseTypes(): void {
        try {
            const dataPath = path.join(__dirname, '..', 'data', 'basetypes.json');
            const rawData = fs.readFileSync(dataPath, 'utf-8');
            this.baseTypesData = JSON.parse(rawData);
        } catch (error) {
            console.error('Error loading basetypes.json for link provider:', error);
        }
    }

    private getBaseUrl(itemName: string): string {
        const config = vscode.workspace.getConfiguration('poefilter');
        const gameVersion = config.get<string>('gameVersion', 'Both');

        // Check which database contains this item
        const isPOE1 = this.baseTypesData.POE1.includes(itemName);
        const isPOE2 = this.baseTypesData.POE2.includes(itemName);

        // Determine which URL to use based on game version setting and item presence
        if (gameVersion === 'POE1' || (gameVersion === 'Both' && isPOE1 && !isPOE2)) {
            return 'https://poedb.tw/us/';
        } else {
            return 'https://poe2db.tw/us/';
        }
    }

    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
        const links: vscode.DocumentLink[] = [];
        
        try {
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const lineText = line.text;
                
                // Match BaseType lines with quoted items
                // Matches: BaseType == "Item Name" or BaseType "Item Name" or multiple items
                const baseTypeRegex = /"([^"]+)"/g;
                let match;
                
                // Only process lines that contain BaseType
                if (!lineText.includes('BaseType')) {
                    continue;
                }
                
                while ((match = baseTypeRegex.exec(lineText)) !== null) {
                    const itemName = match[1]; // Just the item name without quotes
                    
                    // Calculate position excluding the quotes
                    // match.index is the position of the opening quote
                    // We want to start after the opening quote (+1) and end before the closing quote
                    const startPos = line.range.start.translate(0, match.index + 1);
                    const endPos = startPos.translate(0, itemName.length);
                    const linkRange = new vscode.Range(startPos, endPos);
                    
                    // Get the appropriate base URL for this item
                    const baseUrl = this.getBaseUrl(itemName);
                    
                    // Convert item name to URL format (spaces to underscores)
                    const urlName = itemName.replace(/\s+/g, '_');
                    const url = vscode.Uri.parse(`${baseUrl}${urlName}`);
                    
                    const dbName = baseUrl.includes('poe2db') ? 'poe2db.tw' : 'poedb.tw';
                    const link = new vscode.DocumentLink(linkRange, url);
                    link.tooltip = `Open ${itemName} on ${dbName}`;
                    links.push(link);
                }
            }
        } catch (error) {
            console.error('Error in FilterDocumentLinkProvider:', error);
        }
        
        return links;
    }
}

// Hover Provider - Helpful tooltips
class FilterHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
        const range = document.getWordRangeAtPosition(position);
        const line = document.lineAt(position.line);
        const lineText = line.text;
        
        // Check if we're on a Show/Hide line with metadata
        const metadataMatch = lineText.match(/^(Show|Hide)\s+#\s*(.*)$/);
        if (metadataMatch) {
            const metadataText = metadataMatch[2];
            const metadataStart = lineText.indexOf('#') + 1;
            
            // Check if cursor is in the metadata section
            if (position.character >= metadataStart) {
                // Check for specific metadata patterns
                if (metadataText.includes('$type->')) {
                    const typeMatch = metadataText.match(/\$type->([^\s]+)/);
                    if (typeMatch) {
                        return new vscode.Hover(
                            `**FilterBlade.xyz Type Tag**\n\nCategorizes this filter rule: \`${typeMatch[1]}\`\n\n` +
                            '⚠️ **This is FilterBlade-specific metadata** - not part of core POE filter syntax.\n' +
                            'The game ignores everything after # on Show/Hide lines.\n\n' +
                            'Common types: gold, currency, gear, exoticbases, rare, unique'
                        );
                    }
                }
                
                if (metadataText.includes('$tier->')) {
                    const tierMatch = metadataText.match(/\$tier->([^\s]+)/);
                    if (tierMatch) {
                        return new vscode.Hover(
                            `**FilterBlade.xyz Tier Tag**\n\nIndicates value tier: \`${tierMatch[1]}\`\n\n` +
                            '⚠️ **This is FilterBlade-specific metadata** - not part of core POE filter syntax.\n' +
                            'The game ignores everything after # on Show/Hide lines.\n\n' +
                            'Lower tier numbers = higher value items (t1 > t6)'
                        );
                    }
                }
                
                if (metadataText.includes('!')) {
                    const tagMatch = metadataText.match(/!(\w+)/);
                    if (tagMatch) {
                        return new vscode.Hover(
                            `**FilterBlade.xyz Searchable Tag**\n\nQuick identifier: \`${tagMatch[1]}\`\n\n` +
                            '⚠️ **This is FilterBlade-specific metadata** - not part of core POE filter syntax.\n' +
                            'The game ignores everything after # on Show/Hide lines.\n\n' +
                            'Used for searching and organizing rules in FilterBlade.xyz'
                        );
                    }
                }
                
                if (metadataText.match(/%[A-Z][0-9]+/)) {
                    const priorityMatch = metadataText.match(/(%[A-Z][0-9]+)/);
                    if (priorityMatch) {
                        return new vscode.Hover(
                            `**FilterBlade.xyz Priority Tag**\n\nRule priority: \`${priorityMatch[1]}\`\n\n` +
                            '⚠️ **This is FilterBlade-specific metadata** - not part of core POE filter syntax.\n' +
                            'The game ignores everything after # on Show/Hide lines.\n\n' +
                            'Controls evaluation order (higher letters/numbers = higher priority)'
                        );
                    }
                }
                
                // General metadata hover
                return new vscode.Hover(
                    '**FilterBlade.xyz Metadata**\n\n' +
                    '⚠️ **These are FilterBlade-specific tags** - not part of core POE filter syntax.\n' +
                    'The game engine ignores everything after # on Show/Hide lines.\n\n' +
                    'FilterBlade.xyz conventions:\n' +
                    '- `$type->` - Item category\n' +
                    '- `$tier->` - Value tier\n' +
                    '- `!tag` - Searchable identifier\n' +
                    '- `%XN` - Priority level\n\n' +
                    'These help organize filters on FilterBlade.xyz but have no effect in-game.'
                );
            }
        }
        
        if (!range) return undefined;

        const word = document.getText(range);

        // Special handling for MinimapIcon size numbers
        if (lineText.includes('MinimapIcon') && /^[0-2]$/.test(word)) {
            const sizeDescriptions: { [key: string]: string } = {
                '0': '**MinimapIcon Size 0** - Small icon size',
                '1': '**MinimapIcon Size 1** - Medium icon size (default)',
                '2': '**MinimapIcon Size 2** - Large icon size (most visible)'
            };
            return new vscode.Hover(sizeDescriptions[word]);
        }

        const descriptions: { [key: string]: string } = {
            // Block types
            'Show': '**Show Block** - Display items that match the following conditions',
            'Hide': '**Hide Block** - Hide items that match the following conditions',
            'Continue': '**Continue** - Don\'t stop matching after this block (allows items to match multiple rules)',
            'Import': '**Import** - Import another filter file\n\nExample: `Import "MyCustomRules.filter"`',
            
            // Conditions
            'BaseType': '**BaseType** - Filter by base type name\n\nExample: `BaseType "Thicket Bow"`',
            'Class': '**Class** - Filter by item class name\n\nExample: `Class "Currency"`',
            'Rarity': '**Rarity** - Filter by rarity\n\nValues: Normal, Magic, Rare, Unique\n\nExample: `Rarity >= Rare`',
            'ItemLevel': '**ItemLevel** - Filter by item level\n\nExample: `ItemLevel >= 65`',
            'DropLevel': '**DropLevel** - Filter by the level items start dropping at\n\nExample: `DropLevel > 65`',
            'Quality': '**Quality** - Filter by quality percentage\n\nExample: `Quality > 15`',
            'Sockets': '**Sockets** - Filter by number or color of sockets\n\nColors: R=Red, G=Green, B=Blue, W=White, A=Abyss, D=Delve\n\nExample: `Sockets >= 5GGG`',
            'LinkedSockets': '**LinkedSockets** - Filter by size of largest linked group\n\nExample: `LinkedSockets >= 5`',
            'SocketGroup': '**SocketGroup** - Filter by groups of linked sockets\n\nExample: `SocketGroup >= 5GGG`',
            'StackSize': '**StackSize** - Filter currency by stack size\n\nExample: `StackSize >= 5`',
            'GemLevel': '**GemLevel** - Filter by gem level\n\nExample: `GemLevel > 15`',
            'Identified': '**Identified** - Filter by identified items\n\nValues: True, False\n\nExample: `Identified True`',
            'Corrupted': '**Corrupted** - Filter by corrupted/non-corrupted items\n\nValues: True, False\n\nExample: `Corrupted True`',
            'Mirrored': '**Mirrored** - Filter by mirrored items\n\nValues: True, False\n\nExample: `Mirrored False`',
            'AreaLevel': '**AreaLevel** - Filter by area level (helps with leveling sections)\n\nExample: `AreaLevel < 30`',
            'HasExplicitMod': '**HasExplicitMod** - Filter by explicit mod name\n\nExample: `HasExplicitMod >=2 "of Haast" "of Tzteosh"`',
            'WaystoneTier': '**WaystoneTier** - Filter Waystones by tier (POE2)\n\nExample: `WaystoneTier >= 15`',
            'UnidentifiedItemTier': '**UnidentifiedItemTier** - Filter by unidentified tier (POE2)\n\nExample: `UnidentifiedItemTier >= 4`',
            'TwiceCorrupted': '**TwiceCorrupted** - Filter by twice corrupted items (POE2)\n\nValues: True, False\n\nExample: `TwiceCorrupted True`',
            'Height': '**Height** - The height of the item in inventory\n\nExample: `Height <= 2`',
            'Width': '**Width** - The width of the item in inventory\n\nExample: `Width = 1`',
            'MapTier': '**MapTier** - Filter maps by tier\n\nExample: `MapTier >= 15`',
            
            // Display Properties
            'SetFontSize': '**SetFontSize** - Set the font size of item label\n\nRange: 1-45\n\nExample: `SetFontSize 30`',
            'SetTextColor': '**SetTextColor** - Set the color of item text\n\nFormat: Red Green Blue [Alpha]\nRange: 0-255 for each\n\nExample: `SetTextColor 255 255 255 255`',
            'SetBorderColor': '**SetBorderColor** - Set the color of item border\n\nFormat: Red Green Blue [Alpha]\nRange: 0-255 for each\n\nExample: `SetBorderColor 255 0 0`',
            'SetBackgroundColor': '**SetBackgroundColor** - Set the color of item background\n\nFormat: Red Green Blue [Alpha]\nRange: 0-255 for each\n\nExample: `SetBackgroundColor 255 255 255 255`',
            
            // Audio/Visual Effects
            'PlayAlertSound': '**PlayAlertSound** - Play built-in alert sound\n\nFormat: Id (1-16) [Volume (0-300)]\n\nExample: `PlayAlertSound 1 100`',
            'PlayAlertSoundPositional': '**PlayAlertSoundPositional** - Play alert at item\'s 3D location\n\nFormat: Id (1-16) [Volume (0-300)]\n\nExample: `PlayAlertSoundPositional 16 50`',
            'CustomAlertSound': '**CustomAlertSound** - Play custom sound file\n\nFormat: "filename.mp3" [Volume (0-300)]\n\nExample: `CustomAlertSound "Map.mp3"`',
            'PlayEffect': '**PlayEffect** - Display colored beam of light\n\nColors: Red, Green, Blue, Brown, White, Yellow, Cyan, Grey, Orange, Pink, Purple\nTemp: Beam only shows on drop\n\nExample: `PlayEffect Red Temp`',
            'MinimapIcon': '**MinimapIcon** - Display icon on minimap\n\nFormat: Size (0-2) Color Shape\nShapes: Circle, Diamond, Hexagon, Square, Star, Triangle, Cross, Moon, Raindrop, Kite, Pentagon, UpsideDownHouse\n\nExample: `MinimapIcon 2 Cyan Diamond`',
            'DisableDropSound': '**DisableDropSound** - Disables the item drop sound\n\nExample: `DisableDropSound`',
            'EnableDropSound': '**EnableDropSound** - Re-enables the item drop sound\n\nExample: `EnableDropSound`',
            
            // Effect Colors
            'Red': '**Red** - Effect/Icon color: Red',
            'Green': '**Green** - Effect/Icon color: Green',
            'Blue': '**Blue** - Effect/Icon color: Blue',
            'Brown': '**Brown** - Effect/Icon color: Brown',
            'White': '**White** - Effect/Icon color: White',
            'Yellow': '**Yellow** - Effect/Icon color: Yellow',
            'Cyan': '**Cyan** - Effect/Icon color: Cyan',
            'Grey': '**Grey** - Effect/Icon color: Grey',
            'Orange': '**Orange** - Effect/Icon color: Orange',
            'Pink': '**Pink** - Effect/Icon color: Pink',
            'Purple': '**Purple** - Effect/Icon color: Purple',
            
            // Effect modifiers
            'Temp': '**Temp** - Temporary beam effect (only shows when item drops, not permanent)',
            
            // Icon Shapes
            'Circle': '**Circle** - Minimap icon shape: Circle ⭕',
            'Diamond': '**Diamond** - Minimap icon shape: Diamond 💎',
            'Hexagon': '**Hexagon** - Minimap icon shape: Hexagon ⬡',
            'Square': '**Square** - Minimap icon shape: Square ◻',
            'Star': '**Star** - Minimap icon shape: Star ⭐',
            'Triangle': '**Triangle** - Minimap icon shape: Triangle 🔺',
            'Cross': '**Cross** - Minimap icon shape: Cross ✚',
            'Moon': '**Moon** - Minimap icon shape: Moon 🌙',
            'Raindrop': '**Raindrop** - Minimap icon shape: Raindrop 💧',
            'Kite': '**Kite** - Minimap icon shape: Kite 🪁',
            'Pentagon': '**Pentagon** - Minimap icon shape: Pentagon ⬠',
            'UpsideDownHouse': '**UpsideDownHouse** - Minimap icon shape: Upside Down House ⌂',
            
            // Rarity values
            'Normal': '**Normal Rarity** - White items (common drops)',
            'Magic': '**Magic Rarity** - Blue items (with prefixes/suffixes)',
            'Rare': '**Rare Rarity** - Yellow items (multiple mods)',
            'Unique': '**Unique Rarity** - Orange items (special uniques)',
            
            // Boolean values
            'True': '**True** - Boolean value: True/Yes/Enabled',
            'False': '**False** - Boolean value: False/No/Disabled'
        };

        if (descriptions[word]) {
            return new vscode.Hover(descriptions[word]);
        }

        return undefined;
    }
}

// Diagnostic Provider - Syntax validation
function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    if (document.languageId !== 'poefilter') {
        return;
    }

    const diagnostics: vscode.Diagnostic[] = [];

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const text = line.text.trim();

        // Skip comments and empty lines
        if (text.startsWith('#') || text === '') continue;

        // Validate Show/Hide blocks
        if (text.match(/^(Show|Hide)\b/)) {
            continue;
        }

        // Validate color syntax (must be 3 or 4 numbers, 0-255)
        const colorMatch = text.match(/\b(SetTextColor|SetBorderColor|SetBackgroundColor)\s+(.+)/);
        if (colorMatch) {
            const values = colorMatch[2].trim().split(/\s+/);
            
            if (values.length !== 3 && values.length !== 4) {
                const diagnostic = new vscode.Diagnostic(
                    line.range,
                    `Color must have 3 or 4 values (RGB or RGBA), found ${values.length}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            } else {
                for (const val of values) {
                    const num = parseInt(val);
                    if (isNaN(num) || num < 0 || num > 255) {
                        const diagnostic = new vscode.Diagnostic(
                            line.range,
                            `Color values must be between 0 and 255, found: ${val}`,
                            vscode.DiagnosticSeverity.Error
                        );
                        diagnostics.push(diagnostic);
                        break;
                    }
                }
            }
        }

        // Check for unknown keywords (basic validation)
        const knownKeywords = [
            'Show', 'Hide', 'BaseType', 'Class', 'Rarity', 'ItemLevel', 'DropLevel',
            'Quality', 'Sockets', 'LinkedSockets', 'SocketGroup', 'Height', 'Width',
            'HasExplicitMod', 'StackSize', 'Identified', 'Corrupted', 'Mirrored',
            'SetFontSize', 'SetTextColor', 'SetBorderColor', 'SetBackgroundColor',
            'PlayAlertSound', 'PlayEffect', 'MinimapIcon', 'AreaLevel',
            'ElderItem', 'ShaperItem', 'FracturedItem', 'SynthesisedItem'
        ];

        const firstWord = text.split(/\s+/)[0];
        if (firstWord && !knownKeywords.includes(firstWord) && line.firstNonWhitespaceCharacterIndex > 0) {
            // It's indented, so should be a keyword
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(i, line.firstNonWhitespaceCharacterIndex, i, line.firstNonWhitespaceCharacterIndex + firstWord.length),
                `Unknown filter keyword: ${firstWord}`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostics.push(diagnostic);
        }
    }

    collection.set(document.uri, diagnostics);
}

// Effect Color Decorator - Shows color swatches for named colors
class EffectColorDecorator {
    private decorationType: vscode.TextEditorDecorationType;
    private colorMap: { [key: string]: string } = {
        'Red': '#FF0000',
        'Green': '#00FF00',
        'Blue': '#0000FF',
        'Brown': '#A52A2A',
        'White': '#FFFFFF',
        'Yellow': '#FFFF00',
        'Cyan': '#00FFFF',
        'Grey': '#808080',
        'Orange': '#FFA500',
        'Pink': '#FFC0CB',
        'Purple': '#800080'
    };

    constructor() {
        this.decorationType = vscode.window.createTextEditorDecorationType({});
        
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.updateDecorations(editor);
            }
        });

        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document && event.document.languageId === 'poefilter') {
                this.updateDecorations(editor);
            }
        });

        if (vscode.window.activeTextEditor) {
            this.updateDecorations(vscode.window.activeTextEditor);
        }
    }

    private updateDecorations(editor: vscode.TextEditor) {
        if (editor.document.languageId !== 'poefilter') {
            return;
        }

        const text = editor.document.getText();
        const colorRegex = /\b(PlayEffect|MinimapIcon)\s+(?:\d+\s+)?(Red|Green|Blue|Brown|White|Yellow|Cyan|Grey|Orange|Pink|Purple)\b/g;
        const decorations: vscode.DecorationOptions[] = [];

        let match;
        while ((match = colorRegex.exec(text)) !== null) {
            const colorName = match[2];
            const colorValue = this.colorMap[colorName];
            const startPos = editor.document.positionAt(match.index + match[0].indexOf(colorName));
            const endPos = editor.document.positionAt(match.index + match[0].indexOf(colorName) + colorName.length);

            decorations.push({
                range: new vscode.Range(startPos, endPos),
                renderOptions: {
                    before: {
                        contentText: '■',
                        color: colorValue,
                        margin: '0 4px 0 0'
                    }
                }
            });
        }

        editor.setDecorations(this.decorationType, decorations);
    }

    dispose() {
        this.decorationType.dispose();
    }
}
