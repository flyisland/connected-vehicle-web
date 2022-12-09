import appConfig from "./config.mjs"
import msgController from "./messaging.js"
import Vehicle from "./vehicle.js"
import { colorTopic, buildSubscriptionTopic } from "./misc.js"

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

  htmlFilteringIDs: ["route", "vehType", "vehID", "status"],
  init: function () {
    vc.topicTag = document.getElementById("topic")
    vc.msgRateTag = document.getElementById("msg_rate")
    vc.totalVehiclesTag = document.getElementById("total_vehicles")
    vc.zoomLevel = appConfig.mapOptions.zoom

    // add event listener of filtering tags
    vc.htmlFilteringIDs.forEach((eid) => {
      const inputTag = document.querySelector("#" + eid)
      inputTag.addEventListener('change', () => { vc.onFilteringChanged() })
    })
  },

  start: function () {
    msgController.onMessage = function (message) {
      vc.onMessage(message)
    }
    msgController.connect(vc.onMessagingConnected)
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
      const inputTag = document.querySelector("#" + eid)
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

  curtSubList: [],
  // topicList: a list to string, or string if only one topic to subscribe to
  subscribeTo: function (topicList) {
    if (typeof topicList == 'string') {
      topicList = [topicList]
    }

    // un-subscribe
    vc.curtSubList.forEach((topic) => { msgController.unSubscribe(topic) })

    vc.curtSubList = []
    topicList.forEach((topic) => {
      msgController.subscribeTo(topic)
      vc.curtSubList.push(topic)
    })

    const curtSubsTag = document.querySelector("#curt_subs")
    curtSubsTag.innerText = vc.curtSubList.length

    const subTopicTag = document.querySelector("#sub-topic")
    subTopicTag.innerHTML = colorTopic(vc.curtSubList[0])
  },

  onMessagingConnected: function () {
    vc.subscribeTo(buildSubscriptionTopic({}))
  },
}

export { vc as vehicleController }