import appConfig from "./config.js"

// Initialize factory with the most recent API defaults
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// enable logging to JavaScript console at WARN level
// NOTICE: works only with "solclientjs-debug.js"
solace.SolclientFactory.setLogLevel(appConfig.solace.LogLevel);

let session // message session
let onMessage // callback

var msgController = {
  connect: function (onConnected, _onMessage) {
    onMessage = _onMessage
    log.info('Connecting to Solace PubSub+ Event Broker using url: ' + appConfig.solace.SessionProperties.url);
    log.info('Client username: ' + appConfig.solace.SessionProperties.userName);
    log.info('Solace PubSub+ Event Broker VPN name: ' + appConfig.solace.SessionProperties.vpnName);
    // create session
    try {
      session = solace.SolclientFactory.createSession(appConfig.solace.SessionProperties);
    } catch (err) {
      log.error(err.toString());
    }
    // define session event listeners
    const that = this
    session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
      log.info('=== Successfully connected and ready to subscribe. ===');
      setTimeout(() => { onConnected() }, 0);
    });
    session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
      log.error('Connection failed to the message router: ' + sessionEvent.infoStr +
        ' - check correct parameter values and connectivity!');
    });
    session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
      log.info('Disconnected.');
      if (session !== null) {
        session.dispose();
        session = null;
      }
    });
    session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, function (sessionEvent) {
      log.warn('Cannot subscribe to topic: ' + sessionEvent.correlationKey);
    });

    // define message event listener
    session.on(solace.SessionEventCode.MESSAGE, function (message) {
      let msg = {}
      msg.topic = message.getDestination().name
      msg.payload = JSON.parse(msgController.getTextPayload(message))
      onMessage(msg)
    });

    // actually connect to the broker
    session.connect()
  },

  subscribeTo: function (topicName) {
    try {
      session.subscribe(
        solace.SolclientFactory.createTopicDestination(topicName),
        true, // generate confirmation when subscription is added successfully
        topicName, // use topic name as correlation key
        10000 // 10 seconds timeout for this operation
      );
      log.info('Subscribe to topic: ' + topicName);
    } catch (error) {
      log.error(error.toString());
    }
  },

  unSubscribe: function (topicName) {
    try {
      session.unsubscribe(
        solace.SolclientFactory.createTopicDestination(topicName),
        true, // generate confirmation when subscription is added successfully
        topicName, // use topic name as correlation key
        10000 // 10 seconds timeout for this operation
      );
      log.info('Un-Subscribe topic: ' + topicName);
    } catch (error) {
      log.error(error.toString());
    }
  },


  getTextPayload: function (message) {
    if (message.getType() == solace.MessageType.TEXT) {
      return message.getSdtContainer().getValue();
    } else {
      return message.getBinaryAttachment(); // binary attachment, all text
    }
  },

}

export { msgController as default }
