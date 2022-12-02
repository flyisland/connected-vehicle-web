import appConfig from "./config.mjs"

function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), appConfig.mapOptions);

  const markerView = new google.maps.marker.AdvancedMarkerView({
    map,
    position: appConfig.mapOptions.center,
  });
}

window.initMap = initMap;
