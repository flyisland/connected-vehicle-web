import appConfig from "./config.js"
import msgController from "./messaging.js"
import Vehicle from "./vehicle.js"
import geo from "./geo.js"
import { colorTopic, buildSubscriptionTopic } from "./misc.js"

const GEO_FILTERING_REQUEST_TOPIC = "geo/filtering"

let topicTag;
let msgRateTag;
let totalVehiclesTag;
let curtSubsTag;
let subTopicTag;
let coverAccuracyTag;
let zoomLevel;

const filterFields = {
  route: "*",
  vehType: "*",
  vehID: "*",
  status: "*",
}
let geoShapes = []
const SUB_MODE_WILDCARD = "wildcard"
const SUB_MODE_GEO = "geo"
let prevSubMode = SUB_MODE_WILDCARD
let prevSubTopic = null
let prevFilteringResult = null

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
    geo.init(vc.map, vc.onShapesChanged)
  },


  init: function () {
    topicTag = document.getElementById("topic")
    msgRateTag = document.getElementById("msg_rate")
    totalVehiclesTag = document.getElementById("total_vehicles")
    curtSubsTag = document.getElementById("curt_subs")
    subTopicTag = document.getElementById("sub-topic")
    coverAccuracyTag = document.getElementById("cover_accuracy")
    document.getElementById("topic-status-Any").value = appConfig.singleLevelWildCard
    zoomLevel = appConfig.mapOptions.zoom

    // add event listener of filtering tags
    Object.keys(filterFields).forEach((eid) => {
      const inputTag = document.getElementById(eid)
      inputTag.addEventListener('change', () => { vc.onFilterFieldsChanged() })
    })

    document.getElementById("sub-form").addEventListener('change', () => {
      if (geoShapes.length !== 0) {
        vc.updateSubscription()
      }
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
      veh.onZoomChanged(zoomLevel)
      vc.vehicles[vehMsg.payload.vehID] = veh
    } else {
      veh = vc.vehicles[vehMsg.payload.vehID]
    }
    veh.onMessage(vehMsg)
  },

  updateTopic: function (topic) {
    topicTag.innerHTML = colorTopic(topic)
  },


  onZoomChanged: function (_zoomLevel) {
    zoomLevel = _zoomLevel;
    log.debug(`zoom=${_zoomLevel}`)

    for (const [k, v] of Object.entries(vc.vehicles)) {
      v.onZoomChanged(_zoomLevel)
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
    msgRateTag.innerText = `${rate}`
    vc.lastMsgAmount = vc.msgAmount
    vc.lastTs = nowTs
  },
  updateTotalVehicles: function () {
    totalVehiclesTag.innerText = Object.keys(vc.vehicles).length.toString()
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

  onFilterFieldsChanged: function () {
    Object.keys(filterFields).forEach((eid) => {
      const inputTag = document.getElementById(eid)
      if (null === inputTag) {
        filterFields[eid] = appConfig.singleLevelWildCard
        return
      }
      const value = inputTag.value.trim()
      if (value.length === 0) {
        filterFields[eid] = appConfig.singleLevelWildCard
      } else {
        filterFields[eid] = value
      }
    })
    vc.updateSubscription()
  },

  updateSubscription() {
    // un-subscribe prev wildcard topic first
    if (prevSubTopic !== null) {
      msgController.unSubscribe(prevSubTopic)
      prevSubTopic = null
    }
    let curtSubMode = SUB_MODE_WILDCARD
    if (geoShapes.length === 0) {
      filterFields["lat"] = "*"
      filterFields["lng"] = "*"
    } else {
      curtSubMode = SUB_MODE_GEO
      filterFields["lat"] = "{lat}"
      filterFields["lng"] = "{lng}"
    }
    const subTopic = buildSubscriptionTopic(filterFields)
    subTopicTag.innerHTML = colorTopic(subTopic)

    if (curtSubMode === SUB_MODE_WILDCARD) {
      msgController.subscribeTo(subTopic)
      prevSubTopic = subTopic
      curtSubsTag.innerText = "1"
    }
    if (prevSubMode === SUB_MODE_GEO || curtSubMode === SUB_MODE_GEO) {
      // prevSubMode === SUB_MODE_GEO -> need to un-subscribe previous ranges
      let request = {
        clientName: msgController.clientName,
        maxRangeCount: parseInt(document.getElementById("sub_max_range").value.trim()),
        minAccuracy: parseInt(document.getElementById("sub_accuracy").value.trim()),
        singleLevelWildCard: appConfig.singleLevelWildCard,
        topicPattern: subTopic,
        prevResult: prevFilteringResult,
        shapes: geoShapes,
      }
      msgController.sendRequest(GEO_FILTERING_REQUEST_TOPIC,
        JSON.stringify(request), vc.onGeoFilteringResult)
      prevFilteringResult = null
    }
    prevSubMode = curtSubMode
  },


  onMessagingConnected: function () {
    vc.updateSubscription()
  },

  onShapesChanged(_shapes) {
    geoShapes = _shapes
    vc.updateSubscription()
  },

  onGeoFilteringResult(payload) {
    let reply = JSON.parse(payload)
    if (reply.ranges.length > 0) {
      prevFilteringResult = reply
      curtSubsTag.innerText = reply.ranges.length
      coverAccuracyTag.innerText = (reply.accuracy * 100).toFixed(2)
      geo.updateRangeRectangles(reply)
    } else {
      coverAccuracyTag.innerText = "0"
    }
  },
}

export { vc as vehicleController }