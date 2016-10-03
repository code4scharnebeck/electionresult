# Election Result

## About
Map to visualize the election result of 'Samtgemeinderatswahl' in Scharnebeck 2016. 

Created with
* Leaflet 1.0.0-rc3
* bootstrap/3.3.7
* ...

Polygons from [Openstreetmap]("http://overpass-turbo.eu/s/iY9") 
Data copied from <a href="http://wahl.luenecom.de/scharnebeck/Samtgemeinderat2016.html">here</a>.

## Demo
 [![Foo](preview.png)](http://kartenkarsten.github.io/electionresult/)

## Use it
* save osm boundries as `sections.geojson` with [this tool]("http://overpass-turbo.eu/s/iY9")
* fill a csv-file with the election result
* change the method `prepareRawdata` to create an defined `electionResult` object
* change map center + zoom
* change text on `index.html`

