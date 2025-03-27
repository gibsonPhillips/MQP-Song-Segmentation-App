import { updateLabelPositions, updateSegmentAnnotationPositions, updateTimeline, globalState } from './globalData.js';
import htmlElements from './globalData.js';

let segmentAnnotationsPresent = false;

// Button click actions
htmlElements.closeDialogButton.onclick = () => {
    htmlElements.segmentDetailsDialog.close();
}

htmlElements.closeMarkerDialog.onclick = () => {
    htmlElements.markerDialog.close();
}

htmlElements.closeLoadTrackDialogButton.onclick = () => {
    htmlElements.loadTrackMenuDialog.close();
}

htmlElements.closeSaveTrackDialogButton.onclick = () => {
    htmlElements.saveTrackMenuDialog.close();
}

htmlElements.closeDeleteTrackDialogButton.onclick = () => {
    htmlElements.deleteTrackMenuDialog.close();
}

htmlElements.closeAreYouSureDialogButton.onclick = () => {
    htmlElements.areYouSureDialog.close();
}

htmlElements.closeErrorDialogButton.onclick = () => {
    htmlElements.errorDialog.close();
}

htmlElements.colorPreferencesButton.onclick = () => {
    htmlElements.colorLegend.textContent = '';

    // Set up saving of new color legends
    htmlElements.colorLegendSave.addEventListener('click', () => {
        console.log(htmlElements.colorLegendTextInput.value)
        console.log(htmlElements.colorLegendColorInput.value)
        globalState.colorLegendMap.set(htmlElements.colorLegendTextInput.value, htmlElements.colorLegendColorInput.value);

        const container = document.createElement('div');
        container.classList.add('color-input-picker');

        const text = document.createElement('span');
        text.textContent = htmlElements.colorLegendTextInput.value;

        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');
        colorBox.style.backgroundColor = htmlElements.colorLegendColorInput.value;    

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn');
        deleteBtn.textContent = "Delete";
        
        container.appendChild(text);
        container.appendChild(colorBox);
        container.appendChild(deleteBtn);
        htmlElements.colorLegend.appendChild(container);

        // Deleting label
        deleteBtn.addEventListener('click', () => {
            container.textContent = '';
            globalState.colorLegendMap.delete(htmlElements.colorLegendTextInput.value);
        });

        htmlElements.colorLegendTextInput.value = '';
    });

    // Set up color legend
    for (const [key, value] of globalState.colorLegendMap) {
        const container = document.createElement('div');
        container.classList.add('color-input-picker');

        const text = document.createElement('span');
        text.textContent = key;

        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');
        colorBox.style.backgroundColor = value;    

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn');
        deleteBtn.textContent = "Delete";
        
        container.appendChild(text);
        container.appendChild(colorBox);
        container.appendChild(deleteBtn);
        htmlElements.colorLegend.appendChild(container);

        // Deleting label
        deleteBtn.addEventListener('click', () => {
            container.textContent = '';
            globalState.colorLegendMap.delete(key);
        });
    }

    htmlElements.colorPreferenceDialog.showModal();
}

htmlElements.groupEditingButton.onclick = () => {
    globalState.groupEditingMode = !globalState.groupEditingMode;

    if (!globalState.groupEditingMode) {
        htmlElements.groupEditingButton.style.backgroundColor = "white";
    } else {
        htmlElements.groupEditingButton.style.backgroundColor = "rgb(255,197,61)";
    }
}

htmlElements.segmentAnnotationButton.onclick = () => {
    segmentAnnotationsPresent = !segmentAnnotationsPresent;
    if(segmentAnnotationsPresent) {
        htmlElements.segmentAnnotationButton.style.backgroundColor = "rgb(255,197,61)";
        document.querySelectorAll(".segment-annotation-container").forEach((container) => {
            container.setAttribute('style', 'height: 50px; visibility: visible;');
        });
    } else {
        htmlElements.segmentAnnotationButton.style.backgroundColor = "white";
        document.querySelectorAll(".segment-annotation-container").forEach((container) => {
            container.setAttribute('style', 'height: 0px; visibility: hidden;');
        });
    }
}

htmlElements.globalTimelineButton.onclick = () => {
    globalState.globalTimelineMode = !globalState.globalTimelineMode;
    if(globalState.globalTimelineMode) {
        htmlElements.globalTimelineButton.style.backgroundColor = "rgb(255,197,61)";
        // Update zooms and scrolls to first waveform
        if(globalState.wavesurferWaveforms[0].getDuration() > 0) {
            let currentScroll = globalState.wavesurferWaveforms[0].getScroll();        
            for (let i = 1; i < globalState.wavesurferWaveforms.length; i++) {               
                const waveform = globalState.wavesurferWaveforms[i];
                if(waveform.getDuration() > 0) {
                    waveform.setScroll(currentScroll);
                    waveform.zoom(globalState.currentZoom);
                    updateLabelPositions(i);
                    updateSegmentAnnotationPositions(i);
                    updateTimeline(i);
                }
            }
        }
    } else {
        htmlElements.globalTimelineButton.style.backgroundColor = "white";
    }
}

htmlElements.modifyBoundariesButton.onclick = () => {
    globalState.editBoundaryMode = !globalState.editBoundaryMode;

    if (!globalState.editBoundaryMode) {
        htmlElements.modifyBoundariesButton.style.backgroundColor = "white";
    } else {
        htmlElements.modifyBoundariesButton.style.backgroundColor = "rgb(255,197,61)";
    }

    for(let i = 0; i < htmlElements.regions.length; i++) {
        htmlElements.regions[i].regions.forEach(element => {
            if(globalState.regionType[i].get(element) === 'segment') {
                element.setOptions({
                    resize: globalState.editBoundaryMode
                });
            }
        });
    }
}

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
        // { button: htmlElements.algorithmsDropdown, menu: htmlElements.algorithmsDropdownContent },
        // { button: htmlElements.boundariesDropdown, menu: htmlElements.boundariesDropdownContent }
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