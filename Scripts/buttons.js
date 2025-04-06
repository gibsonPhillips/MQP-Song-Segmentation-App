import { updateTrackName, updateTrackColors, updateLabelPositions, updateSegmentAnnotationPositions, updateTimeline, globalState } from './globalData.js';
import htmlElements from './globalData.js';

let segmentAnnotationsPresent = false;

let externalSaveColorPreferences = null;
export function setExternalSaveColorPreferences(fn) {
    externalSaveColorPreferences = fn;
}

let externalLoadColorPreferences = null;
export function setExternalLoadColorPreferences2(fn) {
    externalLoadColorPreferences = fn;
}

// Button click actions
htmlElements.closeDialogButton.onclick = () => {
    htmlElements.segmentDetailsDialog.close();
}

htmlElements.closeMarkerDialog.onclick = () => {
    htmlElements.markerDialog.close();
}

htmlElements.closeTitleChangeDialog.onclick = () => {
    htmlElements.titleChangeDialog.close();
}

htmlElements.colorPreferenceCloseDialog.onclick = () => {
    htmlElements.colorPreferenceDialog.close();
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

htmlElements.closeLoadProjectDialogButton.onclick = () => {
    htmlElements.loadProjectMenuDialog.close();
}

htmlElements.closeSaveProjectDialogButton.onclick = () => {
    htmlElements.saveProjectMenuDialog.close();
}

htmlElements.closeDeleteProjectDialogButton.onclick = () => {
    htmlElements.deleteProjectMenuDialog.close();
}

htmlElements.closeAreYouSureDialogButton.onclick = () => {
    htmlElements.areYouSureDialog.close();
}

htmlElements.closeErrorDialogButton.onclick = () => {
    htmlElements.errorDialog.close();
}

htmlElements.trackExpandButton.onclick = () => {
    if(htmlElements.tracksWindow.style.display === "none") {
        htmlElements.tracksWindow.style.display = "block";
        htmlElements.trackUnexpandButton.style.display = "none";
        htmlElements.trackTime.style.gridTemplateColumns = "215px auto";
    } else {
        htmlElements.tracksWindow.style.display = "none";
        htmlElements.trackUnexpandButton.style.display = "block";
        htmlElements.trackTime.style.gridTemplateColumns = "auto";
    }
}

htmlElements.trackUnexpandButton.onclick = () => {
    if(htmlElements.tracksWindow.style.display === "none") {
        htmlElements.tracksWindow.style.display = "block";
        htmlElements.trackUnexpandButton.style.display = "none";
        htmlElements.trackTime.style.gridTemplateColumns = "215px auto";
    } else {
        htmlElements.tracksWindow.style.display = "none";
        htmlElements.trackUnexpandButton.style.display = "block";
        htmlElements.trackTime.style.gridTemplateColumns = "auto";
    }
}

// Set up saving of new color legends
htmlElements.colorLegendSave.addEventListener('click', () => {
    globalState.colorLegendMap.set(htmlElements.colorLegendTextInput.value, {label: htmlElements.colorLegendTextInput.value, color: htmlElements.colorLegendColorInput.value + "50"});

    const container = document.createElement('div');
    container.classList.add('color-input-picker');

    const text = document.createElement('span');
    text.textContent = htmlElements.colorLegendTextInput.value;

    const colorBox = document.createElement('div');
    colorBox.classList.add('color-box');
    colorBox.style.backgroundColor = htmlElements.colorLegendColorInput.value + "50";

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

    // Update existing tracks
    for (let i = 0; i < globalState.labelColors.length; i++) {
        updateTrackColors(i);            
    }

    // Save color preferences
    externalSaveColorPreferences();

    htmlElements.colorLegendTextInput.value = '';
});

htmlElements.colorPreferencesButton.onclick = async () => {
    await externalLoadColorPreferences();
    htmlElements.colorLegend.textContent = '';

    // Set up color legend
    for (const [key, value] of globalState.colorLegendMap) {
        if(key !== '' && value !== 'undefined') {
            const container = document.createElement('div');
            container.classList.add('color-input-picker');
    
            const text = document.createElement('span');
            text.textContent = key;
    
            const colorBox = document.createElement('div');
            colorBox.classList.add('color-box');
            colorBox.style.backgroundColor = value.color;    
    
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
                externalSaveColorPreferences();
            });
        }
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

htmlElements.titleChangeSave.onclick = () => {
    updateTrackName(htmlElements.titleChangeInput.value, window.currentWaveformNum);
    htmlElements.titleChangeDialog.close();
}