/*********************************************************
 *  testMSP_pathfinder_flex.jsx
 *  Test driver for MSP1_pathfinder_flex.jsx
 *  Most robust approach combining flexible detection + Pathfinder
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
    
    // Quick log entry
    var logFile = new File(scriptFolder + "/log.txt");
    logFile.open("a");
    var d = new Date();
    var timestamp = d.getFullYear() + "-" + 
                   ("0" + (d.getMonth()+1)).slice(-2) + "-" + 
                   ("0" + d.getDate()).slice(-2) + " " + 
                   ("0" + d.getHours()).slice(-2) + ":" + 
                   ("0" + d.getMinutes()).slice(-2) + ":" + 
                   ("0" + d.getSeconds()).slice(-2);
    logFile.writeln("\n[" + timestamp + "] [testMSP_pathfinder_flex] Starting flexible Pathfinder test");
    logFile.writeln("[" + timestamp + "] [testMSP_pathfinder_flex] This approach should work with mask structure: 2 unnamed groups");
    logFile.close();
    
    // Execute the flexible pathfinder script
    var mspScript = new File(scriptFolder + "/MSP1_pathfinder_flex.jsx");
    if (mspScript.exists) {
        $.evalFile(mspScript);
        
        if ($.global.MSP_success) {
            var message = "SUCCESS! Flexible Pathfinder masking completed.\n\nCreated files:";
            for (var i = 0; i < $.global.MSP_outputPaths.length; i++) {
                message += "\n• " + File($.global.MSP_outputPaths[i]).name;
            }
            message += "\n\nThe pattern has been cut at mask boundaries.";
            message += "\nCheck the Target folder for results.";
            alert(message);
        } else {
            alert("Flexible Pathfinder failed:\n" + $.global.MSP_errorMessage + 
                  "\n\nThis was our most robust approach.\nCheck log.txt for details.");
        }
    } else {
        alert("MSP1_pathfinder_flex.jsx not found!");
    }
})();