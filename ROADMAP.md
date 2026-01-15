# POE Filter Extension - Development Roadmap

## ✅ Phase 1: Core Features (COMPLETED)

### Syntax Highlighting ✅
- [x] Show/Hide keywords
- [x] Condition keywords (BaseType, Class, Rarity, etc.)
- [x] Display properties (SetTextColor, etc.)
- [x] Audio/Visual effects
- [x] Comments with proper color distinction
- [x] Operators and values
- [x] Rarity-specific colors (Normal=white, Magic=blue, Rare=yellow, Unique=orange)
- [x] Effect color highlighting (Red, Green, Blue, Orange, etc.)
- [x] FilterBlade metadata recognition ($type->, $tier->, !tag, %XN)

### Color Features ✅
- [x] Inline color visualization (■ colored squares for effect colors)
- [x] Color picker integration for RGB/RGBA values
- [x] RGBA format support (3 or 4 values)
- [x] Real-time color updates
- [x] Effect color decorator showing actual colors

### Syntax Validation ✅
- [x] Color value range validation (0-255)
- [x] Color component count validation (3 or 4)
- [x] Unknown keyword warnings
- [x] Real-time diagnostics

### Autocompletion ✅
- [x] Show/Hide keywords
- [x] Condition keywords
- [x] Display properties with snippets
- [x] BaseType extraction from filters
- [x] Effect keywords
- [x] Context-aware effect color suggestions
- [x] MinimapIcon shape suggestions
- [x] Rarity value suggestions with descriptions

### Interactive Features ✅
- [x] BaseType linking to poe2db.tw database
- [x] Quick action lightbulb menus for color changes
- [x] Quick action lightbulb menus for shape changes
- [x] Clickable item names (Ctrl+Click to open poe2db.tw)

### Developer Experience ✅
- [x] 60+ hover definitions from official POE docs
- [x] Extension development setup
- [x] Test filter file with all features
- [x] Comprehensive documentation (README, QUICKSTART, ROADMAP)
- [x] FilterBlade metadata warnings in tooltips
- [x] MinimapIcon size definitions (0=small, 1=medium, 2=large)

## 🚧 Phase 2: Enhanced Intelligence (TODO)

### Better BaseType Management
- [ ] Extract Class names from filters
- [ ] Group BaseTypes by Class
- [ ] Show item type in autocomplete details
- [ ] Add tier information (which strictness shows/hides)
- [ ] Cache BaseTypes for faster loading
- [ ] Support for custom BaseType files

### Smarter Validation
- [ ] Validate indentation (tabs after Show/Hide)
- [ ] Check block structure (conditions must follow Show/Hide)
- [ ] Validate operator usage (== for strings, >= for numbers)
- [ ] Check for duplicate blocks
- [ ] Validate effect parameters completeness
- [ ] Check for unreachable rules
- [ ] Warn about conflicting conditions

### Advanced Autocompletion
- [ ] Suggest common value ranges (ItemLevel, StackSize)
- [ ] Class name extraction and suggestions
- [ ] Auto-close quotes for BaseType values
- [ ] Multi-line BaseType list formatting
- [ ] Context-aware operator suggestions

## 🎯 Phase 3: Quality of Life (TODO)

### Code Actions (Quick Fixes)
- [ ] "Clamp value to 0-255" for out-of-range colors
- [ ] "Add alpha channel" (convert RGB to RGBA)
- [ ] "Format filter block" (fix indentation)
- [ ] "Sort conditions" (alphabetically)
- [ ] "Add missing closing quote"
- [ ] "Fix operator spacing"

### Snippets
- [ ] Common Show/Hide block templates
- [ ] Currency filter snippets
- [ ] Crafting base snippets
- [ ] Endgame item snippets
- [ ] FilterBlade metadata templates

### Code Navigation
- [ ] Go to definition (jump to section markers)
- [ ] Symbol outline (show all Show/Hide blocks)
- [ ] Breadcrumbs (show current section)
- [ ] Folding ranges (collapse sections)
- [ ] Find all references for BaseTypes

### Filter Analysis
- [ ] Count Show vs Hide blocks
- [ ] Identify unused BaseTypes
- [ ] Find duplicate conditions
- [ ] Coverage report (which items are shown/hidden)
- [ ] Filter statistics dashboard

## 🔮 Phase 4: Advanced Features (FUTURE)

### FilterBlade Integration
- [ ] Parse FilterBlade metadata ($type, $tier, !tags)
- [ ] Validate metadata consistency
- [ ] Suggest appropriate metadata for new blocks
- [ ] Export to FilterBlade format
- [ ] Import from FilterBlade

### Visual Preview
- [ ] Show item appearance preview
- [ ] Simulate minimap icon display
- [ ] Audio preview for alert sounds
- [ ] Effect beam visualization
- [ ] Side-by-side comparison view

### Multi-File Support
- [ ] Compare filters (diff view)
- [ ] Merge filters
- [ ] Extract common blocks
- [ ] Generate strictness variations
- [ ] Batch edit across files

### Testing & Debugging
- [ ] Test filter against item database
- [ ] Simulate item drops
- [ ] Coverage analysis (which blocks are matched)
- [ ] Performance profiling (rule evaluation order)
- [ ] Rule priority visualization

## 📊 Metrics & Analytics

### Current Status (v0.1.0)
- **Lines of Code**: ~750 (extension.ts)
- **Providers**: 5 (Color, Completion, Hover, CodeAction, DocumentLink)
- **Hover Definitions**: 60+
- **Effect Colors**: 12 (Red, Green, Blue, Brown, White, Yellow, Cyan, Grey, Orange, Pink, Purple, Temp)
- **Icon Shapes**: 12 (Circle, Diamond, Hexagon, Square, Star, Triangle, Cross, Moon, Raindrop, Kite, Pentagon, UpsideDownHouse)
- **Keywords Supported**: 30+
- **Validation Rules**: 3 core rules

### Performance Targets
- BaseType loading: < 500ms ✅
- Syntax validation: < 100ms per file ✅
- Color picker response: Instant ✅
- Autocomplete suggestions: < 50ms ✅
- Link provider: < 50ms ✅

## 🐛 Known Issues

### Current Limitations
- BaseType extraction doesn't handle extremely long multi-line lists optimally
- No validation for effect parameters (color/shape existence checked only on hover)
- Validation runs on every keystroke (could benefit from debouncing)
- poe2db.tw links may not work for all item names (URL format variations)
- No support for custom sound files in autocomplete

### Nice to Have
- [ ] Support for custom sound files
- [ ] Integration with POE trade API (item prices)
- [ ] Auto-update BaseType database from game patches
- [ ] Import filters directly from FilterBlade.xyz URL
- [ ] Export filter statistics to JSON

## 📝 Documentation Status

### User Documentation ✅
- [x] Quick Start Guide (comprehensive)
- [x] README with all features
- [x] ROADMAP with development plan
- [x] Example test file with all features
- [ ] Video tutorial
- [ ] Common use cases guide
- [ ] Advanced troubleshooting guide

### Developer Documentation ✅
- [x] Copilot instructions (comprehensive)
- [x] Code comments throughout
- [x] LICENSE file (MIT)
- [ ] Architecture overview diagram
- [ ] Extension points for contributors
- [ ] Testing guide
- [ ] Build and publish instructions

## 🤝 Community Features (FUTURE)

### Sharing & Collaboration
- [ ] Export/import filter presets
- [ ] Share filter snippets
- [ ] Community filter library
- [ ] Filter voting/rating system
- [ ] Filter template marketplace

### Integration
- [ ] GitHub Gist export
- [ ] Pastebin export
- [ ] Direct FilterBlade.xyz sync
- [ ] POE Forum post formatting
- [ ] Discord webhook notifications

## 🎓 Learning Resources

### For Extension Development
- VSCode Extension API docs
- TextMate grammar reference
- Language Server Protocol docs
- TypeScript best practices

### For POE Filters
- NeverSink's filter documentation
- FilterBlade.xyz tutorials
- POE2 wiki (item types)
- Community filter guides
- Official POE filter documentation

## 🚀 Release Plan

### v0.1.0 (Current - Initial Release) ✅
**Core Features:**
- Syntax highlighting with rarity colors
- Color picker for RGB/RGBA values
- Syntax validation
- BaseType autocomplete
- Effect color/shape autocomplete
- BaseType linking to poe2db.tw
- Quick action menus for colors/shapes
- 60+ hover definitions
- FilterBlade metadata recognition
- Effect color visualization

### v0.2.0 (Next - Enhanced Validation)
**Planned Features:**
- Indentation validation
- Block structure validation
- Operator usage validation
- Code actions (quick fixes)
- Snippets for common patterns
- Class name extraction
- Improved error messages

### v0.3.0 (Future - Advanced Features)
**Planned Features:**
- FilterBlade integration
- Visual preview
- Multi-file support
- Filter comparison
- Coverage analysis
- Performance profiling

### v1.0.0 (Stable Release)
**Requirements:**
- All Phase 2 features complete
- Comprehensive test suite
- User feedback incorporated
- Performance optimized
- Documentation complete
- Community validation

## 🎯 Success Metrics

### Adoption
- Downloads from marketplace
- Active users
- Star rating
- User feedback

### Quality
- Bug reports resolved
- Feature requests implemented
- Documentation completeness
- Test coverage

### Performance
- Extension activation time
- Memory usage
- Response times
- Error rates

---

**Current Status**: Phase 1 Complete ✅ | Phase 2 Planning 🚧

### v1.0.0 (Stable)
- All Phase 2 features complete
- Comprehensive testing
- Performance optimization
- Full documentation

## 💬 Feedback Needed

1. Which Phase 2 features are most important?
2. Are there missing filter keywords/conditions?
3. What common editing tasks should be automated?
4. Should we support POE1 filters too?

---

**Last Updated**: January 15, 2026
**Current Version**: 0.1.0
**Status**: Phase 1 Complete ✅
