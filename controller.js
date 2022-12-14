import appConfig from "./config.js"
import msgController from "./messaging.js"
import Vehicle from "./vehicle.js"
import geo from "./geo.js"
import { colorTopic, buildSubscriptionTopic } from "./misc.js"

const GEO_FILTERING_REQUEST_TOPIC = "geo/filtering"

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
    geo.init(vc.map, vc.requestGeoFiltering)
  },

  htmlFilteringIDs: ["route", "vehType", "vehID", "status"],
  init: function () {
    vc.topicTag = document.getElementById("topic")
    vc.msgRateTag = document.getElementById("msg_rate")
    vc.totalVehiclesTag = document.getElementById("total_vehicles")
    vc.curtSubsTag = document.getElementById("curt_subs")
    vc.subTopicTag = document.getElementById("sub-topic")
    vc.zoomLevel = appConfig.mapOptions.zoom

    // add event listener of filtering tags
    vc.htmlFilteringIDs.forEach((eid) => {
      const inputTag = document.getElementById(eid)
      inputTag.addEventListener('change', () => { vc.onFilteringChanged() })
    })
  },

  start: function () {
    msgController.connect(vc.onMessagingConnected, vc.onMessage)
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

  onFilteringChanged: function () {
    const filter = {}
    vc.htmlFilteringIDs.forEach((eid) => {
      const inputTag = document.getElementById(eid)
      if (null == inputTag) {
        filter[eid] = "*"
        return
      }
      const value = inputTag.value.trim()
      if (value.length == 0) {
        filter[eid] = "*"
      } else {
        filter[eid] = value
      }
    })
    const subTopic = buildSubscriptionTopic(filter)
    vc.subscribeTo(subTopic)
  },

  curtSubTopic: null,
  // topicList: a list to string, or string if only one topic to subscribe to
  subscribeTo: function (topic) {
    // un-subscribe first
    if (vc.curtSubTopic !== null) {
      msgController.unSubscribe(vc.curtSubTopic)
      vc.curtSubTopic = null
    }

    if (topic !== null) {
      msgController.subscribeTo(topic)
      vc.curtSubTopic = topic
      vc.curtSubsTag.innerText = "1"
      vc.subTopicTag.innerHTML = colorTopic(vc.curtSubTopic)
    }
  },

  onMessagingConnected: function () {
    vc.subscribeTo(buildSubscriptionTopic({}))
  },

  requestGeoFiltering(shapes) {
    msgController.sendRequest(GEO_FILTERING_REQUEST_TOPIC, JSON.stringify(shapes),
      (payload) => { log.debug(JSON.stringify(payload)) })
    log.debug(JSON.stringify(shapes))
  }
}

export { vc as vehicleController }