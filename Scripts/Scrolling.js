// Sync scrolling between two separated scroll panes
const Tracks = document.getElementById('tracks');
const Waveforms = document.getElementById('waveforms');

let isSyncingScroll = false;

// this flashes the functionality so scrolling 
// isn't detected as a scroll action to sync
function syncScroll(source, target) {
    if (isSyncingScroll) return;
    isSyncingScroll = true;
    target.scrollTop = source.scrollTop;
    isSyncingScroll = false;
}

Tracks.addEventListener('scroll', () => syncScroll(Tracks, Waveforms));
Waveforms.addEventListener('scroll', () => syncScroll(Waveforms, Tracks));