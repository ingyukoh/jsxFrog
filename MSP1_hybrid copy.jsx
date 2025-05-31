/*********************************************************
 *  MSP1_hybrid.jsx - Hybrid Masking Script
 *  Combines compound path (preserves holes) with optional stroke preservation
 *  Best of both MSP1_compound.jsx and MSP1_stroke.jsx
 *********************************************************/
#target illustrator

// Global input parameters (to be set by caller)
// Use $.global to ensure cross-script visibility
if (typeof $.global.MSP_patColPath === 'undefined') $.global.MSP_patColPath = "";
if (typeof $.global.MSP_patBlkPath === 'undefined') $.global.MSP_patBlkPath = "";
if (typeof $.global.MSP_maskPath === 'undefined') $.global.MSP_maskPath = "";
if (typeof $.global.MSP_preserveStrokes === 'undefined') $.global.MSP_preserveStrokes = false;

// Global output results
if (typeof $.global.MSP_success === 'undefined') $.global.MSP_success = false;
if (typeof $.global.MSP_outputPaths === 'undefined') $.global.MSP_outputPaths = [];
if (typeof $.global.MSP_errorMessage === 'undefined') $.global.MSP_errorMessage = "";

// Create local references for easier use
var MSP_patColPath = $.global.MSP_patColPath;
var MSP_patBlkPath = $.global.MSP_patBlkPath;
var MSP_maskPath = $.global.MSP_maskPath;
var MSP_preserveStrokes = $.global.MSP_preserveStrokes;

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
    
    function pathArea(item) {
        if (!item.geometricBounds) return 0;
        var b = item.geometricBounds;
        return Math.abs((b[2]-b[0])*(b[1]-b[3]));
    }
    
    function collectAllPaths(container, paths) {
        // Recursively collect all paths in a container
        if (!paths) paths = [];
        
        for (var i = 0; i < container.pageItems.length; i++) {
            var item = container.pageItems[i];
            if (item.typename === "PathItem") {
                paths.push(item);
            } else if (item.typename === "CompoundPathItem") {
                // CompoundPathItem already contains multiple paths
                paths.push(item);
            } else if (item.typename === "GroupItem") {
                // Recursively search groups
                collectAllPaths(item, paths);
            }
        }
        return paths;
    }
    
    function processMasking(patternPath, maskPath, patternType) {
        try {
            log("Processing " + patternType + " masking (Hybrid mode)");
            log("Pattern: " + patternPath);
            log("Mask: " + maskPath);
            log("Preserve strokes: " + MSP_preserveStrokes);
            
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
            
            // Fetch CL + BL from mask doc
            app.activeDocument = docMask;
            log("Fetching CL + BL from mask document");
            
            var mainLayer = docMask.layers[0];
            var groups = [];
            for (var i = 0; i < mainLayer.pageItems.length; i++) {
                if (mainLayer.pageItems[i].typename === "GroupItem") {
                    groups.push(mainLayer.pageItems[i]);
                }
            }
            
            if (groups.length < 2) {
                throw new Error("Mask layer must contain at least CL + BL groups.");
            }
            
            var CL = groups[0];   // case-line (trim)
            var BL = groups[1];   // bleed outline (trim + 3 mm)
            log("Found CL and BL groups");
            
            // Paste pattern
            app.activeDocument = docPattern;
            docPattern.selectObjectsOnActiveArtboard();
            app.copy();
            
            app.activeDocument = docMask;
            app.paste();
            log("Pasted pattern into mask document");
            
            var pastedGroup = docMask.selection[0];
            var patGroup = null;
            
            if (pastedGroup.typename === "GroupItem") {
                patGroup = pastedGroup;
            } else {
                patGroup = mainLayer.groupItems.add();
                pastedGroup.move(patGroup, ElementPlacement.PLACEATBEGINNING);
            }
            
            // Find disclaimers to exclude from masking
            var disclaimers = [];
            for (var i = 0; i < mainLayer.pageItems.length; i++) {
                var item = mainLayer.pageItems[i];
                if (item.typename === "TextFrame" && item.contents.indexOf("disclaimer") !== -1) {
                    disclaimers.push(item);
                    log("Found disclaimer text: " + item.contents.substring(0, 30) + "...");
                }
            }
            
            // Scale pattern to match case-line height
            var clB = CL.visibleBounds;
            var clW = Math.abs(clB[2] - clB[0]);
            var clH = Math.abs(clB[3] - clB[1]);
            var clCX = (clB[0] + clB[2]) / 2;
            var clCY = (clB[1] + clB[3]) / 2;
            
            var patB = patGroup.visibleBounds;
            var patW = Math.abs(patB[2] - patB[0]);
            var patH = Math.abs(patB[3] - patB[1]);
            
            var sF = Math.abs(clH) / Math.abs(patH);
            unlockDeep(patGroup);
            
            log("Scaling uniformly by " + sF.toFixed(4));
            
            patGroup.resize(sF*100, sF*100, true, true, true, true, true, Transformation.CENTER);
            
            // Reposition
            var newPatB = patGroup.visibleBounds;
            var patCtr = ctr(newPatB);
            patGroup.translate(clCX - patCtr[0], clCY - patCtr[1]);
            
            log("Pattern scaled and centered");
            
            // Create hybrid clipping mask
            log("Creating hybrid clipping mask...");
            
            var sourceGroup = (BL && BL.typename === "GroupItem") ? BL : CL;
            var dupSource = sourceGroup.duplicate();
            unlockDeep(dupSource);
            
            // Variables to store paths and strokes
            var clipPath = null;
            var strokeOutlines = [];
            var useCompoundPath = true;
            
            // Try to create compound path first
            try {
                // Store strokes if needed
                if (MSP_preserveStrokes) {
                    log("Collecting strokes before compound path creation...");
                    var allPaths = collectAllPaths(dupSource);
                    for (var i = 0; i < allPaths.length; i++) {
                        var path = allPaths[i];
                        if (path.stroked) {
                            var strokeCopy = path.duplicate();
                            strokeCopy.filled = false;
                            strokeCopy.stroked = true;
                            strokeCopy.clipping = false;
                            strokeOutlines.push(strokeCopy);
                        }
                    }
                }
                
                // Try compound path creation
                app.selection = null;
                dupSource.selected = true;
                app.executeMenuCommand('compoundPath');
                
                clipPath = dupSource;
                log("Successfully created compound path");
                
            } catch(e) {
                log("Compound path failed: " + e.message + " - falling back to largest path method");
                useCompoundPath = false;
                
                // Fall back to largest path method (like MSP1_stroke.jsx)
                var outerPath = null;
                var largestArea = 0;
                
                function findLargestPath(obj) {
                    if (obj.typename === "PathItem" || obj.typename === "CompoundPathItem") {
                        var a = pathArea(obj);
                        if (a > largestArea) {
                            largestArea = a;
                            outerPath = obj;
                        }
                    }
                    if (obj.pageItems && obj.typename === "GroupItem") {
                        for (var p = 0; p < obj.pageItems.length; p++) {
                            findLargestPath(obj.pageItems[p]);
                        }
                    }
                }
                
                findLargestPath(dupSource);
                
                if (!outerPath) {
                    throw new Error("No valid path found in BL/CL group to act as clipping mask.");
                }
                
                clipPath = outerPath.duplicate();
                
                // Create stroke outline if needed and not already collected
                if (MSP_preserveStrokes && strokeOutlines.length === 0 && clipPath.stroked) {
                    var strokeOutline = clipPath.duplicate();
                    strokeOutline.clipping = false;
                    strokeOutline.filled = false;
                    strokeOutline.stroked = true;
                    strokeOutlines.push(strokeOutline);
                    log("Created stroke outline from largest path");
                }
                
                // Clean up duplicate
                try { 
                    dupSource.remove(); 
                } catch(e) {}
            }
            
            // Configure clipping path
            clipPath.filled = false;
            clipPath.stroked = false;
            clipPath.clipping = true;
            log("Clipping path configured (compound path: " + useCompoundPath + ")");
            
            // Create target layer and group
            log("Assembling final Target group...");
            var tgtLayer = docMask.layers.add();
            tgtLayer.name = "Target";
            var targG = tgtLayer.groupItems.add();
            tgtLayer.visible = true;
            
            // Add items to group in correct order
            // IMPORTANT: Pattern must be added first, then clipping path on top
            patGroup.move(targG, ElementPlacement.PLACEATBEGINNING);
            clipPath.move(targG, ElementPlacement.PLACEATBEGINNING);
            
            // Add disclaimers back
            for (var d = 0; d < disclaimers.length; d++) {
                if (disclaimers[d].isValid) {
                    disclaimers[d].move(targG, ElementPlacement.PLACEATEND);
                }
            }
            
            // Apply clipping
            targG.clipped = true;
            
            // Add stroke outlines AFTER clipping is applied
            if (MSP_preserveStrokes && strokeOutlines.length > 0) {
                var strokeGroup = targG.groupItems.add();
                strokeGroup.name = "Preserved Strokes";
                for (var s = 0; s < strokeOutlines.length; s++) {
                    if (strokeOutlines[s].isValid) {
                        strokeOutlines[s].move(strokeGroup, ElementPlacement.PLACEATBEGINNING);
                    }
                }
                log("Added " + strokeOutlines.length + " stroke outlines");
            }
            log("Target group assembled + clipping applied");
            
            // Hide old layer
            mainLayer.visible = false;
            
            // Save EPS with synthesized name
            var maskBasename = fileMask.name.replace(/\.eps$/i, "");
            var outputFilename = maskBasename + "_" + patternType + ".eps";
            var outFile = new File(targetFolder + "/" + outputFilename);
            
            log("Saving to: " + outFile.fsName);
            var epsOpt = new EPSSaveOptions();
            epsOpt.saveMultipleArtboards = false;
            docMask.saveAs(outFile, epsOpt);
            
            // Close documents without saving changes
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
        log("===== MSP1_hybrid.jsx STARTED =====");
        
        // Validate parameters
        if (!MSP_patColPath || !MSP_patBlkPath || !MSP_maskPath) {
            throw new Error("Missing required parameters. PatCol: " + MSP_patColPath + 
                          ", PatBlk: " + MSP_patBlkPath + ", Mask: " + MSP_maskPath);
        }
        
        // Clear output paths
        $.global.MSP_outputPaths = [];
        
        // Process PatCol
        var patColOutput = processMasking(MSP_patColPath, MSP_maskPath, "PatCol");
        $.global.MSP_outputPaths.push(patColOutput);
        
        // Process PatBlk
        var patBlkOutput = processMasking(MSP_patBlkPath, MSP_maskPath, "PatBlk");
        $.global.MSP_outputPaths.push(patBlkOutput);
        
        $.global.MSP_success = true;
        log("===== MSP1_hybrid.jsx COMPLETED SUCCESSFULLY =====");
        
    } catch(err) {
        $.global.MSP_success = false;
        $.global.MSP_errorMessage = err.message;
        log("===== MSP1_hybrid.jsx FAILED: " + err.message + " =====");
    } finally {
        logFile.close();
    }
})();