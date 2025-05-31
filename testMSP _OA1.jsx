/*********************************************************
 *  testMSP.jsx - Test driver for MSP1.jsx
 *  Tests the parameterized masking script with hardcoded paths
 *********************************************************/
#target illustrator

(function() {
    var scriptFolder = File($.fileName).path;
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
    
    try {
        log("===== testMSP.jsx STARTED =====");
        log("Script folder: " + scriptFolder);
        
        // Set up test paths - using absolute paths
        var testPatColPath = "D:\\EPS\\Iter\\UI2\\PatCol.eps";
        var testPatBlkPath = "D:\\EPS\\Iter\\UI2\\PatBlk.eps";
        var testMaskPath = "D:\\EPS\\Iter\\UI2\\2d.eps";  // Using 2d.eps which has CL+BL groups
        
        log("Test paths:");
        log("  PatCol: " + testPatColPath);
        log("  PatBlk: " + testPatBlkPath);
        log("  Mask: " + testMaskPath);
        
        // Verify input files exist
        var patColFile = new File(testPatColPath);
        var patBlkFile = new File(testPatBlkPath);
        var maskFile = new File(testMaskPath);
        
        if (!patColFile.exists) {
            throw new Error("PatCol file not found: " + testPatColPath);
        }
        if (!patBlkFile.exists) {
            throw new Error("PatBlk file not found: " + testPatBlkPath);
        }
        if (!maskFile.exists) {
            throw new Error("Mask file not found: " + testMaskPath);
        }
        
        log("All input files verified to exist");
        
        // Execute MSP1.jsx with global parameters
        // We need to include the file content rather than evalFile for global variable access
        var mspScript = new File(scriptFolder + "/MSP_OA1.jsx");
        if (!mspScript.exists) {
            throw new Error("MSP1.jsx not found in: " + scriptFolder);
        }
        
        log("Including MSP1.jsx...");
        
        // Set global parameters that MSP1 will use
        $.global.MSP_patColPath = testPatColPath;
        $.global.MSP_patBlkPath = testPatBlkPath;
        $.global.MSP_maskPath = testMaskPath;
        
        // Clear previous results
        $.global.MSP_success = false;
        $.global.MSP_outputPaths = [];
        $.global.MSP_errorMessage = "";
        
        // Include and execute MSP1.jsx
        $.evalFile(mspScript);
        
        // Check results from global variables
        log("MSP1.jsx execution complete");
        log("Success: " + $.global.MSP_success);
        log("Error message: " + $.global.MSP_errorMessage);
        log("Output paths: " + ($.global.MSP_outputPaths ? $.global.MSP_outputPaths.length : 0) + " files");
        
        if ($.global.MSP_success) {
            log("Output files created:");
            for (var i = 0; i < $.global.MSP_outputPaths.length; i++) {
                log("  " + (i+1) + ": " + $.global.MSP_outputPaths[i]);
                
                // Verify file exists
                var outFile = new File($.global.MSP_outputPaths[i]);
                if (outFile.exists) {
                    log("    Verified: File exists (size: " + outFile.length + " bytes)");
                } else {
                    log("    ERROR: File does not exist!");
                }
            }
            
            // Check expected files in Target folder
            var targetFolder = new Folder(scriptFolder + "/Target");
            if (targetFolder.exists) {
                log("Target folder contents:");
                var files = targetFolder.getFiles("*.eps");
                for (var j = 0; j < files.length; j++) {
                    log("  - " + files[j].name);
                }
            }
            
            alert("Test completed successfully!\n\n" + 
                  "Created " + $.global.MSP_outputPaths.length + " files:\n" +
                  $.global.MSP_outputPaths.join("\n"));
                  
        } else {
            alert("Test failed!\n\nError: " + $.global.MSP_errorMessage);
        }
        
        log("===== testMSP.jsx COMPLETED =====");
        
    } catch(err) {
        log("ERROR: " + err.message);
        alert("Test script error: " + err.message);
    } finally {
        logFile.close();
    }
})();