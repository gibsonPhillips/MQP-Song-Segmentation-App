import { updateLabelPositions, updateTimeline, globalState } from './globalData.js';
import htmlElements from './globalData.js';

// Button click actions
htmlElements.segmentDetailsButton.onclick = () => {
    htmlElements.segmentDetailsDialog.showModal();
}

htmlElements.closeDialogButton.onclick = () => {
    htmlElements.segmentDetailsDialog.close();
    htmlElements.removeBoundaryDialog.close();
}

htmlElements.closeLoadDialogButton.onclick = () => {
    htmlElements.loadMenuDialog.close();
}

htmlElements.closeSaveDialogButton.onclick = () => {
    htmlElements.saveMenuDialog.close();
}

htmlElements.closeDeleteDialogButton.onclick = () => {
    htmlElements.deleteMenuDialog.close();
}

htmlElements.closeErrorDialogButton.onclick = () => {
    htmlElements.errorDialog.close();
}

htmlElements.playButton0.onclick = () => {
    if(globalState.wavesurferWaveforms[0].getDuration() > 0) {
        globalState.wavesurferWaveforms[0].playPause()
        if(globalState.wavesurferWaveforms[0].isPlaying()) {
            // pause icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/pause-solid.svg" alt="Pause Button">';
        } else {
            // play icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/play-solid.svg" alt="Play Button">';
        }
    }
}

htmlElements.forwardButton0.onclick = () => {
    globalState.wavesurferWaveforms[0].skip(15)
}

htmlElements.backButton0.onclick = () => {
    globalState.wavesurferWaveforms[0].skip(-15)
}

htmlElements.playButton1.onclick = () => {
    if(globalState.wavesurferWaveforms[1].getDuration() > 0) {
        globalState.wavesurferWaveforms[1].playPause()
        if(globalState.wavesurferWaveforms[1].isPlaying()) {
            // pause icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/pause-solid.svg" alt="Pause Button">';
        } else {
            // play icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/play-solid.svg" alt="Play Button">';
        }
    }
}

htmlElements.forwardButton1.onclick = () => {
    globalState.wavesurferWaveforms[1].skip(15)
}

htmlElements.backButton1.onclick = () => {
    globalState.wavesurferWaveforms[1].skip(-15)
}

htmlElements.playButton2.onclick = () => {
    if(globalState.wavesurferWaveforms[2].getDuration() > 0) {
        globalState.wavesurferWaveforms[2].playPause()
        if(globalState.wavesurferWaveforms[2].isPlaying()) {
            // pause icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/pause-solid.svg" alt="Pause Button">';
        } else {
            // play icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/play-solid.svg" alt="Play Button">';
        }
    }
}

htmlElements.forwardButton2.onclick = () => {
    globalState.wavesurferWaveforms[2].skip(15)
}

htmlElements.backButton2.onclick = () => {
    globalState.wavesurferWaveforms[2].skip(-15)
}

htmlElements.playButton3.onclick = () => {
    if(globalState.wavesurferWaveforms[3].getDuration() > 0) {
        globalState.wavesurferWaveforms[3].playPause()
        if(globalState.wavesurferWaveforms[3].isPlaying()) {
            // pause icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/pause-solid.svg" alt="Pause Button">';
        } else {
            // play icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/play-solid.svg" alt="Play Button">';
        }
    }
}

htmlElements.forwardButton3.onclick = () => {
    globalState.wavesurferWaveforms[3].skip(15)
}

htmlElements.backButton3.onclick = () => {
    globalState.wavesurferWaveforms[3].skip(-15)
}

htmlElements.playButton4.onclick = () => {
    if(globalState.wavesurferWaveforms[4].getDuration() > 0) {
        globalState.wavesurferWaveforms[4].playPause()
        if(globalState.wavesurferWaveforms[4].isPlaying()) {
            // pause icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/pause-solid.svg" alt="Pause Button">';
        } else {
            // play icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/play-solid.svg" alt="Play Button">';
        }
    }
}

htmlElements.forwardButton4.onclick = () => {
    globalState.wavesurferWaveforms[4].skip(15)
}

htmlElements.backButton4.onclick = () => {
    globalState.wavesurferWaveforms[4].skip(-15)
}

// htmlElements.zoomInButton.onclick = () => {
//     globalState.currentZoom += 10;
//     globalState.wavesurferWaveforms[0].zoom(globalState.currentZoom);
//     updateTimeline(0);
// }

// htmlElements.zoomOutButton.onclick = () => {
//     globalState.currentZoom -= 10;
//     globalState.wavesurferWaveforms[0].zoom(globalState.currentZoom);
//     updateTimeline(0);
// }

htmlElements.groupEditingButton.onclick = () => {
    globalState.groupEditingMode = !globalState.groupEditingMode;

    if (!globalState.groupEditingMode) {
        htmlElements.groupEditingButton.style.backgroundColor = "white";
    } else {
        htmlElements.groupEditingButton.style.backgroundColor = "rgb(255,197,61)";
    }
}

// Update labels on scroll
globalState.wavesurferWaveforms[0].on("scroll", () => {
    updateLabelPositions(0);
});

globalState.wavesurferWaveforms.forEach((wavesurfer, index) => {
    // Update labels on scroll
    wavesurfer.on("scroll", () => {
        updateLabelPositions(index);
    });

    // Update labels and timeline on zoom
    wavesurfer.on("zoom", (newPxPerSec) => {
        globalState.currentZoom = newPxPerSec;
        updateLabelPositions(index);
        updateTimeline(index);
    });
});

/*
document.getElementById("thisisn").addEventListener("click", function() {

    // resizes the whole mod window
    document.querySelectorAll("#modifiers").forEach(item => {
        item.style.width = item.style.width === "30px" ? "15%" : "30px";
    });

});
*/

// collapsing functions
// toggles every time the x button is clicked
document.getElementById("mod").addEventListener("click", function() {

    // cull
    document.querySelectorAll(".cull").forEach(item => {
        item.style.display = "none"
    });

    // resizes the whole mod window
    document.querySelectorAll("#modifiers").forEach(item => {
        item.style.width = item.style.width === "50px" ? "15%" : "50px";
    });

    // swaps out buttons for collapsing and expanding
    // also cull other items in mod window
    document.getElementById("expand").style.display = "flex"
    document.getElementById("expand-button").style.display = "flex"
    document.getElementsByClassName("cull")[0].style.setProperty("display","none")

    // failed experiment
    // document.querySelectorAll("#modifiers").forEach(item => {
    //     item.style.display = item.style.display === "none" ? "flex" : "none";

    // gets rid of the extra stuff in the way
    // document.querySelectorAll(".cull").forEach(item => {
    //     item.style.display = item.style.display === "none" ? "flex" : "none";
    // });

    // resizes the button so it doesn't get squashed
    // document.getElementById("mod").style.setProperty("max-width","unset")

    // document.getElementById("mod").style.setProperty("width","30px")

});


document.getElementById("expand").addEventListener("click", function() {
        
    // uncull
    document.querySelectorAll(".cull").forEach(item => {
        item.style.display = "flex"
    });

    // reset the window size
    document.querySelectorAll("#modifiers").forEach(item => {
        item.style.width = "15%";
    });

    // swap out the expand button for the collapse button
    document.getElementById("expand").style.display = "none"
    document.getElementById("expand-button").style.display = "none"
    document.getElementsByClassName("cull")[0].style.setProperty("display","flex")

});

// Setup dropdown buttons
document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = [
        { button: htmlElements.fileDropdown, menu: htmlElements.fileDropdownContent },
        { button: htmlElements.algorithmsDropdown, menu: htmlElements.algorithmsDropdownContent },
        { button: htmlElements.boundariesDropdown, menu: htmlElements.boundariesDropdownContent }
    ];

    dropdowns.forEach(({ button, menu }) => {
        // Move dropdown outside restrictive parent
        document.body.appendChild(menu);

        function showDropdown() {
            const rect = button.getBoundingClientRect();
            menu.style.position = "absolute";
            menu.style.left = `${rect.left}px`;
            menu.style.top = `${rect.bottom}px`;
            menu.style.display = "block";
        }

        function hideDropdown(event) {
            // Ensure dropdown only hides when cursor leaves both button & menu
            if (!button.contains(event.relatedTarget) && !menu.contains(event.relatedTarget)) {
                menu.style.display = "none";
            }
        }

        button.addEventListener("mouseenter", showDropdown);
        button.addEventListener("mouseleave", hideDropdown);
        menu.addEventListener("mouseleave", hideDropdown);
        menu.addEventListener("mouseenter", showDropdown);
    });
});