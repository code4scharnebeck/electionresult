var geojson, electionResult, selectedParty, selectedSection;
var lastClickedLayer;

function highlightFeature(layer) {

  layer.setStyle({
    weight: 2,
    color: '#F00',
    dashArray: '',
    fillOpacity: 0.5
  });

  if (!L.Browser.ie && !L.Browser.opera) {
    layer.bringToFront();
  }

  redrawDetails(layer.feature.properties);
}

function resetHighlight(layer) {
  geojson.resetStyle(layer);
}

function clickUpdate(e) {

  if(lastClickedLayer) {
    resetHighlight(lastClickedLayer);
  }

  lastClickedLayer = e.target;
  map.fire('selectionChanged',{section:e.target.feature.properties.name, party:selectedParty});
}

function onEachFeature(feature, layer) {
  if (feature.geometry.type == "Polygon") {
    var name = feature.properties.name;
    layer.bindTooltip(name,{permanent: true});
  }
  layer.on({
    click : clickUpdate
  });
}

function onSelectionChanged(e) {
  selectedSection = e.section;
  selectedParty = e.party;

  // refresh section with party selection
  if (e.party != undefined && e.party != "undefined") {
    updateSections(e.party);
  }
  var layer = getLayerBySectionKey(e.section)
  lastClickedLayer = layer;
  highlightFeature(layer);

}
//---------------------------------------------------------------------------------------------------------------------
//needs clean up / standardisation
function redrawDetails(props) {
  selectedSection = props.name;
  var section = electionResult[getSectionKeyByOsmProperties(props)];
  $('#info').text(props ? props.name : 'Gemeinde anklicken')
  // bar chart
  var width = parseInt(d3.select('#electionResult').style('width'), 10)-10;
  var x = d3.scaleLinear()
    .domain([0, d3.max(d3.entries(section.parties), function(d) {return +d.value.count; })])
    .range([0, width]);
  var test = d3.entries(section.parties);
  d3.select("#electionResult").selectAll("div").remove();
  d3.select("#electionResult").selectAll("div").data(test.sort(function(a,b) { return +b.value.count - +a.value.count; }))
    .enter().append("div")
    .each(function(d) {
      if (d.value.name == selectedParty) {
        d3.select(this).attr("class","clickable selected");
      }else{
        d3.select(this).attr("class","clickable");
      }
    })
    .html(function(d) { return "<div><a href=\"#\">"+ d.value.name+"</a>"+
      " "+d.value.count+" Stimmen ("+d.value.relative_count+"%)</div>"+
        "<div class=\"bar\" style=\"width: "+x(d.value.count)+"px\"></div>"
    })
    .on("click", function(){
      $(".clickable").removeClass("selected");
      $(this).addClass("selected");      //add the class to the clicked element
      var partyName = arguments[0].key;
      map.fire('selectionChanged',{section:selectedSection,party:partyName});
    });
}

function updateSections(party) {
  //get max min percentage (for better coloring)
  var maxProcent = 0, minProcent = 1;
  for (var sectionKey in electionResult) {
    if (sectionKey == "meta") {
      continue;
    }
    var section = electionResult[sectionKey];
    var procent = section.parties[party].count/section.total_count;
    if (procent > maxProcent) {
      maxProcent = procent;
    }
    if (procent<minProcent) {
      minProcent = procent;
    }
  }

  for (var layerId in geojson._layers) {
    var layer = geojson._layers[layerId];
    var osmProps = layer.feature.properties;
    if (osmProps === undefined) {
      continue;
    }
    var sectionKey = getSectionKeyByOsmProperties(osmProps);
    var section = electionResult[sectionKey];
    var procent = section.parties[party].count/section.total_count;
    var coloringPercentage = (procent - minProcent) / (maxProcent - minProcent);
    layer.setTooltipContent(Math.round(procent*100) + " %");
    var color = fade('FC9300',"ffffff",coloringPercentage);
    layer.setStyle({
      weight: 2,
      opacity: 1,
      fillOpacity: 0.4,
      fillColor: '#'+color
    });
  }
}

function getSectionKeyByOsmProperties(props) {
  var sectionKey = props["name"];
  return sectionKey;
}

function getLayerBySectionKey(section) {
  for (var layerId in geojson._layers) {
    var layer = geojson._layers[layerId];
    var osmProps = layer.feature.properties;
    if (osmProps === undefined) {
      continue;
    }
    var sectionKey = getSectionKeyByOsmProperties(osmProps);
    if (sectionKey == section) {
      return layer;
    }
  }
  return undefined;
}

/**
 * creates a defined data structure used to display content
 * change it depending on your input
 */
function prepareRawdata(rawdata) {
  var preparedData = [];
  var noPartyColumns = {"Name":1,"Gültige Stimmen":1,"Briefbez.":1,"Nr-Ebene2":1,"Nr-Ebene3":1,"Ungült. Stimmen":1,"Volksabstimmung":1,"Wahlb. insges.":1,"Wahlb. mit Sperrv.":1,"Wahlb. nach § 24 Abs.2 EuWO":1,"Wahlb. ohne Sperrv.":1,"Wähler":1,"dav. mit Wahlschein":1,"_id":1,"Gemeinde":1,"Wahlberechtigte":1};

  for (i = 0; i < rawdata.length; ++i) {
    var rawdataRow = rawdata[i];
    var parties = {};
    for (var k in rawdataRow) {
      if (rawdataRow.hasOwnProperty(k) && noPartyColumns[k]==null) {
        //parties.push({
        parties[k] = {
          "name":k, 
          "count": rawdataRow[k], 
          "relative_count":Math.round(100*rawdataRow[k]/rawdataRow["Wähler"]/3)
          //});
        };
      }
    }
    var section = {
      "name":rawdataRow["Gemeinde"],
      "total_count":rawdataRow["Wähler"]*3,
      "theoretical_total_count": rawdataRow["Wahlberechtigte"]*3,
      "parties":parties
    };
    var sectionKey = rawdataRow["Gemeinde"];
    preparedData[sectionKey] = section;
    preparedData["meta"] = {"attribution": "Datenquelle: <a href=\"http://wahl.luenecom.de/scharnebeck/Samtgemeinderat2016.html\">Samtgemeinde Scharnebeck</a>"};
    //Datenquelle: Landkreis Lüneburg -<a href="http://open.lklg.net">http://open.lklg.net</a>
  }
  return preparedData;
}

function onElectionResultIsReady(electionResult) {
  var attr = L.control.attribution().addTo(map);
  attr.addAttribution(electionResult.meta["attribution"]);
}
//
//Load the Result
//$.getJSON( "ergebnis.json", function( json ) {
//  electionResult = json;
//  onElectionResultIsReady(electionResult);
//});
d3.csv("sg_2016.csv", function(data) {
  electionResult=prepareRawdata(data);
  onElectionResultIsReady(electionResult);
});
//---------------------------------------------------------------------------------------------------------------------

var map = L.map('map', {
  center: [53.3149,10.5414],
  zoom: 11,
  attributionControl: false
});
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);

map.on('selectionChanged', this.onSelectionChanged, this);

var hash = new HashComponent();
var connector = new L.SelectionConnector(map,hash);


//Add the sections to the map
$.getJSON( "sections.geojson", function( json ) {
  geojson = L.geoJson(json, {
    style: {
      weight: 2,
      opacity: 1,
      color: '#000',
      fillOpacity: 0.3,
      fillColor: '#FEB24C'
    },
    onEachFeature: onEachFeature,
    filter: function (geoJsonFeature) {
      return (geoJsonFeature.geometry.type == "Polygon");
    }

  }).addTo(map);
});

// http://stackoverflow.com/questions/16360533/calculate-color-hex-having-2-colors-and-percent-position
function fade(color1, color2,ratio) {
  var hex = function(x) {
    x = x.toString(16);
    return (x.length == 1) ? '0' + x : x;
  };

  var r = Math.ceil(parseInt(color1.substring(0,2), 16) * ratio + parseInt(color2.substring(0,2), 16) * (1-ratio));
  var g = Math.ceil(parseInt(color1.substring(2,4), 16) * ratio + parseInt(color2.substring(2,4), 16) * (1-ratio));
  var b = Math.ceil(parseInt(color1.substring(4,6), 16) * ratio + parseInt(color2.substring(4,6), 16) * (1-ratio));

  var middle = hex(r) + hex(g) + hex(b);
  return middle;
}

