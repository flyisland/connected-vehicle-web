import appConfig from "./config.mjs"
import vehicleController from "./vehicle.js"
import { colorTopic } from "./misc.js"

document.getElementById("topic-pattern").innerHTML =
  colorTopic("acmeResources/veh_trak/gps/v2/{route}/{vehType}/{vehID}/{lat}/{lng}/{dir}/{status}")

log.setLevel(appConfig.logLevel)
window.initMap = vehicleController.initMap;

