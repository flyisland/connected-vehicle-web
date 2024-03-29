
import appConfig from "./config.js"
import { colorTopic } from "./misc.js"

export default class Vehicle {
  constructor(vehMsg, map) {
    Object.assign(this, vehMsg)
    this.map = map
    this.typeConfig = appConfig.vehicleTypes[vehMsg.payload.vehType]

    const imgTag = document.createElement("img");
    imgTag.src = appConfig.iconBase + this.typeConfig.icon
    imgTag.className = `marker-${vehMsg.payload.status}`
    //    imgTag.style.filter = "drop-shadow(0 0 3mm black)"
    const marker = new google.maps.marker.AdvancedMarkerView({
      map: this.map,
      content: imgTag
    });
    const infoWindow = new google.maps.InfoWindow({
      content: ""
    })
    let isInfoWindowOpened = false;
    marker.addListener("click", () => {
      if (!isInfoWindowOpened) {
        infoWindow.open({ anchor: marker, map, });
        isInfoWindowOpened = true
      } else {
        infoWindow.close()
        isInfoWindowOpened = false
      }
    });
    this.marker = marker
    this.infoWindow = infoWindow
  }

  onMessage(vehMsg) {
    Object.assign(this, vehMsg)
    this.marker.position = { lat: this.payload.lat, lng: this.payload.lng }
    this.marker.content.style.transform = `rotate(${this.payload.heading}deg)`
    this.marker.content.style.opacity = 1

    this.infoWindow.setContent(this.buildInfoContent())

    this.lastTs = Date.now()
  }

  // https://groups.google.com/g/google-maps-js-api-v3/c/hDRO4oHVSeM
  static metersPerPxOnZoomZero = 156543.03392 * Math.cos(appConfig.mapOptions.center.lat * Math.PI / 180) // / Math.pow(2, zoom)
  // calculate the icon's size in pixel according to the zoom level of google
  // map and the body length
  onZoomChanged(zoomLevel) {
    let bodyLength = this.typeConfig.bodyLength
    // when (zoomLevel < 18), double the vehicle length
    if (zoomLevel < 17) { bodyLength = bodyLength * 2 }
    // when (zoomLevel < 15), the icon's size is too small, so we keep the
    // icon's size at least on zoomLevel 15
    if (zoomLevel < 15) { zoomLevel = 15 }
    const metersPerPx = Vehicle.metersPerPxOnZoomZero / Math.pow(2, zoomLevel)
    this.marker.content.height = Math.round(bodyLength / metersPerPx)
  }

  // fade out inactive vehicle
  checkActivity(nowTs) {
    const elapse = nowTs - this.lastTs
    if (elapse >= this.typeConfig.reportInterval * 1000 * 2.5) {
      this.marker.map = null
    } else if (elapse >= this.typeConfig.reportInterval * 1000 * 2) {
      this.marker.content.style.opacity = 0.4
    } else if (elapse >= this.typeConfig.reportInterval * 1000 * 1.5) {
      this.marker.content.style.opacity = 0.7
    }
  }

  buildInfoContent() {
    return `<div class="info-box">
  <div class="info-title">Vehicle: ${this.payload.vehID}, Status: <span class="info-status-${this.payload.status}">&nbsp;${this.payload.status}&nbsp;</span></div>
  <div class="info-topic">${colorTopic(this.topic)}</div>
  <div class="info-body">
    <div>
      <pre>${JSON.stringify(this.payload, null, 2)}</pre>
    </div>
    <div><img class="info-img" src="${appConfig.iconBase + this.typeConfig.infoImage}"></div>
  </div>
</div>`
  }
}