/*********************************************************
 *  MSP1_pathfinder.jsx - Masked Script with Path Operations
 *  Uses Pathfinder to actually CUT paths at mask boundaries
 *********************************************************/
#target illustrator

// Global input parameters (to be set by caller)
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
    
    function processMasking(patternPath, maskPath, patternType) {
        try {
            log("Processing " + patternType + " masking with Pathfinder");
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
            
            // Fetch CL + BL from mask doc - Enhanced search
            app.activeDocument = docMask;
            log("Fetching CL + BL from mask document");
            
            // Function to recursively find groups
            function findAllGroups(container) {
                var foundGroups = [];
                for (var i = 0; i < container.pageItems.length; i++) {
                    var item = container.pageItems[i];
                    if (item.typename === "GroupItem") {
                        foundGroups.push(item);
                        // Also search within this group
                        var subGroups = findAllGroups(item);
                        foundGroups = foundGroups.concat(subGroups);
                    }
                }
                return foundGroups;
            }
            
            // Search all layers for groups
            var allGroups = [];
            for (var L = 0; L < docMask.layers.length; L++) {
                var layerGroups = findAllGroups(docMask.layers[L]);
                allGroups = allGroups.concat(layerGroups);
            }
            
            log("Total groups found: " + allGroups.length);
            
            // Try to identify CL and BL groups
            var CL = null;
            var BL = null;
            
            // Method 1: Look for groups by name
            for (var g = 0; g < allGroups.length; g++) {
                var group = allGroups[g];
                if (group.name) {
                    var upperName = group.name.toUpperCase();
                    if (upperName.indexOf("CL") !== -1 && !CL) {
                        CL = group;
                        log("Found CL group by name: " + group.name);
                    }
                    if (upperName.indexOf("BL") !== -1 && !BL) {
                        BL = group;
                        log("Found BL group by name: " + group.name);
                    }
                }
            }
            
            // Method 2: Use first two groups as fallback
            if (!CL && !BL && allGroups.length >= 2) {
                CL = allGroups[0];
                BL = allGroups[1];
                log("Using first two groups as CL and BL (positional fallback)");
            }
            
            // Method 3: If only one group, use it for both
            if (!CL && !BL && allGroups.length === 1) {
                CL = allGroups[0];
                BL = allGroups[0];
                log("Only one group found, using for both CL and BL");
            }
            
            if (!CL || !BL) {
                throw new Error("Could not identify CL and BL groups. Found " + allGroups.length + " groups total.");
            }
            
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
            
            var sF = Math.abs(clH) / Math.abs(patH);
            unlockDeep(patGroup);
            
            log("Scaling uniformly by " + sF.toFixed(4));
            patGroup.resize(sF*100, sF*100, true, true, true, true, true, Transformation.CENTER);
            
            // Reposition
            var newPatB = patGroup.visibleBounds;
            var patCtr = ctr(newPatB);
            patGroup.translate(clCX - patCtr[0], clCY - patCtr[1]);
            
            log("Pattern scaled and centered");
            
            // NEW: Use Pathfinder operations instead of simple clipping
            log("Applying Pathfinder operations to cut paths at boundaries...");
            
            // Duplicate the mask shape for operations
            var sourceGroup = (BL && BL.typename === "GroupItem") ? BL : CL;
            var maskShape = sourceGroup.duplicate();
            unlockDeep(maskShape);
            
            // Convert mask to compound path if needed
            app.selection = null;
            maskShape.selected = true;
            try {
                app.executeMenuCommand('compoundPath');
                log("Created compound path from mask");
            } catch(e) {
                log("Could not create compound path: " + e.message);
            }
            
            // Create target layer
            var tgtLayer = docMask.layers.add();
            tgtLayer.name = "Target";
            
            // Process each item in the pattern group
            var resultGroup = tgtLayer.groupItems.add();
            resultGroup.name = "Processed Pattern";
            
            // Ungroup pattern for processing
            var patternItems = [];
            function collectItems(container) {
                for (var i = container.pageItems.length - 1; i >= 0; i--) {
                    var item = container.pageItems[i];
                    if (item.typename === "GroupItem") {
                        collectItems(item);
                    } else {
                        patternItems.push(item);
                    }
                }
            }
            collectItems(patGroup);
            
            log("Processing " + patternItems.length + " pattern items...");
            
            // Process each pattern item
            for (var p = 0; p < patternItems.length; p++) {
                var patternItem = patternItems[p];
                
                // Skip text frames and non-path items
                if (patternItem.typename === "TextFrame" || 
                    (patternItem.typename !== "PathItem" && 
                     patternItem.typename !== "CompoundPathItem")) {
                    patternItem.move(resultGroup, ElementPlacement.PLACEATEND);
                    continue;
                }
                
                try {
                    // Duplicate the mask for this operation
                    var tempMask = maskShape.duplicate();
                    var tempPattern = patternItem.duplicate();
                    
                    // Select both items
                    app.selection = null;
                    tempPattern.selected = true;
                    tempMask.selected = true;
                    
                    // Apply Intersect pathfinder
                    app.executeMenuCommand('Live Pathfinder Intersect');
                    
                    // Move result to target group
                    if (app.selection.length > 0) {
                        app.selection[0].move(resultGroup, ElementPlacement.PLACEATEND);
                    }
                    
                    // Clean up
                    try { tempMask.remove(); } catch(e) {}
                    try { tempPattern.remove(); } catch(e) {}
                    
                } catch(err) {
                    log("Could not process item " + p + ": " + err.message);
                    // If pathfinder fails, just move the original
                    patternItem.move(resultGroup, ElementPlacement.PLACEATEND);
                }
            }
            
            // Add disclaimers back
            for (var d = 0; d < disclaimers.length; d++) {
                if (disclaimers[d].isValid) {
                    disclaimers[d].move(resultGroup, ElementPlacement.PLACEATEND);
                }
            }
            
            // Clean up
            try { maskShape.remove(); } catch(e) {}
            try { patGroup.remove(); } catch(e) {}
            
            // Hide old layer
            mainLayer.visible = false;
            
            log("Pathfinder operations completed");
            
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
        log("===== MSP1_pathfinder.jsx STARTED =====");
        
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
        log("===== MSP1_pathfinder.jsx COMPLETED SUCCESSFULLY =====");
        
    } catch(err) {
        $.global.MSP_success = false;
        $.global.MSP_errorMessage = err.message;
        log("===== MSP1_pathfinder.jsx FAILED: " + err.message + " =====");
    } finally {
        logFile.close();
    }
})();