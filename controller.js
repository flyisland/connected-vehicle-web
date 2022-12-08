import appConfig from "./config.mjs"
import msgController from "./messaging.js"
import Vehicle from "./vehicle.js"
import { colorTopic } from "./misc.js"

// vehicleController
const vc = {
  map: null,
  initMap: function () {
    vc.map = new google.maps.Map(document.getElementById("map"), appConfig.mapOptions);
    google.maps.event.addListener(vc.map, 'zoom_changed', function () {
      vc.zoomLevel = vc.map.getZoom();
      log.debug(`zoom=${vc.zoomLevel}`)
    });

    vc.init()
    vc.start()
  },

  init: function () {
    vc.topicTag = document.getElementById("topic")
    vc.msgRateTag = document.getElementById("msg_rate")
    vc.totalVehiclesTag = document.getElementById("total_vehicles")

    // https://groups.google.com/g/google-maps-js-api-v3/c/hDRO4oHVSeM
    vc.zoomLevel = appConfig.mapOptions.zoom
  },

  start: function () {
    msgController.onMessage = function (message) {
      vc.onMessage(message)
    }
    msgController.connect()
    setInterval(() => { vc.updateRealTimeTopics() }, 1000)
  },

  vehicles: {},
  msgAmount: 0,
  onMessage: function (vehMsg) {
    vc.msgAmount++
    vc.updateTopic(vehMsg.topic)

    if (map == null) return;
    let veh = null
    if (!(vehMsg.payload.vehID in vc.vehicles)) {
      vc.vehicles[vehMsg.payload.vehID] = new Vehicle(vehMsg)
    }
    veh = vc.vehicles[vehMsg.payload.vehID]
    veh.onMessage(vehMsg)
    veh.onZoomChanged(vc.zoomLevel)
  },

  updateTopic: function (topic) {
    vc.topicTag.innerHTML = colorTopic(topic)
  },


  updateRealTimeTopics: function () {
    vc.updateMsgRate()
    vc.updateTotalVehicles()
  },

  lastMsgAmount: 0,
  lastTs: Date.now(),
  updateMsgRate: function () {
    let nowTs = Date.now()
    let secs = (nowTs - vc.lastTs) / 1000
    let rate = Math.round((vc.msgAmount - vc.lastMsgAmount) / secs)
    vc.msgRateTag.innerText = `${rate}`
    vc.lastMsgAmount = vc.msgAmount
    vc.lastTs = nowTs
  },
  updateTotalVehicles: function () {
    vc.totalVehiclesTag.innerText = Object.keys(vc.vehicles).length.toString()
  }
}

export { vc as vehicleController }