/*********************************************************
 *  testMSP_hybrid3_direct.jsx
 *  Direct caller for MSP1_hybrid3 with automatic file selection
 *  Processes: MolancanoDemo/FrogCol.eps, FrogBlk.eps with 2dFold/2d.eps
 *  Logs to: log.txt with [testMSP_hybrid3_direct] prefix
 *********************************************************/
#target illustrator

(function() {
    // Get script folder path
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent;
    
    // Define automatic file paths
    var patColPath = scriptFolder + "/MolancanoDemo/FrogCol.eps";
    var patBlkPath = scriptFolder + "/MolancanoDemo/FrogBlk.eps";
    var maskPath = scriptFolder + "/2dFold/2d.eps";
    
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
        logFile.writeln("[" + timestamp + "] [testMSP_hybrid3_direct] " + message);
    }
    
    try {
        log("===== DIRECT MSP1_HYBRID3 CALLER STARTED =====");
        log("Script Location: " + scriptFolder.fsName);
        
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
        
        // Check if MSP1_hybrid3 has additional parameters
        // Set default for stroke preservation if it exists
        if (typeof $.global.MSP_preserveStrokes === 'undefined') {
            $.global.MSP_preserveStrokes = true; // Enable stroke preservation for hybrid mode
        }
        
        // Clear previous results
        $.global.MSP_success = false;
        $.global.MSP_outputPaths = [];
        $.global.MSP_errorMessage = "";
        
        log("Global parameters set:");
        log("  MSP_patColPath: " + $.global.MSP_patColPath);
        log("  MSP_patBlkPath: " + $.global.MSP_patBlkPath);
        log("  MSP_maskPath: " + $.global.MSP_maskPath);
        if (typeof $.global.MSP_preserveStrokes !== 'undefined') {
            log("  MSP_preserveStrokes: " + $.global.MSP_preserveStrokes);
        }
        
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
        alert("Direct caller error: " + error.message);
    } finally {
        log("===== DIRECT MSP1_HYBRID3 CALLER ENDED =====\n");
        logFile.close();
    }
})();