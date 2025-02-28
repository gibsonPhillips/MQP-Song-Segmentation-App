
// collapsing the windows button functionality
let coll = document.getElementsByClassName("collapsible");
let i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
}


// Track height slider stuff

let slider = document.getElementById('trackheight')
let root = document.documentElement; // Selects :root

slider.addEventListener("input", function () {
    let divHeight = parseInt(slider.value)

    root.style.setProperty("--track-height", divHeight + "px")
})

