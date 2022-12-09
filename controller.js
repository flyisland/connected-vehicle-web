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
      vc.onZoomChanged(vc.map.getZoom())
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
    for (const eid of ["route", "vehType", "vehID", "status"]) {
      const inputTag = document.querySelector("#" + eid)
      inputTag.addEventListener('change', () => { log.debug("change event") })
    }
  },

  start: function () {
    msgController.onMessage = function (message) {
      vc.onMessage(message)
    }
    msgController.connect()
    setInterval(() => { vc.updateRealTimeTopics() }, 1000)
    setInterval(() => { vc.checkInactiveVehicles() }, 500)
  },

  vehicles: {},
  msgAmount: 0,
  onMessage: function (vehMsg) {
    vc.msgAmount++
    vc.updateTopic(vehMsg.topic)

    if (vc.map == null) return;
    let veh = null
    if (!(vehMsg.payload.vehID in vc.vehicles)) {
      veh = new Vehicle(vehMsg, vc.map)
      veh.onZoomChanged(vc.zoomLevel)
      vc.vehicles[vehMsg.payload.vehID] = veh
    } else {
      veh = vc.vehicles[vehMsg.payload.vehID]
    }
    veh.onMessage(vehMsg)
  },

  updateTopic: function (topic) {
    vc.topicTag.innerHTML = colorTopic(topic)
  },


  onZoomChanged: function (zoomLevel) {
    vc.zoomLevel = zoomLevel;
    log.debug(`zoom=${vc.zoomLevel}`)

    for (const [k, v] of Object.entries(vc.vehicles)) {
      v.onZoomChanged(vc.zoomLevel)
    }
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
  },

  checkInactiveVehicles: function () {
    const nowTs = Date.now()
    for (const [k, v] of Object.entries(vc.vehicles)) {
      v.checkActivity(nowTs)
      if (null == v.marker.map) {
        delete vc.vehicles[k]
      }
    }
  },
}

export { vc as vehicleController }