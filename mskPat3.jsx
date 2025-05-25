// cmEpOp7.jsx - Added 2d BluePrint #3 with 4-column grid and Target placement
#target "illustrator"

// Add early logging to catch script startup issues
try {
    var earlyScriptFile = new File($.fileName);
    var earlyScriptFolder = earlyScriptFile.parent;
    var earlyLogFile = new File(earlyScriptFolder + "/logCmd.txt");
    
    earlyLogFile.open("a");
    var timestamp = new Date().toLocaleString();
    earlyLogFile.writeln("[" + timestamp + "] [SCRIPT_INIT] cmEpOp7.jsx starting - early init");
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
var placedBlueprint2 = null; // NEW: 2d BluePrint #2 at (1,3)
var placedBlueprint3 = null; // NEW: 2d BluePrint #3 at (1,4)
var placedTargetPatCol = null; // New variable for Target PatCol
var placedTargetPatBlk = null; // NEW: Target PatBlk at (3,2)
var placedTarget2PatCol = null; // NEW: Target PatCol #2 at (2,3)
var placedTarget2PatBlk = null; // NEW: Target PatBlk #2 at (3,3)
var placedTarget3PatCol = null; // NEW: Target PatCol #3 at (2,4)
var placedTarget3PatBlk = null; // NEW: Target PatBlk #3 at (3,4)
var patColLabel = null;
var patBlkLabel = null;
var blueprintLabel = null;
var blueprint2Label = null; // NEW: 2d BluePrint #2 label
var blueprint3Label = null; // NEW: 2d BluePrint #3 label
var targetPatColLabel = null; // New variable for Target PatCol label
var targetPatBlkLabel = null; // NEW: Target PatBlk label
var target2PatColLabel = null; // NEW: Target PatCol #2 label
var target2PatBlkLabel = null; // NEW: Target PatBlk #2 label
var target3PatColLabel = null; // NEW: Target PatCol #3 label
var target3PatBlkLabel = null; // NEW: Target PatBlk #3 label

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
    // Make sure layer is visible and not locked
    placedItem.layer.visible = true;
    placedItem.layer.locked = false;
    
    // Bring to front
    placedItem.zOrder(ZOrderMethod.BRINGTOFRONT);
    
    // Make sure the item itself is not hidden
    placedItem.hidden = false;
    
    logToFile("VISIBILITY", itemName + " - Layer visible: " + placedItem.layer.visible + ", Item hidden: " + placedItem.hidden);
}

// === DOCUMENT CREATION ===

// Create new document at start
try {
    logToFile("SCRIPT_START", "cmEpOp7.jsx starting - main execution");
    
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
    
    // Calculate grid positions for 3x2 layout
    var artboardBounds = currentDoc.artboards[0].artboardRect;
    var artboardWidth = artboardBounds[2] - artboardBounds[0];
    var artboardHeight = artboardBounds[1] - artboardBounds[3];
    
    var cellWidth = 150;
    var cellHeight = 300;
    var horizontalGap = 100;
    var verticalGap = 50;
    
    var totalWidth = (cellWidth * 4) + (horizontalGap * 3); // NOW 4 COLUMNS
    var totalHeight = (cellHeight * 3) + (verticalGap * 2);
    
    var startX = (artboardWidth - totalWidth) / 2;
    var startY = (artboardHeight - totalHeight) / 2;
    
    // Calculate positions for each grid cell
    var col1X = startX;
    var col2X = startX + cellWidth + horizontalGap;
    var col3X = startX + (cellWidth * 2) + (horizontalGap * 2);
    var col4X = startX + (cellWidth * 3) + (horizontalGap * 3); // NEW COLUMN 4
    
    var row1Y = artboardBounds[1] - startY;
    var row2Y = row1Y - cellHeight - verticalGap;
    var row3Y = row2Y - cellHeight - verticalGap;
    
    logToFile("GRID_CALCULATED", "Grid layout calculated - Cell size: " + cellWidth + "x" + cellHeight);
    logToFile("GRID_POSITIONS", "Col1: " + col1X + ", Col2: " + col2X + ", Col3: " + col3X + ", Col4: " + col4X);
    logToFile("GRID_POSITIONS", "Row1: " + row1Y + ", Row2: " + row2Y + ", Row3: " + row3Y);
    
    // Draw grid guides
    currentDoc.activeLayer = gridLayer;
    for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 4; col++) { // NOW 4 COLUMNS
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
    
    logToFile("GRID_DRAWN", "Grid guides and labels added");
    
    // Lock grid layer and switch back to artwork layer
    gridLayer.locked = true;
    currentDoc.activeLayer = artworkLayer;
    
} catch (e) {
    alert("Error creating document: " + e.toString());
    logToFile("ERROR", "Document creation failed: " + e.toString());
}

// === DIALOG CREATION ===

// Create dialog AFTER document
var dialog = new Window("dialog", "Pattern Selection Interface");
dialog.orientation = "column";
dialog.alignChildren = "fill";

// Add title
var titleText = dialog.add("statictext", undefined, "Select Pattern Files");
titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);

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

// === BUTTON CLICK HANDLERS ===

// PatCol button click handler - NOW WITH IMAGE PLACEMENT
patColButton.onClick = function() {
    logToFile("BUTTON_CLICK", "Pattern Col button clicked");
    var selectedFile = File.openDialog("Select Pattern Col file", "*.eps");
    if (selectedFile != null) {
        selectedPatCol = selectedFile;
        patColText.text = selectedFile.name;
        logToFile("FILE_SELECTED", "Pattern Col: " + selectedFile.fsName);
        
        // NEW: Place Pattern Col image immediately at row 1, col 1
        try {
            // Make sure we're working with the right document and layer
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous PatCol and label if exists
            if (placedPatCol) {
                placedPatCol.remove();
                logToFile("IMAGE_REMOVED", "Previous Pattern Col removed");
            }
            if (patColLabel) {
                patColLabel.remove();
                logToFile("TEXT_REMOVED", "Previous Pattern Col label removed");
            }
            
            // Place the new Pattern Col image
            placedPatCol = currentDoc.placedItems.add();
            placedPatCol.file = selectedPatCol;
            logToFile("IMAGE_PLACED", "Pattern Col placed in document");
            
            // Resize with aspect ratio
            var result = resizeWithAspectRatio(placedPatCol, 150, 300);
            logToFile("IMAGE_RESIZED", "Pattern Col resized: " + result.newWidth.toFixed(1) + " x " + result.newHeight.toFixed(1) + " (scale: " + result.scale.toFixed(1) + "%)");
            
            // Position at row 1, column 1
            placedPatCol.left = col1X;
            placedPatCol.top = row1Y;
            logToFile("IMAGE_POSITIONED", "Pattern Col positioned at (1,1): (" + col1X + ", " + row1Y + ")");
            
            // Ensure visibility
            ensureItemVisible(placedPatCol, "Pattern Col");
            
            // Add text label below the image
            patColLabel = currentDoc.textFrames.add();
            patColLabel.contents = selectedPatCol.name;
            patColLabel.top = placedPatCol.top - placedPatCol.height - 10;
            patColLabel.left = placedPatCol.left;
            patColLabel.textRange.characterAttributes.size = 12;
            logToFile("TEXT_ADDED", "Label added for Pattern Col: " + selectedPatCol.name);
            
            // Force document to update
            app.redraw();
            
            // Zoom to fit artboard in window
            app.executeMenuCommand('fitall');
            
            // Select the placed item to make it visible
            currentDoc.selection = [placedPatCol];
            
            logToFile("DOCUMENT_UPDATED", "Document refreshed and zoomed to fit");
            
            // Update status text to confirm placement
            statusText.text = "[OK] Pattern Col placed at (1,1). Continue selecting files.";
            
        } catch (placeError) {
            alert("Error placing Pattern Col: " + placeError.toString());
            logToFile("PLACE_ERROR", "Error placing Pattern Col: " + placeError.toString());
        }
        
        updateSynthesizedNames();
        updateSynthesizedNames2();
        updateSynthesizedNames3();
    } else {
        logToFile("FILE_SELECTION", "Pattern Col selection cancelled");
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
        
        // NEW: Place Pattern Blk image immediately at row 2, col 1
        try {
            // Make sure we're working with the right document and layer
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous PatBlk and label if exists
            if (placedPatBlk) {
                placedPatBlk.remove();
                logToFile("IMAGE_REMOVED", "Previous Pattern Blk removed");
            }
            if (patBlkLabel) {
                patBlkLabel.remove();
                logToFile("TEXT_REMOVED", "Previous Pattern Blk label removed");
            }
            
            // Place the new Pattern Blk image
            placedPatBlk = currentDoc.placedItems.add();
            placedPatBlk.file = selectedPatBlk;
            logToFile("IMAGE_PLACED", "Pattern Blk placed in document");
            
            // Resize with aspect ratio
            var result = resizeWithAspectRatio(placedPatBlk, 150, 300);
            logToFile("IMAGE_RESIZED", "Pattern Blk resized: " + result.newWidth.toFixed(1) + " x " + result.newHeight.toFixed(1) + " (scale: " + result.scale.toFixed(1) + "%)");
            
            // Position at row 2, column 1
            placedPatBlk.left = col1X;
            placedPatBlk.top = row2Y;
            logToFile("IMAGE_POSITIONED", "Pattern Blk positioned at (2,1): (" + col1X + ", " + row2Y + ")");
            
            // Ensure visibility
            ensureItemVisible(placedPatBlk, "Pattern Blk");
            
            // Add text label below the image
            patBlkLabel = currentDoc.textFrames.add();
            patBlkLabel.contents = selectedPatBlk.name;
            patBlkLabel.top = placedPatBlk.top - placedPatBlk.height - 10;
            patBlkLabel.left = placedPatBlk.left;
            patBlkLabel.textRange.characterAttributes.size = 12;
            logToFile("TEXT_ADDED", "Label added for Pattern Blk: " + selectedPatBlk.name);
            
            // Force document to update
            app.redraw();
            
            // Zoom to fit artboard in window
            app.executeMenuCommand('fitall');
            
            // Select the placed item to make it visible
            currentDoc.selection = [placedPatBlk];
            
            logToFile("DOCUMENT_UPDATED", "Document refreshed and zoomed to fit");
            
            // Update status text to confirm placement
            statusText.text = "[OK] Pattern Blk placed at (2,1). Continue selecting files.";
            
        } catch (placeError) {
            alert("Error placing Pattern Blk: " + placeError.toString());
            logToFile("PLACE_ERROR", "Error placing Pattern Blk: " + placeError.toString());
        }
        
        updateSynthesizedNames();
        updateSynthesizedNames2();
        updateSynthesizedNames3();
    } else {
        logToFile("FILE_SELECTION", "Pattern Blk selection cancelled");
    }
};

// 2d BluePrint button click handler (first instance) - NOW WITH IMAGE PLACEMENT AND TARGET
blueprintButton.onClick = function() {
    logToFile("BUTTON_CLICK", "2d BluePrint button #1 clicked");
    var selectedFile = File.openDialog("Select 2d BluePrint file (must have CL/BL groups)", "*.eps");
    if (selectedFile != null) {
        selectedBlueprint = selectedFile;
        blueprintText.text = selectedFile.name;
        logToFile("FILE_SELECTED", "2d BluePrint #1: " + selectedFile.fsName);
        
        // NEW: Place 2d BluePrint image immediately at row 1, col 2
        try {
            // Make sure we're working with the right document and layer
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous BluePrint and label if exists
            if (placedBlueprint) {
                placedBlueprint.remove();
                logToFile("IMAGE_REMOVED", "Previous 2d BluePrint removed");
            }
            if (blueprintLabel) {
                blueprintLabel.remove();
                logToFile("TEXT_REMOVED", "Previous 2d BluePrint label removed");
            }
            
            // Place the new 2d BluePrint image
            placedBlueprint = currentDoc.placedItems.add();
            placedBlueprint.file = selectedBlueprint;
            logToFile("IMAGE_PLACED", "2d BluePrint placed in document");
            
            // Resize with aspect ratio
            var result = resizeWithAspectRatio(placedBlueprint, 150, 300);
            logToFile("IMAGE_RESIZED", "2d BluePrint resized: " + result.newWidth.toFixed(1) + " x " + result.newHeight.toFixed(1) + " (scale: " + result.scale.toFixed(1) + "%)");
            
            // Position at row 1, column 2
            placedBlueprint.left = col2X;
            placedBlueprint.top = row1Y;
            logToFile("IMAGE_POSITIONED", "2d BluePrint positioned at (1,2): (" + col2X + ", " + row1Y + ")");
            
            // Ensure visibility
            ensureItemVisible(placedBlueprint, "2d BluePrint");
            
            // Add text label below the image
            blueprintLabel = currentDoc.textFrames.add();
            blueprintLabel.contents = selectedBlueprint.name;
            blueprintLabel.top = placedBlueprint.top - placedBlueprint.height - 10;
            blueprintLabel.left = placedBlueprint.left;
            blueprintLabel.textRange.characterAttributes.size = 12;
            logToFile("TEXT_ADDED", "Label added for 2d BluePrint: " + selectedBlueprint.name);
            
            // Force document to update
            app.redraw();
            
            // Zoom to fit artboard in window
            app.executeMenuCommand('fitall');
            
            // Select the placed item to make it visible
            currentDoc.selection = [placedBlueprint];
            
            logToFile("DOCUMENT_UPDATED", "Document refreshed and zoomed to fit");
            
            // Update status text to confirm placement
            statusText.text = "[OK] 2d BluePrint placed at (1,2). Generating masked files...";
            
            // NEW: Execute MSP1.jsx if PatCol and PatBlk are selected
            if (selectedPatCol && selectedPatBlk) {
                logToFile("MSP_START", "Starting MSP1.jsx execution");
                try {
                    // Set global parameters for MSP1
                    $.global.MSP_patColPath = selectedPatCol.fsName;
                    $.global.MSP_patBlkPath = selectedPatBlk.fsName;
                    $.global.MSP_maskPath = selectedBlueprint.fsName;
                    
                    // Clear previous results
                    $.global.MSP_success = false;
                    $.global.MSP_outputPaths = [];
                    $.global.MSP_errorMessage = "";
                    
                    logToFile("MSP_PARAMS", "PatCol: " + selectedPatCol.fsName);
                    logToFile("MSP_PARAMS", "PatBlk: " + selectedPatBlk.fsName);
                    logToFile("MSP_PARAMS", "Mask: " + selectedBlueprint.fsName);
                    
                    // Execute MSP1.jsx synchronously
                    var scriptFile = new File($.fileName);
                    var scriptFolder = scriptFile.parent;
                    var mspScript = new File(scriptFolder + "/MSP1.jsx");
                    
                    if (mspScript.exists) {
                        $.evalFile(mspScript);
                        
                        // Check results
                        if ($.global.MSP_success) {
                            logToFile("MSP_SUCCESS", "MSP1.jsx completed successfully");
                            logToFile("MSP_OUTPUT", "Created " + $.global.MSP_outputPaths.length + " files");
                            statusText.text = "[OK] Masked files generated. Placing images...";
                        } else {
                            logToFile("MSP_FAILED", "MSP1.jsx failed: " + $.global.MSP_errorMessage);
                            statusText.text = "[ERROR] Masking failed: " + $.global.MSP_errorMessage;
                        }
                    } else {
                        logToFile("MSP_ERROR", "MSP1.jsx not found in: " + scriptFolder.fsName);
                        statusText.text = "[ERROR] MSP1.jsx not found";
                    }
                    
                } catch (mspError) {
                    logToFile("MSP_ERROR", "Error executing MSP1.jsx: " + mspError.toString());
                    statusText.text = "[ERROR] " + mspError.toString();
                }
            } else {
                logToFile("MSP_SKIP", "Skipping MSP1 - PatCol or PatBlk not selected");
                statusText.text = "[INFO] Select PatCol and PatBlk to generate masked files";
            }
            
            // Try to place synthesized Target PatCol at (2,2)
            logToFile("TARGET_START", "Starting Target PatCol placement");
            try {
                // Get script folder path
                var scriptFile = new File($.fileName);
                var scriptFolder = scriptFile.parent;
                
                // Construct the target file path - FIXED REGEX
                var blueprintName = selectedBlueprint.name.replace(/\.[^.]+$/, '');
                var targetFileName = blueprintName + "_PatCol.eps";
                var targetFolder = new Folder(scriptFolder + "/Target");
                var targetFile = new File(targetFolder + "/" + targetFileName);
                
                logToFile("TARGET_PATH", "Script folder: " + scriptFolder.fsName);
                logToFile("TARGET_PATH", "Target folder: " + targetFolder.fsName);
                logToFile("TARGET_PATH", "Looking for: " + targetFile.fsName);
                logToFile("TARGET_EXISTS", "Target folder exists: " + targetFolder.exists);
                logToFile("TARGET_EXISTS", "Target file exists: " + targetFile.exists);
                
                if (targetFile.exists) {
                    logToFile("TARGET_FOUND", "Target file found: " + targetFileName);
                    
                    // Remove previous Target PatCol if exists
                    if (placedTargetPatCol) {
                        placedTargetPatCol.remove();
                        logToFile("IMAGE_REMOVED", "Previous Target PatCol removed");
                    }
                    if (targetPatColLabel) {
                        targetPatColLabel.remove();
                        logToFile("TEXT_REMOVED", "Previous Target PatCol label removed");
                    }
                    
                    // Place the Target PatCol image
                    placedTargetPatCol = currentDoc.placedItems.add();
                    placedTargetPatCol.file = targetFile;
                    logToFile("IMAGE_PLACED", "Target PatCol placed: " + targetFileName);
                    
                    // Resize with aspect ratio
                    var targetResult = resizeWithAspectRatio(placedTargetPatCol, 150, 300);
                    logToFile("IMAGE_RESIZED", "Target PatCol resized: " + targetResult.newWidth.toFixed(1) + " x " + targetResult.newHeight.toFixed(1) + " (scale: " + targetResult.scale.toFixed(1) + "%)");
                    
                    // Position at row 2, column 2
                    placedTargetPatCol.left = col2X;
                    placedTargetPatCol.top = row2Y;
                    logToFile("IMAGE_POSITIONED", "Target PatCol positioned at (2,2): (" + col2X + ", " + row2Y + ")");
                    
                    // Ensure visibility
                    ensureItemVisible(placedTargetPatCol, "Target PatCol");
                    
                    // Add text label
                    targetPatColLabel = currentDoc.textFrames.add();
                    targetPatColLabel.contents = targetFileName;
                    targetPatColLabel.top = placedTargetPatCol.top - placedTargetPatCol.height - 10;
                    targetPatColLabel.left = placedTargetPatCol.left;
                    targetPatColLabel.textRange.characterAttributes.size = 12;
                    logToFile("TEXT_ADDED", "Label added for Target PatCol: " + targetFileName);
                    
                    // Force another update
                    app.redraw();
                    
                    // Update status
                    statusText.text = "[OK] BluePrint at (1,2) + Target PatCol at (2,2)";
                    logToFile("TARGET_SUCCESS", "Target PatCol placed successfully");
                    
                    // NEW: Try to place Target PatBlk at (3,2)
                    logToFile("TARGET_BLK_START", "Starting Target PatBlk placement");
                    try {
                        var targetBlkFileName = blueprintName + "_PatBlk.eps";
                        var targetBlkFile = new File(targetFolder + "/" + targetBlkFileName);
                        
                        logToFile("TARGET_BLK_PATH", "Looking for: " + targetBlkFile.fsName);
                        logToFile("TARGET_BLK_EXISTS", "Target PatBlk file exists: " + targetBlkFile.exists);
                        
                        if (targetBlkFile.exists) {
                            logToFile("TARGET_BLK_FOUND", "Target PatBlk file found: " + targetBlkFileName);
                            
                            // Remove previous Target PatBlk if exists
                            if (placedTargetPatBlk) {
                                placedTargetPatBlk.remove();
                                logToFile("IMAGE_REMOVED", "Previous Target PatBlk removed");
                            }
                            if (targetPatBlkLabel) {
                                targetPatBlkLabel.remove();
                                logToFile("TEXT_REMOVED", "Previous Target PatBlk label removed");
                            }
                            
                            // Place the Target PatBlk image
                            placedTargetPatBlk = currentDoc.placedItems.add();
                            placedTargetPatBlk.file = targetBlkFile;
                            logToFile("IMAGE_PLACED", "Target PatBlk placed: " + targetBlkFileName);
                            
                            // Resize with aspect ratio
                            var targetBlkResult = resizeWithAspectRatio(placedTargetPatBlk, 150, 300);
                            logToFile("IMAGE_RESIZED", "Target PatBlk resized: " + targetBlkResult.newWidth.toFixed(1) + " x " + targetBlkResult.newHeight.toFixed(1) + " (scale: " + targetBlkResult.scale.toFixed(1) + "%)");
                            
                            // Position at row 3, column 2
                            placedTargetPatBlk.left = col2X;
                            placedTargetPatBlk.top = row3Y;
                            logToFile("IMAGE_POSITIONED", "Target PatBlk positioned at (3,2): (" + col2X + ", " + row3Y + ")");
                            
                            // Ensure visibility
                            ensureItemVisible(placedTargetPatBlk, "Target PatBlk");
                            
                            // Add text label
                            targetPatBlkLabel = currentDoc.textFrames.add();
                            targetPatBlkLabel.contents = targetBlkFileName;
                            targetPatBlkLabel.top = placedTargetPatBlk.top - placedTargetPatBlk.height - 10;
                            targetPatBlkLabel.left = placedTargetPatBlk.left;
                            targetPatBlkLabel.textRange.characterAttributes.size = 12;
                            logToFile("TEXT_ADDED", "Label added for Target PatBlk: " + targetBlkFileName);
                            
                            // Force another update
                            app.redraw();
                            
                            // Update status
                            statusText.text = "[OK] BluePrint + Target PatCol + Target PatBlk";
                            logToFile("TARGET_BLK_SUCCESS", "Target PatBlk placed successfully");
                            
                        } else {
                            logToFile("TARGET_BLK_NOT_FOUND", "Target PatBlk file does not exist: " + targetBlkFile.fsName);
                        }
                        
                    } catch (targetBlkError) {
                        logToFile("TARGET_BLK_ERROR", "Error placing Target PatBlk: " + targetBlkError.toString());
                    }
                    
                } else {
                    logToFile("TARGET_NOT_FOUND", "Target file does not exist: " + targetFile.fsName);
                    statusText.text = "[OK] BluePrint at (1,2). Target not found: " + targetFileName;
                }
                
            } catch (targetError) {
                logToFile("TARGET_ERROR", "Error placing Target PatCol: " + targetError.toString());
                alert("Error placing Target PatCol: " + targetError.toString());
            }
            
        } catch (placeError) {
            alert("Error placing 2d BluePrint: " + placeError.toString());
            logToFile("PLACE_ERROR", "Error placing 2d BluePrint: " + placeError.toString());
        }
        
        updateSynthesizedNames();
        updateSynthesizedNames2();
        updateSynthesizedNames3();
    } else {
        logToFile("FILE_SELECTION", "2d BluePrint selection cancelled");
    }
};

// 2d BluePrint #2 button click handler - NOW WITH IMAGE PLACEMENT AND TARGET
blueprint2Button.onClick = function() {
    logToFile("BUTTON_CLICK", "2d BluePrint button #2 clicked");
    var selectedFile = File.openDialog("Select 2d BluePrint #2 file (must have CL/BL groups)", "*.eps");
    if (selectedFile != null) {
        selectedBlueprint2 = selectedFile;
        blueprint2Text.text = selectedFile.name;
        logToFile("FILE_SELECTED", "2d BluePrint #2: " + selectedFile.fsName);
        
        // NEW: Place 2d BluePrint #2 image immediately at row 1, col 3
        try {
            // Make sure we're working with the right document and layer
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous BluePrint #2 and label if exists
            if (placedBlueprint2) {
                placedBlueprint2.remove();
                logToFile("IMAGE_REMOVED", "Previous 2d BluePrint #2 removed");
            }
            if (blueprint2Label) {
                blueprint2Label.remove();
                logToFile("TEXT_REMOVED", "Previous 2d BluePrint #2 label removed");
            }
            
            // Place the new 2d BluePrint #2 image
            placedBlueprint2 = currentDoc.placedItems.add();
            placedBlueprint2.file = selectedBlueprint2;
            logToFile("IMAGE_PLACED", "2d BluePrint #2 placed in document");
            
            // Resize with aspect ratio
            var result = resizeWithAspectRatio(placedBlueprint2, 150, 300);
            logToFile("IMAGE_RESIZED", "2d BluePrint #2 resized: " + result.newWidth.toFixed(1) + " x " + result.newHeight.toFixed(1) + " (scale: " + result.scale.toFixed(1) + "%)");
            
            // Position at row 1, column 3
            placedBlueprint2.left = col3X;
            placedBlueprint2.top = row1Y;
            logToFile("IMAGE_POSITIONED", "2d BluePrint #2 positioned at (1,3): (" + col3X + ", " + row1Y + ")");
            
            // Ensure visibility
            ensureItemVisible(placedBlueprint2, "2d BluePrint #2");
            
            // Add text label below the image
            blueprint2Label = currentDoc.textFrames.add();
            blueprint2Label.contents = selectedBlueprint2.name;
            blueprint2Label.top = placedBlueprint2.top - placedBlueprint2.height - 10;
            blueprint2Label.left = placedBlueprint2.left;
            blueprint2Label.textRange.characterAttributes.size = 12;
            logToFile("TEXT_ADDED", "Label added for 2d BluePrint #2: " + selectedBlueprint2.name);
            
            // Force document to update
            app.redraw();
            
            // Zoom to fit artboard in window
            app.executeMenuCommand('fitall');
            
            // Select the placed item to make it visible
            currentDoc.selection = [placedBlueprint2];
            
            logToFile("DOCUMENT_UPDATED", "Document refreshed and zoomed to fit");
            
            // Update status text to confirm placement
            statusText.text = "[OK] 2d BluePrint #2 placed at (1,3). Generating masked files...";
            
            // NEW: Execute MSP1.jsx if PatCol and PatBlk are selected
            if (selectedPatCol && selectedPatBlk) {
                logToFile("MSP2_START", "Starting MSP1.jsx execution for BluePrint #2");
                try {
                    // Set global parameters for MSP1
                    $.global.MSP_patColPath = selectedPatCol.fsName;
                    $.global.MSP_patBlkPath = selectedPatBlk.fsName;
                    $.global.MSP_maskPath = selectedBlueprint2.fsName;
                    
                    // Clear previous results
                    $.global.MSP_success = false;
                    $.global.MSP_outputPaths = [];
                    $.global.MSP_errorMessage = "";
                    
                    logToFile("MSP2_PARAMS", "PatCol: " + selectedPatCol.fsName);
                    logToFile("MSP2_PARAMS", "PatBlk: " + selectedPatBlk.fsName);
                    logToFile("MSP2_PARAMS", "Mask: " + selectedBlueprint2.fsName);
                    
                    // Execute MSP1.jsx synchronously
                    var scriptFile = new File($.fileName);
                    var scriptFolder = scriptFile.parent;
                    var mspScript = new File(scriptFolder + "/MSP1.jsx");
                    
                    if (mspScript.exists) {
                        $.evalFile(mspScript);
                        
                        // Check results
                        if ($.global.MSP_success) {
                            logToFile("MSP2_SUCCESS", "MSP1.jsx completed successfully for BluePrint #2");
                            logToFile("MSP2_OUTPUT", "Created " + $.global.MSP_outputPaths.length + " files");
                            statusText.text = "[OK] Masked files generated. Placing images...";
                        } else {
                            logToFile("MSP2_FAILED", "MSP1.jsx failed: " + $.global.MSP_errorMessage);
                            statusText.text = "[ERROR] Masking failed: " + $.global.MSP_errorMessage;
                        }
                    } else {
                        logToFile("MSP2_ERROR", "MSP1.jsx not found in: " + scriptFolder.fsName);
                        statusText.text = "[ERROR] MSP1.jsx not found";
                    }
                    
                } catch (mspError) {
                    logToFile("MSP2_ERROR", "Error executing MSP1.jsx: " + mspError.toString());
                    statusText.text = "[ERROR] " + mspError.toString();
                }
            } else {
                logToFile("MSP2_SKIP", "Skipping MSP1 - PatCol or PatBlk not selected");
                statusText.text = "[INFO] Select PatCol and PatBlk to generate masked files";
            }
            
            // Try to place synthesized Target files at (2,3) and (3,3)
            logToFile("TARGET2_START", "Starting Target #2 placement");
            try {
                // Get script folder path
                var scriptFile = new File($.fileName);
                var scriptFolder = scriptFile.parent;
                
                // Construct the target file paths
                var blueprint2Name = selectedBlueprint2.name.replace(/\.[^.]+$/, '');
                var target2PatColFileName = blueprint2Name + "_PatCol.eps";
                var target2PatBlkFileName = blueprint2Name + "_PatBlk.eps";
                var targetFolder = new Folder(scriptFolder + "/Target");
                var target2PatColFile = new File(targetFolder + "/" + target2PatColFileName);
                var target2PatBlkFile = new File(targetFolder + "/" + target2PatBlkFileName);
                
                logToFile("TARGET2_PATH", "Looking for PatCol: " + target2PatColFile.fsName);
                logToFile("TARGET2_PATH", "Looking for PatBlk: " + target2PatBlkFile.fsName);
                
                // Place Target PatCol #2 at (2,3)
                if (target2PatColFile.exists) {
                    logToFile("TARGET2_PATCOL_FOUND", "Target PatCol #2 file found: " + target2PatColFileName);
                    
                    // Remove previous Target PatCol #2 if exists
                    if (placedTarget2PatCol) {
                        placedTarget2PatCol.remove();
                        logToFile("IMAGE_REMOVED", "Previous Target PatCol #2 removed");
                    }
                    if (target2PatColLabel) {
                        target2PatColLabel.remove();
                        logToFile("TEXT_REMOVED", "Previous Target PatCol #2 label removed");
                    }
                    
                    // Place the Target PatCol #2 image
                    placedTarget2PatCol = currentDoc.placedItems.add();
                    placedTarget2PatCol.file = target2PatColFile;
                    logToFile("IMAGE_PLACED", "Target PatCol #2 placed: " + target2PatColFileName);
                    
                    // Resize with aspect ratio
                    var target2PatColResult = resizeWithAspectRatio(placedTarget2PatCol, 150, 300);
                    logToFile("IMAGE_RESIZED", "Target PatCol #2 resized: " + target2PatColResult.newWidth.toFixed(1) + " x " + target2PatColResult.newHeight.toFixed(1) + " (scale: " + target2PatColResult.scale.toFixed(1) + "%)");
                    
                    // Position at row 2, column 3
                    placedTarget2PatCol.left = col3X;
                    placedTarget2PatCol.top = row2Y;
                    logToFile("IMAGE_POSITIONED", "Target PatCol #2 positioned at (2,3): (" + col3X + ", " + row2Y + ")");
                    
                    // Ensure visibility
                    ensureItemVisible(placedTarget2PatCol, "Target PatCol #2");
                    
                    // Add text label
                    target2PatColLabel = currentDoc.textFrames.add();
                    target2PatColLabel.contents = target2PatColFileName;
                    target2PatColLabel.top = placedTarget2PatCol.top - placedTarget2PatCol.height - 10;
                    target2PatColLabel.left = placedTarget2PatCol.left;
                    target2PatColLabel.textRange.characterAttributes.size = 12;
                    logToFile("TEXT_ADDED", "Label added for Target PatCol #2: " + target2PatColFileName);
                    
                    logToFile("TARGET2_PATCOL_SUCCESS", "Target PatCol #2 placed successfully");
                } else {
                    logToFile("TARGET2_PATCOL_NOT_FOUND", "Target PatCol #2 file does not exist: " + target2PatColFile.fsName);
                }
                
                // Place Target PatBlk #2 at (3,3)
                if (target2PatBlkFile.exists) {
                    logToFile("TARGET2_PATBLK_FOUND", "Target PatBlk #2 file found: " + target2PatBlkFileName);
                    
                    // Remove previous Target PatBlk #2 if exists
                    if (placedTarget2PatBlk) {
                        placedTarget2PatBlk.remove();
                        logToFile("IMAGE_REMOVED", "Previous Target PatBlk #2 removed");
                    }
                    if (target2PatBlkLabel) {
                        target2PatBlkLabel.remove();
                        logToFile("TEXT_REMOVED", "Previous Target PatBlk #2 label removed");
                    }
                    
                    // Place the Target PatBlk #2 image
                    placedTarget2PatBlk = currentDoc.placedItems.add();
                    placedTarget2PatBlk.file = target2PatBlkFile;
                    logToFile("IMAGE_PLACED", "Target PatBlk #2 placed: " + target2PatBlkFileName);
                    
                    // Resize with aspect ratio
                    var target2PatBlkResult = resizeWithAspectRatio(placedTarget2PatBlk, 150, 300);
                    logToFile("IMAGE_RESIZED", "Target PatBlk #2 resized: " + target2PatBlkResult.newWidth.toFixed(1) + " x " + target2PatBlkResult.newHeight.toFixed(1) + " (scale: " + target2PatBlkResult.scale.toFixed(1) + "%)");
                    
                    // Position at row 3, column 3
                    placedTarget2PatBlk.left = col3X;
                    placedTarget2PatBlk.top = row3Y;
                    logToFile("IMAGE_POSITIONED", "Target PatBlk #2 positioned at (3,3): (" + col3X + ", " + row3Y + ")");
                    
                    // Ensure visibility
                    ensureItemVisible(placedTarget2PatBlk, "Target PatBlk #2");
                    
                    // Add text label
                    target2PatBlkLabel = currentDoc.textFrames.add();
                    target2PatBlkLabel.contents = target2PatBlkFileName;
                    target2PatBlkLabel.top = placedTarget2PatBlk.top - placedTarget2PatBlk.height - 10;
                    target2PatBlkLabel.left = placedTarget2PatBlk.left;
                    target2PatBlkLabel.textRange.characterAttributes.size = 12;
                    logToFile("TEXT_ADDED", "Label added for Target PatBlk #2: " + target2PatBlkFileName);
                    
                    logToFile("TARGET2_PATBLK_SUCCESS", "Target PatBlk #2 placed successfully");
                } else {
                    logToFile("TARGET2_PATBLK_NOT_FOUND", "Target PatBlk #2 file does not exist: " + target2PatBlkFile.fsName);
                }
                
                // Force final update
                app.redraw();
                
                // Update status based on what was placed
                var placedCount = 0;
                if (target2PatColFile.exists) placedCount++;
                if (target2PatBlkFile.exists) placedCount++;
                
                if (placedCount === 2) {
                    statusText.text = "[OK] BluePrint #2 + Target PatCol #2 + Target PatBlk #2";
                } else if (placedCount === 1) {
                    statusText.text = "[OK] BluePrint #2 + " + placedCount + " target file";
                } else {
                    statusText.text = "[OK] BluePrint #2 at (1,3). No target files found.";
                }
                
            } catch (target2Error) {
                logToFile("TARGET2_ERROR", "Error placing Target #2 files: " + target2Error.toString());
                alert("Error placing Target #2 files: " + target2Error.toString());
            }
            
        } catch (placeError) {
            alert("Error placing 2d BluePrint #2: " + placeError.toString());
            logToFile("PLACE_ERROR", "Error placing 2d BluePrint #2: " + placeError.toString());
        }
        
        updateSynthesizedNames2();
    } else {
        logToFile("FILE_SELECTION", "2d BluePrint #2 selection cancelled");
    }
};

// 2d BluePrint #3 button click handler - NOW WITH IMAGE PLACEMENT AND TARGET
blueprint3Button.onClick = function() {
    logToFile("BUTTON_CLICK", "2d BluePrint button #3 clicked");
    var selectedFile = File.openDialog("Select 2d BluePrint #3 file (must have CL/BL groups)", "*.eps");
    if (selectedFile != null) {
        selectedBlueprint3 = selectedFile;
        blueprint3Text.text = selectedFile.name;
        logToFile("FILE_SELECTED", "2d BluePrint #3: " + selectedFile.fsName);
        
        // NEW: Place 2d BluePrint #3 image immediately at row 1, col 4
        try {
            // Make sure we're working with the right document and layer
            app.activeDocument = currentDoc;
            currentDoc.activeLayer = artworkLayer;
            
            // Remove previous BluePrint #3 and label if exists
            if (placedBlueprint3) {
                placedBlueprint3.remove();
                logToFile("IMAGE_REMOVED", "Previous 2d BluePrint #3 removed");
            }
            if (blueprint3Label) {
                blueprint3Label.remove();
                logToFile("TEXT_REMOVED", "Previous 2d BluePrint #3 label removed");
            }
            
            // Place the new 2d BluePrint #3 image
            placedBlueprint3 = currentDoc.placedItems.add();
            placedBlueprint3.file = selectedBlueprint3;
            logToFile("IMAGE_PLACED", "2d BluePrint #3 placed in document");
            
            // Resize with aspect ratio
            var result = resizeWithAspectRatio(placedBlueprint3, 150, 300);
            logToFile("IMAGE_RESIZED", "2d BluePrint #3 resized: " + result.newWidth.toFixed(1) + " x " + result.newHeight.toFixed(1) + " (scale: " + result.scale.toFixed(1) + "%)");
            
            // Position at row 1, column 4
            placedBlueprint3.left = col4X;
            placedBlueprint3.top = row1Y;
            logToFile("IMAGE_POSITIONED", "2d BluePrint #3 positioned at (1,4): (" + col4X + ", " + row1Y + ")");
            
            // Ensure visibility
            ensureItemVisible(placedBlueprint3, "2d BluePrint #3");
            
            // Add text label below the image
            blueprint3Label = currentDoc.textFrames.add();
            blueprint3Label.contents = selectedBlueprint3.name;
            blueprint3Label.top = placedBlueprint3.top - placedBlueprint3.height - 10;
            blueprint3Label.left = placedBlueprint3.left;
            blueprint3Label.textRange.characterAttributes.size = 12;
            logToFile("TEXT_ADDED", "Label added for 2d BluePrint #3: " + selectedBlueprint3.name);
            
            // Force document to update
            app.redraw();
            
            // Zoom to fit artboard in window
            app.executeMenuCommand('fitall');
            
            // Select the placed item to make it visible
            currentDoc.selection = [placedBlueprint3];
            
            logToFile("DOCUMENT_UPDATED", "Document refreshed and zoomed to fit");
            
            // Update status text to confirm placement
            statusText.text = "[OK] 2d BluePrint #3 placed at (1,4). Generating masked files...";
            
            // NEW: Execute MSP1.jsx if PatCol and PatBlk are selected
            if (selectedPatCol && selectedPatBlk) {
                logToFile("MSP3_START", "Starting MSP1.jsx execution for BluePrint #3");
                try {
                    // Set global parameters for MSP1
                    $.global.MSP_patColPath = selectedPatCol.fsName;
                    $.global.MSP_patBlkPath = selectedPatBlk.fsName;
                    $.global.MSP_maskPath = selectedBlueprint3.fsName;
                    
                    // Clear previous results
                    $.global.MSP_success = false;
                    $.global.MSP_outputPaths = [];
                    $.global.MSP_errorMessage = "";
                    
                    logToFile("MSP3_PARAMS", "PatCol: " + selectedPatCol.fsName);
                    logToFile("MSP3_PARAMS", "PatBlk: " + selectedPatBlk.fsName);
                    logToFile("MSP3_PARAMS", "Mask: " + selectedBlueprint3.fsName);
                    
                    // Execute MSP1.jsx synchronously
                    var scriptFile = new File($.fileName);
                    var scriptFolder = scriptFile.parent;
                    var mspScript = new File(scriptFolder + "/MSP1.jsx");
                    
                    if (mspScript.exists) {
                        $.evalFile(mspScript);
                        
                        // Check results
                        if ($.global.MSP_success) {
                            logToFile("MSP3_SUCCESS", "MSP1.jsx completed successfully for BluePrint #3");
                            logToFile("MSP3_OUTPUT", "Created " + $.global.MSP_outputPaths.length + " files");
                            statusText.text = "[OK] Masked files generated. Placing images...";
                        } else {
                            logToFile("MSP3_FAILED", "MSP1.jsx failed: " + $.global.MSP_errorMessage);
                            statusText.text = "[ERROR] Masking failed: " + $.global.MSP_errorMessage;
                        }
                    } else {
                        logToFile("MSP3_ERROR", "MSP1.jsx not found in: " + scriptFolder.fsName);
                        statusText.text = "[ERROR] MSP1.jsx not found";
                    }
                    
                } catch (mspError) {
                    logToFile("MSP3_ERROR", "Error executing MSP1.jsx: " + mspError.toString());
                    statusText.text = "[ERROR] " + mspError.toString();
                }
            } else {
                logToFile("MSP3_SKIP", "Skipping MSP1 - PatCol or PatBlk not selected");
                statusText.text = "[INFO] Select PatCol and PatBlk to generate masked files";
            }
            
            // Try to place synthesized Target files at (2,4) and (3,4)
            logToFile("TARGET3_START", "Starting Target #3 placement");
            try {
                // Get script folder path
                var scriptFile = new File($.fileName);
                var scriptFolder = scriptFile.parent;
                
                // Construct the target file paths
                var blueprint3Name = selectedBlueprint3.name.replace(/\.[^.]+$/, '');
                var target3PatColFileName = blueprint3Name + "_PatCol.eps";
                var target3PatBlkFileName = blueprint3Name + "_PatBlk.eps";
                var targetFolder = new Folder(scriptFolder + "/Target");
                var target3PatColFile = new File(targetFolder + "/" + target3PatColFileName);
                var target3PatBlkFile = new File(targetFolder + "/" + target3PatBlkFileName);
                
                logToFile("TARGET3_PATH", "Looking for PatCol: " + target3PatColFile.fsName);
                logToFile("TARGET3_PATH", "Looking for PatBlk: " + target3PatBlkFile.fsName);
                
                // Place Target PatCol #3 at (2,4)
                if (target3PatColFile.exists) {
                    logToFile("TARGET3_PATCOL_FOUND", "Target PatCol #3 file found: " + target3PatColFileName);
                    
                    // Remove previous Target PatCol #3 if exists
                    if (placedTarget3PatCol) {
                        placedTarget3PatCol.remove();
                        logToFile("IMAGE_REMOVED", "Previous Target PatCol #3 removed");
                    }
                    if (target3PatColLabel) {
                        target3PatColLabel.remove();
                        logToFile("TEXT_REMOVED", "Previous Target PatCol #3 label removed");
                    }
                    
                    // Place the Target PatCol #3 image
                    placedTarget3PatCol = currentDoc.placedItems.add();
                    placedTarget3PatCol.file = target3PatColFile;
                    logToFile("IMAGE_PLACED", "Target PatCol #3 placed: " + target3PatColFileName);
                    
                    // Resize with aspect ratio
                    var target3PatColResult = resizeWithAspectRatio(placedTarget3PatCol, 150, 300);
                    logToFile("IMAGE_RESIZED", "Target PatCol #3 resized: " + target3PatColResult.newWidth.toFixed(1) + " x " + target3PatColResult.newHeight.toFixed(1) + " (scale: " + target3PatColResult.scale.toFixed(1) + "%)");
                    
                    // Position at row 2, column 4
                    placedTarget3PatCol.left = col4X;
                    placedTarget3PatCol.top = row2Y;
                    logToFile("IMAGE_POSITIONED", "Target PatCol #3 positioned at (2,4): (" + col4X + ", " + row2Y + ")");
                    
                    // Ensure visibility
                    ensureItemVisible(placedTarget3PatCol, "Target PatCol #3");
                    
                    // Add text label
                    target3PatColLabel = currentDoc.textFrames.add();
                    target3PatColLabel.contents = target3PatColFileName;
                    target3PatColLabel.top = placedTarget3PatCol.top - placedTarget3PatCol.height - 10;
                    target3PatColLabel.left = placedTarget3PatCol.left;
                    target3PatColLabel.textRange.characterAttributes.size = 12;
                    logToFile("TEXT_ADDED", "Label added for Target PatCol #3: " + target3PatColFileName);
                    
                    logToFile("TARGET3_PATCOL_SUCCESS", "Target PatCol #3 placed successfully");
                } else {
                    logToFile("TARGET3_PATCOL_NOT_FOUND", "Target PatCol #3 file does not exist: " + target3PatColFile.fsName);
                }
                
                // Place Target PatBlk #3 at (3,4)
                if (target3PatBlkFile.exists) {
                    logToFile("TARGET3_PATBLK_FOUND", "Target PatBlk #3 file found: " + target3PatBlkFileName);
                    
                    // Remove previous Target PatBlk #3 if exists
                    if (placedTarget3PatBlk) {
                        placedTarget3PatBlk.remove();
                        logToFile("IMAGE_REMOVED", "Previous Target PatBlk #3 removed");
                    }
                    if (target3PatBlkLabel) {
                        target3PatBlkLabel.remove();
                        logToFile("TEXT_REMOVED", "Previous Target PatBlk #3 label removed");
                    }
                    
                    // Place the Target PatBlk #3 image
                    placedTarget3PatBlk = currentDoc.placedItems.add();
                    placedTarget3PatBlk.file = target3PatBlkFile;
                    logToFile("IMAGE_PLACED", "Target PatBlk #3 placed: " + target3PatBlkFileName);
                    
                    // Resize with aspect ratio
                    var target3PatBlkResult = resizeWithAspectRatio(placedTarget3PatBlk, 150, 300);
                    logToFile("IMAGE_RESIZED", "Target PatBlk #3 resized: " + target3PatBlkResult.newWidth.toFixed(1) + " x " + target3PatBlkResult.newHeight.toFixed(1) + " (scale: " + target3PatBlkResult.scale.toFixed(1) + "%)");
                    
                    // Position at row 3, column 4
                    placedTarget3PatBlk.left = col4X;
                    placedTarget3PatBlk.top = row3Y;
                    logToFile("IMAGE_POSITIONED", "Target PatBlk #3 positioned at (3,4): (" + col4X + ", " + row3Y + ")");
                    
                    // Ensure visibility
                    ensureItemVisible(placedTarget3PatBlk, "Target PatBlk #3");
                    
                    // Add text label
                    target3PatBlkLabel = currentDoc.textFrames.add();
                    target3PatBlkLabel.contents = target3PatBlkFileName;
                    target3PatBlkLabel.top = placedTarget3PatBlk.top - placedTarget3PatBlk.height - 10;
                    target3PatBlkLabel.left = placedTarget3PatBlk.left;
                    target3PatBlkLabel.textRange.characterAttributes.size = 12;
                    logToFile("TEXT_ADDED", "Label added for Target PatBlk #3: " + target3PatBlkFileName);
                    
                    logToFile("TARGET3_PATBLK_SUCCESS", "Target PatBlk #3 placed successfully");
                } else {
                    logToFile("TARGET3_PATBLK_NOT_FOUND", "Target PatBlk #3 file does not exist: " + target3PatBlkFile.fsName);
                }
                
                // Force final update
                app.redraw();
                
                // Update status based on what was placed
                var placedCount = 0;
                if (target3PatColFile.exists) placedCount++;
                if (target3PatBlkFile.exists) placedCount++;
                
                if (placedCount === 2) {
                    statusText.text = "[OK] BluePrint #3 + Target PatCol #3 + Target PatBlk #3";
                } else if (placedCount === 1) {
                    statusText.text = "[OK] BluePrint #3 + " + placedCount + " target file";
                } else {
                    statusText.text = "[OK] BluePrint #3 at (1,4). No target files found.";
                }
                
            } catch (target3Error) {
                logToFile("TARGET3_ERROR", "Error placing Target #3 files: " + target3Error.toString());
                alert("Error placing Target #3 files: " + target3Error.toString());
            }
            
        } catch (placeError) {
            alert("Error placing 2d BluePrint #3: " + placeError.toString());
            logToFile("PLACE_ERROR", "Error placing 2d BluePrint #3: " + placeError.toString());
        }
        
        updateSynthesizedNames3();
    } else {
        logToFile("FILE_SELECTION", "2d BluePrint #3 selection cancelled");
    }
};

// View Document button click handler
viewDocButton.onClick = function() {
    logToFile("BUTTON_CLICK", "View Document button clicked");
    if (currentDoc) {
        app.activeDocument = currentDoc;
        app.executeMenuCommand('fitall');
        logToFile("VIEW_DOCUMENT", "Document brought to front and zoomed to fit");
    }
};

// OK button click handler
okButton.onClick = function() {
    logToFile("BUTTON_CLICK", "OK button clicked");
    logToFile("DIALOG_CLOSE", "Dialog closed with OK");
    logToFile("FINAL_STATUS", "PatCol: " + (selectedPatCol ? selectedPatCol.name : "none"));
    logToFile("FINAL_STATUS", "PatBlk: " + (selectedPatBlk ? selectedPatBlk.name : "none"));
    logToFile("FINAL_STATUS", "BluePrint: " + (selectedBlueprint ? selectedBlueprint.name : "none"));
    logToFile("FINAL_STATUS", "BluePrint2: " + (selectedBlueprint2 ? selectedBlueprint2.name : "none"));
    logToFile("FINAL_STATUS", "BluePrint3: " + (selectedBlueprint3 ? selectedBlueprint3.name : "none"));
    dialog.close();
};

// Cancel button click handler
cancelButton.onClick = function() {
    logToFile("BUTTON_CLICK", "Cancel button clicked");
    logToFile("DIALOG_CLOSE", "Dialog closed with Cancel");
    dialog.close();
};

// Show the dialog
logToFile("DIALOG_SHOW", "Showing dialog");
dialog.show();

logToFile("SCRIPT_END", "cmEpOp7.jsx completed");