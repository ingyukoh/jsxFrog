/*********************************************************
 *  testMSP_hybrid3_flexible_direct.jsx
 *  Direct caller for MSP1_hybrid3_flexible.jsx
 *  Uses the most flexible masking approach
 *********************************************************/
#target illustrator

(function() {
    var scriptFolder = File($.fileName).path;
    
    // Set global parameters
    $.global.MSP_patColPath = scriptFolder + "/MolancanoDemo/FrogCol.eps";
    $.global.MSP_patBlkPath = scriptFolder + "/MolancanoDemo/FrogBlk.eps";
    $.global.MSP_maskPath = scriptFolder + "/2dFold/2d.eps";
    
    // Clear previous results
    $.global.MSP_success = false;
    $.global.MSP_outputPaths = [];
    $.global.MSP_errorMessage = "";
    
    // Log start
    var logFile = new File(scriptFolder + "/log.txt");
    logFile.open("a");
    var d = new Date();
    var timestamp = d.getFullYear() + "-" + 
                   ("0" + (d.getMonth()+1)).slice(-2) + "-" + 
                   ("0" + d.getDate()).slice(-2) + " " + 
                   ("0" + d.getHours()).slice(-2) + ":" + 
                   ("0" + d.getMinutes()).slice(-2) + ":" + 
                   ("0" + d.getSeconds()).slice(-2);
    logFile.writeln("\n[" + timestamp + "] [testMSP_hybrid3_flexible_direct] Starting flexible masking test");
    logFile.close();
    
    // Execute flexible version
    var mspScript = new File(scriptFolder + "/MSP1_hybrid3_flexible.jsx");
    if (mspScript.exists) {
        $.evalFile(mspScript);
        
        if ($.global.MSP_success) {
            var message = "MSP1_hybrid3_flexible completed successfully!\n\nCreated files:";
            for (var i = 0; i < $.global.MSP_outputPaths.length; i++) {
                message += "\n" + File($.global.MSP_outputPaths[i]).name;
            }
            alert(message);
        } else {
            alert("MSP1_hybrid3_flexible failed:\n" + $.global.MSP_errorMessage);
        }
    } else {
        alert("MSP1_hybrid3_flexible.jsx not found!");
    }
})();