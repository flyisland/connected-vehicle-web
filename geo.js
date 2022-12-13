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

function covertToLatLng(position) {
  return new google.maps.LatLng({ lat: position[1], lng: position[0] })
}


const shapes = []
var isDragging = false
var map;
const SHAPE_CIRCLE = "Circle"
const SHAPE_RECTANGLE = "Rectangle"

const geo = {
  init: function (_map) {
    map = _map
    document.getElementById("btn-circle").addEventListener('click', geo.addCircle)
    document.getElementById("btn-rect").addEventListener('click', geo.addRect)
    document.getElementById("btn-polygon").addEventListener('click', geo.addPolygon)
    document.getElementById("btn-remove").addEventListener('click', geo.removeAllShapes)
  },

  addCircle: function () {
    const circle = new google.maps.Circle(Object.assign({
      map: map,
      center: map.getCenter(),
      radius: 500 + (Math.random() * 100),
    }, shapeOptions));
    shapes.push(circle)
    circle.shapeType = SHAPE_CIRCLE
    geo.onShapeChanged()
    circle.addListener('radius_changed', geo.onShapeChanged);
    circle.addListener('center_changed', geo.onShapeChanged);
    circle.addListener('dragstart', () => { isDragging = true });
    circle.addListener('dragend', () => { isDragging = false; geo.onShapeChanged() });
  },

  addRect: function () {
    const p1 = covertToLatLng([119.6746484, -23.3644178])
    const p2 = covertToLatLng([119.6657252, -23.3576024])

    const rect = new google.maps.Rectangle(Object.assign({
      map: map,
      bounds: {
        north: Math.max(p1.lat(), p2.lat()),
        south: Math.min(p1.lat(), p2.lat()),
        east: Math.max(p1.lng(), p2.lng()),
        west: Math.min(p1.lng(), p2.lng()),
      },
    }, shapeOptions))
    shapes.push(rect)
    rect.shapeType = SHAPE_RECTANGLE
    geo.onShapeChanged()
    rect.addListener('bounds_changed', geo.onShapeChanged);
    rect.addListener('dragstart', () => { isDragging = true });
    rect.addListener('dragend', () => { isDragging = false; geo.onShapeChanged() });
  },

  addPolygon: function () {
    const p1 = covertToLatLng([119.6746484, -23.3644178])
    const p2 = covertToLatLng([119.6657252, -23.3576024])

  },

  onShapeChanged() {
    if (isDragging) { return }
    log.debug("--- onShapeChanged ---")
    shapes.forEach((shape) => {
      switch (shape.shapeType) {
        case SHAPE_CIRCLE:
          log.debug(`${SHAPE_CIRCLE}: center:${shape.getCenter()}, radius:${shape.getRadius()}, bounds:${shape.getBounds()}`)
          break
        case SHAPE_RECTANGLE:
          log.debug(`${SHAPE_RECTANGLE}: bounds:${shape.getBounds()}`)
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