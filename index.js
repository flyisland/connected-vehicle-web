import appConfig from "./config.js"
import { vehicleController } from "./controller.js"
import { colorTopic, buildSubscriptionTopic } from "./misc.js"

document.getElementById("topic-pattern").innerHTML =
  colorTopic(buildSubscriptionTopic({
    route: "{route}",
    vehType: "{vehType}",
    vehID: "{vehID}",
    lat: "{lat}",
    lng: "{lng}",
    heading: "{dir}",
    status: "{status}",
  }))

log.setLevel(appConfig.logLevel)
window.initMap = vehicleController.initMap;

