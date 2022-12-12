const config = {
  //"trace","debug","info","warn","error"
  logLevel: "debug",

  mapOptions: {
    center: { lat: -23.3644177610712, lng: 119.67464837435948 }, // Newman Mine Site
    zoom: 16,
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
      url: "ws://localhost:8008",
      vpnName: "default",
      userName: "default",
      password: "default",
    },
    // FATAL: 0, ERROR: 1, WARN: 2, INFO: 3, DEBUG: 4, TRACE: 5
    // NOTICE: works only with "solclientjs-debug.js"
    LogLevel: 1,
  },

  iconBase: "./images/",
  vehicleTypes: {
    HAUL: { // type name
      reportInterval: 3, // seconds
      icon: "haul.svg",
      bodyLength: 15, // meters
      infoImage: "haul-truck-info.jpeg"
    },
    WATER: {
      reportInterval: 3, // seconds
      icon: "water.svg",
      bodyLength: 15, // meters
      infoImage: "water-truck-info.png"
    },
  }
}

export { config as default }