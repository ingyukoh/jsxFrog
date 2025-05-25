/*********************************************************
 *  masked2.jsx - Final working version without dialog boxes
 *  Automatically loads 2d.eps and PatCol.eps from same folder
 *  Writes logs to log.txt
 *********************************************************/
#target illustrator

(function () {
    var scriptFolder = File($.fileName).path;
    var logFile = new File(scriptFolder + "/log.txt");
    logFile.encoding = "UTF8";
    logFile.open("w");
    
    function log(message) {
        var d = new Date();
        var timestamp = d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate() + " " + 
                       d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
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
    
    try {
        log("Starting masked2.jsx - Fast development mode");
        
        // Load files automatically from same folder
        var file2D = new File(scriptFolder + "/2d.eps");
        if (!file2D.exists) {
            throw new Error("2d.eps not found in " + scriptFolder);
        }
        log("Found 2d.eps: " + file2D.fsName);
        var doc2D = app.open(file2D);
        
        var filePC = new File(scriptFolder + "/PatCol.eps");
        if (!filePC.exists) {
            throw new Error("PatCol.eps not found in " + scriptFolder);
        }
        log("Found PatCol.eps: " + filePC.fsName);
        var docPC = app.open(filePC);

        // Fetch CL + BL from 2D doc
        app.activeDocument = doc2D;
        log("Fetching CL + BL from 2D document");
        
        var mainLayer = doc2D.layers[0];
        var groups = [];
        for (var i = 0; i < mainLayer.pageItems.length; i++) {
            if (mainLayer.pageItems[i].typename === "GroupItem") {
                groups.push(mainLayer.pageItems[i]);
            }
        }
        
        if (groups.length < 2) {
            throw new Error("Layer 1 must contain at least CL + BL groups.");
        }

        var CL = groups[0];   // case-line (trim)
        var BL = groups[1];   // bleed outline (trim + 3 mm)
        log("Found CL and BL groups");

        // Paste pattern
        app.activeDocument = docPC;
        log("Step 1: Extracting pattern from PatCol file...");
        for (var n = 0; n < docPC.pageItems.length; n++) {
            unlockDeep(docPC.pageItems[n]);
        }
        app.executeMenuCommand("selectall");
        app.executeMenuCommand("copy");

        app.activeDocument = doc2D;
        app.executeMenuCommand("paste");
        log("Pattern copied from PatCol file to 2D document");

        var patGroup;
        if (app.selection.length > 1) {
            patGroup = doc2D.groupItems.add();
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
                        one.move(doc2D, ElementPlacement.PLACEATEND);
                    }
                } catch(e) {}
            }
        }
        log("Protected " + disclaimers.length + " disclaimer text items");

        // Scale pattern
        log("Step 2: Scaling pattern to match CL height...");
        
        var clB = CL.geometricBounds;
        var clH = clB[1] - clB[3];
        var clCX = (clB[0] + clB[2]) / 2;
        var clCY = (clB[1] + clB[3]) / 2;
        
        var patB = patGroup.visibleBounds;
        var patH = patB[1] - patB[3];
        var patW = patB[2] - patB[0];
        
        var sF = Math.abs(clH) / Math.abs(patH);
        unlockDeep(patGroup);
        
        log("Original dimensions: Width: " + patW.toFixed(2) + " pts, Height: " + patH.toFixed(2) + " pts");
        log("Scaling uniformly by " + sF.toFixed(4) + " to match CL height (" + clH.toFixed(2) + " pts)");
        
        patGroup.resize(sF*100, sF*100, true, true, true, true, true, Transformation.CENTER);
        
        // Reposition
        var newPatB = patGroup.visibleBounds;
        var patCtr = ctr(newPatB);
        patGroup.translate(clCX - patCtr[0], clCY - patCtr[1]);
        
        log("Pattern scaled and centered");

        // Create clipping mask
        log("Step 3: Creating clipping mask...");
        
        var sourceGroup = (BL && BL.typename === "GroupItem") ? BL : CL;
        var dupSource = sourceGroup.duplicate();
        unlockDeep(dupSource);
        
        // Find largest path for clipping mask
        var outerPath = null;
        var largestArea = 0;
        
        function pathArea(item) {
            if (!item.geometricBounds) return 0;
            var b = item.geometricBounds;
            return Math.abs((b[2]-b[0])*(b[1]-b[3]));
        }
        
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
        
        var clipPath = outerPath.duplicate();
        clipPath.filled = false;
        clipPath.stroked = false;
        clipPath.clipping = true;
        log("Clipping path derived from largest path (" + largestArea.toFixed(0) + " pts²)");
        
        // Clean up duplicate
        try { 
            dupSource.remove(); 
        } catch(e) {}

        // Create target layer and group
        log("Step 4: Assembling final Target group...");
        var tgtLayer = doc2D.layers.add();
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
        
        // Apply clipping - this is the key!
        targG.clipped = true;
        log("Target group assembled + clipping applied");

        // Hide old layer
        mainLayer.visible = false;

        // Save EPS
        log("Step 5: Saving final EPS file...");
        var outFile = new File(scriptFolder + "/targG.eps");
        var epsOpt = new EPSSaveOptions();
        epsOpt.saveMultipleArtboards = false;
        doc2D.saveAs(outFile, epsOpt);

        log("WORKFLOW COMPLETE! Saved to: " + outFile.fsName);

    } catch(err) {
        log("ERROR: Script stopped: " + err.message);
        alert("Script error: " + err.message);
    } finally {
        logFile.close();
    }
})();