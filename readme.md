# Song Slicer

## Purpose
This 1.0 app can be used by people with no programming experience to segment songs into its form sections. 

## dev
- Download latest node and npm (think current is around 23.3.0 and 10.9.0)
- Run npm install node
- To run the app, use "npm start"

### css
Using System.css project
- should be all set to be used offline. If there's gaps in the ui use the internet version with the link.
- install using some command
- alternatively just be connected to the internet (not ideal for 1.0)
- Icons used from https://iconoir.com/

### Python
- Run pip install for the following: numpy librosa flask waitress scipy sklearn ipython
- The application uses a Python Flask server to run Python code
- The Python code is for running the segmentatation algorithms from Librosa
- The Python server should start up and stop automatically with the application. Sometimes, it may take a little while for to start up at the beginning
