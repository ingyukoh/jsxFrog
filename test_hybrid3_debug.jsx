/*********************************************************
 *  test_hybrid3_debug.jsx
 *  Test driver for MSP1_hybrid3_debug.jsx
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
    
    // Execute debug version
    var mspScript = new File(scriptFolder + "/MSP1_hybrid3_debug.jsx");
    if (mspScript.exists) {
        $.evalFile(mspScript);
        
        if ($.global.MSP_success) {
            alert("Debug run completed successfully.\nCheck log.txt for detailed diagnostics.");
        } else {
            alert("Debug run failed:\n" + $.global.MSP_errorMessage + "\n\nCheck log.txt for diagnostics.");
        }
    } else {
        alert("MSP1_hybrid3_debug.jsx not found!");
    }
})();