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
- Silent script failures are common - use early `alert()` or logging to verify execution

### Common Functions and Patterns

```javascript
// Unit conversion (standard across codebase)
function mmToPt(mm) {
    return mm * 2.834645669;
}

// Standard document creation with A3+ size
var docPreset = new DocumentPreset();
docPreset.width = mmToPt(320);  // Standard width: 320mm
docPreset.height = mmToPt(450); // Standard height: 450mm
docPreset.units = RulerUnits.Millimeters;
var doc = app.documents.addDocument(null, docPreset);

// Logging pattern (critical for debugging)
function logToFile(action, details) {
    var scriptFile = new File($.fileName);
    var logFile = new File(scriptFile.parent + "/logCmd.txt");
    var now = new Date();
    var timestamp = now.getFullYear() + "-" + 
                   ("0" + (now.getMonth() + 1)).slice(-2) + "-" + 
                   ("0" + now.getDate()).slice(-2) + " " + 
                   ("0" + now.getHours()).slice(-2) + ":" + 
                   ("0" + now.getMinutes()).slice(-2) + ":" + 
                   ("0" + now.getSeconds()).slice(-2) + "." + 
                   ("00" + now.getMilliseconds()).slice(-3);
    logFile.open("a");
    logFile.writeln("[" + timestamp + "] " + action + " - " + details);
    logFile.close();
}

// Common helper functions
function ctr(b) { // Get center of bounds
    return [(b[0]+b[2])/2, (b[1]+b[3])/2]; 
}

function unlockDeep(it) { // Recursively unlock items
    try { it.locked = false; it.hidden = false; } catch(e){}
    if (it.pageItems) {
        for (var k = 0; k < it.pageItems.length; k++) {
            unlockDeep(it.pageItems[k]);
        }
    }
}
```

## Script Categories

### Current Active Scripts
- **cmEpOp7.jsx**: Main dialog-based tool with 4-column grid layout and Target file placement
- **cmd8.jsx**: Dialog component for pattern file selection
- **masked2.jsx**: Fast automated masking without dialogs (loads 2d.eps and PatCol.eps automatically)

### Dialog Scripts (dial*.jsx, cmEp*.jsx)
User interface scripts with file selection dialogs. Pattern:
- Create ScriptUI dialog with columns
- Add file selection buttons for patterns and blueprints
- Display synthesized file names (e.g., "s25_PatCol.eps")
- Generate document on confirmation
- Log all actions to logCmd.txt with structured tags

### Grid Layout System (Updated)
- **4-column grid** (3 rows, 4 columns) in cmEpOp7.jsx
- Standard positions:
  - Row 1: Y=280mm, Row 2: Y=155mm, Row 3: Y=30mm
  - Column 1: X=20mm, Column 2: X=100mm, Column 3: X=180mm, Column 4: X=260mm
- Cell size: 60x105mm (170x297 points)
- Special placements: Target files in specific grid positions

## File Organization

```
/                 # Root directory (D:\EPS\Iter\UI2)
  PatCol.eps      # Base color pattern file
  PatBlk.eps      # Base black pattern file
  PatCol.png      # PNG version of color pattern
  s25.eps         # Galaxy S25 blueprint
  s25plus.eps     # Galaxy S25+ blueprint  
  s25ultra.eps    # Galaxy S25 Ultra blueprint
  targ.eps        # Target pattern template

/Target/          # Device-specific synthesized patterns
  s25_PatCol.eps
  s25_PatBlk.eps
  s25plus_*.eps
  s25ultra_*.eps
  targG.eps       # Target generic file

/Dlg/            # Dialog examples and command scripts
  cmd8.jsx       # Pattern file selection dialog
  logCmd.txt     # Dialog action logs

/screenshot/     # UI reference images for debugging
```

## Development Workflow

### Running Scripts
1. Run script in Illustrator: File > Scripts > Other Script
2. Select the .jsx file from file browser
3. Check logCmd.txt for execution logs and debugging

### Logging Strategy
- Every user action logged with structured tags (e.g., SCRIPT_START, FILE_SELECTED, BUTTON_CLICK)
- Timestamps include milliseconds for precise debugging
- Log files: `logCmd.txt` for dialogs, `log.txt` for automated scripts
- Early logging before main script logic to catch initialization failures

### Common Issues and Solutions
- **Silent script failures**: Add `alert("Script starting")` at very beginning
- **Dialog not showing**: Check ScriptUI hierarchy and `.show()` call
- **File not found**: Use absolute paths (`D:\EPS\Iter\UI2\...`)
- **Locked items**: Use `unlockDeep()` function before operations
- **Copy/paste issues**: Ensure `app.activeDocument` is set correctly

## Target Devices and Patterns

- **Pattern files**: PatCol.eps (color), PatBlk.eps (black) - base patterns with trim marks
- **BluePrint files**: s25.eps, s25plus.eps, s25ultra.eps - device-specific overlays
- **Target files**: Pre-synthesized patterns in /Target/ directory
- **Synthesized naming**: `{blueprint}_{pattern}.eps` (e.g., s25_PatCol.eps)
- **Masking workflow**: Pattern is masked by blueprint's CL (case line) and BL (bleed line) groups