
import appConfig from "./config.mjs"

// https://groups.google.com/g/google-maps-js-api-v3/c/hDRO4oHVSeM
const metersPerPxOnZoomZero = 156543.03392 * Math.cos(appConfig.mapOptions.center.lat * Math.PI / 180) // / Math.pow(2, vc.zoomLevel)

export default class Vehicle {
  constructor(vehMsg, map) {
    Object.assign(this, vehMsg)
    this.map = map
    this.bodyLength = appConfig.vehicles[vehMsg.payload.vehType].bodyLength

    const imgTag = document.createElement("img");
    imgTag.src = appConfig.iconBase + appConfig.vehicles[vehMsg.payload.vehType].icon
    imgTag.style.filter = "drop-shadow(0 0 3mm black)"
    this.marker = new google.maps.marker.AdvancedMarkerView({
      map: this.map,
      content: imgTag
    });
  }

  onMessage(vehMsg) {
    Object.assign(this, vehMsg)
    this.marker.position = { lat: this.payload.lat, lng: this.payload.lng }
    this.marker.content.style.transform = `rotate(${this.payload.heading}deg)`
  }

  onZoomChanged(zoomLevel) {
    if (zoomLevel < 15) { return }

    const metersPerPx = metersPerPxOnZoomZero / Math.pow(2, zoomLevel)
    let bodyLength = this.bodyLength
    if (zoomLevel < 18) { bodyLength = bodyLength * 2 }
    this.marker.content.width = Math.round(bodyLength / metersPerPx)
  }
}