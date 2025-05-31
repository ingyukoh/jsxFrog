/*********************************************************
 *  MSP1_pathfinder_flex.jsx - Flexible Pathfinder Masking
 *  Combines flexible mask detection with Pathfinder operations
 *  Most robust approach for cutting vectors at boundaries
 *********************************************************/
#target illustrator

// Global input parameters
if (typeof $.global.MSP_patColPath === 'undefined') $.global.MSP_patColPath = "";
if (typeof $.global.MSP_patBlkPath === 'undefined') $.global.MSP_patBlkPath = "";
if (typeof $.global.MSP_maskPath === 'undefined') $.global.MSP_maskPath = "";

// Global output results
if (typeof $.global.MSP_success === 'undefined') $.global.MSP_success = false;
if (typeof $.global.MSP_outputPaths === 'undefined') $.global.MSP_outputPaths = [];
if (typeof $.global.MSP_errorMessage === 'undefined') $.global.MSP_errorMessage = "";

var MSP_patColPath = $.global.MSP_patColPath;
var MSP_patBlkPath = $.global.MSP_patBlkPath;
var MSP_maskPath = $.global.MSP_maskPath;

(function () {
    var scriptFolder = File($.fileName).path;
    var targetFolder = new Folder(scriptFolder + "/Target");
    if (!targetFolder.exists) {
        targetFolder.create();
    }
    
    var logFile = new File(scriptFolder + "/log.txt");
    logFile.encoding = "UTF8";
    logFile.open("a");
    
    function log(message) {
        var d = new Date();
        var timestamp = d.getFullYear() + "-" + 
                       ("0" + (d.getMonth()+1)).slice(-2) + "-" + 
                       ("0" + d.getDate()).slice(-2) + " " + 
                       ("0" + d.getHours()).slice(-2) + ":" + 
                       ("0" + d.getMinutes()).slice(-2) + ":" + 
                       ("0" + d.getSeconds()).slice(-2);
        var logMessage = "[" + timestamp + "] " + message;
        $.writeln(logMessage);
        logFile.writeln(logMessage);
    }
    
    function ctr(b) { 
        return [(b[0]+b[2])/2, (b[1]+b[3])/2]; 
    }
    
    function unlockDeep(it) {
        try { it.locked = false; it.hidden = false; } catch(e){}
        if (it.pageItems) {
            for (var k = 0; k < it.pageItems.length; k++) {
                unlockDeep(it.pageItems[k]);
            }
        }
    }
    
    // Flexible mask finding - works with any structure
    function findMaskGroups(docMask) {
        log("Flexibly searching for mask groups...");
        
        var allGroups = [];
        
        // Search all layers
        for (var L = 0; L < docMask.layers.length; L++) {
            var layer = docMask.layers[L];
            log("Searching layer " + L + ": " + layer.name);
            
            // Direct groups in layer
            for (var i = 0; i < layer.pageItems.length; i++) {
                if (layer.pageItems[i].typename === "GroupItem") {
                    allGroups.push(layer.pageItems[i]);
                }
            }
        }
        
        log("Found " + allGroups.length + " groups");
        
        // For mask diagnosis results: we found 2 groups
        // Group 0: 397 paths (main mask)
        // Group 1: 1 path (possibly inner cutout)
        
        if (allGroups.length === 0) {
            throw new Error("No groups found in mask document");
        }
        
        // Use the first group as primary mask
        // If there's a second group, it might be for camera cutout
        var primaryMask = allGroups[0];
        var secondaryMask = allGroups.length > 1 ? allGroups[1] : null;
        
        log("Using group with " + primaryMask.pageItems.length + " items as primary mask");
        if (secondaryMask) {
            log("Found secondary mask with " + secondaryMask.pageItems.length + " items");
        }
        
        return {
            primary: primaryMask,
            secondary: secondaryMask
        };
    }
    
    function processMasking(patternPath, maskPath, patternType) {
        try {
            log("Processing " + patternType + " with flexible Pathfinder masking");
            log("Pattern: " + patternPath);
            log("Mask: " + maskPath);
            
            // Open files
            var fileMask = new File(maskPath);
            if (!fileMask.exists) {
                throw new Error("Mask file not found: " + maskPath);
            }
            var docMask = app.open(fileMask);
            
            var filePattern = new File(patternPath);
            if (!filePattern.exists) {
                throw new Error("Pattern file not found: " + patternPath);
            }
            var docPattern = app.open(filePattern);
            
            // Find mask groups flexibly
            app.activeDocument = docMask;
            var maskGroups = findMaskGroups(docMask);
            var primaryMask = maskGroups.primary;
            
            // Get bounds for scaling
            var maskBounds = primaryMask.geometricBounds;
            var maskHeight = maskBounds[1] - maskBounds[3];
            var maskCenterX = (maskBounds[0] + maskBounds[2]) / 2;
            var maskCenterY = (maskBounds[1] + maskBounds[3]) / 2;
            
            // Paste pattern
            app.activeDocument = docPattern;
            log("Extracting pattern...");
            for (var n = 0; n < docPattern.pageItems.length; n++) {
                unlockDeep(docPattern.pageItems[n]);
            }
            app.executeMenuCommand("selectall");
            app.executeMenuCommand("copy");
            
            app.activeDocument = docMask;
            app.executeMenuCommand("paste");
            log("Pattern pasted");
            
            // Group pasted items
            var patGroup;
            if (app.selection.length > 1) {
                patGroup = docMask.groupItems.add();
                for (var s = 0; s < app.selection.length; s++) {
                    app.selection[s].move(patGroup, ElementPlacement.PLACEATEND);
                }
            } else {
                patGroup = app.selection[0];
            }
            
            // Scale pattern
            var patBounds = patGroup.visibleBounds;
            var patHeight = patBounds[1] - patBounds[3];
            var scaleFactor = Math.abs(maskHeight) / Math.abs(patHeight);
            
            log("Scaling by " + scaleFactor.toFixed(4));
            patGroup.resize(scaleFactor*100, scaleFactor*100, true, true, true, true, true, Transformation.CENTER);
            
            // Center pattern
            var newPatBounds = patGroup.visibleBounds;
            var patCenter = ctr(newPatBounds);
            patGroup.translate(maskCenterX - patCenter[0], maskCenterY - patCenter[1]);
            log("Pattern positioned");
            
            // Create working layer
            var workLayer = docMask.layers.add();
            workLayer.name = "Pathfinder Work";
            
            // Prepare mask for Pathfinder operations
            log("Preparing mask for Pathfinder...");
            var maskCopy = primaryMask.duplicate();
            maskCopy.move(workLayer, ElementPlacement.PLACEATEND);
            
            // Convert to compound path for better Pathfinder results
            app.selection = null;
            maskCopy.selected = true;
            try {
                app.executeMenuCommand('compoundPath');
                var maskCompound = app.selection[0];
                log("Mask converted to compound path");
            } catch(e) {
                log("Using mask as-is (compound path failed)");
                var maskCompound = maskCopy;
            }
            
            // Create result layer
            var resultLayer = docMask.layers.add();
            resultLayer.name = "Target";
            var resultGroup = resultLayer.groupItems.add();
            
            // Process pattern with Pathfinder
            log("Applying Pathfinder Intersect...");
            
            // Move pattern to work layer
            patGroup.move(workLayer, ElementPlacement.PLACEATEND);
            
            // Select pattern and mask
            app.selection = null;
            patGroup.selected = true;
            maskCompound.selected = true;
            
            try {
                // Use Pathfinder Intersect to cut pattern at mask boundaries
                app.executeMenuCommand('Live Pathfinder Intersect');
                log("Pathfinder Intersect applied");
                
                // Move result to final layer
                if (app.selection.length > 0) {
                    for (var r = 0; r < app.selection.length; r++) {
                        app.selection[r].move(resultGroup, ElementPlacement.PLACEATEND);
                    }
                }
            } catch(e) {
                log("Pathfinder failed, using alternative method: " + e.message);
                
                // Fallback: Simple clipping
                app.selection = null;
                var clipPath = maskCompound.duplicate();
                clipPath.filled = false;
                clipPath.stroked = false;
                
                patGroup.move(resultGroup, ElementPlacement.PLACEATEND);
                clipPath.move(resultGroup, ElementPlacement.PLACEATBEGINNING);
                clipPath.clipping = true;
                resultGroup.clipped = true;
            }
            
            // Clean up work layer
            try { workLayer.remove(); } catch(e) {}
            
            // Hide original layers
            for (var L = 1; L < docMask.layers.length; L++) {
                if (docMask.layers[L] !== resultLayer) {
                    docMask.layers[L].visible = false;
                }
            }
            
            // Save result
            var maskBasename = fileMask.name.replace(/\.eps$/i, "");
            var outputFilename = maskBasename + "_" + patternType + ".eps";
            var outFile = new File(targetFolder + "/" + outputFilename);
            
            log("Saving to: " + outFile.fsName);
            var epsOpt = new EPSSaveOptions();
            epsOpt.saveMultipleArtboards = false;
            docMask.saveAs(outFile, epsOpt);
            
            // Close documents
            try { docPattern.close(SaveOptions.DONOTSAVECHANGES); } catch(e) {}
            try { docMask.close(SaveOptions.DONOTSAVECHANGES); } catch(e) {}
            
            log("Successfully created: " + outputFilename);
            return outFile.fsName;
            
        } catch(err) {
            log("ERROR: " + err.message);
            throw err;
        }
    }
    
    try {
        log("===== MSP1_pathfinder_flex STARTED =====");
        
        if (!MSP_patColPath || !MSP_patBlkPath || !MSP_maskPath) {
            throw new Error("Missing required parameters");
        }
        
        $.global.MSP_outputPaths = [];
        
        // Process both patterns
        var patColOutput = processMasking(MSP_patColPath, MSP_maskPath, "PatCol");
        $.global.MSP_outputPaths.push(patColOutput);
        
        var patBlkOutput = processMasking(MSP_patBlkPath, MSP_maskPath, "PatBlk");
        $.global.MSP_outputPaths.push(patBlkOutput);
        
        $.global.MSP_success = true;
        log("===== MSP1_pathfinder_flex COMPLETED =====");
        
    } catch(err) {
        $.global.MSP_success = false;
        $.global.MSP_errorMessage = err.message;
        log("===== MSP1_pathfinder_flex FAILED: " + err.message + " =====");
    } finally {
        logFile.close();
    }
})();