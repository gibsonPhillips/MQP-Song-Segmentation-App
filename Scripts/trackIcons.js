fetch("segmenting_icon.svg")
    .then(response => response.text())
    .then(svg => {
        document.getElementById("icon-container").innerHTML = svg;
    })
    .catch(error => console.error("Error loading SVG:", error));