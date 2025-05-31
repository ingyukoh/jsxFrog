/*********************************************************
 *  MSP1_hybrid3_debug.jsx - Debug version with detailed logging
 *  Based on MSP1_hybrid3.jsx but with extensive diagnostics
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
    
    function findGroupsRecursively(container, path, foundGroups) {
        path = path || "root";
        foundGroups = foundGroups || [];
        
        log("DEBUG: Searching in " + path + " with " + container.pageItems.length + " items");
        
        for (var i = 0; i < container.pageItems.length; i++) {
            var item = container.pageItems[i];
            var itemPath = path + "[" + i + "]";
            
            log("DEBUG: Item " + i + " type: " + item.typename);
            
            if (item.typename === "GroupItem") {
                log("DEBUG: Found group at " + itemPath);
                if (item.name) {
                    log("DEBUG: Group name: " + item.name);
                }
                
                foundGroups.push({
                    group: item,
                    path: itemPath,
                    name: item.name || "",
                    itemCount: item.pageItems.length
                });
                
                // Recurse into subgroups
                findGroupsRecursively(item, itemPath, foundGroups);
            }
        }
        
        return foundGroups;
    }
    
    function findCLBLGroups(docMask) {
        log("DEBUG: Starting comprehensive group search");
        
        var allGroups = [];
        var clGroup = null;
        var blGroup = null;
        
        // Search all layers
        for (var L = 0; L < docMask.layers.length; L++) {
            log("DEBUG: Searching layer " + L + ": " + docMask.layers[L].name);
            var layerGroups = findGroupsRecursively(docMask.layers[L], "Layer" + L);
            allGroups = allGroups.concat(layerGroups);
        }
        
        log("DEBUG: Total groups found: " + allGroups.length);
        
        // Log all groups
        for (var g = 0; g < allGroups.length; g++) {
            log("DEBUG: Group " + g + " - Path: " + allGroups[g].path + 
                ", Name: '" + allGroups[g].name + "'" + 
                ", Items: " + allGroups[g].itemCount);
        }
        
        // Try to identify CL and BL groups
        // Method 1: By name
        for (var i = 0; i < allGroups.length; i++) {
            var groupInfo = allGroups[i];
            var upperName = groupInfo.name.toUpperCase();
            
            if (upperName.indexOf("CL") !== -1 && !clGroup) {
                clGroup = groupInfo.group;
                log("DEBUG: Found CL group by name: " + groupInfo.name);
            }
            if (upperName.indexOf("BL") !== -1 && !blGroup) {
                blGroup = groupInfo.group;
                log("DEBUG: Found BL group by name: " + groupInfo.name);
            }
        }
        
        // Method 2: By position (first two groups)
        if (!clGroup && !blGroup && allGroups.length >= 2) {
            log("DEBUG: Using positional fallback (first two groups)");
            clGroup = allGroups[0].group;
            blGroup = allGroups[1].group;
        }
        
        return {
            CL: clGroup,
            BL: blGroup,
            allGroups: allGroups
        };
    }
    
    function processMasking(patternPath, maskPath, patternType) {
        try {
            log("Processing " + patternType + " masking with Pathfinder (DEBUG MODE)");
            log("Pattern: " + patternPath);
            log("Mask: " + maskPath);
            
            // Open files
            var fileMask = new File(maskPath);
            if (!fileMask.exists) {
                throw new Error("Mask file not found: " + maskPath);
            }
            var docMask = app.open(fileMask);
            log("DEBUG: Mask document opened - Layers: " + docMask.layers.length);
            
            var filePattern = new File(patternPath);
            if (!filePattern.exists) {
                throw new Error("Pattern file not found: " + patternPath);
            }
            var docPattern = app.open(filePattern);
            
            // Fetch CL + BL from mask doc with detailed search
            app.activeDocument = docMask;
            log("Fetching CL + BL from mask document (enhanced search)");
            
            var groupResult = findCLBLGroups(docMask);
            
            if (!groupResult.CL || !groupResult.BL) {
                var errorMsg = "Could not find CL and BL groups. Found " + 
                              groupResult.allGroups.length + " total groups.";
                throw new Error(errorMsg);
            }
            
            var CL = groupResult.CL;
            var BL = groupResult.BL;
            log("Found CL and BL groups successfully");
            
            // Continue with the rest of the processing...
            log("DEBUG: Rest of processing would continue here");
            
            // For now, just close documents and return success
            docPattern.close(SaveOptions.DONOTSAVECHANGES);
            docMask.close(SaveOptions.DONOTSAVECHANGES);
            
            return scriptFolder + "/Target/debug_test.eps";
            
        } catch(err) {
            log("ERROR in processMasking: " + err.message);
            throw err;
        }
    }
    
    try {
        log("===== MSP1_hybrid3_debug STARTED =====");
        
        if (!MSP_patColPath || !MSP_patBlkPath || !MSP_maskPath) {
            throw new Error("Missing required parameters");
        }
        
        $.global.MSP_outputPaths = [];
        
        // Process PatCol only for debugging
        var patColOutput = processMasking(MSP_patColPath, MSP_maskPath, "PatCol");
        $.global.MSP_outputPaths.push(patColOutput);
        
        $.global.MSP_success = true;
        log("===== MSP1_hybrid3_debug COMPLETED =====");
        
    } catch(err) {
        $.global.MSP_success = false;
        $.global.MSP_errorMessage = err.message;
        log("===== MSP1_hybrid3_debug FAILED: " + err.message + " =====");
    } finally {
        logFile.close();
    }
})();