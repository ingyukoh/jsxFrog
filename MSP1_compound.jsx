/*********************************************************
 *  MSP1_compound.jsx - Masked Script with Compound Path Solution
 *  Uses compound path to preserve all shapes and holes
 *********************************************************/
#target illustrator

// Global input parameters (to be set by caller)
// Use $.global to ensure cross-script visibility
if (typeof $.global.MSP_patColPath === 'undefined') $.global.MSP_patColPath = "";
if (typeof $.global.MSP_patBlkPath === 'undefined') $.global.MSP_patBlkPath = "";
if (typeof $.global.MSP_maskPath === 'undefined') $.global.MSP_maskPath = "";

// Global output results
if (typeof $.global.MSP_success === 'undefined') $.global.MSP_success = false;
if (typeof $.global.MSP_outputPaths === 'undefined') $.global.MSP_outputPaths = [];
if (typeof $.global.MSP_errorMessage === 'undefined') $.global.MSP_errorMessage = "";

// Create local references for easier use
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
    
    function processMasking(patternPath, maskPath, patternType) {
        try {
            log("Processing " + patternType + " masking");
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
            
            // Protect disclaimer text
            var disclaimers = [];
            if (patGroup.textFrames) {
                var tf = patGroup.textFrames;
                for (var t = tf.length-1; t >= 0; t--) {
                    try {
                        var one = tf[t];
                        if (/©|Disney|Winnie|Pooh|Shepard/i.test(one.contents) ||
                            (one.geometricBounds[3] < patGroup.visibleBounds[3] + 10)) {
                            disclaimers.push(one);
                            one.move(docMask, ElementPlacement.PLACEATEND);
                        }
                    } catch(e) {}
                }
            }
            log("Protected " + disclaimers.length + " disclaimer text items");
            
            // Scale pattern
            log("Scaling pattern to match CL height...");
            
            var clB = CL.geometricBounds;
            var clH = clB[1] - clB[3];
            var clCX = (clB[0] + clB[2]) / 2;
            var clCY = (clB[1] + clB[3]) / 2;
            
            var patB = patGroup.visibleBounds;
            var patH = patB[1] - patB[3];
            var patW = patB[2] - patB[0];
            
            var sF = Math.abs(clH) / Math.abs(patH);
            unlockDeep(patGroup);
            
            log("Scaling uniformly by " + sF.toFixed(4));
            
            patGroup.resize(sF*100, sF*100, true, true, true, true, true, Transformation.CENTER);
            
            // Reposition
            var newPatB = patGroup.visibleBounds;
            var patCtr = ctr(newPatB);
            patGroup.translate(clCX - patCtr[0], clCY - patCtr[1]);
            
            log("Pattern scaled and centered");
            
            // Create clipping mask using compound path
            log("Creating compound path clipping mask...");
            
            var sourceGroup = (BL && BL.typename === "GroupItem") ? BL : CL;
            var dupSource = sourceGroup.duplicate();
            unlockDeep(dupSource);
            
            // Convert the entire group to a compound path
            app.selection = null;
            dupSource.selected = true;
            app.executeMenuCommand('compoundPath');
            
            // The dupSource is now a CompoundPathItem
            var clipPath = dupSource;
            clipPath.filled = false;
            clipPath.stroked = false;
            clipPath.clipping = true;
            
            log("Compound clipping path created");
            
            // Create target layer and group
            log("Assembling final Target group...");
            var tgtLayer = docMask.layers.add();
            tgtLayer.name = "Target";
            var targG = tgtLayer.groupItems.add();
            tgtLayer.visible = true;
            
            // Add items to group in correct order
            clipPath.move(targG, ElementPlacement.PLACEATBEGINNING);
            patGroup.move(targG, ElementPlacement.PLACEATEND);
            
            // Add disclaimers back
            for (var d = 0; d < disclaimers.length; d++) {
                if (disclaimers[d].isValid) {
                    disclaimers[d].move(targG, ElementPlacement.PLACEATEND);
                }
            }
            
            // Apply clipping
            targG.clipped = true;
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
        log("===== MSP1_compound.jsx STARTED =====");
        
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
        log("===== MSP1_compound.jsx COMPLETED SUCCESSFULLY =====");
        
    } catch(err) {
        $.global.MSP_success = false;
        $.global.MSP_errorMessage = err.message;
        log("===== MSP1_compound.jsx FAILED: " + err.message + " =====");
    } finally {
        logFile.close();
    }
})();