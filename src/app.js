class Building {
  constructor(wikidataelement) {
    this.lat = wikidataelement.hasOwnProperty("lat")
      ? wikidataelement.lat.value
      : "";
    this.lon = wikidataelement.hasOwnProperty("lon")
      ? wikidataelement.lon.value
      : "";
    this.label = wikidataelement.itemLabel.value;
    this.description = wikidataelement.hasOwnProperty("itemDescription")
      ? wikidataelement.itemDescription.value
      : "";
    this.wikidata = wikidataelement.item.value;
    this.qid = wikidataelement.item.value.replace(
      "http://www.wikidata.org/entity/",
      ""
    );
    this.iconURL = wikidataelement.hasOwnProperty("types")
      ? this.determineIconURL(wikidataelement)
      : "";
    this.inception = wikidataelement.hasOwnProperty("year")
      ? wikidataelement.year.value
      : "?";
    this.kulturnav = wikidataelement.hasOwnProperty("kulturnav")
      ? wikidataelement.kulturnav.value
      : "";
    this.imageThumb = wikidataelement.hasOwnProperty("thumb")
      ? wikidataelement.thumb.value
      : "assets/placeholder-small.png";
    this.locationLabel = wikidataelement.hasOwnProperty("locationLabel")
      ? wikidataelement.locationLabel.value
      : "";
    this.image = wikidataelement.hasOwnProperty("image")
      ? wikidataelement.image.value
      : "";
    this.imagePath = wikidataelement.hasOwnProperty("image")
      ? "https://commons.wikimedia.org/wiki/File:" +
        wikidataelement.image.value.split("Special:FilePath/").pop()
      : "";
    this.dob = wikidataelement.hasOwnProperty("dob")
      ? this.processDate(wikidataelement.dob.value)
      : "";
    this.dod = wikidataelement.hasOwnProperty("dod")
      ? this.processDate(wikidataelement.dod.value)
      : "";
    this.article = wikidataelement.hasOwnProperty("article")
      ? wikidataelement.article.value
      : "";
    this.commonscat = wikidataelement.hasOwnProperty("commonscat")
      ? wikidataelement.commonscat.value
      : "";
    this.dimu = wikidataelement.hasOwnProperty("dimu")
      ? wikidataelement.dimu.value
      : "";
    this.viaf = wikidataelement.hasOwnProperty("viaf")
      ? wikidataelement.viaf.value
      : "";
    this.natmus = wikidataelement.hasOwnProperty("natmus")
      ? wikidataelement.natmus.value
      : "";
    this.ksamsok = wikidataelement.hasOwnProperty("ksamsok")
      ? wikidataelement.ksamsok.value
      : "";
  }
  processDate = function (wikidataTimestamp) {
    return wikidataTimestamp.substring(0, 10);
  };
  determineIconURL = function (wikidataelement) {
    var buildingIconURL = iconDict["default"];
    var instanceTypes = wikidataelement.types.value.split(", ");
    for (let i = 0; i < instanceTypes.length; i++) {
      var rawType = instanceTypes[i].split("/");
      var qID_ofType = rawType[rawType.length - 1];
      for (const [key, value] of Object.entries(qDict)) {
        if (value.includes(qID_ofType)) {
          buildingIconURL = iconDict[key];
        }
      }
    }
    return buildingIconURL;
  };
}

const endpointUrl = "https://query.wikidata.org/sparql";

const CartoDB_Voyager = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  }
);

function makeLink(url, text) {
  return "<a href='" + url + "' target='_blank'>" + text + "</a>";
}

function makeQueryPersonInfo(qid) {
  return queryDict["personInfo"].replace("__qid__", qid);
}

function makeQueryPersonBuildings(qid) {
  return queryDict["personBuildings"].replace("__qid__", qid);
}

function makeSPARQLQuery(endpointUrl, query, architect, doneCallback) {
  var settings = {
    headers: {
      Accept: "application/sparql-results+json",
    },
    data: {
      query: query,
    },
  };
  return $.ajax(endpointUrl, settings).then(doneCallback);
}

function getDataFromAPI(someurl, doneCallback) {
  var settings = {
    headers: {
      Accept: "application/json",
    },
  };
}

function getThumbPath(filename) {
  apiPath =
    "https://commons.wikimedia.org/w/api.php?action=query&titles=Image:" +
    filename +
    "&prop=imageinfo&iiprop=url&iiurlwidth=200&format=json&origin=*";
  getDataFromAPI(apiPath, function (data) {
    pages = data.query.pages;

    pagekey = Object.keys(data.query.pages)[0];

    return pages[pagekey]["imageinfo"][0]["thumburl"];
  });
}

$(document).ready(function () {
  jQuery.ui.autocomplete.prototype._resizeMenu = function () {
    var ul = this.menu.element;
    ul.outerWidth(this.element.outerWidth());
  };

  var popup = L.popup({
    autoPan: true,
  });
  var mymap = L.map("mapdiv", {
    center: [61, 15],
    zoom: 5,
  });
  var OSM_tile = L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png");

  mymap.addLayer(CartoDB_Voyager);

  var buildingsLayer = L.layerGroup().addTo(mymap);

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  if (urlParams.get("person")) {
    architect = urlParams.get("person");
  } else {
    architect = "Q6044893";
  }

  runArchitect(architect, buildingsLayer);

  $(document).on("change", "#architectSelector", function (e) {
    var valueToFind = $(this).val();
    if (valueToFind.startsWith("Q")) {
      var url = new URL(window.location.href);
      url.searchParams.set("person", valueToFind);
      history.pushState({}, null, url.href);
      runArchitect(valueToFind, buildingsLayer);
    }
  });

  $("#architect-search")
    .autocomplete({
      source: function (request, response) {
        $.ajax({
          url:
            "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&uselang=sv&type=item&continue=0&search=" +
            request.term,
          dataType: "jsonp",

          success: function (data) {
            response(
              $.map(data.search, function (value, key) {
                return {
                  label: value.label,
                  description: value.description,
                  value: value.id,
                };
              })
            );
          },
        });
      },
      minLength: 3,
      close: function (event, ui) {
        $("#architect-search")[0].value = "";
      },
      focus: function (event, ui) {
        return false;
      },
      select: function (event, ui) {
        var url = new URL(window.location.href);
        url.searchParams.set("person", ui.item.value);
        history.pushState({}, null, url.href);

        runArchitect(ui.item.value, buildingsLayer);
        return false;
      },
    })
    .autocomplete("instance")._renderItem = function (ul, item) {
    return $("<li class='each'></li>")
      .data("item.autocomplete", item)
      .append(
        "<div class='acItem'><span class='name'>" +
          item.label +
          "</span><br><span class='desc'>" +
          item.description +
          "</span></div>"
      )
      .appendTo(ul);
  };

  function runArchitect(qid, buildingsLayer) {
    $("#building-list").empty();
    $("#notes").empty();
    mapArchitect(qid, buildingsLayer);
    fillArchitectInfo(qid);
  }

  function deduplicateSPARQLResult(data) {
    var cleanData = [];
    var uniqueQ = new Set();
    bindings = data.results.bindings;
    for (let index = 0; index < bindings.length; ++index) {
      var Q = bindings[index].item.value;
      if (!uniqueQ.has(Q)) {
        uniqueQ.add(bindings[index].item.value);
        cleanData.push(bindings[index]);
      }
    }
    return cleanData;
  }

  function fillArchitectInfo(architectToFetch) {
    makeSPARQLQuery(
      endpointUrl,
      makeQueryPersonInfo(architectToFetch),
      architectToFetch,
      function (data) {
        data = deduplicateSPARQLResult(data);
        data.forEach((element) => {
          const person = new Building(element);

          $("#architect-portrait").attr("src", person.imageThumb);
          if (person.imagePath.length > 1) {
            $("#architect-portrait").wrap(
              $("<a>", {
                href: person.imagePath,
                target: "_blank",
                id: "architect-portrait-link",
              })
            );
          } else {
            $("#architect-portrait-link").contents().unwrap();
          }
          $("#architect-name")
            .text(person.label)
            .append("<span id='architect-name-q'> (" + person.qid + ")</span>");
          $("#architect-description").text(person.description);
          if (!person.dob.length == 0) {
            $("#architect-dob").text("* " + person.dob);
          } else {
            $("#architect-dob").text("");
          }

          if (!person.dod.length == 0) {
            $("#architect-dod").text("* " + person.dod);
          } else {
            $("#architect-dod").text("");
          }

          var authorityLinks = [];
          var wikimediaLinks = [];

          if (!person.viaf.length == 0) {
            authorityLinks.push(
              "<b>VIAF:</b> " +
                makeLink("https://viaf.org/viaf/" + person.viaf, person.viaf)
            );
          }

          if (!person.dimu.length == 0) {
            authorityLinks.push(
              "<b>Digitalt Museum:</b> " +
                makeLink(
                  "https://digitaltmuseum.org/" + person.dimu,
                  person.dimu
                )
            );
          }

          if (!person.kulturnav.length == 0) {
            authorityLinks.push(
              "<b>Kulturnav:</b> " +
                makeLink(
                  "https://kulturnav.org/" + person.kulturnav,
                  person.kulturnav
                )
            );
          }

          if (!person.natmus.length == 0) {
            authorityLinks.push(
              "<b>Nationalmuseum:</b> " +
                makeLink(
                  "https://collection.nationalmuseum.se/sv/artists/artist/" +
                    person.natmus,
                  person.natmus
                )
            );
          }

          if (!person.article.length == 0) {
            wikimediaLinks.push(makeLink(person.article, "Wikipedia"));
          }

          if (!person.commonscat.length == 0) {
            wikimediaLinks.push(
              makeLink(
                "https://commons.wikimedia.org/wiki/Category:" +
                  encodeURIComponent(person.commonscat),
                "Wikimedia Commons"
              )
            );
          }

          wikimediaLinks.push(makeLink(person.wikidata, "Wikidata"));

          $("#authority-data").text("");
          $("#wikimedia-data").text("");
          $("#authority-data").append(authorityLinks.join(" · "));
          $("#wikimedia-data").append(wikimediaLinks.join(" · "));
        });
      }
    );
  }

  function enhanceMarker(marker, building) {
    marker.bindTooltip(building.label, {
      direction: "top",
    });

    var popup = L.popup({
      qid: building.qid,
    });

    var commonsLink = "";
    var kulturnavLink = "";
    var ksamsokLink = "";
    var wikipediaLink = "";

    var wikidataLink = makeLink(
      building.wikidata,
      "<img src=" + iconDict["wikidata"] + ">"
    );

    if (building.article.length > 0) {
      wikipediaLink = makeLink(
        building.article,
        "<img src=" + iconDict["wikipedia"] + ">"
      );
    }

    if (!building.kulturnav.length == 0) {
      kulturnavLink = makeLink(
        "https://kulturnav.org/" + building.kulturnav,
        building.kulturnav
      );
      kulturnavLink = "<p>" + kulturnavLink + "</p>";
    }

    if (!building.ksamsok.length == 0) {
      ksamsokLink = makeLink(
        "https://kulturarvsdata.se/" + building.ksamsok,
        building.ksamsok
      );
      ksamsokLink = "<p>" + ksamsokLink + "</p>";
    }

    if (!building.commonscat.length == 0) {
      commonsLink = makeLink(
        "https://commons.wikimedia.org/wiki/Category:" +
          encodeURIComponent(building.commonscat),
        "<img src=" + iconDict["commons"] + ">"
      );
    }

    if (building.imagePath.length == 0) {
      var imageInPopup = "<img src=" + building.imageThumb + ">";
    } else {
      var imageInPopup =
        "<a href=" +
        building.imagePath +
        " target='_blank'><img src=" +
        building.imageThumb +
        "></a>";
    }

    var popupContent = `
          <div class='building-info'>
            <h4>${building.label}</h4>
      
            <figure class='building-thumbnail'>
            ${imageInPopup}
            <figcaption>
              ${wikidataLink} ${commonsLink} ${wikipediaLink}
              </figcaption>
            </figure>
            <p>${building.description}</p>
            <p>Uppförd: ${building.inception}</p>
            ${kulturnavLink}
            ${ksamsokLink}
            </div>
            `;

    popup.setContent(popupContent);
    marker.bindPopup(popup);
  }

  function activateBuildingList() {
    $("#building-table").on("click", "td", function () {
      var id_to_find = $(this).attr("id");
      mymap.eachLayer(function (marker) {
        if (marker instanceof L.Marker) {
          if (marker.options.qid === id_to_find) {
            var markerPosition = marker.getLatLng();
            mymap.flyTo([markerPosition.lat, markerPosition.lng], 17, {
              duration: 1.5,
            });
            marker.openPopup();
          }
        }
      });
    });
  }

  function populateInfo(buildings) {
    var hasInception = buildings.filter((item) => item.inception.length > 1);
    var timelineContainer = document.getElementById("notes");
    var datasetArray = [];

    hasInception.forEach((element) => {
      var buildingElement = {
        id: "timeline-" + element.qid,
        start: new Date(element.inception),
        className: "timelineItem",
        content: "<h4>" + element.label + "</h4>" + element.description,
      };
      datasetArray.push(buildingElement);
    });

    var items2 = new vis.DataSet(datasetArray);
    var options = {
      stack: true,
      height: "30vh",
    };

    var timeline = new vis.Timeline(timelineContainer, items2, options);
    timeline.on("click", function (properties) {
      var id_to_find = properties.item.split("-")[1];

      mymap.eachLayer(function (marker) {
        if (marker instanceof L.Marker) {
          if (marker.options.qid === id_to_find) {
            var markerPosition = marker.getLatLng();
            mymap.flyTo([markerPosition.lat, markerPosition.lng], 17, {
              duration: 1.5,
            });
            marker.openPopup();
          }
        }
      });
    });
  }

  function mapArchitect(architectToFetch, buildingsLayer) {
    $("#architectSelector").val("*").change();

    function populateBuildingList(buildings) {
      buildings.forEach((element) => {
        $("#building-table tbody").append(
          "<tr>" +
            "<td>" +
            element.inception +
            "</td><td id=" +
            element.qid +
            ' class="clickable-table">' +
            element.label +
            "</td></tr>"
        );
      });

      $("#building-table").on("click", "td", function () {
        var id_to_find = $(this).attr("id");
        mymap.eachLayer(function (marker) {
          if (marker instanceof L.Marker) {
            if (marker.options.qid === id_to_find) {
              var markerPosition = marker.getLatLng();
              mymap.flyTo([markerPosition.lat, markerPosition.lng], 17, {
                duration: 1.5,
              });
              marker.openPopup();
            }
          }
        });
      });

      $("#building-table").tablesorter({});
      $("#building-table").trigger("update");
    }

    buildingsLayer.clearLayers();
    var arrayOfMarkers = []; // used to pan map to corner markers
    var arrayOfBuildings = [];
    $("#mapdiv").LoadingOverlay("show", {
      background: "rgba(255,255,255, 0.3)",
      backgroundClass: "loading-overlay",
    });
    makeSPARQLQuery(
      endpointUrl,
      makeQueryPersonBuildings(architectToFetch),
      architectToFetch,
      function (data) {
        data = deduplicateSPARQLResult(data);

        $("#building-table tbody").html("");
        $("#works-header").text("");
        $("#works-header").append("(" + data.length + ")");
        data.forEach((element) => {
          const building = new Building(element);

          var marker = L.marker([building.lat, building.lon], {
            qid: building.qid,
            icon: L.icon({
              iconUrl: building.iconURL,
              iconSize: [30, 30],
              popupAnchor: [0, 0],
            }),
          });

          marker.addTo(buildingsLayer);
          enhanceMarker(marker, building);
          arrayOfMarkers.push([marker.getLatLng().lat, marker.getLatLng().lng]);
          arrayOfBuildings.push(building);
        });

        buildingsLayer.addTo(mymap);
        $("#mapdiv").LoadingOverlay("hide", true);
        mymap.fitBounds(new L.LatLngBounds(arrayOfMarkers));
        populateBuildingList(arrayOfBuildings);
        populateInfo(arrayOfBuildings);
        $("#mapdiv a").attr("target", "_blank");
      }
    );
  }
});
