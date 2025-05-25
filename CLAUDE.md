# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Adobe Illustrator ExtendScript automation toolkit for creating pattern-based designs. The scripts automate document creation, EPS/PNG file placement, scaling, and grid-based layouts for product packaging workflows.

## Key Technical Context

### ExtendScript Limitations
- No ES6+ features (use ES3/ES5 syntax only)
- No `toISOString()` method on Date objects
- Limited array methods (no `map`, `filter`, `forEach`)
- Use `#target illustrator` directive at start of all scripts
- File paths must be absolute, not relative

### Common Functions and Patterns

```javascript
// Unit conversion (used throughout)
function mmToPt(mm) {
    return mm * 2.834645669;
}

// Standard document creation
var docPreset = new DocumentPreset();
docPreset.width = mmToPt(200);
docPreset.height = mmToPt(500);
docPreset.units = RulerUnits.Millimeters;
var doc = app.documents.addDocument(null, docPreset);

// Logging pattern
function logToFile(action, details) {
    var logFile = new File(new File($.fileName).parent + "/logCmd.txt");
    var timestamp = /* manual date formatting */;
    logFile.open("a");
    logFile.writeln("[" + timestamp + "] " + action + " - " + details);
    logFile.close();
}
```

## Script Categories

### Basic Placement Scripts (eps*.jsx)
Single-purpose scripts for placing and scaling images at specific coordinates.

### Dialog Scripts (dial*.jsx, cmEp*.jsx)
User interface scripts with file selection dialogs. Pattern:
- Create ScriptUI dialog
- Add file selection buttons
- Generate document on confirmation
- Log all actions to logCmd.txt

### Grid Layout System
- 3x2 grid (3 rows, 2 columns)
- Standard positions:
  - Row 1: Y=700, Row 2: Y=350, Row 3: Y=0
  - Column 1: X=20, Column 2: X=190
- Cell size: 150x300 points

## File Organization

```
/Target/          # Device-specific synthesized patterns
  s25_PatCol.eps
  s25_PatBlk.eps
  s25plus_*.eps
  s25ultra_*.eps

/Dlg/            # Dialog examples and utilities
  cmd*.jsx       # Dialog component examples

/screenshot/     # UI reference images for debugging
```

## Development Workflow

### Testing Scripts
1. Run script in Illustrator (File > Scripts > Other Script)
2. Check logCmd.txt for execution logs
3. Debug versions typically suffixed with _debug, _test, _fixed

### Common Issues
- Silent script failures: Add immediate `alert()` at start to verify execution
- Dialog not showing: Check for UI element hierarchy issues
- File not found: Always use absolute paths (e.g., `D:\EPS\Iter\UI\...`)

### Incremental Development Pattern
When building complex features:
1. Start with single functionality (e.g., cmEp3a.jsx - one file placement)
2. Add features incrementally (e.g., cmEp3b.jsx - two file placement)
3. Test each step before proceeding

## Target Devices and Patterns

- **Pattern files**: PatCol.eps, PatBlk.eps (base patterns)
- **BluePrint files**: s25.eps, s25plus.eps, s25ultra.eps (device overlays)
- **Synthesized naming**: `{blueprint}_{pattern}.eps` (e.g., s25_PatCol.eps)