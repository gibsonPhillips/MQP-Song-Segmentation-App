// runs the segmentation algorithm
async function segment() {
    const inputName = "C:\\Users\\sethb\\OneDrive - Worcester Polytechnic Institute (wpi.edu)\\gr-MQP-MLSongMap\\General\\Songs and Annotations\\Songs\\0043Carly Rae Jepsen  Call Me Maybe.wav"; // Example input data
    try {
        // Send a POST request to the Python server
        const response = await fetch('http://127.0.0.1:5000/call-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: inputName }),
        });

        // Parse the JSON response
        const data = await response.json();
        updateSegmentElementsList(data)
    } catch (error) {
        console.error('Error:', error);
    }
}

// Updates the segment elements and display in table
function updateSegmentElementsList(elements) {
    const tbody = document.getElementById('segment-elements');
    tbody.innerHTML = ''
    elements.forEach(element => {
        let tr = document.createElement('tr');
        element.forEach(item => {
            let td = document.createElement('td');
            td.textContent = item
            tr.appendChild(td)
        });
        tbody.appendChild(tr);
    });
}

document.getElementById("segment-button").addEventListener("click", segment);