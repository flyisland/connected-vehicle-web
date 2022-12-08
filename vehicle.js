
import appConfig from "./config.mjs"
import { vehicleController } from "./controller.js"

// https://groups.google.com/g/google-maps-js-api-v3/c/hDRO4oHVSeM
const metersPerPxOnZoomZero = 156543.03392 * Math.cos(appConfig.mapOptions.center.lat * Math.PI / 180) // / Math.pow(2, vc.zoomLevel)

export default class Vehicle {
  constructor(vehMsg) {
    Object.assign(this, vehMsg)

    const imgTag = document.createElement("img");
    imgTag.src = appConfig.iconBase + appConfig.vehicles[vehMsg.payload.vehType].icon
    imgTag.style.filter = "drop-shadow(0 0 3mm black)"
    this.marker = new google.maps.marker.AdvancedMarkerView({
      map: vehicleController.map,
      content: imgTag
    });
  }

  onMessage(vehMsg) {
    Object.assign(this, vehMsg)
    this.marker.position = { lat: this.payload.lat, lng: this.payload.lng }
    this.marker.content.style.transform = `rotate(${this.payload.heading}deg)`
  }

  onZoomChanged(zoomLevel) {
    this.marker.content.width = 30
  }
}