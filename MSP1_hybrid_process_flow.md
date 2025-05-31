# MSP1_hybrid Process Flow Documentation

## Overview
MSP1_hybrid.jsx is a hybrid masking script that combines compound path creation (preserves holes) with optional stroke preservation. It processes pattern files (PatCol and PatBlk) with a mask file to create masked versions.

## Input Parameters (Global Variables)
- `$.global.MSP_patColPath`: Path to color pattern file
- `$.global.MSP_patBlkPath`: Path to black pattern file  
- `$.global.MSP_maskPath`: Path to mask/blueprint file
- `$.global.MSP_preserveStrokes`: Boolean flag for stroke preservation (default: false)

## Output Results (Global Variables)
- `$.global.MSP_success`: Boolean indicating success/failure
- `$.global.MSP_outputPaths`: Array of created file paths
- `$.global.MSP_errorMessage`: Error message if failed

## Log Files
- **Main process log**: `/mnt/d/EPS/Iter/UI4/log.txt`
- **Direct caller log**: `/mnt/d/EPS/Iter/UI4/log_hybrid_direct.txt` (when using testMSP_hybrid_direct.jsx)

## Detailed Process Flow

### 1. Script Initialization
```
[timestamp] ===== MSP1_hybrid.jsx STARTED =====
```
- Creates/verifies Target folder existence
- Opens log file for appending
- Validates input parameters

### 2. Pattern Processing (Runs twice: PatCol then PatBlk)

#### 2.1 File Opening
```
[timestamp] Processing PatCol masking
[timestamp] Pattern: [full path to pattern file]
[timestamp] Mask: [full path to mask file]
```
- Opens mask document
- Opens pattern document

#### 2.2 Mask Extraction
```
[timestamp] Fetching CL + BL from mask document
[timestamp] Found CL and BL groups
```
- Extracts CL (case line) and BL (bleed line) groups from mask
- Validates mask contains required groups

#### 2.3 Pattern Preparation
```
[timestamp] Extracting pattern from PatCol file...
[timestamp] Pattern copied to mask document
[timestamp] Protected [N] disclaimer text items
```
- Unlocks all items in pattern document
- Copies all pattern content
- Identifies and protects disclaimer text (©, Disney, etc.)

#### 2.4 Pattern Scaling
```
[timestamp] Scaling pattern to match CL height...
[timestamp] Scaling uniformly by [scale factor]
[timestamp] Pattern scaled and centered
```
- Calculates scale factor based on CL height
- Scales pattern uniformly from center
- Repositions to match CL center

#### 2.5 Hybrid Clipping Mask Creation
```
[timestamp] Creating hybrid clipping mask...
[timestamp] Compound clipping path created
```
- Duplicates BL (or CL if BL not available)
- Converts to compound path (preserves holes)
- Sets as clipping path

#### 2.6 Optional Stroke Preservation
```
[timestamp] Duplicating stroke from mask...
```
(Only if MSP_preserveStrokes = true)
- Creates stroke copy from original mask
- Applies to clipped result

#### 2.7 Final Assembly
```
[timestamp] Assembling final Target group...
[timestamp] Target group assembled + clipping applied
```
- Creates new Target layer
- Groups pattern with clipping mask
- Re-adds disclaimer text
- Applies clipping

#### 2.8 File Saving
```
[timestamp] Saving to: [output path]
[timestamp] Successfully created: [filename]
```
- Saves as EPS to Target folder
- Naming convention: `[maskname]_[PatCol/PatBlk].eps`
- Example: `2d_PatCol.eps`, `2d_PatBlk.eps`

### 3. Script Completion
```
[timestamp] ===== MSP1_hybrid.jsx COMPLETED SUCCESSFULLY =====
```
Or if failed:
```
[timestamp] ===== MSP1_hybrid.jsx FAILED: [error message] =====
```

## Output Files Structure
```
/mnt/d/EPS/Iter/UI4/Target/
├── 2d_PatCol.eps    # Masked color pattern
└── 2d_PatBlk.eps    # Masked black pattern
```

## Error Handling
- Missing files: "Pattern file not found" / "Mask file not found"
- Invalid mask: "Mask layer must contain at least CL + BL groups"
- Compound path failure: "Failed to create compound path from mask"
- General errors: Caught and logged with full error message

## Direct Execution Flow (testMSP_hybrid_direct.jsx)

1. **Initialization**
   - Sets up automatic file paths
   - Creates separate log file
   - Validates file existence

2. **Parameter Setup**
   - Sets all global parameters
   - Enables stroke preservation
   - Clears previous results

3. **Execution**
   - Calls MSP1_hybrid.jsx via $.evalFile()
   - Monitors execution results

4. **Result Handling**
   - Logs all output files
   - Shows user-friendly alerts
   - Provides detailed error messages if failed