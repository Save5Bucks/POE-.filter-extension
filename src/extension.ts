import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('POE Filter Editor extension activated');

    // Check and suggest color decorator limit increase for large filter files
    checkColorDecoratorLimit(context);

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

    // Register item preview hover provider
    const previewHoverProvider = new FilterPreviewHoverProvider(context);
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('poefilter', previewHoverProvider)
    );

    // Register inline preview decorator
    const inlinePreviewDecorator = new FilterInlinePreviewDecorator(context);
    context.subscriptions.push(inlinePreviewDecorator);

    // Register sound CodeLens provider (shows clickable play button)
    const soundCodeLensProvider = new FilterSoundCodeLensProvider(context);
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider('poefilter', soundCodeLensProvider)
    );

    // Register filter outline tree view
    const filterOutlineProvider = new FilterOutlineProvider();
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('poefilterOutline', filterOutlineProvider)
    );
    
    // Register helpful links tree view
    const linksProvider = new FilterLinksProvider();
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('poefilterLinks', linksProvider)
    );
    
    // Register command to jump to section
    context.subscriptions.push(
        vscode.commands.registerCommand('poefilter.jumpToSection', (lineNumber: number) => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                // Jump to one line above to show the #=== separator
                const targetLine = Math.max(0, lineNumber - 1);
                const position = new vscode.Position(targetLine, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
            }
        })
    );

    // Refresh outline when document changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'poefilter') {
            filterOutlineProvider.refresh(editor.document);
        }
    });

    vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'poefilter') {
            filterOutlineProvider.refresh(event.document);
        }
    });

    // Initial load
    if (vscode.window.activeTextEditor?.document.languageId === 'poefilter') {
        filterOutlineProvider.refresh(vscode.window.activeTextEditor.document);
    }

    // Register command for playing alert sound
    context.subscriptions.push(
        vscode.commands.registerCommand('poefilter.playSound', async (soundId: number | string) => {
            // Get volume setting (0-100) and reduce to 5%
            const config = vscode.workspace.getConfiguration('poefilter');
            const volumePercent = config.get<number>('soundVolume', 50);
            const volume = (volumePercent / 100) * 0.05; // Convert to 0.0-1.0 range and multiply by 5%
            
            console.log(`Playing sound with volume: ${volumePercent}% setting -> ${volume} actual (${volume * 100}%)`);
            
            // Determine the sound file name based on ID
            const soundsDir = path.join(context.extensionPath, 'sounds');
            let soundFileName = '';
            
            // Map of special currency sound IDs to their identifiers
            const specialSounds: { [key: number]: string } = {
                17: 'ShAlchemy',
                18: 'ShBlessed',
                19: 'ShChaos',
                20: 'ShFusing',
                21: 'ShGeneral',
                22: 'ShRegal',
                23: 'ShVaal',
                24: 'ShDivine',
                25: 'ShExalted',
                26: 'ShMirror'
            };
            
            const soundNum = typeof soundId === 'string' ? parseInt(soundId) : soundId;
            
            // Determine file name based on sound ID
            if (soundNum >= 1 && soundNum <= 16) {
                soundFileName = `AlertSound${soundNum}.mp3`;
            } else if (soundNum >= 17 && soundNum <= 26 && specialSounds[soundNum]) {
                soundFileName = `AlertSound${soundNum}_${specialSounds[soundNum]}.mp3`;
            } else {
                vscode.window.showWarningMessage(
                    `Invalid sound ID: ${soundId}. Valid range is 1-26.`
                );
                return;
            }
            
            const mp3Path = path.join(soundsDir, soundFileName);
            const oggPath = path.join(soundsDir, soundFileName.replace('.mp3', '.ogg'));
            
            let soundPath = '';
            if (fs.existsSync(mp3Path)) {
                soundPath = mp3Path;
            } else if (fs.existsSync(oggPath)) {
                soundPath = oggPath;
            } else {
                vscode.window.showWarningMessage(
                    `Sound file not found: ${soundFileName}. ` +
                    `Please ensure sound files are in the sounds/ folder. See sounds/README.md for instructions.`
                );
                return;
            }

            // Play sound using child_process
            const { exec } = require('child_process');
            
            try {
                if (process.platform === 'win32') {
                    // Windows: Use PowerShell with MediaPlayer for volume control
                    // Convert path to file:// URI format and escape for PowerShell
                    const fileUri = soundPath.replace(/\\/g, '/');
                    const escapedPath = fileUri.replace(/'/g, "''");
                    // Get duration dynamically and wait for it to finish playing
                    const psCommand = `Add-Type -AssemblyName presentationCore; $mediaPlayer = New-Object System.Windows.Media.MediaPlayer; $mediaPlayer.Open([Uri]'file:///${escapedPath}'); $mediaPlayer.Volume = ${volume}; Start-Sleep -Milliseconds 100; while ($mediaPlayer.NaturalDuration.HasTimeSpan -eq $false) { Start-Sleep -Milliseconds 50 }; $duration = $mediaPlayer.NaturalDuration.TimeSpan.TotalSeconds; $mediaPlayer.Play(); Start-Sleep -Seconds $duration; $mediaPlayer.Stop(); $mediaPlayer.Close()`;
                    
                    exec(`powershell -NoProfile -Command "${psCommand}"`, 
                        (error: any, stdout: any, stderr: any) => {
                            if (error) {
                                console.log('Could not play sound with MediaPlayer:', error.message);
                                console.log('stderr:', stderr);
                                console.log('stdout:', stdout);
                            }
                        }
                    );
                } else if (process.platform === 'darwin') {
                    // macOS: afplay with volume
                    exec(`afplay -v ${volume} "${soundPath}"`, (error: any) => {
                        if (error) console.log('Could not play sound:', error.message);
                    });
                } else {
                    // Linux: try paplay with volume or ffplay
                    const volumeLinux = Math.round(volume * 65536); // paplay uses 0-65536 range
                    exec(`paplay --volume=${volumeLinux} "${soundPath}" || ffplay -nodisp -autoexit -volume ${Math.round(volume * 100)} "${soundPath}" 2>/dev/null`, 
                        (error: any) => {
                            if (error) console.log('Could not play sound:', error.message);
                        }
                    );
                }
                
                // Show brief status message in the status bar
                const soundName = soundNum >= 17 && specialSounds[soundNum] 
                    ? `${soundNum} (${specialSounds[soundNum].replace('Sh', '')})`
                    : soundNum.toString();
                vscode.window.setStatusBarMessage(`🔊 Playing Sound ${soundName} (Volume: ${volumePercent}%)`, 2000);
            } catch (error) {
                console.error('Error playing sound:', error);
            }
        })
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
    provideDocumentColors(document: vscode.TextDocument, token?: vscode.CancellationToken): vscode.ColorInformation[] {
        const colors: vscode.ColorInformation[] = [];
        const colorRegex = /\b(SetTextColor|SetBorderColor|SetBackgroundColor)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+))?/g;
        
        // Get all text at once instead of line by line for better performance
        const text = document.getText();
        let match;
        let count = 0;

        while ((match = colorRegex.exec(text)) !== null) {
            // Check cancellation token periodically for better performance
            if (token?.isCancellationRequested) {
                break;
            }

            const r = parseInt(match[2]) / 255;
            const g = parseInt(match[3]) / 255;
            const b = parseInt(match[4]) / 255;
            const a = match[5] ? parseInt(match[5]) / 255 : 1;

            const startPos = document.positionAt(match.index + match[1].length + 1);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            colors.push(new vscode.ColorInformation(range, new vscode.Color(r, g, b, a)));
            count++;
        }

        console.log(`POE Filter: Found ${count} colors in document with ${document.lineCount} lines, returning ${colors.length} color infos`);
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

        // PlayAlertSound number suggestions with descriptions
        if (linePrefix.match(/PlayAlertSound(?:Positional)?\s+$/)) {
            const soundDescriptions: { [key: number]: string } = {
                1: 'Sound 1', 2: 'Sound 2', 3: 'Sound 3', 4: 'Sound 4', 5: 'Sound 5',
                6: 'Sound 6', 7: 'Sound 7', 8: 'Sound 8', 9: 'Sound 9', 10: 'Sound 10',
                11: 'Sound 11', 12: 'Sound 12', 13: 'Sound 13', 14: 'Sound 14', 15: 'Sound 15', 16: 'Sound 16',
                17: 'Alchemy', 18: 'Blessed', 19: 'Chaos', 20: 'Fusing',
                21: 'General', 22: 'Regal', 23: 'Vaal', 24: 'Divine',
                25: 'Exalted', 26: 'Mirror'
            };
            
            for (let i = 1; i <= 26; i++) {
                items.push({
                    label: i.toString(),
                    kind: vscode.CompletionItemKind.Value,
                    detail: `Alert Sound: ${soundDescriptions[i]}`,
                    insertText: i.toString(),
                    sortText: i.toString().padStart(2, '0') // Ensures proper numeric sorting
                });
            }
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

        // Check if we're on a PlayAlertSound line
        const soundMatch = lineText.match(/PlayAlertSound(?:Positional)?\s+(\d+)/);
        if (soundMatch) {
            // Get the word at cursor (should be a number)
            const wordRange = document.getWordRangeAtPosition(range.start);
            if (wordRange) {
                const word = document.getText(wordRange);
                const currentSound = parseInt(word);
                
                // Only show actions if clicking on the sound number
                if (!isNaN(currentSound) && currentSound >= 1 && currentSound <= 26) {
                    const actions: vscode.CodeAction[] = [];
                    
                    for (let i = 1; i <= 26; i++) {
                        if (i === currentSound) {
                            continue; // Skip current sound
                        }
                        
                        const label = i <= 6 ? `${i}` : `${i} (requires FilterBlade audio)`;
                        
                        const action = new vscode.CodeAction(
                            label,
                            vscode.CodeActionKind.QuickFix
                        );
                        action.edit = new vscode.WorkspaceEdit();
                        action.edit.replace(document.uri, wordRange, i.toString());
                        actions.push(action);
                    }
                    
                    return actions;
                }
            }
        }

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
        
        // Don't provide hover if we're on the Show/Hide keyword itself (let FilterPreviewHoverProvider handle it)
        const wordAtPosition = document.getText(range);
        if (wordAtPosition === 'Show' || wordAtPosition === 'Hide') {
            return undefined;
        }
        
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

// Item Preview Hover Provider - Shows visual preview of filter rules
class FilterPreviewHoverProvider implements vscode.HoverProvider {
    private fontBase64: string = '';

    constructor(private context: vscode.ExtensionContext) {
        this.loadFont();
    }

    private loadFont(): void {
        try {
            const fontPath = path.join(this.context.extensionPath, 'fonts', 'fontin', 'Fontin-Regular.otf');
            const fontBuffer = fs.readFileSync(fontPath);
            this.fontBase64 = fontBuffer.toString('base64');
        } catch (error) {
            console.error('Error loading Fontin font:', error);
        }
    }

    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
        try {
            const line = document.lineAt(position.line);
            const lineText = line.text.trim();

            console.log('FilterPreviewHoverProvider: hovering over line:', lineText);

            // Only show preview when hovering over Show lines
            if (!lineText.match(/^Show\b/)) {
                console.log('FilterPreviewHoverProvider: not a Show line, skipping');
                return undefined;
            }

            console.log('FilterPreviewHoverProvider: parsing Show block');

            // Parse FilterBlade metadata from the Show line comment
            const metadata = this.parseFilterBladeMetadata(lineText);

            // Parse the entire Show block
            const blockData = this.parseShowBlock(document, position.line);
            if (!blockData) {
                console.log('FilterPreviewHoverProvider: no block data');
                return undefined;
            }

            console.log('FilterPreviewHoverProvider: generating preview for:', blockData.itemName);

            // Generate HTML preview
            const htmlContent = this.generatePreview(blockData);
            
            // Create hover message with explanation
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown('**Visual Preview** (representation of listed settings)\n\n');
            markdown.appendMarkdown(htmlContent);
            
            // Add visual settings that affect the appearance
            markdown.appendMarkdown('\n\n---\n\n**Visual Settings:**\n');
            
            if (blockData.itemName !== 'Mirror of Kalandra') {
                markdown.appendMarkdown(`\n- **BaseType:** \`${blockData.itemName}\``);
            }
            
            markdown.appendMarkdown(`\n- **SetFontSize:** \`${blockData.fontSize}\``);
            
            const tc = blockData.textColor;
            markdown.appendMarkdown(`\n- **SetTextColor:** \`${tc.r} ${tc.g} ${tc.b} ${tc.a}\``);
            
            if (blockData.backgroundColor) {
                const bg = blockData.backgroundColor;
                markdown.appendMarkdown(`\n- **SetBackgroundColor:** \`${bg.r} ${bg.g} ${bg.b} ${bg.a}\``);
            }
            
            if (blockData.borderColor) {
                const bc = blockData.borderColor;
                markdown.appendMarkdown(`\n- **SetBorderColor:** \`${bc.r} ${bc.g} ${bc.b} ${bc.a}\``);
            }
            
            if (blockData.iconShape && blockData.iconColor) {
                markdown.appendMarkdown(`\n- **MinimapIcon:** \`${blockData.iconSize} ${blockData.iconColor} ${blockData.iconShape}\``);
            }
            
            if (blockData.soundId !== null) {
                markdown.appendMarkdown(`\n- **PlayAlertSound:** \`${blockData.soundId}\``);
            }
            
            // Add FilterBlade metadata if present
            if (metadata) {
                markdown.appendMarkdown('\n\n---\n\n**FilterBlade Metadata:**\n');
                if (metadata.type) {
                    markdown.appendMarkdown(`\n- Type: \`${metadata.type}\``);
                }
                if (metadata.tier) {
                    markdown.appendMarkdown(`\n- Tier: \`${metadata.tier}\``);
                }
                if (metadata.tags.length > 0) {
                    markdown.appendMarkdown(`\n- Tags: ${metadata.tags.map(t => `\`${t}\``).join(', ')}`);
                }
                if (metadata.comment) {
                    markdown.appendMarkdown(`\n- Comment: ${metadata.comment}`);
                }
            }
            
            markdown.supportHtml = true;
            markdown.isTrusted = true;

            return new vscode.Hover(markdown);
        } catch (error) {
            console.error('Error in FilterPreviewHoverProvider:', error);
            return undefined;
        }
    }

    private parseFilterBladeMetadata(lineText: string): { type: string | null, tier: string | null, tags: string[], comment: string | null } | null {
        // Extract everything after # in Show line
        const commentMatch = lineText.match(/^Show\s*#\s*(.+)$/);
        if (!commentMatch) {
            return null;
        }

        const commentText = commentMatch[1];
        const metadata = {
            type: null as string | null,
            tier: null as string | null,
            tags: [] as string[],
            comment: null as string | null
        };

        // Check for FilterBlade patterns
        const hasFilterBladePattern = commentText.match(/\$type->|\$tier->|![\w]+/);
        
        if (hasFilterBladePattern) {
            // Parse $type-> pattern
            const typeMatch = commentText.match(/\$type->(\w+)/);
            if (typeMatch) {
                metadata.type = typeMatch[1];
            }

            // Parse $tier-> pattern
            const tierMatch = commentText.match(/\$tier->([^\s]+)/);
            if (tierMatch) {
                metadata.tier = tierMatch[1];
            }

            // Parse !tag patterns
            const tagMatches = commentText.matchAll(/!([\w]+)/g);
            for (const match of tagMatches) {
                metadata.tags.push(match[1]);
            }

            // Extract any remaining text as comment (remove FilterBlade patterns)
            const cleanedComment = commentText
                .replace(/\$type->\w+/g, '')
                .replace(/\$tier->[^\s]+/g, '')
                .replace(/![\w]+/g, '')
                .replace(/^[%\s]+/, '') // Remove leading % and spaces
                .trim();
            
            if (cleanedComment) {
                metadata.comment = cleanedComment;
            }
        } else {
            // No FilterBlade pattern, treat entire comment as regular comment
            metadata.comment = commentText.trim();
        }

        return metadata;
    }

    public parseShowBlock(document: vscode.TextDocument, startLine: number): FilterBlockData | undefined {
        const data: FilterBlockData = {
            itemName: 'Mirror of Kalandra', // Default name
            fontSize: 32,
            textColor: { r: 175, g: 96, b: 37, a: 255 }, // Default POE orange
            borderColor: null,
            backgroundColor: { r: 0, g: 0, b: 0, a: 240 },
            iconShape: null,
            iconColor: null,
            iconSize: 1,
            soundId: null
        };

        // Extract BaseType if present
        let currentLine = startLine;
        while (currentLine < document.lineCount) {
            const line = document.lineAt(currentLine);
            const text = line.text.trim();

            // Stop at next Show/Hide block
            if (currentLine > startLine && text.match(/^(Show|Hide)\b/)) {
                break;
            }

            // Stop at empty line (end of block)
            if (text === '') {
                break;
            }

            // Parse BaseType
            const baseTypeMatch = text.match(/BaseType\s*==?\s*"([^"]+)"/);
            if (baseTypeMatch) {
                data.itemName = baseTypeMatch[1];
            }

            // Parse SetFontSize
            const fontSizeMatch = text.match(/SetFontSize\s+(\d+)/);
            if (fontSizeMatch) {
                data.fontSize = parseInt(fontSizeMatch[1]);
            }

            // Parse SetTextColor
            const textColorMatch = text.match(/SetTextColor\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+))?/);
            if (textColorMatch) {
                data.textColor = {
                    r: parseInt(textColorMatch[1]),
                    g: parseInt(textColorMatch[2]),
                    b: parseInt(textColorMatch[3]),
                    a: textColorMatch[4] ? parseInt(textColorMatch[4]) : 255
                };
            }

            // Parse SetBorderColor
            const borderColorMatch = text.match(/SetBorderColor\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+))?/);
            if (borderColorMatch) {
                data.borderColor = {
                    r: parseInt(borderColorMatch[1]),
                    g: parseInt(borderColorMatch[2]),
                    b: parseInt(borderColorMatch[3]),
                    a: borderColorMatch[4] ? parseInt(borderColorMatch[4]) : 255
                };
            }

            // Parse SetBackgroundColor
            const bgColorMatch = text.match(/SetBackgroundColor\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+))?/);
            if (bgColorMatch) {
                data.backgroundColor = {
                    r: parseInt(bgColorMatch[1]),
                    g: parseInt(bgColorMatch[2]),
                    b: parseInt(bgColorMatch[3]),
                    a: bgColorMatch[4] ? parseInt(bgColorMatch[4]) : 255
                };
            }

            // Parse MinimapIcon
            const iconMatch = text.match(/MinimapIcon\s+([0-2])\s+(Red|Green|Blue|Brown|White|Yellow|Cyan|Grey|Orange|Pink|Purple)\s+(Circle|Diamond|Hexagon|Square|Star|Triangle|Cross|Moon|Raindrop|Kite|Pentagon|UpsideDownHouse)/i);
            if (iconMatch) {
                data.iconSize = parseInt(iconMatch[1]);
                data.iconColor = iconMatch[2]; // Preserve case from filter
                data.iconShape = iconMatch[3]; // Preserve case from filter
                console.log(`Parsed icon: size=${data.iconSize}, color=${data.iconColor}, shape=${data.iconShape}`);
            }

            // Parse PlayAlertSound
            const soundMatch = text.match(/PlayAlertSound(?:Positional)?\s+(\d+)/);
            if (soundMatch) {
                data.soundId = parseInt(soundMatch[1]);
            }

            currentLine++;
        }

        return data;
    }

    private generatePreview(data: FilterBlockData): string {
        const textColor = data.textColor;
        const textColorRGBA = `rgba(${textColor.r}, ${textColor.g}, ${textColor.b}, ${textColor.a / 255})`;
        
        let borderStyle = 'none';
        if (data.borderColor) {
            const border = data.borderColor;
            const borderRGBA = `rgba(${border.r}, ${border.g}, ${border.b}, ${border.a / 255})`;
            borderStyle = `2px solid ${borderRGBA}`;
        }

        let bgStyle = 'rgba(0, 0, 0, 0.94)'; // Default dark background
        if (data.backgroundColor) {
            const bg = data.backgroundColor;
            bgStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a / 255})`;
        }

        // Icon HTML
        let iconHTML = '';
        if (data.iconShape && data.iconColor) {
            const iconEmoji = this.getIconEmoji(data.iconShape);
            const iconColorStyle = this.getColorStyle(data.iconColor);
            const iconSizeStyle = data.iconSize === 0 ? '12px' : data.iconSize === 2 ? '20px' : '16px';
            iconHTML = `<span style="color: ${iconColorStyle}; font-size: ${iconSizeStyle}; margin-right: 4px;">${iconEmoji}</span>`;
        }

        // Sound indicator
        let soundHTML = '';
        if (data.soundId !== null) {
            soundHTML = `<span style="font-size: 10px; color: #888; margin-left: 8px;">🔊 Sound ${data.soundId}</span>`;
        }

        // Embedded font CSS
        const fontFaceCSS = this.fontBase64 ? `
<style>
    @font-face {
        font-family: 'Fontin';
        src: url(data:font/otf;base64,${this.fontBase64}) format('opentype');
        font-weight: normal;
        font-style: normal;
    }
</style>` : '';

        return `
${fontFaceCSS}
<div style="
    font-family: 'Fontin', 'Segoe UI', sans-serif;
    font-size: ${data.fontSize}px;
    color: ${textColorRGBA};
    background: ${bgStyle};
    border: ${borderStyle};
    padding: 8px 12px;
    border-radius: 3px;
    display: inline-block;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    white-space: nowrap;
">
    ${iconHTML}${data.itemName}${soundHTML}
</div>`;
    }

    public generateWebviewContent(data: FilterBlockData): string {
        const previewHTML = this.generatePreview(data);
        const fontFaceCSS = this.fontBase64 ? `
        @font-face {
            font-family: 'Fontin';
            src: url(data:font/otf;base64,${this.fontBase64}) format('opentype');
            font-weight: normal;
            font-style: normal;
        }` : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Filter Preview</title>
    <style>
        ${fontFaceCSS}
        body {
            background-color: #1e1e1e;
            padding: 20px;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
    </style>
</head>
<body>
    ${previewHTML}
</body>
</html>`;
    }

    private getIconEmoji(shape: string): string {
        // Use Unicode geometric shapes that can be colored with CSS
        const emojiMap: { [key: string]: string } = {
            'circle': '●',        // Black Circle (can be colored)
            'diamond': '◆',       // Black Diamond
            'hexagon': '⬢',       // Black Hexagon
            'square': '■',        // Black Square
            'star': '★',          // Black Star
            'triangle': '▲',      // Black Triangle
            'cross': '✚',         // Heavy Cross
            'moon': '●',          // Use circle for moon (close approximation)
            'raindrop': '💧',     // Keep raindrop emoji (works well)
            'kite': '◆',          // Use diamond for kite
            'pentagon': '⬟',      // Pentagon
            'upsidedownhouse': '⌂' // House symbol
        };
        return emojiMap[shape.toLowerCase()] || '●';
    }

    private getColorStyle(color: string): string {
        const colorMap: { [key: string]: string } = {
            'red': '#FF0000',
            'green': '#00FF00',
            'blue': '#0000FF',
            'brown': '#A52A2A',
            'white': '#FFFFFF',
            'yellow': '#FFFF00',
            'cyan': '#00FFFF',
            'grey': '#808080',
            'orange': '#FFA500',
            'pink': '#FFC0CB',
            'purple': '#800080'
        };
        return colorMap[color.toLowerCase()] || '#FFFFFF';
    }
}

interface FilterBlockData {
    itemName: string;
    fontSize: number;
    textColor: RGBAColor;
    borderColor: RGBAColor | null;
    backgroundColor: RGBAColor | null;
    iconShape: string | null;
    iconColor: string | null;
    iconSize: number;
    soundId: number | null;
}

interface RGBAColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

// CodeLens Provider - Shows "Preview" link under Show blocks
class FilterPreviewCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(private context: vscode.ExtensionContext) {}

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];

        try {
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const lineText = line.text.trim();

                // Find Show blocks
                if (lineText.match(/^Show\b/)) {
                    // Parse the block to get preview data
                    const previewProvider = new FilterPreviewHoverProvider(this.context);
                    const blockData = previewProvider.parseShowBlock(document, i);
                    
                    if (blockData) {
                        const range = new vscode.Range(i, 0, i, line.text.length);
                        const codeLens = new vscode.CodeLens(range, {
                            title: `👁️ Preview`,
                            command: 'poefilter.showPreview',
                            arguments: [blockData]
                        });
                        codeLenses.push(codeLens);
                    }
                }
            }
        } catch (error) {
            console.error('Error in FilterPreviewCodeLensProvider:', error);
        }

        return codeLenses;
    }
}

// Inline Sound Play Decorator - Shows play button after PlayAlertSound lines
class FilterInlineSoundDecorator {
    private decorationType: vscode.TextEditorDecorationType;
    private soundLocations: Map<number, number> = new Map(); // line -> soundId

    constructor(private context: vscode.ExtensionContext) {
        // Create decoration type for the sound play button with gutter icon
        this.decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: context.asAbsolutePath('sounds/play-icon.svg'),
            gutterIconSize: 'contain',
            after: {
                margin: '0 0 0 20px',
            },
            isWholeLine: false
        });

        // Listen for gutter clicks
        context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(event => {
                const editor = event.textEditor;
                if (editor.document.languageId === 'poefilter' && event.kind === vscode.TextEditorSelectionChangeKind.Mouse) {
                    const position = event.selections[0].active;
                    
                    // Check if a sound is on this line
                    const soundId = this.soundLocations.get(position.line);
                    if (soundId) {
                        vscode.commands.executeCommand('poefilter.playSound', soundId);
                    }
                }
            })
        );

        // Update decorations on text change
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                this.updateDecorations(editor);
            }
        });

        // Update decorations on editor change
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.updateDecorations(editor);
            }
        });

        // Initial update
        if (vscode.window.activeTextEditor) {
            this.updateDecorations(vscode.window.activeTextEditor);
        }
    }

    private updateDecorations(editor: vscode.TextEditor): void {
        if (editor.document.languageId !== 'poefilter') {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];
        this.soundLocations.clear();

        // Map of special currency sound names
        const specialSounds: { [key: number]: string } = {
            17: 'Alchemy',
            18: 'Blessed',
            19: 'Chaos',
            20: 'Fusing',
            21: 'General',
            22: 'Regal',
            23: 'Vaal',
            24: 'Divine',
            25: 'Exalted',
            26: 'Mirror'
        };

        try {
            for (let i = 0; i < editor.document.lineCount; i++) {
                const line = editor.document.lineAt(i);
                const lineText = line.text.trim();

                // Find PlayAlertSound or PlayAlertSoundPositional lines
                const soundMatch = lineText.match(/PlayAlertSound(?:Positional)?\s+(\d+)/);
                if (soundMatch) {
                    const soundId = parseInt(soundMatch[1]);
                    
                    // Validate sound ID is between 1-26
                    if (soundId >= 1 && soundId <= 26) {
                        this.soundLocations.set(i, soundId);
                        const soundName = specialSounds[soundId] 
                            ? `${soundId} (${specialSounds[soundId]})`
                            : soundId.toString();
                        
                        const decoration: vscode.DecorationOptions = {
                            range: new vscode.Range(i, line.text.length, i, line.text.length),
                            renderOptions: {
                                after: {
                                    contentText: `  ▶️ Play Sound ${soundName}`,
                                    color: new vscode.ThemeColor('textLink.foreground'),
                                    fontWeight: 'bold'
                                }
                            },
                            hoverMessage: `Click near end of line to play sound ${soundName}`
                        };
                        decorations.push(decoration);
                    }
                }
            }
        } catch (error) {
            console.error('Error in FilterInlineSoundDecorator:', error);
        }

        editor.setDecorations(this.decorationType, decorations);
    }

    dispose() {
        this.decorationType.dispose();
    }
}

// Sound CodeLens Provider - Shows "Play Sound" button on PlayAlertSound lines
class FilterSoundCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(private context: vscode.ExtensionContext) {}

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];

        try {
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const lineText = line.text.trim();

                // Find PlayAlertSound or PlayAlertSoundPositional lines
                const soundMatch = lineText.match(/PlayAlertSound(?:Positional)?\s+(\d+)/);
                if (soundMatch) {
                    const soundId = parseInt(soundMatch[1]);
                    
                    // Validate sound ID is between 1-26
                    if (soundId >= 1 && soundId <= 26) {
                        // Map of special currency sound names
                        const specialSounds: { [key: number]: string } = {
                            17: 'Alchemy',
                            18: 'Blessed',
                            19: 'Chaos',
                            20: 'Fusing',
                            21: 'General',
                            22: 'Regal',
                            23: 'Vaal',
                            24: 'Divine',
                            25: 'Exalted',
                            26: 'Mirror'
                        };
                        
                        const soundName = specialSounds[soundId] 
                            ? `Sound ${soundId} (${specialSounds[soundId]})`
                            : `Sound ${soundId}`;
                        
                        const range = new vscode.Range(i, 0, i, line.text.length);
                        const codeLens = new vscode.CodeLens(range, {
                            title: `▶️ Play ${soundName}`,
                            command: 'poefilter.playSound',
                            arguments: [soundId]
                        });
                        codeLenses.push(codeLens);
                    }
                }
            }
        } catch (error) {
            console.error('Error in FilterSoundCodeLensProvider:', error);
        }

        return codeLenses;
    }
}

// Inline Preview Decorator - Shows preview after Show lines
class FilterInlinePreviewDecorator {
    private decorationType: vscode.TextEditorDecorationType;
    private previewProvider: FilterPreviewHoverProvider;

    constructor(private context: vscode.ExtensionContext) {
        this.previewProvider = new FilterPreviewHoverProvider(context);
        
        // Create decoration type for the preview line
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: '0 0 0 20px',
            },
            isWholeLine: false
        });

        // Update decorations on text change
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                this.updateDecorations(editor);
            }
        });

        // Update decorations on editor change
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.updateDecorations(editor);
            }
        });

        // Initial update
        if (vscode.window.activeTextEditor) {
            this.updateDecorations(vscode.window.activeTextEditor);
        }
    }

    private updateDecorations(editor: vscode.TextEditor): void {
        if (editor.document.languageId !== 'poefilter') {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];

        try {
            for (let i = 0; i < editor.document.lineCount; i++) {
                const line = editor.document.lineAt(i);
                const lineText = line.text.trim();

                // Find Show blocks
                if (lineText.match(/^Show\b/)) {
                    const blockData = this.previewProvider.parseShowBlock(editor.document, i);
                    
                    if (blockData) {
                        // Generate compact preview text
                        const previewText = this.generatePreviewText(blockData);
                        
                        const decoration: vscode.DecorationOptions = {
                            range: new vscode.Range(i, line.text.length, i, line.text.length),
                            renderOptions: {
                                after: {
                                    contentText: previewText,
                                    color: this.rgbaToHex(blockData.textColor),
                                    backgroundColor: blockData.backgroundColor ? this.rgbaToHex(blockData.backgroundColor) : '#000000dd',
                                    border: blockData.borderColor ? `1px solid ${this.rgbaToHex(blockData.borderColor)}` : 'none',
                                    margin: '0 0 0 20px',
                                    fontWeight: 'bold',
                                    textDecoration: `none; padding: 2px 8px; border-radius: 3px; font-size: ${Math.min(blockData.fontSize, 16)}px;`
                                }
                            }
                        };
                        decorations.push(decoration);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating preview decorations:', error);
        }

        editor.setDecorations(this.decorationType, decorations);
    }

    private generatePreviewText(data: FilterBlockData): string {
        let text = '';
        
        // Add icon
        if (data.iconShape && data.iconColor) {
            const iconEmoji = this.getIconEmoji(data.iconShape);
            text += `${iconEmoji} `;
        }
        
        // Add item name
        text += data.itemName;
        
        // Add sound indicator
        if (data.soundId !== null) {
            text += ` 🔊`;
        }
        
        return text;
    }

    private rgbaToHex(color: RGBAColor): string {
        const r = color.r.toString(16).padStart(2, '0');
        const g = color.g.toString(16).padStart(2, '0');
        const b = color.b.toString(16).padStart(2, '0');
        const a = Math.round((color.a / 255) * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}${a}`;
    }

    private getIconEmoji(shape: string): string {
        // Use Unicode geometric shapes that can be colored with CSS
        const emojiMap: { [key: string]: string } = {
            'circle': '●',        // Black Circle (can be colored)
            'diamond': '◆',       // Black Diamond
            'hexagon': '⬢',       // Black Hexagon
            'square': '■',        // Black Square
            'star': '★',          // Black Star
            'triangle': '▲',      // Black Triangle
            'cross': '✚',         // Heavy Cross
            'moon': '●',          // Use circle for moon (close approximation)
            'raindrop': '💧',     // Keep raindrop emoji (works well)
            'kite': '◆',          // Use diamond for kite
            'pentagon': '⬟',      // Pentagon
            'upsidedownhouse': '⌂' // House symbol
        };
        return emojiMap[shape.toLowerCase()] || '●';
    }

    dispose(): void {
        this.decorationType.dispose();
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
            'Show', 'Hide', 'Continue', 'Import',
            'BaseType', 'Class', 'Rarity', 'ItemLevel', 'DropLevel',
            'Quality', 'Sockets', 'LinkedSockets', 'SocketGroup', 'Height', 'Width',
            'HasExplicitMod', 'StackSize', 'Identified', 'Corrupted', 'Mirrored',
            'SetFontSize', 'SetTextColor', 'SetBorderColor', 'SetBackgroundColor',
            'PlayAlertSound', 'PlayAlertSoundPositional', 'PlayEffect', 'MinimapIcon', 'AreaLevel',
            'ElderItem', 'ShaperItem', 'FracturedItem', 'SynthesisedItem',
            'GemLevel', 'WaystoneTier', 'UnidentifiedItemTier', 'TwiceCorrupted',
            'ShapedMap', 'ElderMap', 'BlightedMap', 'UberBlightedMap', 'MapTier',
            'Transfigured', 'HasInfluence', 'BaseArmour', 'BaseEvasion', 
            'BaseEnergyShield', 'BaseWard', 'BaseDefencePercentile', 'CorruptedMods',
            'EnchantmentPassiveNode', 'EnchantmentPassiveNum', 'Foulborn',
            'HasCruciblePassiveTree', 'HasEaterOfWorldsImplicit', 'HasImplicitMod',
            'HasSearingExarchImplicit', 'HasVaalUniqueMod', 'IsVaalUnique',
            'MemoryStrands', 'Replica', 'Scourged', 'ZanaMemory', 'ArchnemesisMod',
            'AnyEnchantment', 'HasEnchantment', 'GemQualityType', 'AlternateQuality'
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

// Filter Outline Provider - TreeView for navigation
class FilterOutlineProvider implements vscode.TreeDataProvider<FilterSection> {
    private _onDidChangeTreeData: vscode.EventEmitter<FilterSection | undefined | null | void> = new vscode.EventEmitter<FilterSection | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FilterSection | undefined | null | void> = this._onDidChangeTreeData.event;

    private sections: FilterSection[] = [];

    refresh(document?: vscode.TextDocument): void {
        if (document) {
            this.sections = this.parseSections(document);
        }
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FilterSection): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FilterSection): Thenable<FilterSection[]> {
        if (!element) {
            // Root level - return main sections
            return Promise.resolve(this.sections.filter(s => s.level === 0));
        } else {
            // Return child sections
            return Promise.resolve(this.sections.filter(s => s.parentId === element.id));
        }
    }

    private parseSections(document: vscode.TextDocument): FilterSection[] {
        const sections: FilterSection[] = [];
        const separatorRegex = /^#={3,}/; // Matches #===...
        const sectionHeaderRegex = /^#\s*\[\[?(\d+)\]?\]?\s*(.+)$/; // Matches # [[XXXX]] or # [XXXX]

        for (let i = 0; i < document.lineCount - 2; i++) {
            const line1 = document.lineAt(i).text;
            const line2 = document.lineAt(i + 1).text;
            const line3 = document.lineAt(i + 2).text;

            // Check for pattern: #===...  then  # [[XXXX]] Title  then  #===...
            if (separatorRegex.test(line1) && separatorRegex.test(line3)) {
                const headerMatch = line2.match(sectionHeaderRegex);
                
                if (headerMatch) {
                    const sectionNumber = headerMatch[1];
                    const sectionName = headerMatch[2].trim();
                    
                    // Only include sections with [[XXXX]] double brackets (not single [XXXX])
                    if (line2.includes('[[') && line2.includes(']]')) {
                        sections.push(new FilterSection(
                            `${sectionNumber}_${i + 1}`, // Make ID unique by including line number
                            `${sectionNumber} - ${sectionName}`, // Format: 0100 - Gold
                            i + 1, // Line number of the header (middle line)
                            0, // level 0 = main section
                            null, // no parent
                            vscode.TreeItemCollapsibleState.None
                        ));
                    }
                }
            }
        }

        return sections;
    }
}

class FilterSection extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly lineNumber: number,
        public readonly level: number,
        public readonly parentId: string | null,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        
        this.tooltip = `Jump to line ${lineNumber + 1}`;
        this.command = {
            command: 'poefilter.jumpToSection',
            title: 'Jump to Section',
            arguments: [lineNumber]
        };
        
        // Use a simple arrow icon instead of namespace symbol
        this.iconPath = new vscode.ThemeIcon('chevron-right');
    }
}

// Helpful Links Tree View Provider
class FilterLinksProvider implements vscode.TreeDataProvider<FilterLink> {
    getTreeItem(element: FilterLink): vscode.TreeItem {
        return element;
    }

    getChildren(): FilterLink[] {
        return [
            new FilterLink('Craft of Exile', 'https://www.craftofexile.com/', 'Crafting simulator and calculator'),
            new FilterLink('PoE Database', 'https://poedb.tw/', 'Comprehensive PoE 1 database'),
            new FilterLink('PoE 2 Database', 'https://poe2db.tw/', 'Comprehensive PoE 2 database'),
            new FilterLink("Atziri's Temple Planner", 'https://sulozor.github.io/#/atziri-temple', 'Plan temple layouts'),
            new FilterLink('PoE and PoE 2 Economy Tracker', 'https://poe.ninja/', 'Item prices and economy data'),
            new FilterLink('PoE Wiki', 'https://www.poewiki.net/wiki/Path_of_Exile', 'Official PoE 1 wiki'),
            new FilterLink('PoE 2 Wiki', 'https://www.poewiki.net/wiki/Path_of_Exile_2', 'Official PoE 2 wiki'),
            new FilterLink('Path of Building Community Fork', 'https://pathofbuilding.community/', 'Build planning tool'),
            new FilterLink('PoE Vault', 'https://www.poe-vault.com/', 'Builds and guides'),
            new FilterLink('Maxroll PoE Guides and Builds', 'https://maxroll.gg/poe', 'PoE 1 guides'),
            new FilterLink('Maxroll PoE 2 Guides and Builds', 'https://maxroll.gg/poe2', 'PoE 2 guides'),
            new FilterLink('PoE and PoE 2 Filter Designer', 'https://www.filterblade.xyz/', 'Create and customize filters'),
            new FilterLink('PoHX PoE Build Planner', 'https://pohx.net/', 'Build guides and tools'),
            new FilterLink('Awakened PoE Trade App', 'https://snosme.github.io/awakened-poe-trade/', 'Price checking tool'),
            new FilterLink('Exile PoE 2 Trade App', 'https://kvan7.github.io/Exiled-Exchange-2/download', 'PoE 2 trading tool')
        ];
    }
}

class FilterLink extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private url: string,
        tooltip: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = tooltip;
        this.description = '';
        this.command = {
            command: 'vscode.open',
            title: 'Open Link',
            arguments: [vscode.Uri.parse(url)]
        };
        
        this.iconPath = new vscode.ThemeIcon('link');
    }
}

// Check color decorator limit and suggest increase for large filter files
function checkColorDecoratorLimit(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration();
    const currentLimit = config.get<number>('editor.colorDecoratorsLimit', 500);
    const recommendedLimit = 1000;
    
    // Only show notification once per install
    const hasShownNotification = context.globalState.get('hasShownColorLimitNotification', false);
    
    if (!hasShownNotification && currentLimit < recommendedLimit) {
        vscode.window.showInformationMessage(
            `POE Filter files can have 800+ colors. Current limit: ${currentLimit}. Increase to ${recommendedLimit}+ for best experience?`,
            'Increase Limit',
            'Remind Me Later',
            'Don\'t Show Again'
        ).then(selection => {
            if (selection === 'Increase Limit') {
                config.update('editor.colorDecoratorsLimit', recommendedLimit, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Color decorator limit increased to ${recommendedLimit}. Reload window for changes to take effect.`, 'Reload').then(choice => {
                    if (choice === 'Reload') {
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
                context.globalState.update('hasShownColorLimitNotification', true);
            } else if (selection === 'Don\'t Show Again') {
                context.globalState.update('hasShownColorLimitNotification', true);
            }
        });
    }
}
