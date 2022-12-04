import appConfig from "./config.mjs"

// Initialize factory with the most recent API defaults
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// enable logging to JavaScript console at WARN level
// NOTICE: works only with "solclientjs-debug.js"
solace.SolclientFactory.setLogLevel(appConfig.solace.LogLevel);

class Messaging {
  session = null

  connect() {
    log.info('Connecting to Solace PubSub+ Event Broker using url: ' + appConfig.solace.SessionProperties.url);
    log.info('Client username: ' + appConfig.solace.SessionProperties.userName);
    log.info('Solace PubSub+ Event Broker VPN name: ' + appConfig.solace.SessionProperties.vpnName);
    // create session
    try {
      this.session = solace.SolclientFactory.createSession(appConfig.solace.SessionProperties);
    } catch (err) {
      log.error(err.toString());
    }
    // define session event listeners
    this.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
      log.info('=== Successfully connected and ready to subscribe. ===');
      setTimeout(() => { messaging.subscribe() }, 0);
    });
    this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
      log.error('Connection failed to the message router: ' + sessionEvent.infoStr +
        ' - check correct parameter values and connectivity!');
    });
    this.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
      log.info('Disconnected.');
      if (this.session !== null) {
        this.session.dispose();
        this.session = null;
      }
    });
    this.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, function (sessionEvent) {
      log.warn('Cannot subscribe to topic: ' + sessionEvent.correlationKey);
    });
    this.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function (sessionEvent) {
      log.info('SUBSCRIPTION_OK: ' + sessionEvent)
    });
    // define message event listener
    this.session.on(solace.SessionEventCode.MESSAGE, function (message) {
      log.info('Received message: "' + message.getBinaryAttachment() + '", details:\n' +
        message.dump());
    });

    // actually connect to the broker
    this.session.connect()
  }

  subscribe() {
    let topicName = "acmeResources/veh_trak/>"
    log.info('Subscribing to topic: ' + topicName);
    try {
      this.session.subscribe(
        solace.SolclientFactory.createTopicDestination(topicName),
        true, // generate confirmation when subscription is added successfully
        topicName, // use topic name as correlation key
        10000 // 10 seconds timeout for this operation
      );
    } catch (error) {
      log.error(error.toString());
    }
  }
}

let messaging = new Messaging()
export { messaging as default }
