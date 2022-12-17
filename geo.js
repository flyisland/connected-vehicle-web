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
const rangeRectangles = []
let curtGeoFilterRanges;
let isDragging = false
let map;
let drawingManager;
let cancelDrawing = false
let onShapesChanged

const geo = {
  init: function (_map, _requestGeoFiltering) {
    map = _map
    onShapesChanged = _requestGeoFiltering
    geo.setupDrawingManager()

    document.getElementById("btn-circle").addEventListener('click',
      () => { geo.startDrawing(google.maps.drawing.OverlayType.CIRCLE) })
    document.getElementById("btn-rect").addEventListener('click',
      () => { geo.startDrawing(google.maps.drawing.OverlayType.RECTANGLE) })
    document.getElementById("btn-polygon").addEventListener('click',
      () => { geo.startDrawing(google.maps.drawing.OverlayType.POLYGON) })
    document.getElementById("btn-remove").addEventListener('click', geo.removeAllShapes)
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
    onShapesChanged(result)
  },

  removeAllShapes() {
    for (let shape = shapes.pop(); 'undefined' != typeof shape; shape = shapes.pop()) {
      shape.setMap(null)
    }
  },

  updateRangeRectangles(ranges) {
    geo.removeAllRangeRectangles()
    curtGeoFilterRanges = ranges
    geo.drawAllRangeRectangles()
  },

  removeAllRangeRectangles() {
    for (let rect = rangeRectangles.pop(); 'undefined' != typeof rect; rect = rangeRectangles.pop()) {
      rect.setMap(null)
    }
  },

  drawAllRangeRectangles() {
    for (let range of curtGeoFilterRanges) {
      const rect = new google.maps.Rectangle(Object.assign({
        map: map,
        bounds: {
          north: range.sign.Y > 0 ? range.coord.Y + range.unit.Y : range.coord.Y * -1,
          south: range.sign.Y > 0 ? range.coord.Y : (range.coord.Y + range.unit.Y) * -1,
          east: range.sign.X > 0 ? range.coord.X + range.unit.X : range.coord.X * -1,
          west: range.sign.X > 0 ? range.coord.X : (range.coord.X + range.unit.X) * -1,
        },
      }, subRectangleOptions))
      rangeRectangles.push(rect)
    }
  },
}

export { geo as default }