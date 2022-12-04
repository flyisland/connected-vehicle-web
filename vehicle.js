import appConfig from "./config.mjs"
import msgController from "./messaging.js"

// vehicleController
const vc = {
  map: null,
  initMap: function () {
    vc.map = new google.maps.Map(document.getElementById("map"), appConfig.mapOptions);
  },

  start: function () {
    msgController.onMessage = function (message) {
      vc.onMessage(message)
    }
    msgController.connect()
  },

  vehicles: {},
  onMessage: function (vehMsg) {
    if (map == null) return;

    let veh = null
    if (!(vehMsg.payload.vehID in vc.vehicles)) {
      const markerView = new google.maps.marker.AdvancedMarkerView({ map: vc.map, });
      vc.vehicles[vehMsg.payload.vehID] = { "marker": markerView, }
    }
    veh = vc.vehicles[vehMsg.payload.vehID]
    veh["marker"].position = { lat: vehMsg.payload.lat, lng: vehMsg.payload.lng }
  }
}

export { vc as default }