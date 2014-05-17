var geojson, candidates, template = Handlebars.compile($('#candidates_template').html());



function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 2,
    color: '#000000',
    dashArray: '',
    fillOpacity: 0.5
  });

  if (!L.Browser.ie && !L.Browser.opera) {
    layer.bringToFront();
  }

  updateInfo(layer.feature.properties);
}

function resetHighlight(e) {
  geojson.resetStyle(e.target);
  updateInfo();
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight
  });
}

function updateInfo(props) {
  $('#info').text(props ? 'Ausgewählter Wahlkreis: ' + props.bezirkname + '(' + props.cartodb_id + ')' : 'Addresse eingeben oder über Wahlkreis fahren')
  $('#candidates').html(props ? template(candidates[props.cartodb_id]) : '');
}


var map = L.map('map', {
  center: [51.95738424719267, 7.601165771484375],
  zoom: 11
});
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
}).addTo(map);


//Add the sections to the map
$.getJSON( "sections.json", function( json ) {
  geojson = L.geoJson(json, {
    style: {
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.3,
      fillColor: '#FEB24C'
    },
    onEachFeature: onEachFeature
  }).addTo(map);
});

//Load the candidates
$.getJSON( "candidates.json", function( json ) {
  candidates = json;
});

