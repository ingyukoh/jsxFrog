/*********************************************************
 *  MSP1_hybrid3_flexible.jsx - Flexible Pathfinder Masking
 *  Can handle various mask file structures
 *  Falls back to using any closed path as mask
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
    
    // Find all paths and compound paths recursively
    function findAllPaths(container) {
        var paths = [];
        
        function searchPaths(item) {
            if (item.typename === "PathItem" || item.typename === "CompoundPathItem") {
                // Check if it's closed (suitable for masking)
                if (item.typename === "PathItem" && !item.closed) {
                    return; // Skip open paths
                }
                paths.push(item);
            } else if (item.typename === "GroupItem") {
                for (var i = 0; i < item.pageItems.length; i++) {
                    searchPaths(item.pageItems[i]);
                }
            }
        }
        
        for (var i = 0; i < container.pageItems.length; i++) {
            searchPaths(container.pageItems[i]);
        }
        
        return paths;
    }
    
    // Find the most suitable mask shape
    function findMaskShape(docMask) {
        log("Searching for suitable mask shape...");
        
        var allPaths = [];
        
        // Search all layers
        for (var L = 0; L < docMask.layers.length; L++) {
            var layerPaths = findAllPaths(docMask.layers[L]);
            allPaths = allPaths.concat(layerPaths);
            log("Layer " + L + " (" + docMask.layers[L].name + "): found " + layerPaths.length + " paths");
        }
        
        if (allPaths.length === 0) {
            throw new Error("No suitable mask paths found in the document");
        }
        
        log("Total paths found: " + allPaths.length);
        
        // Find the largest path (most likely to be the outer mask)
        var largestPath = null;
        var largestArea = 0;
        
        for (var p = 0; p < allPaths.length; p++) {
            var path = allPaths[p];
            var bounds = path.geometricBounds;
            var area = Math.abs((bounds[2] - bounds[0]) * (bounds[1] - bounds[3]));
            
            if (area > largestArea) {
                largestArea = area;
                largestPath = path;
            }
        }
        
        log("Selected largest path as mask (area: " + largestArea.toFixed(2) + ")");
        return largestPath;
    }
    
    function processMasking(patternPath, maskPath, patternType) {
        try {
            log("Processing " + patternType + " masking with flexible Pathfinder");
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
            
            // Find mask shape flexibly
            app.activeDocument = docMask;
            var maskShape = findMaskShape(docMask);
            
            // Get mask bounds for scaling
            var maskBounds = maskShape.geometricBounds;
            var maskHeight = maskBounds[1] - maskBounds[3];
            var maskCenterX = (maskBounds[0] + maskBounds[2]) / 2;
            var maskCenterY = (maskBounds[1] + maskBounds[3]) / 2;
            
            // Paste pattern
            app.activeDocument = docPattern;
            log("Extracting pattern from " + patternType + " file...");
            for (var n = 0; n < docPattern.pageItems.length; n++) {
                unlockDeep(docPattern.pageItems[n]);
            }
            app.executeMenuCommand("selectall");
            app.executeMenuCommand("copy");
            
            app.activeDocument = docMask;
            app.executeMenuCommand("paste");
            log("Pattern copied to mask document");
            
            var patGroup;
            if (app.selection.length > 1) {
                patGroup = docMask.groupItems.add();
                for (var s = 0; s < app.selection.length; s++) {
                    app.selection[s].move(patGroup, ElementPlacement.PLACEATEND);
                }
            } else {
                patGroup = app.selection[0];
            }
            
            // Scale pattern to match mask
            log("Scaling pattern to match mask height...");
            var patBounds = patGroup.visibleBounds;
            var patHeight = patBounds[1] - patBounds[3];
            var scaleFactor = Math.abs(maskHeight) / Math.abs(patHeight);
            
            unlockDeep(patGroup);
            log("Scaling uniformly by " + scaleFactor.toFixed(4));
            patGroup.resize(scaleFactor*100, scaleFactor*100, true, true, true, true, true, Transformation.CENTER);
            
            // Center pattern on mask
            var newPatBounds = patGroup.visibleBounds;
            var patCenter = ctr(newPatBounds);
            patGroup.translate(maskCenterX - patCenter[0], maskCenterY - patCenter[1]);
            log("Pattern scaled and centered");
            
            // Create clipping mask using simple approach
            log("Creating clipping mask...");
            
            // Duplicate mask shape for clipping
            var clipPath = maskShape.duplicate();
            clipPath.filled = false;
            clipPath.stroked = false;
            
            // Create target layer and group
            var tgtLayer = docMask.layers.add();
            tgtLayer.name = "Target";
            var targG = tgtLayer.groupItems.add();
            
            // Add items in correct order for clipping
            patGroup.move(targG, ElementPlacement.PLACEATEND);
            clipPath.move(targG, ElementPlacement.PLACEATBEGINNING);
            clipPath.clipping = true;
            
            // Apply clipping
            targG.clipped = true;
            log("Clipping mask applied");
            
            // Hide original layers
            for (var L = 1; L < docMask.layers.length; L++) {
                docMask.layers[L].visible = false;
            }
            
            // Save EPS
            var maskBasename = fileMask.name.replace(/\.eps$/i, "");
            var outputFilename = maskBasename + "_" + patternType + ".eps";
            var outFile = new File(targetFolder + "/" + outputFilename);
            
            log("Saving to: " + outFile.fsName);
            var epsOpt = new EPSSaveOptions();
            epsOpt.saveMultipleArtboards = false;
            docMask.saveAs(outFile, epsOpt);
            
            // Close documents
            try {
                docPattern.close(SaveOptions.DONOTSAVECHANGES);
            } catch(e) {
                log("Warning: Could not close pattern document: " + e.message);
            }
            try {
                docMask.close(SaveOptions.DONOTSAVECHANGES);
            } catch(e) {
                log("Warning: Could not close mask document: " + e.message);
            }
            
            log("Successfully created: " + outputFilename);
            return outFile.fsName;
            
        } catch(err) {
            log("ERROR in processMasking: " + err.message);
            throw err;
        }
    }
    
    try {
        log("===== MSP1_hybrid3_flexible STARTED =====");
        
        if (!MSP_patColPath || !MSP_patBlkPath || !MSP_maskPath) {
            throw new Error("Missing required parameters");
        }
        
        $.global.MSP_outputPaths = [];
        
        // Process PatCol
        var patColOutput = processMasking(MSP_patColPath, MSP_maskPath, "PatCol");
        $.global.MSP_outputPaths.push(patColOutput);
        
        // Process PatBlk
        var patBlkOutput = processMasking(MSP_patBlkPath, MSP_maskPath, "PatBlk");
        $.global.MSP_outputPaths.push(patBlkOutput);
        
        $.global.MSP_success = true;
        log("===== MSP1_hybrid3_flexible COMPLETED SUCCESSFULLY =====");
        
    } catch(err) {
        $.global.MSP_success = false;
        $.global.MSP_errorMessage = err.message;
        log("===== MSP1_hybrid3_flexible FAILED: " + err.message + " =====");
    } finally {
        logFile.close();
    }
})();