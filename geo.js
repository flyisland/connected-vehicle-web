import { colorTopic } from "./misc.js"

const strokeColor = '#F71'
const shapeOptions = {
  strokeColor: strokeColor,
  strokeOpacity: 0.7,
  fillColor: strokeColor,
  fillOpacity: 0.025,
  draggable: true,
  clickable: true,
  editable: true,
  visible: true,
}

const rectColor = "#00c895"
const subRectangleOptions = {
  strokeColor: rectColor,
  strokeOpacity: 0.5,
  strokeWeight: 1,
  fillColor: rectColor,
  fillOpacity: 0.05,
  zIndex: 1000000, //factor,
  clickable: true,
}

const shapes = []
const curtRangeRectangles = []
let curtGeoFilterReply
let isDragging = false // the user is dragging the shapes now
let map;
let drawingManager;
let cancelDrawing = false // the use press ESC to cancel current shape
let onFilteringShapesChanged
let showAllRanges = false // whether to show ranged rectangles


let rangRectTag
let rangeTopicTag
const geo = {
  init: function (_map, _onShapesChanged) {
    map = _map
    onFilteringShapesChanged = _onShapesChanged
    geo.setupDrawingManager()

    document.getElementById("btn-circle").addEventListener('click',
      () => { geo.startDrawing(google.maps.drawing.OverlayType.CIRCLE) })
    document.getElementById("btn-rect").addEventListener('click',
      () => { geo.startDrawing(google.maps.drawing.OverlayType.RECTANGLE) })
    document.getElementById("btn-polygon").addEventListener('click',
      () => { geo.startDrawing(google.maps.drawing.OverlayType.POLYGON) })
    document.getElementById("btn-remove").addEventListener('click', geo.removeAllShapes)
    const showRangesCheckbox = document.getElementById("show_ranges")
    showRangesCheckbox.checked = showAllRanges
    showRangesCheckbox.addEventListener('change', () => {
      showAllRanges = showRangesCheckbox.checked
      if (showAllRanges) {
        geo.drawAllRangeRectangles()
      } else {
        geo.removeAllRangeRectangles()
      }
    })

    rangRectTag = document.getElementById("range-rect")
    rangeTopicTag = document.getElementById("range-topic")
  },

  closeDrawingManager() {
    drawingManager.setDrawingMode(null)
    drawingManager.setMap(null)
  },

  setupDrawingManager() {
    drawingManager = new google.maps.drawing.DrawingManager({
      circleOptions: shapeOptions,
      rectangleOptions: shapeOptions,
      polygonOptions: shapeOptions,
      drawingMode: null,
      drawingControl: false,
      drawingControlOptions: { position: google.maps.ControlPosition.TOP_CENTER, }
    })


    drawingManager.addListener('circlecomplete', function (circle) {
      geo.onNewShape(circle, google.maps.drawing.OverlayType.CIRCLE)
      circle.addListener('radius_changed', geo.onShapeChanged);
      circle.addListener('center_changed', geo.onShapeChanged);
    })
    drawingManager.addListener('rectanglecomplete', function (rect) {
      geo.onNewShape(rect, google.maps.drawing.OverlayType.RECTANGLE)
      rect.addListener('bounds_changed', geo.onShapeChanged);
    })
    drawingManager.addListener('polygoncomplete', function (polygon) {
      geo.onNewShape(polygon, google.maps.drawing.OverlayType.POLYGON)
      google.maps.event.addListener(polygon.getPath(), 'set_at', geo.onShapeChanged);
      google.maps.event.addListener(polygon.getPath(), 'insert_at', geo.onShapeChanged);
      google.maps.event.addListener(polygon.getPath(), 'remove_at', geo.onShapeChanged);
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === "Escape") {
        cancelDrawing = true
        geo.closeDrawingManager()
      }
    })
  },

  startDrawing: function (drawingMode) {
    cancelDrawing = false
    drawingManager.setOptions({
      map,
      drawingMode: drawingMode,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [drawingMode]
      }
    })
  },

  onNewShape(shape, drawingMode) {
    if (cancelDrawing) {
      shape.setMap(null)
      return
    }
    geo.closeDrawingManager()
    shapes.push(shape)
    shape.shapeType = drawingMode
    geo.onShapeChanged()
    shape.addListener('dragstart', () => { isDragging = true });
    shape.addListener('dragend', () => { isDragging = false; geo.onShapeChanged() })
  },

  onShapeChanged() {
    if (isDragging) { return }
    let result = []
    shapes.forEach((shape) => {
      let shapeObj
      switch (shape.shapeType) {
        case google.maps.drawing.OverlayType.CIRCLE:
          shapeObj = {
            type: "Ellipse", // circle on google map is actually an ellipse
            bounds: shape.getBounds(),
          }
          break
        case google.maps.drawing.OverlayType.RECTANGLE:
          shapeObj = {
            type: "Rectangle",
            bounds: shape.getBounds(),
          }
          break
        case google.maps.drawing.OverlayType.POLYGON:
          shapeObj = {
            type: "Polygon",
            coordinates: shape.getPath().getArray(),
          }
          break
        default:
          return
      }
      result.push(shapeObj)
    })
    onFilteringShapesChanged(result)
  },

  removeAllShapes() {
    for (let shape = shapes.pop(); 'undefined' != typeof shape; shape = shapes.pop()) {
      shape.setMap(null)
    }
    geo.removeAllRangeRectangles()
    onFilteringShapesChanged([])
  },

  updateRangeRectangles(reply) {
    geo.removeAllRangeRectangles()
    curtGeoFilterReply = reply
    geo.drawAllRangeRectangles()
  },

  removeAllRangeRectangles() {
    for (let rect = curtRangeRectangles.pop(); 'undefined' != typeof rect; rect = curtRangeRectangles.pop()) {
      rect.setMap(null)
    }
  },

  drawAllRangeRectangles() {
    if (!showAllRanges) { return }
    if (curtGeoFilterReply === null) { return }
    if (!("ranges" in curtGeoFilterReply)) { return }
    for (let i = 0; i < curtGeoFilterReply.ranges.length; i++) {
      const range = curtGeoFilterReply.ranges[i]
      const x1 = range.sign.X * range.coord.X
      const x2 = range.sign.X * (range.coord.X + range.unit.X)
      const y1 = range.sign.Y * range.coord.Y
      const y2 = range.sign.Y * (range.coord.Y + range.unit.Y)
      const rect = new google.maps.Rectangle(Object.assign({
        map: map,
        bounds: {
          north: y1 > y2 ? y1 : y2,
          south: y1 < y2 ? y1 : y2,
          east: x1 > x2 ? x1 : x2,
          west: x1 < x2 ? x1 : x2,
        },
      }, subRectangleOptions))
      const temp = curtGeoFilterReply.topicPattern.replace('{lat}', range.filtering.Y)
      rect["topic"] = temp.replace("{lng}", range.filtering.X)

      rect.addListener("mouseover", function () {
        rect.setOptions({ fillOpacity: 0.1, strokeOpacity: 1 });
        rangeTopicTag.innerHTML = colorTopic(rect["topic"])
        rangRectTag.style.display = "block"
      });
      rect.addListener("mousemove", function (event) {
        rangRectTag.style.left = (event.domEvent.x + 10) + 'px';
        rangRectTag.style.top = (event.domEvent.y + 10) + 'px';
      });
      rect.addListener("mouseout", function () {
        rect.setOptions({ fillOpacity: 0.05, strokeOpacity: 0.5 });
        rangRectTag.style.display = "none"
      });


      curtRangeRectangles.push(rect)
    }
  },
}

export { geo as default }