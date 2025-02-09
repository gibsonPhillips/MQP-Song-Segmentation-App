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

htmlElements.playButton.onclick = () => {
    if(htmlElements.wavesurfer.getDuration() > 0) {
        htmlElements.wavesurfer.playPause()
        if(htmlElements.wavesurfer.isPlaying()) {
            // pause icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/pause-solid.svg" alt="Pause Button">';
        } else {
            // play icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/play-solid.svg" alt="Play Button">';
        }
    }
}

htmlElements.forwardButton.onclick = () => {
    htmlElements.wavesurfer.skip(15)
}

htmlElements.backButton.onclick = () => {
    htmlElements.wavesurfer.skip(-15)
}

htmlElements.zoomInButton.onclick = () => {
    globalState.currentZoom += 10;
    htmlElements.wavesurfer.zoom(globalState.currentZoom);
    updateTimeline();
}

htmlElements.zoomOutButton.onclick = () => {
    globalState.currentZoom -= 10;
    htmlElements.wavesurfer.zoom(globalState.currentZoom);
    updateTimeline();
}

// Update labels on scroll
htmlElements.wavesurfer.on("scroll", () => {
    updateLabelPositions();
});

// Update labels on zoom
htmlElements.wavesurfer.on("zoom", (newPxPerSec) => {
    globalState.currentZoom = newPxPerSec;
    updateLabelPositions();
    updateTimeline();
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