import appConfig from "./config.mjs"
import msgController from "./messaging.js"
import { colorTopic } from "./misc.js"

// vehicleController
const vc = {
  map: null,
  initMap: function () {
    vc.map = new google.maps.Map(document.getElementById("map"), appConfig.mapOptions);
    vc.start()
  },

  start: function () {
    msgController.onMessage = function (message) {
      vc.onMessage(message)
    }
    msgController.connect()
  },

  vehicles: {},
  msgAmount: 0,
  onMessage: function (vehMsg) {
    this.msgAmount++
    vc.updateTopic(vehMsg.topic)

    if (map == null) return;
    let veh = null
    if (!(vehMsg.payload.vehID in vc.vehicles)) {
      const markerView = new google.maps.marker.AdvancedMarkerView({ map: vc.map, });
      vc.vehicles[vehMsg.payload.vehID] = { "marker": markerView, }
    }
    veh = vc.vehicles[vehMsg.payload.vehID]
    veh["marker"].position = { lat: vehMsg.payload.lat, lng: vehMsg.payload.lng }
  },

  topicTag: null,
  updateTopic: function (topic) {
    if (vc.topicTag == null) {
      vc.topicTag = document.getElementById("topic")
    }
    vc.topicTag.innerHTML =
      colorTopic(topic)
  },
}

export { vc as default }