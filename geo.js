const shapeOptions = {
  strokeColor: '#F71',
  strokeOpacity: 0.7,
  fillColor: '#F71',
  fillOpacity: 0.025,
  draggable: true,
  clickable: true,
  editable: true,
  visible: true,
}


const shapes = []
var isDragging = false
var map;
let drawingManager;

const geo = {
  init: function (_map) {
    map = _map
    geo.setupDrawingManager()

    document.getElementById("btn-circle").addEventListener('click',
      () => { geo.addShape(google.maps.drawing.OverlayType.CIRCLE) })
    document.getElementById("btn-rect").addEventListener('click',
      () => { geo.addShape(google.maps.drawing.OverlayType.RECTANGLE) })
    document.getElementById("btn-polygon").addEventListener('click',
      () => { geo.addShape(google.maps.drawing.OverlayType.POLYGON) })
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
  },

  addShape: function (drawingMode) {
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
    geo.closeDrawingManager()
    shapes.push(shape)
    shape.shapeType = drawingMode
    geo.onShapeChanged()
    shape.addListener('dragstart', () => { isDragging = true });
    shape.addListener('dragend', () => { isDragging = false; geo.onShapeChanged() })
  },

  onShapeChanged() {
    if (isDragging) { return }
    log.debug("--- onShapeChanged ---")
    shapes.forEach((shape) => {
      switch (shape.shapeType) {
        case google.maps.drawing.OverlayType.CIRCLE:
          log.debug(`${shape.shapeType}: center:${shape.getCenter()}, radius:${shape.getRadius()}, bounds:${shape.getBounds()}`)
          break
        case google.maps.drawing.OverlayType.RECTANGLE:
          log.debug(`${shape.shapeType}: bounds:${shape.getBounds()}`)
          break
        case google.maps.drawing.OverlayType.POLYGON:
          log.debug(`${shape.shapeType}: path:${shape.getPath()}`)
          break
        default:
          log.debug(shape.shapeType)
      }
    })
  },

  removeAllShapes() {
    for (let shape = shapes.pop(); 'undefined' != typeof shape; shape = shapes.pop()) {
      shape.setMap(null)
    }
  }
}

export { geo as default }