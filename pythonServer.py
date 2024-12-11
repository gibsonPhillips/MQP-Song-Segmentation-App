from flask import Flask, request, jsonify
from algorithms.librosaMusicSeg import runSegmentation

app = Flask(__name__)

# Create an endpoint
@app.route('/call-python', methods=['POST'])
def call_python():
    # Get data from the request
    input_data = request.json.get('name', 'Guest')
    # Call the Python function
    result = runSegmentation(input_data, "CQT", "KMeans", 4)
    # Return the result as a JSON response
    return jsonify([[int(a), float(b), float(c), int(d)] for a, b, c, d in result])

if __name__ == '__main__':
    app.run(debug=True)
