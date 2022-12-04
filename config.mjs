const config = {
  //"trace","debug","info","warn","error"
  logLevel: "debug",

  mapOptions: {
    //    center: { lat: -30.777444938024253, lng: 121.50542285547441 }, // Super Pit
    center: { lat: -23.3598290, lng: 119.6702020 }, // Newman Mine Site
    zoom: 15,
    mapId: "DEMO_MAP_ID",
    mapTypeId: 'hybrid',
    fullscreenControl: false,
    streetViewControl: false,
    scaleControl: true,
    drawable: true,
  },

  solace: {
    SessionProperties: {
      // check (https://docs.solace.com/API-Developer-Online-Ref-Documentation/js/solace.SessionProperties.html)
      // to details of all properties
      "url": "ws://localhost:8008",
      "vpnName": "default",
      "userName": "default",
      "password": "default",
    },
    // FATAL: 0, ERROR: 1, WARN: 2, INFO: 3, DEBUG: 4, TRACE: 5
    // NOTICE: works only with "solclientjs-debug.js"
    LogLevel: 1,
  }
}

export { config as default }