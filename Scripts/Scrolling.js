// Sync scrolling between two separated scroll panes
const tracks = document.getElementById('tracks');
const timeline = document.getElementById('timeline');

let isSyncingScroll = false;

// this flashes the functionality so scrolling 
// isn't detected as a scroll action to sync
function syncScroll(source, target) {
    if (isSyncingScroll) return;
    isSyncingScroll = true;
    target.scrollTop = source.scrollTop;
    isSyncingScroll = false;
}

tracks.addEventListener('scroll', () => syncScroll(tracks, timeline));
// timeline.addEventListener('scroll', () => syncScroll(timeline, tracks));


