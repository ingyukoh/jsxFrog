// mskPat3_advanced.jsx - Enhanced version with masking method selection
#target "illustrator"

// Add early logging to catch script startup issues
try {
    var earlyScriptFile = new File($.fileName);
    var earlyScriptFolder = earlyScriptFile.parent;
    var earlyLogFile = new File(earlyScriptFolder + "/logCmd.txt");
    
    earlyLogFile.open("a");
    var timestamp = new Date().toLocaleString();
    earlyLogFile.writeln("[" + timestamp + "] [SCRIPT_INIT] mskPat3_advanced.jsx starting - early init");
    earlyLogFile.close();
} catch (e) {
    alert("Early logging failed: " + e.toString());
}

// Global variables
var selectedPatCol = null;
var selectedPatBlk = null;
var selectedBlueprint = null;
var selectedBlueprint2 = null; 
var selectedBlueprint3 = null;
var currentDoc = null;
var artworkLayer = null;
var placedPatCol = null;
var placedPatBlk = null;
var placedBlueprint = null;
var placedBlueprint2 = null;
var placedBlueprint3 = null;
var placedTargetPatCol = null;
var placedTargetPatBlk = null;
var placedTarget2PatCol = null;
var placedTarget2PatBlk = null;
var placedTarget3PatCol = null;
var placedTarget3PatBlk = null;
var patColLabel = null;
var patBlkLabel = null;
var blueprintLabel = null;
var blueprint2Label = null;
var blueprint3Label = null;
var targetPatColLabel = null;
var targetPatBlkLabel = null;
var target2PatColLabel = null;
var target2PatBlkLabel = null;
var target3PatColLabel = null;
var target3PatBlkLabel = null;

// NEW: Masking method selection variables
var selectedMaskingMethod = "hybrid"; // Default to hybrid
var preserveStrokes = true; // Default to preserve strokes

// === HELPER FUNCTIONS ===

// Function to log to external file
function logToFile(tag, message) {
    try {
        var scriptFile = new File($.fileName);
        var scriptFolder = scriptFile.parent;
        var logFile = new File(scriptFolder + "/logCmd.txt");
        
        logFile.open("a");
        var timestamp = new Date().toLocaleString();
        logFile.writeln("[" + timestamp + "] [" + tag + "] " + message);
        logFile.close();
    } catch (e) {
        // Silently fail if can't write to log
    }
}

// Function to resize placed item maintaining aspect ratio
function resizeWithAspectRatio(item, maxWidth, maxHeight) {
    var currentWidth = item.width;
    var currentHeight = item.height;
    
    var widthScale = maxWidth / currentWidth;
    var heightScale = maxHeight / currentHeight;
    var scale = Math.min(widthScale, heightScale);
    
    item.width = currentWidth * scale;
    item.height = currentHeight * scale;
    
    return {
        scale: scale * 100,
        newWidth: item.width,
        newHeight: item.height
    };
}

// Function to ensure item is visible
function ensureItemVisible(placedItem, itemName) {
    placedItem.layer.visible = true;
    placedItem.layer.locked = false;
    placedItem.zOrder(ZOrderMethod.BRINGTOFRONT);
    placedItem.hidden = false;
    logToFile("VISIBILITY", itemName + " - Layer visible: " + placedItem.layer.visible + ", Item hidden: " + placedItem.hidden);
}

// === DOCUMENT CREATION ===

// Create new document at start
try {
    logToFile("SCRIPT_START", "mskPat3_advanced.jsx starting - main execution");
    
    // Create a new document with specific settings
    var docPreset = new DocumentPreset();
    docPreset.title = "Pattern Placement Document";
    docPreset.width = 1000;
    docPreset.height = 1000;
    docPreset.artboardLayout = DocumentArtboardLayout.GridByRow;
    docPreset.numArtboards = 1;
    
    currentDoc = app.documents.addDocument(DocumentColorSpace.RGB, docPreset);
    logToFile("DOCUMENT_CREATED", "New document created: " + docPreset.width + "x" + docPreset.height);
    
    // Create layers
    var gridLayer = currentDoc.layers.add();
    gridLayer.name = "Grid Guides";
    
    artworkLayer = currentDoc.layers.add();
    artworkLayer.name = "Artwork";
    currentDoc.activeLayer = artworkLayer;
    logToFile("LAYERS_CREATED", "Grid Guides and Artwork layers created");
    
    // Calculate grid positions for 3x4 layout
    var artboardBounds = currentDoc.artboards[0].artboardRect;
    var artboardWidth = artboardBounds[2] - artboardBounds[0];
    var artboardHeight = artboardBounds[1] - artboardBounds[3];
    
    var cellWidth = 150;
    var cellHeight = 300;
    var horizontalGap = 100;
    var verticalGap = 50;
    
    var totalWidth = (cellWidth * 4) + (horizontalGap * 3);
    var totalHeight = (cellHeight * 3) + (verticalGap * 2);
    
    var startX = (artboardWidth - totalWidth) / 2;
    var startY = (artboardHeight - totalHeight) / 2;
    
    // Calculate positions for each grid cell
    var col1X = startX;
    var col2X = startX + cellWidth + horizontalGap;
    var col3X = startX + (cellWidth * 2) + (horizontalGap * 2);
    var col4X = startX + (cellWidth * 3) + (horizontalGap * 3);
    
    var row1Y = artboardBounds[1] - startY;
    var row2Y = row1Y - cellHeight - verticalGap;
    var row3Y = row2Y - cellHeight - verticalGap;
    
    logToFile("GRID_CALCULATED", "Grid layout calculated - Cell size: " + cellWidth + "x" + cellHeight);
    
    // Draw grid guides
    currentDoc.activeLayer = gridLayer;
    for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 4; col++) {
            var rect = currentDoc.pathItems.rectangle(
                row === 0 ? row1Y : (row === 1 ? row2Y : row3Y),
                col === 0 ? col1X : (col === 1 ? col2X : (col === 2 ? col3X : col4X)),
                cellWidth,
                cellHeight
            );
            rect.filled = false;
            rect.stroked = true;
            rect.strokeColor = new RGBColor();
            rect.strokeColor.red = 200;
            rect.strokeColor.green = 200;
            rect.strokeColor.blue = 200;
            rect.strokeWidth = 0.5;
        }
    }
    
    // Add labels to grid
    var positions = [
        {label: "(1,1) Pattern Col", x: col1X + 5, y: row1Y - 5},
        {label: "(1,2) 2d BluePrint #1", x: col2X + 5, y: row1Y - 5},
        {label: "(1,3) 2d BluePrint #2", x: col3X + 5, y: row1Y - 5},
        {label: "(1,4) 2d BluePrint #3", x: col4X + 5, y: row1Y - 5},
        {label: "(2,1) Pattern Blk", x: col1X + 5, y: row2Y - 5},
        {label: "(2,2) Target PatCol", x: col2X + 5, y: row2Y - 5},
        {label: "(2,3) Target PatCol #2", x: col3X + 5, y: row2Y - 5},
        {label: "(2,4) Target PatCol #3", x: col4X + 5, y: row2Y - 5},
        {label: "(3,1) [Reserved]", x: col1X + 5, y: row3Y - 5},
        {label: "(3,2) Target PatBlk", x: col2X + 5, y: row3Y - 5},
        {label: "(3,3) Target PatBlk #2", x: col3X + 5, y: row3Y - 5},
        {label: "(3,4) Target PatBlk #3", x: col4X + 5, y: row3Y - 5}
    ];
    
    for (var i = 0; i < positions.length; i++) {
        var labelText = currentDoc.textFrames.add();
        labelText.contents = positions[i].label;
        labelText.top = positions[i].y;
        labelText.left = positions[i].x;
        labelText.textRange.characterAttributes.size = 10;
        labelText.textRange.characterAttributes.fillColor = new RGBColor();
        labelText.textRange.characterAttributes.fillColor.red = 150;
        labelText.textRange.characterAttributes.fillColor.green = 150;
        labelText.textRange.characterAttributes.fillColor.blue = 150;
    }
    
    currentDoc.activeLayer = artworkLayer;
    logToFile("GRID_CREATED", "Grid guides and labels created");
    
} catch (e) {
    logToFile("ERROR", "Document creation failed: " + e.toString());
    alert("Failed to create document: " + e.toString());
}

// === DIALOG CREATION ===

// Create dialog window
var dialog = new Window("dialog", "Pattern File Selection - Advanced");
dialog.orientation = "column";
dialog.alignChildren = "fill";

// Add title
var titleText = dialog.add("statictext", undefined, "Select Pattern Files");
titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);

// === NEW: MASKING METHOD SELECTION ===
var maskingPanel = dialog.add("panel", undefined, "Masking Method");
maskingPanel.orientation = "column";
maskingPanel.alignChildren = "left";

// Add radio buttons for masking methods
var standardRadio = maskingPanel.add("radiobutton", undefined, "Standard (Fast) - Simple masking, largest path only");
var compoundRadio = maskingPanel.add("radiobutton", undefined, "Compound Path - Preserves all holes and inner paths");
var strokeRadio = maskingPanel.add("radiobutton", undefined, "Preserve Stroke - Keeps visible outline strokes");
var hybridRadio = maskingPanel.add("radiobutton", undefined, "Hybrid (Recommended) - Best quality, preserves holes + optional strokes");

// Set default selection
hybridRadio.value = true;

// Add checkbox for stroke preservation (only enabled for hybrid)
var strokeCheckbox = maskingPanel.add("checkbox", undefined, "Preserve mask strokes");
strokeCheckbox.value = true;

// Radio button event handlers
standardRadio.onClick = function() {
    selectedMaskingMethod = "standard";
    strokeCheckbox.enabled = false;
    logToFile("UI_METHOD_CHANGE", "Masking method changed to: Standard");
};

compoundRadio.onClick = function() {
    selectedMaskingMethod = "compound";
    strokeCheckbox.enabled = false;
    logToFile("UI_METHOD_CHANGE", "Masking method changed to: Compound Path");
};

strokeRadio.onClick = function() {
    selectedMaskingMethod = "stroke";
    strokeCheckbox.enabled = false;
    logToFile("UI_METHOD_CHANGE", "Masking method changed to: Preserve Stroke");
};

hybridRadio.onClick = function() {
    selectedMaskingMethod = "hybrid";
    strokeCheckbox.enabled = true;
    logToFile("UI_METHOD_CHANGE", "Masking method changed to: Hybrid");
};

strokeCheckbox.onClick = function() {
    preserveStrokes = strokeCheckbox.value;
    logToFile("UI_STROKE_CHANGE", "Preserve strokes: " + preserveStrokes);
};

// Add separator
dialog.add("panel", undefined, "").preferredSize.height = 10;

// Add container for the two-column layout
var mainContainer = dialog.add("group");
mainContainer.orientation = "row";
mainContainer.alignChildren = "top";

// === FIRST COLUMN (Pattern Col/Blk) ===
var column1 = mainContainer.add("group");
column1.orientation = "column";
column1.alignChildren = "left";

// Create a group for PatCol section
var patColGroup = column1.add("group");
patColGroup.orientation = "column";
patColGroup.alignChildren = "left";

// Add PatCol button
var patColButton = patColGroup.add("button", undefined, "Pattern Col");
patColButton.preferredSize.width = 150;

// Add text field for PatCol filename
var patColText = patColGroup.add("statictext", undefined, "No file selected");
patColText.preferredSize.width = 150;

// Add spacing
column1.add("panel", undefined, "").preferredSize.height = 10;

// Create a group for PatBlk section
var patBlkGroup = column1.add("group");
patBlkGroup.orientation = "column";
patBlkGroup.alignChildren = "left";

// Add PatBlk button
var patBlkButton = patBlkGroup.add("button", undefined, "Pattern Blk");
patBlkButton.preferredSize.width = 150;

// Add text field for PatBlk filename
var patBlkText = patBlkGroup.add("statictext", undefined, "No file selected");
patBlkText.preferredSize.width = 150;

logToFile("UI_CREATED", "Column 1 (Pattern Col/Blk) created");

// Add vertical separator
mainContainer.add("panel", undefined, "").preferredSize.width = 20;

// === SECOND COLUMN (2d BluePrint - first instance) ===
var column2 = mainContainer.add("group");
column2.orientation = "column";
column2.alignChildren = "left";

// Create a group for 2d BluePrint section
var blueprintGroup = column2.add("group");
blueprintGroup.orientation = "column";
blueprintGroup.alignChildren = "left";

// Add 2d BluePrint button
var blueprintButton = blueprintGroup.add("button", undefined, "2d BluePrint");
blueprintButton.preferredSize.width = 150;

// Add text field for 2d BluePrint filename
var blueprintText = blueprintGroup.add("statictext", undefined, "No file selected");
blueprintText.preferredSize.width = 150;

// Add spacing
column2.add("panel", undefined, "").preferredSize.height = 10;

// Masked PatCol text
var maskedPatColText = column2.add("statictext", undefined, "Target PatCol: Not selected");
maskedPatColText.preferredSize.width = 250;

// Masked PatBlk text  
var maskedPatBlkText = column2.add("statictext", undefined, "Target PatBlk: Not selected");
maskedPatBlkText.preferredSize.width = 250;

logToFile("UI_CREATED", "Column 2 (2d BluePrint) created");

// Add separator before bottom section
dialog.add("panel", undefined, "").preferredSize.height = 20;

// === BOTTOM SECTION (Additional 2d BluePrints) ===
var bottomContainer = dialog.add("group");
bottomContainer.orientation = "row";
bottomContainer.alignChildren = "top";

// 2d BluePrint #2
var blueprint2Group = bottomContainer.add("group");
blueprint2Group.orientation = "column";
blueprint2Group.alignChildren = "left";

var blueprint2Button = blueprint2Group.add("button", undefined, "2d BluePrint #2");
blueprint2Button.preferredSize.width = 150;

var blueprint2Text = blueprint2Group.add("statictext", undefined, "No file selected");
blueprint2Text.preferredSize.width = 150;

// Add synthesized name texts for BluePrint #2
var maskedPatCol2Text = blueprint2Group.add("statictext", undefined, "Target PatCol: Not selected");
maskedPatCol2Text.preferredSize.width = 250;

var maskedPatBlk2Text = blueprint2Group.add("statictext", undefined, "Target PatBlk: Not selected");
maskedPatBlk2Text.preferredSize.width = 250;

// Add spacing
bottomContainer.add("panel", undefined, "").preferredSize.width = 20;

// 2d BluePrint #3
var blueprint3Group = bottomContainer.add("group");
blueprint3Group.orientation = "column";
blueprint3Group.alignChildren = "left";

var blueprint3Button = blueprint3Group.add("button", undefined, "2d BluePrint #3");
blueprint3Button.preferredSize.width = 150;

var blueprint3Text = blueprint3Group.add("statictext", undefined, "No file selected");
blueprint3Text.preferredSize.width = 150;

// Add synthesized name texts for BluePrint #3
var maskedPatCol3Text = blueprint3Group.add("statictext", undefined, "Target PatCol: Not selected");
maskedPatCol3Text.preferredSize.width = 250;

var maskedPatBlk3Text = blueprint3Group.add("statictext", undefined, "Target PatBlk: Not selected");
maskedPatBlk3Text.preferredSize.width = 250;

logToFile("UI_CREATED", "Bottom section (2d BluePrint #2 and #3) created");

// Add separator
dialog.add("panel", undefined, "").preferredSize.height = 10;

// Add status text
var statusText = dialog.add("statictext", undefined, "Ready to select files");
statusText.graphics.font = ScriptUI.newFont("Arial", "Italic", 10);

// Add control buttons
var buttonGroup = dialog.add("group");
buttonGroup.orientation = "row";
buttonGroup.alignment = "center";

var viewDocButton = buttonGroup.add("button", undefined, "View Document");
var okButton = buttonGroup.add("button", undefined, "OK");
var cancelButton = buttonGroup.add("button", undefined, "Cancel");

logToFile("UI_CREATED", "Control buttons created");

// === HELPER FUNCTIONS FOR UI ===

// Function to update synthesized filenames
function updateSynthesizedNames() {
    if (selectedBlueprint) {
        var baseName = selectedBlueprint.name.replace(/\.[^.]+$/, "");
        maskedPatColText.text = "Target PatCol: " + baseName + "_PatCol.eps";
        maskedPatBlkText.text = "Target PatBlk: " + baseName + "_PatBlk.eps";
    } else {
        maskedPatColText.text = "Target PatCol: Not selected";
        maskedPatBlkText.text = "Target PatBlk: Not selected";
    }
}

function updateSynthesizedNames2() {
    if (selectedBlueprint2) {
        var baseName = selectedBlueprint2.name.replace(/\.[^.]+$/, "");
        maskedPatCol2Text.text = "Target PatCol: " + baseName + "_PatCol.eps";
        maskedPatBlk2Text.text = "Target PatBlk: " + baseName + "_PatBlk.eps";
    } else {
        maskedPatCol2Text.text = "Target PatCol: Not selected";
        maskedPatBlk2Text.text = "Target PatBlk: Not selected";
    }
}

function updateSynthesizedNames3() {
    if (selectedBlueprint3) {
        var baseName = selectedBlueprint3.name.replace(/\.[^.]+$/, "");
        maskedPatCol3Text.text = "Target PatCol: " + baseName + "_PatCol.eps";
        maskedPatBlk3Text.text = "Target PatBlk: " + baseName + "_PatBlk.eps";
    } else {
        maskedPatCol3Text.text = "Target PatCol: Not selected";
        maskedPatBlk3Text.text = "Target PatBlk: Not selected";
    }
}

// === EXECUTE MASKING FUNCTION ===
function executeMasking(patCol, patBlk, mask, maskNumber) {
    logToFile("MSP_START", "Starting masking for blueprint #" + maskNumber);
    logToFile("MSP_METHOD", "Using masking method: " + selectedMaskingMethod);
    
    try {
        // Set global parameters for MSP
        $.global.MSP_patColPath = patCol.fsName;
        $.global.MSP_patBlkPath = patBlk.fsName;
        $.global.MSP_maskPath = mask.fsName;
        
        // Set stroke preservation for hybrid method
        if (selectedMaskingMethod === "hybrid") {
            $.global.MSP_preserveStrokes = preserveStrokes;
        }
        
        // Clear previous results
        $.global.MSP_success = false;
        $.global.MSP_outputPaths = [];
        $.global.MSP_errorMessage = "";
        
        logToFile("MSP_PARAMS", "PatCol: " + patCol.fsName);
        logToFile("MSP_PARAMS", "PatBlk: " + patBlk.fsName);
        logToFile("MSP_PARAMS", "Mask: " + mask.fsName);
        
        // Select the appropriate MSP script based on method
        var scriptFile = new File($.fileName);
        var scriptFolder = scriptFile.parent;
        var mspScriptName = "";
        
        switch (selectedMaskingMethod) {
            case "standard":
                mspScriptName = "MSP1.jsx";
                break;
            case "compound":
                mspScriptName = "MSP1_compound.jsx";
                break;
            case "stroke":
                mspScriptName = "MSP1_stroke.jsx";
                break;
            case "hybrid":
                mspScriptName = "MSP1_hybrid.jsx";
                break;
        }
        
        var mspScript = new File(scriptFolder + "/" + mspScriptName);
        logToFile("MSP_SCRIPT", "Using script: " + mspScriptName);
        
        if (mspScript.exists) {
            $.evalFile(mspScript);
            
            // Check results
            if ($.global.MSP_success) {
                logToFile("MSP_SUCCESS", mspScriptName + " completed successfully");
                logToFile("MSP_OUTPUT", "Created " + $.global.MSP_outputPaths.length + " files");
                return true;
            } else {
                logToFile("MSP_FAILED", mspScriptName + " failed: " + $.global.MSP_errorMessage);
                statusText.text = "[ERROR] Masking failed: " + $.global.MSP_errorMessage;
                return false;
            }
        } else {
            logToFile("MSP_ERROR", mspScriptName + " not found in: " + scriptFolder.fsName);
            statusText.text = "[ERROR] " + mspScriptName + " not found";
            return false;
        }
        
    } catch (mspError) {
        logToFile("MSP_ERROR", "Error executing masking: " + mspError.toString());
        statusText.text = "[ERROR] " + mspError.toString();
        return false;
    }
}

// === BUTTON CLICK HANDLERS ===

// PatCol button click handler - NOW WITH IMAGE PLACEMENT
patColButton.onClick = function() {
    logToFile("BUTTON_CLICK", "Pattern Col button clicked");
    var selectedFile = File.openDialog("Select Pattern Col file", "*.eps");
    if (selectedFile != null) {
        selectedPatCol = selectedFile;
        patColText.text = selectedFile.name;
        logToFile("FILE_SELECTED", "Pattern Col: " + selectedFile.fsName);
        
        // Place Pattern Col image immediately at row 1, col 1
        try {
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous Pattern Col if exists
            if (placedPatCol) {
                placedPatCol.remove();
                logToFile("IMAGE_REMOVED", "Previous Pattern Col removed");
            }
            
            // Place new Pattern Col
            placedPatCol = currentDoc.placedItems.add();
            placedPatCol.file = selectedFile;
            
            // Position and scale
            placedPatCol.top = row1Y;
            placedPatCol.left = col1X;
            
            var scalingResult = resizeWithAspectRatio(placedPatCol, cellWidth, cellHeight);
            logToFile("IMAGE_PLACED", "Pattern Col placed at (1,1) and scaled to " + scalingResult.scale + "%");
            
            // Center in cell
            var itemBounds = placedPatCol.geometricBounds;
            var itemWidth = itemBounds[2] - itemBounds[0];
            var itemHeight = itemBounds[1] - itemBounds[3];
            var centerOffsetX = (cellWidth - itemWidth) / 2;
            var centerOffsetY = (cellHeight - itemHeight) / 2;
            placedPatCol.left = col1X + centerOffsetX;
            placedPatCol.top = row1Y - centerOffsetY;
            
            ensureItemVisible(placedPatCol, "Pattern Col");
            
            // Refresh document
            app.redraw();
            app.activeDocument.views[0].zoom = 1;
            app.activeDocument.views[0].centerPoint = [500, 500];
            
            statusText.text = "[OK] Pattern Col placed at (1,1)";
            logToFile("IMAGE_PLACED", "Pattern Col successfully placed and centered");
            
        } catch (e) {
            logToFile("ERROR", "Failed to place Pattern Col: " + e.toString());
            statusText.text = "[ERROR] Failed to place Pattern Col";
        }
    }
};

// PatBlk button click handler - NOW WITH IMAGE PLACEMENT
patBlkButton.onClick = function() {
    logToFile("BUTTON_CLICK", "Pattern Blk button clicked");
    var selectedFile = File.openDialog("Select Pattern Blk file", "*.eps");
    if (selectedFile != null) {
        selectedPatBlk = selectedFile;
        patBlkText.text = selectedFile.name;
        logToFile("FILE_SELECTED", "Pattern Blk: " + selectedFile.fsName);
        
        // Place Pattern Blk image immediately at row 2, col 1
        try {
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous Pattern Blk if exists
            if (placedPatBlk) {
                placedPatBlk.remove();
                logToFile("IMAGE_REMOVED", "Previous Pattern Blk removed");
            }
            
            // Place new Pattern Blk
            placedPatBlk = currentDoc.placedItems.add();
            placedPatBlk.file = selectedFile;
            
            // Position and scale
            placedPatBlk.top = row2Y;
            placedPatBlk.left = col1X;
            
            var scalingResult = resizeWithAspectRatio(placedPatBlk, cellWidth, cellHeight);
            logToFile("IMAGE_PLACED", "Pattern Blk placed at (2,1) and scaled to " + scalingResult.scale + "%");
            
            // Center in cell
            var itemBounds = placedPatBlk.geometricBounds;
            var itemWidth = itemBounds[2] - itemBounds[0];
            var itemHeight = itemBounds[1] - itemBounds[3];
            var centerOffsetX = (cellWidth - itemWidth) / 2;
            var centerOffsetY = (cellHeight - itemHeight) / 2;
            placedPatBlk.left = col1X + centerOffsetX;
            placedPatBlk.top = row2Y - centerOffsetY;
            
            ensureItemVisible(placedPatBlk, "Pattern Blk");
            
            // Refresh document
            app.redraw();
            
            statusText.text = "[OK] Pattern Blk placed at (2,1)";
            logToFile("IMAGE_PLACED", "Pattern Blk successfully placed and centered");
            
        } catch (e) {
            logToFile("ERROR", "Failed to place Pattern Blk: " + e.toString());
            statusText.text = "[ERROR] Failed to place Pattern Blk";
        }
    }
};

// 2d BluePrint button click handler - NOW WITH IMAGE PLACEMENT AND MSP1 EXECUTION
blueprintButton.onClick = function() {
    logToFile("BUTTON_CLICK", "2d BluePrint button clicked");
    var selectedFile = File.openDialog("Select 2d BluePrint file", "*.eps");
    if (selectedFile != null) {
        selectedBlueprint = selectedFile;
        blueprintText.text = selectedFile.name;
        logToFile("FILE_SELECTED", "2d BluePrint: " + selectedFile.fsName);
        updateSynthesizedNames();
        
        // Place 2d BluePrint image immediately at row 1, col 2
        try {
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous 2d BluePrint if exists
            if (placedBlueprint) {
                placedBlueprint.remove();
                logToFile("IMAGE_REMOVED", "Previous 2d BluePrint removed");
            }
            
            // Place new 2d BluePrint
            placedBlueprint = currentDoc.placedItems.add();
            placedBlueprint.file = selectedFile;
            
            // Position and scale
            placedBlueprint.top = row1Y;
            placedBlueprint.left = col2X;
            
            var scalingResult = resizeWithAspectRatio(placedBlueprint, cellWidth, cellHeight);
            logToFile("IMAGE_PLACED", "2d BluePrint placed at (1,2) and scaled to " + scalingResult.scale + "%");
            
            // Center in cell
            var itemBounds = placedBlueprint.geometricBounds;
            var itemWidth = itemBounds[2] - itemBounds[0];
            var itemHeight = itemBounds[1] - itemBounds[3];
            var centerOffsetX = (cellWidth - itemWidth) / 2;
            var centerOffsetY = (cellHeight - itemHeight) / 2;
            placedBlueprint.left = col2X + centerOffsetX;
            placedBlueprint.top = row1Y - centerOffsetY;
            
            ensureItemVisible(placedBlueprint, "2d BluePrint");
            
            // Refresh document
            app.redraw();
            
            statusText.text = "[OK] 2d BluePrint placed at (1,2). Generating masked files...";
            
            // Execute MSP if PatCol and PatBlk are selected
            if (selectedPatCol && selectedPatBlk) {
                if (executeMasking(selectedPatCol, selectedPatBlk, selectedBlueprint, 1)) {
                    statusText.text = "[OK] Masked files generated. Placing images...";
                    
                    // Try to place synthesized Target PatCol at (2,2)
                    try {
                        var scriptFile = new File($.fileName);
                        var scriptFolder = scriptFile.parent;
                        
                        var blueprintName = selectedBlueprint.name.replace(/\.[^.]+$/, '');
                        var targetFileName = blueprintName + "_PatCol.eps";
                        var targetFolder = new Folder(scriptFolder + "/Target");
                        var targetFile = new File(targetFolder + "/" + targetFileName);
                        
                        if (targetFile.exists) {
                            // Remove previous Target PatCol if exists
                            if (placedTargetPatCol) {
                                placedTargetPatCol.remove();
                            }
                            
                            // Place new Target PatCol
                            placedTargetPatCol = currentDoc.placedItems.add();
                            placedTargetPatCol.file = targetFile;
                            
                            // Position and scale
                            placedTargetPatCol.top = row2Y;
                            placedTargetPatCol.left = col2X;
                            
                            var scalingResult = resizeWithAspectRatio(placedTargetPatCol, cellWidth, cellHeight);
                            
                            // Center in cell
                            var itemBounds = placedTargetPatCol.geometricBounds;
                            var itemWidth = itemBounds[2] - itemBounds[0];
                            var itemHeight = itemBounds[1] - itemBounds[3];
                            var centerOffsetX = (cellWidth - itemWidth) / 2;
                            var centerOffsetY = (cellHeight - itemHeight) / 2;
                            placedTargetPatCol.left = col2X + centerOffsetX;
                            placedTargetPatCol.top = row2Y - centerOffsetY;
                            
                            ensureItemVisible(placedTargetPatCol, "Target PatCol");
                            logToFile("TARGET_PLACED", "Target PatCol placed at (2,2)");
                        }
                        
                        // Try to place Target PatBlk at (3,2)
                        var targetBlkFileName = blueprintName + "_PatBlk.eps";
                        var targetBlkFile = new File(targetFolder + "/" + targetBlkFileName);
                        
                        if (targetBlkFile.exists) {
                            // Remove previous Target PatBlk if exists
                            if (placedTargetPatBlk) {
                                placedTargetPatBlk.remove();
                            }
                            
                            // Place new Target PatBlk
                            placedTargetPatBlk = currentDoc.placedItems.add();
                            placedTargetPatBlk.file = targetBlkFile;
                            
                            // Position and scale
                            placedTargetPatBlk.top = row3Y;
                            placedTargetPatBlk.left = col2X;
                            
                            var scalingResult = resizeWithAspectRatio(placedTargetPatBlk, cellWidth, cellHeight);
                            
                            // Center in cell
                            var itemBounds = placedTargetPatBlk.geometricBounds;
                            var itemWidth = itemBounds[2] - itemBounds[0];
                            var itemHeight = itemBounds[1] - itemBounds[3];
                            var centerOffsetX = (cellWidth - itemWidth) / 2;
                            var centerOffsetY = (cellHeight - itemHeight) / 2;
                            placedTargetPatBlk.left = col2X + centerOffsetX;
                            placedTargetPatBlk.top = row3Y - centerOffsetY;
                            
                            ensureItemVisible(placedTargetPatBlk, "Target PatBlk");
                            logToFile("TARGET_PLACED", "Target PatBlk placed at (3,2)");
                        }
                        
                        app.redraw();
                        statusText.text = "[OK] All images placed successfully";
                        
                    } catch (targetError) {
                        logToFile("TARGET_ERROR", "Error placing target files: " + targetError.toString());
                    }
                }
            } else {
                logToFile("MSP_SKIP", "Skipping MSP - PatCol or PatBlk not selected");
                statusText.text = "[INFO] Select PatCol and PatBlk to generate masked files";
            }
            
        } catch (e) {
            logToFile("ERROR", "Failed to place 2d BluePrint: " + e.toString());
            statusText.text = "[ERROR] Failed to place 2d BluePrint";
        }
    }
};

// 2d BluePrint #2 button click handler
blueprint2Button.onClick = function() {
    logToFile("BUTTON_CLICK", "2d BluePrint #2 button clicked");
    var selectedFile = File.openDialog("Select 2d BluePrint #2 file", "*.eps");
    if (selectedFile != null) {
        selectedBlueprint2 = selectedFile;
        blueprint2Text.text = selectedFile.name;
        logToFile("FILE_SELECTED", "2d BluePrint #2: " + selectedFile.fsName);
        updateSynthesizedNames2();
        
        // Place 2d BluePrint #2 image at row 1, col 3
        try {
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous 2d BluePrint #2 if exists
            if (placedBlueprint2) {
                placedBlueprint2.remove();
                logToFile("IMAGE_REMOVED", "Previous 2d BluePrint #2 removed");
            }
            
            // Place new 2d BluePrint #2
            placedBlueprint2 = currentDoc.placedItems.add();
            placedBlueprint2.file = selectedFile;
            
            // Position and scale
            placedBlueprint2.top = row1Y;
            placedBlueprint2.left = col3X;
            
            var scalingResult = resizeWithAspectRatio(placedBlueprint2, cellWidth, cellHeight);
            logToFile("IMAGE_PLACED", "2d BluePrint #2 placed at (1,3) and scaled to " + scalingResult.scale + "%");
            
            // Center in cell
            var itemBounds = placedBlueprint2.geometricBounds;
            var itemWidth = itemBounds[2] - itemBounds[0];
            var itemHeight = itemBounds[1] - itemBounds[3];
            var centerOffsetX = (cellWidth - itemWidth) / 2;
            var centerOffsetY = (cellHeight - itemHeight) / 2;
            placedBlueprint2.left = col3X + centerOffsetX;
            placedBlueprint2.top = row1Y - centerOffsetY;
            
            ensureItemVisible(placedBlueprint2, "2d BluePrint #2");
            
            // Execute MSP if PatCol and PatBlk are selected
            if (selectedPatCol && selectedPatBlk) {
                if (executeMasking(selectedPatCol, selectedPatBlk, selectedBlueprint2, 2)) {
                    // Place Target files for BluePrint #2
                    try {
                        var scriptFile = new File($.fileName);
                        var scriptFolder = scriptFile.parent;
                        var targetFolder = new Folder(scriptFolder + "/Target");
                        
                        var blueprintName = selectedBlueprint2.name.replace(/\.[^.]+$/, '');
                        
                        // Place Target PatCol #2 at (2,3)
                        var targetFileName = blueprintName + "_PatCol.eps";
                        var targetFile = new File(targetFolder + "/" + targetFileName);
                        
                        if (targetFile.exists) {
                            if (placedTarget2PatCol) {
                                placedTarget2PatCol.remove();
                            }
                            
                            placedTarget2PatCol = currentDoc.placedItems.add();
                            placedTarget2PatCol.file = targetFile;
                            placedTarget2PatCol.top = row2Y;
                            placedTarget2PatCol.left = col3X;
                            
                            var scalingResult = resizeWithAspectRatio(placedTarget2PatCol, cellWidth, cellHeight);
                            
                            var itemBounds = placedTarget2PatCol.geometricBounds;
                            var itemWidth = itemBounds[2] - itemBounds[0];
                            var itemHeight = itemBounds[1] - itemBounds[3];
                            var centerOffsetX = (cellWidth - itemWidth) / 2;
                            var centerOffsetY = (cellHeight - itemHeight) / 2;
                            placedTarget2PatCol.left = col3X + centerOffsetX;
                            placedTarget2PatCol.top = row2Y - centerOffsetY;
                            
                            ensureItemVisible(placedTarget2PatCol, "Target PatCol #2");
                        }
                        
                        // Place Target PatBlk #2 at (3,3)
                        var targetBlkFileName = blueprintName + "_PatBlk.eps";
                        var targetBlkFile = new File(targetFolder + "/" + targetBlkFileName);
                        
                        if (targetBlkFile.exists) {
                            if (placedTarget2PatBlk) {
                                placedTarget2PatBlk.remove();
                            }
                            
                            placedTarget2PatBlk = currentDoc.placedItems.add();
                            placedTarget2PatBlk.file = targetBlkFile;
                            placedTarget2PatBlk.top = row3Y;
                            placedTarget2PatBlk.left = col3X;
                            
                            var scalingResult = resizeWithAspectRatio(placedTarget2PatBlk, cellWidth, cellHeight);
                            
                            var itemBounds = placedTarget2PatBlk.geometricBounds;
                            var itemWidth = itemBounds[2] - itemBounds[0];
                            var itemHeight = itemBounds[1] - itemBounds[3];
                            var centerOffsetX = (cellWidth - itemWidth) / 2;
                            var centerOffsetY = (cellHeight - itemHeight) / 2;
                            placedTarget2PatBlk.left = col3X + centerOffsetX;
                            placedTarget2PatBlk.top = row3Y - centerOffsetY;
                            
                            ensureItemVisible(placedTarget2PatBlk, "Target PatBlk #2");
                        }
                        
                    } catch (targetError) {
                        logToFile("TARGET_ERROR", "Error placing target files #2: " + targetError.toString());
                    }
                }
            }
            
            app.redraw();
            statusText.text = "[OK] 2d BluePrint #2 placed at (1,3)";
            
        } catch (e) {
            logToFile("ERROR", "Failed to place 2d BluePrint #2: " + e.toString());
            statusText.text = "[ERROR] Failed to place 2d BluePrint #2";
        }
    }
};

// 2d BluePrint #3 button click handler
blueprint3Button.onClick = function() {
    logToFile("BUTTON_CLICK", "2d BluePrint #3 button clicked");
    var selectedFile = File.openDialog("Select 2d BluePrint #3 file", "*.eps");
    if (selectedFile != null) {
        selectedBlueprint3 = selectedFile;
        blueprint3Text.text = selectedFile.name;
        logToFile("FILE_SELECTED", "2d BluePrint #3: " + selectedFile.fsName);
        updateSynthesizedNames3();
        
        // Place 2d BluePrint #3 image at row 1, col 4
        try {
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous 2d BluePrint #3 if exists
            if (placedBlueprint3) {
                placedBlueprint3.remove();
                logToFile("IMAGE_REMOVED", "Previous 2d BluePrint #3 removed");
            }
            
            // Place new 2d BluePrint #3
            placedBlueprint3 = currentDoc.placedItems.add();
            placedBlueprint3.file = selectedFile;
            
            // Position and scale
            placedBlueprint3.top = row1Y;
            placedBlueprint3.left = col4X;
            
            var scalingResult = resizeWithAspectRatio(placedBlueprint3, cellWidth, cellHeight);
            logToFile("IMAGE_PLACED", "2d BluePrint #3 placed at (1,4) and scaled to " + scalingResult.scale + "%");
            
            // Center in cell
            var itemBounds = placedBlueprint3.geometricBounds;
            var itemWidth = itemBounds[2] - itemBounds[0];
            var itemHeight = itemBounds[1] - itemBounds[3];
            var centerOffsetX = (cellWidth - itemWidth) / 2;
            var centerOffsetY = (cellHeight - itemHeight) / 2;
            placedBlueprint3.left = col4X + centerOffsetX;
            placedBlueprint3.top = row1Y - centerOffsetY;
            
            ensureItemVisible(placedBlueprint3, "2d BluePrint #3");
            
            // Execute MSP if PatCol and PatBlk are selected
            if (selectedPatCol && selectedPatBlk) {
                if (executeMasking(selectedPatCol, selectedPatBlk, selectedBlueprint3, 3)) {
                    // Place Target files for BluePrint #3
                    try {
                        var scriptFile = new File($.fileName);
                        var scriptFolder = scriptFile.parent;
                        var targetFolder = new Folder(scriptFolder + "/Target");
                        
                        var blueprintName = selectedBlueprint3.name.replace(/\.[^.]+$/, '');
                        
                        // Place Target PatCol #3 at (2,4)
                        var targetFileName = blueprintName + "_PatCol.eps";
                        var targetFile = new File(targetFolder + "/" + targetFileName);
                        
                        if (targetFile.exists) {
                            if (placedTarget3PatCol) {
                                placedTarget3PatCol.remove();
                            }
                            
                            placedTarget3PatCol = currentDoc.placedItems.add();
                            placedTarget3PatCol.file = targetFile;
                            placedTarget3PatCol.top = row2Y;
                            placedTarget3PatCol.left = col4X;
                            
                            var scalingResult = resizeWithAspectRatio(placedTarget3PatCol, cellWidth, cellHeight);
                            
                            var itemBounds = placedTarget3PatCol.geometricBounds;
                            var itemWidth = itemBounds[2] - itemBounds[0];
                            var itemHeight = itemBounds[1] - itemBounds[3];
                            var centerOffsetX = (cellWidth - itemWidth) / 2;
                            var centerOffsetY = (cellHeight - itemHeight) / 2;
                            placedTarget3PatCol.left = col4X + centerOffsetX;
                            placedTarget3PatCol.top = row2Y - centerOffsetY;
                            
                            ensureItemVisible(placedTarget3PatCol, "Target PatCol #3");
                        }
                        
                        // Place Target PatBlk #3 at (3,4)
                        var targetBlkFileName = blueprintName + "_PatBlk.eps";
                        var targetBlkFile = new File(targetFolder + "/" + targetBlkFileName);
                        
                        if (targetBlkFile.exists) {
                            if (placedTarget3PatBlk) {
                                placedTarget3PatBlk.remove();
                            }
                            
                            placedTarget3PatBlk = currentDoc.placedItems.add();
                            placedTarget3PatBlk.file = targetBlkFile;
                            placedTarget3PatBlk.top = row3Y;
                            placedTarget3PatBlk.left = col4X;
                            
                            var scalingResult = resizeWithAspectRatio(placedTarget3PatBlk, cellWidth, cellHeight);
                            
                            var itemBounds = placedTarget3PatBlk.geometricBounds;
                            var itemWidth = itemBounds[2] - itemBounds[0];
                            var itemHeight = itemBounds[1] - itemBounds[3];
                            var centerOffsetX = (cellWidth - itemWidth) / 2;
                            var centerOffsetY = (cellHeight - itemHeight) / 2;
                            placedTarget3PatBlk.left = col4X + centerOffsetX;
                            placedTarget3PatBlk.top = row3Y - centerOffsetY;
                            
                            ensureItemVisible(placedTarget3PatBlk, "Target PatBlk #3");
                        }
                        
                    } catch (targetError) {
                        logToFile("TARGET_ERROR", "Error placing target files #3: " + targetError.toString());
                    }
                }
            }
            
            app.redraw();
            statusText.text = "[OK] 2d BluePrint #3 placed at (1,4)";
            
        } catch (e) {
            logToFile("ERROR", "Failed to place 2d BluePrint #3: " + e.toString());
            statusText.text = "[ERROR] Failed to place 2d BluePrint #3";
        }
    }
};

// View Document button
viewDocButton.onClick = function() {
    logToFile("BUTTON_CLICK", "View Document button clicked");
    try {
        app.activeDocument = currentDoc;
        app.redraw();
        app.executeMenuCommand('fitall');
        statusText.text = "Viewing document...";
    } catch (e) {
        statusText.text = "[ERROR] Cannot view document: " + e.toString();
    }
};

// OK button
okButton.onClick = function() {
    logToFile("BUTTON_CLICK", "OK button clicked");
    logToFile("DIALOG_CLOSED", "User clicked OK");
    dialog.close();
};

// Cancel button
cancelButton.onClick = function() {
    logToFile("BUTTON_CLICK", "Cancel button clicked");
    logToFile("DIALOG_CLOSED", "User clicked Cancel");
    dialog.close();
};

// === SHOW DIALOG ===
logToFile("DIALOG_SHOW", "Showing dialog to user");
dialog.show();

logToFile("SCRIPT_END", "mskPat3_advanced.jsx completed");