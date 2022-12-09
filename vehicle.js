
import appConfig from "./config.mjs"


export default class Vehicle {
  constructor(vehMsg, map) {
    Object.assign(this, vehMsg)
    this.map = map
    this.config = appConfig.vehicles[vehMsg.payload.vehType]

    const imgTag = document.createElement("img");
    imgTag.src = appConfig.iconBase + this.config.icon
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

  // https://groups.google.com/g/google-maps-js-api-v3/c/hDRO4oHVSeM
  static metersPerPxOnZoomZero = 156543.03392 * Math.cos(appConfig.mapOptions.center.lat * Math.PI / 180) // / Math.pow(2, zoom)
  // calculate the icon's size in pixel according to the zoom level of google
  // map and the body length
  onZoomChanged(zoomLevel) {
    let bodyLength = this.config.bodyLength
    // when (zoomLevel < 18), double the vehicle length
    if (zoomLevel < 18) { bodyLength = bodyLength * 2 }
    // when (zoomLevel < 15), the icon's size is too small, so we keep the
    // icon's size at least on zoomLevel 15
    if (zoomLevel < 15) { zoomLevel = 15 }
    const metersPerPx = Vehicle.metersPerPxOnZoomZero / Math.pow(2, zoomLevel)
    this.marker.content.height = Math.round(bodyLength / metersPerPx)
  }
}