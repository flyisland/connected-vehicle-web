import appConfig from "./config.js"
import { vehicleController } from "./controller.js"
import { colorTopic, buildSubscriptionTopic } from "./misc.js"

// set title and sub titles
document.getElementsByTagName("title")[0].innerText = appConfig.title
const solaceHeader = document.getElementById("solace-header")
const demoTitle = document.createElement("p")
demoTitle.className = "dash-title dash-line-item"
demoTitle.innerText = appConfig.title
solaceHeader.append(demoTitle)
for (const subTitle of appConfig.subTitles) {
  const subTag = document.createElement("p")
  subTag.className = "dash-sub-title dash-line-item"
  subTag.innerText = subTitle
  solaceHeader.append(subTag)
}

// set google map script src
const scriptTag = document.createElement("script")
scriptTag.src = `https://maps.googleapis.com/maps/api/js?key=${appConfig.googleApiKey}&callback=initMap&libraries=drawing,marker,places&v=beta`
scriptTag.defer = true
document.getElementsByTagName("body")[0].append(scriptTag)

document.getElementById("topic-pattern").innerHTML =
  colorTopic(buildSubscriptionTopic({
    route: "{route}",
    vehType: "{vehType}",
    vehID: "{vehID}",
    lat: "{lat}",
    lng: "{lng}",
    dir: "{dir}",
    status: "{status}",
  }))

log.setLevel(appConfig.logLevel)
window.initMap = vehicleController.initMap;

