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

  topicTag: null,
  msgRateTag: null,
  start: function () {
    vc.topicTag = document.getElementById("topic")
    vc.msgRateTag = document.getElementById("msg_rate")

    msgController.onMessage = function (message) {
      vc.onMessage(message)
    }
    msgController.connect()
    setInterval(() => { vc.updateMsgRate() }, 1000)
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

  updateTopic: function (topic) {
    vc.topicTag.innerHTML = colorTopic(topic)
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
  }
}

export { vc as default }