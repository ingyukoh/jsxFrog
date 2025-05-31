/*********************************************************
 *  testMSP_hybrid3_custom.jsx
 *  Direct caller for MSP1_hybrid3 with custom file selection
 *  Allows testing with different pattern/mask combinations
 *  Logs to: log.txt with [testMSP_hybrid3_custom] prefix
 *********************************************************/
#target illustrator

(function() {
    // Get script folder path
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent;
    
    // Create dialog for file selection
    var dialog = new Window("dialog", "MSP1_hybrid3 Test Driver");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    
    // Title
    var titleText = dialog.add("statictext", undefined, "Select Files for MSP1_hybrid3 Testing");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
    
    // File selection groups
    var patColGroup = dialog.add("group");
    patColGroup.add("statictext", undefined, "Pattern Col:");
    var patColText = patColGroup.add("edittext", undefined, scriptFolder + "/MolancanoDemo/FrogCol.eps");
    patColText.preferredSize.width = 400;
    var patColButton = patColGroup.add("button", undefined, "Browse");
    
    var patBlkGroup = dialog.add("group");
    patBlkGroup.add("statictext", undefined, "Pattern Blk:");
    var patBlkText = patBlkGroup.add("edittext", undefined, scriptFolder + "/MolancanoDemo/FrogBlk.eps");
    patBlkText.preferredSize.width = 400;
    var patBlkButton = patBlkGroup.add("button", undefined, "Browse");
    
    var maskGroup = dialog.add("group");
    maskGroup.add("statictext", undefined, "Mask File:");
    var maskText = maskGroup.add("edittext", undefined, scriptFolder + "/2dFold/2d.eps");
    maskText.preferredSize.width = 400;
    var maskButton = maskGroup.add("button", undefined, "Browse");
    
    // Control buttons
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "center";
    var okButton = buttonGroup.add("button", undefined, "Run Test");
    var cancelButton = buttonGroup.add("button", undefined, "Cancel");
    
    // Button handlers
    patColButton.onClick = function() {
        var file = File.openDialog("Select Pattern Col file", "*.eps");
        if (file) patColText.text = file.fsName;
    };
    
    patBlkButton.onClick = function() {
        var file = File.openDialog("Select Pattern Blk file", "*.eps");
        if (file) patBlkText.text = file.fsName;
    };
    
    maskButton.onClick = function() {
        var file = File.openDialog("Select Mask file", "*.eps");
        if (file) maskText.text = file.fsName;
    };
    
    cancelButton.onClick = function() {
        dialog.close();
    };
    
    okButton.onClick = function() {
        dialog.close();
        
        // Set up logging to main log.txt
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
                           ("0" + d.getSeconds()).slice(-2) + "." + 
                           ("00" + d.getMilliseconds()).slice(-3);
            logFile.writeln("[" + timestamp + "] [testMSP_hybrid3_custom] " + message);
        }
        
        try {
            log("===== CUSTOM MSP1_HYBRID3 CALLER STARTED =====");
            log("Script Location: " + scriptFolder.fsName);
            
            // Get selected paths
            var patColPath = patColText.text;
            var patBlkPath = patBlkText.text;
            var maskPath = maskText.text;
            
            // Validate files exist
            var patColFile = new File(patColPath);
            var patBlkFile = new File(patBlkPath);
            var maskFile = new File(maskPath);
            
            log("Checking file existence:");
            log("  PatCol: " + patColPath + " - Exists: " + patColFile.exists);
            log("  PatBlk: " + patBlkPath + " - Exists: " + patBlkFile.exists);
            log("  Mask: " + maskPath + " - Exists: " + maskFile.exists);
            
            if (!patColFile.exists || !patBlkFile.exists || !maskFile.exists) {
                throw new Error("One or more required files not found!");
            }
            
            // Set global parameters for MSP1_hybrid3
            $.global.MSP_patColPath = patColPath;
            $.global.MSP_patBlkPath = patBlkPath;
            $.global.MSP_maskPath = maskPath;
            
            // Clear previous results
            $.global.MSP_success = false;
            $.global.MSP_outputPaths = [];
            $.global.MSP_errorMessage = "";
            
            log("Global parameters set:");
            log("  MSP_patColPath: " + $.global.MSP_patColPath);
            log("  MSP_patBlkPath: " + $.global.MSP_patBlkPath);
            log("  MSP_maskPath: " + $.global.MSP_maskPath);
            
            // Execute MSP1_hybrid3.jsx
            var mspScript = new File(scriptFolder + "/MSP1_hybrid3.jsx");
            log("Looking for MSP1_hybrid3.jsx at: " + mspScript.fsName);
            log("MSP1_hybrid3.jsx exists: " + mspScript.exists);
            
            if (mspScript.exists) {
                log("Executing MSP1_hybrid3.jsx...");
                $.evalFile(mspScript);
                
                // Check results
                log("Execution completed. Checking results...");
                log("  Success: " + $.global.MSP_success);
                log("  Output count: " + $.global.MSP_outputPaths.length);
                
                if ($.global.MSP_success) {
                    log("SUCCESS! Files created:");
                    for (var i = 0; i < $.global.MSP_outputPaths.length; i++) {
                        log("  - " + $.global.MSP_outputPaths[i]);
                    }
                    
                    // Show success alert
                    var message = "MSP1_hybrid3 completed successfully!\n\nCreated files:";
                    for (var j = 0; j < $.global.MSP_outputPaths.length; j++) {
                        message += "\n" + File($.global.MSP_outputPaths[j]).name;
                    }
                    alert(message);
                    
                } else {
                    log("FAILED! Error: " + $.global.MSP_errorMessage);
                    alert("MSP1_hybrid3 failed!\n\nError: " + $.global.MSP_errorMessage);
                }
                
            } else {
                throw new Error("MSP1_hybrid3.jsx not found at: " + mspScript.fsName);
            }
            
        } catch (error) {
            log("ERROR: " + error.message);
            alert("Custom caller error: " + error.message);
        } finally {
            log("===== CUSTOM MSP1_HYBRID3 CALLER ENDED =====\n");
            logFile.close();
        }
    };
    
    // Show dialog
    dialog.show();
})();