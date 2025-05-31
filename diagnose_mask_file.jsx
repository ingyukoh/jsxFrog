/*********************************************************
 *  diagnose_mask_file.jsx
 *  Diagnostic tool to examine mask file structure
 *  Helps understand why MSP1_hybrid3 can't find CL/BL groups
 *********************************************************/
#target illustrator

(function() {
    var scriptFolder = File($.fileName).path;
    var maskPath = scriptFolder + "/2dFold/2d.eps";
    
    // Log file
    var logFile = new File(scriptFolder + "/mask_diagnosis.txt");
    logFile.encoding = "UTF8";
    logFile.open("w");
    
    function log(message, indent) {
        indent = indent || 0;
        var spaces = "";
        for (var i = 0; i < indent; i++) spaces += "  ";
        logFile.writeln(spaces + message);
    }
    
    try {
        log("===== MASK FILE DIAGNOSIS =====");
        log("Mask file: " + maskPath);
        
        var maskFile = new File(maskPath);
        if (!maskFile.exists) {
            log("ERROR: Mask file does not exist!");
            return;
        }
        
        // Open mask document
        var docMask = app.open(maskFile);
        log("Document opened successfully");
        log("Document name: " + docMask.name);
        
        // Analyze layers
        log("\nLAYER STRUCTURE:");
        log("Total layers: " + docMask.layers.length);
        
        for (var L = 0; L < docMask.layers.length; L++) {
            var layer = docMask.layers[L];
            log("\nLayer " + L + ": " + layer.name, 1);
            log("Visible: " + layer.visible, 2);
            log("Locked: " + layer.locked, 2);
            log("Page items: " + layer.pageItems.length, 2);
            
            // Analyze page items
            if (layer.pageItems.length > 0) {
                log("Page item breakdown:", 2);
                var itemTypes = {};
                
                for (var i = 0; i < layer.pageItems.length; i++) {
                    var item = layer.pageItems[i];
                    var typeName = item.typename;
                    
                    if (!itemTypes[typeName]) {
                        itemTypes[typeName] = [];
                    }
                    itemTypes[typeName].push(i);
                    
                    // Detailed info for groups
                    if (typeName === "GroupItem") {
                        log("Group " + i + ":", 3);
                        log("Name: " + (item.name || "(unnamed)"), 4);
                        log("Items in group: " + item.pageItems.length, 4);
                        
                        // Check for specific names
                        if (item.name) {
                            if (item.name.toUpperCase().indexOf("CL") !== -1) {
                                log(">>> Possible CL group found!", 4);
                            }
                            if (item.name.toUpperCase().indexOf("BL") !== -1) {
                                log(">>> Possible BL group found!", 4);
                            }
                        }
                        
                        // Analyze group contents
                        var groupTypes = {};
                        for (var j = 0; j < item.pageItems.length; j++) {
                            var subType = item.pageItems[j].typename;
                            groupTypes[subType] = (groupTypes[subType] || 0) + 1;
                        }
                        
                        for (var gType in groupTypes) {
                            log(gType + ": " + groupTypes[gType], 5);
                        }
                    }
                }
                
                // Summary of item types
                log("\nItem type summary for layer " + L + ":", 2);
                for (var type in itemTypes) {
                    log(type + ": " + itemTypes[type].length + " items (indices: " + itemTypes[type].join(", ") + ")", 3);
                }
            }
        }
        
        // Special search for CL/BL patterns
        log("\n\nSEARCHING FOR CL/BL PATTERNS:");
        
        function searchForCLBL(container, path) {
            for (var i = 0; i < container.pageItems.length; i++) {
                var item = container.pageItems[i];
                var currentPath = path + "[" + i + "]";
                
                if (item.typename === "GroupItem") {
                    log("Checking group at " + currentPath, 1);
                    
                    // Check various properties that might indicate CL/BL
                    if (item.name) {
                        log("Name: " + item.name, 2);
                    }
                    
                    // Check if it has the structure of a CL/BL group
                    var hasPath = false;
                    var hasCompoundPath = false;
                    
                    for (var j = 0; j < item.pageItems.length; j++) {
                        if (item.pageItems[j].typename === "PathItem") hasPath = true;
                        if (item.pageItems[j].typename === "CompoundPathItem") hasCompoundPath = true;
                    }
                    
                    if (hasPath || hasCompoundPath) {
                        log(">>> Contains paths - possible mask group!", 2);
                    }
                    
                    // Recurse into subgroups
                    searchForCLBL(item, currentPath);
                }
            }
        }
        
        searchForCLBL(docMask, "Document");
        
        // Close document without saving
        docMask.close(SaveOptions.DONOTSAVECHANGES);
        
        log("\n===== DIAGNOSIS COMPLETE =====");
        alert("Mask diagnosis complete!\n\nCheck mask_diagnosis.txt for details.");
        
    } catch (error) {
        log("ERROR: " + error.message);
        alert("Diagnosis error: " + error.message);
    } finally {
        logFile.close();
    }
})();