/**
 * MSP-Hybrid Masking Script v1.4
 * (c) 2024-2025 MUNCH Studio — All rights reserved
 *
 * Hybrid version: drives Illustrator through ExtendScript but mimics
 * the same clipping-mask workflow as the original MSP panel.
 *
 * -- CHANGE LOG --
 * 1.4  (2025-05-30)  • Fix stacking order bug that caused
 *                     “The top item in the group must be a path item
 *                     to create a mask” on some documents
 * 1.3  (2024-12-12)  • Add stroke-outline preservation
 * ...
 */

/* ===========================  USER SETTINGS  ============================ */
#target "Illustrator"
#targetengine "session"
var MSP_preserveStrokes   = true;   // keep original outlines as separate item
var MSP_debug             = false;  // turn on verbose logging
/* ======================================================================= */

function MSP_log(msg) { if (MSP_debug) $.writeln(msg); }
function MSP_error(msg) { alert("MSP1_hybrid failed!\n\n" + msg); throw Error(msg); }

(function () {
    // -------- Helpers ----------------------------------------------------
    function log(s) { MSP_log("[MSP] " + s); }

    // -------- Main routine ----------------------------------------------
    function processMasking(docMask, docPattern, useCompoundPath) {
        try {
            var mainLayer      = docMask.layers[0];
            var patGroup       = docPattern.pageItems[0].duplicate(docMask, ElementPlacement.PLACEATEND);
            var disclaimers    = [];
            var strokeOutlines = [];

            /* ... earlier code unchanged ... */

            // Configure clipping path
            clipPath.filled   = false;
            clipPath.stroked  = false;
            clipPath.clipping = true;
            log("Clipping path configured (compound path: " + useCompoundPath + ")");

            // Create target layer and group
            log("Assembling final Target group...");
            var tgtLayer = docMask.layers.add();
            tgtLayer.name = "Target";
            var targG     = tgtLayer.groupItems.add();
            tgtLayer.visible = true;

            // Add items to group in correct order
            // 1. Pattern artwork at the very bottom
            patGroup.move(targG, ElementPlacement.PLACEATBEGINNING);

            // 2. Any disclaimer text above the pattern but below the clipping path
            for (var d = 0; d < disclaimers.length; d++) {
                if (disclaimers[d].isValid) {
                    disclaimers[d].move(targG, ElementPlacement.PLACEATEND);
                }
            }

            // 3. Clipping path LAST → becomes top-most item in stack
            clipPath.move(targG, ElementPlacement.PLACEATEND);   // or clipPath.zOrder(ZOrderMethod.BRINGTOFRONT);

            // Apply clipping
            targG.clipped = true;
            log("Target group assembled + clipping applied");

            // Add stroke outlines AFTER clipping is applied
            if (MSP_preserveStrokes && strokeOutlines.length > 0) {
                var strokeGroup = targG.groupItems.add();
                strokeGroup.name = "Preserved Strokes";
                for (var s = 0; s < strokeOutlines.length; s++) {
                    if (strokeOutlines[s].isValid) {
                        strokeOutlines[s].move(strokeGroup, ElementPlacement.PLACEATBEGINNING);
                    }
                }
                log("Added " + strokeOutlines.length + " stroke outlines");
            }

            // Hide old layer
            mainLayer.visible = false;

            /* ... rest of original script unchanged ... */

        } catch (err) {
            log("ERROR in processMasking: " + err.message);
            throw err;
        }
    }

    try {
        log("===== MSP1_hybrid.jsx STARTED =====");

        /* ... bootstrap code & UI dialog ... */

    } catch (mainErr) {
        MSP_error(mainErr.message);
    }
})();
