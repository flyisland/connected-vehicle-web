const config = {
  //"trace","debug","info","warn","error"
  logLevel: "debug",

  // acmeResources/veh_trak/gps/v2/{route}/{vehType}/{vehID}/{lat}/{lng}/{dir}/{status}
  topicPrefix: "acmeResources/veh_trak/gps/v2/",
  title: "Real-time Connected Mining Demo",
  subTitles: [
    "Bidirectional IoT Communication using MQTT",
    "Advanced Filtering and Routing Capabilities"
  ],

  googleApiKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  mapOptions: {
    center: { lat: -23.3644177610712, lng: 119.67464837435948 }, // Newman Mine Site
    zoom: 16,
    mapId: "DEMO_MAP_ID",
    mapTypeId: 'hybrid',
    fullscreenControl: false,
    streetViewControl: false,
    scaleControl: true,
    drawable: true,
    mapTypeControlOptions: {
      position: 3, //"TOP_RIGHT"
    }
  },

  singleLevelWildCard: "*",
  solace: {
    SessionProperties: {
      // check (https://docs.solace.com/API-Developer-Online-Ref-Documentation/js/solace.SessionProperties.html)
      // for details of all properties
      url: "ws://localhost:8008",
      vpnName: "default",
      userName: "default",
      password: "default",
    },
    // FATAL: 0, ERROR: 1, WARN: 2, INFO: 3, DEBUG: 4, TRACE: 5
    // NOTICE: works only with "solclientjs-debug.js"
    LogLevel: 1,
  },

  iconBase: "./icons/",
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