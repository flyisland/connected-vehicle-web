import appConfig from "./config.js"
const topicSeparator = "/"
// acmeResources/veh_trak/gps/v2/{route}/{vehType}/{vehID}/{lat}/{lng}/{dir}/{status}
const topicLevels = {
  // start with ZERO
  2: "app",
  3: "ver",
  4: "route",
  5: "vehType",
  6: "vehID",
  7: "lat",
  8: "lng",
  9: "dir",
  10: "status",
}
// input: topic string
// output: topic in multiple <span> element with different css class
function colorTopic(topic) {
  const levels = topic.split(topicSeparator);
  const levelSpans = levels.map((field, idx) => {
    if (idx in topicLevels)
      return `<span class="topic-${topicLevels[idx]}">${field}</span>`
    else
      return field
  })
  return levelSpans.join(topicSeparator)
}


function buildSubscriptionTopic(filter) {
  const topicList = []
  for (let i = 4; i <= 10; i++) {
    if (topicLevels[i] in filter) {
      topicList.push(filter[topicLevels[i]])
    } else {
      topicList.push(appConfig.singleLevelWildCard)
    }
  }
  return appConfig.topicPrefix + topicList.join(topicSeparator)
}

export { colorTopic, buildSubscriptionTopic }