export default class MapFunctions {
  /**
   * @param {google.maps.Map} map Google Maps JavaScript API instance
   * @returns {number} Current zoom level of the map
   */
  static getZoom = (map) => {
    return map.getZoom();
  };

  /**
   * @param {google.maps.Map} map Google Maps JavaScript API instance
   * @returns {any} Object with NW and SE bounds of the map
   */
  static getBounds = (map) => {
    const bounds = map.getBounds();

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    return {
      nw: { lat: ne.lat(), lng: sw.lng() },
      se: { lat: sw.lat(), lng: ne.lng() }
    };
  };

  /**
   * @param {google.maps.Map} map Google Maps JavaScript API instance
   * @param {any} point Object with clientX and clientY screen coordinates
   * @returns {google.maps.LatLng} Object with Lat and Lng
   */
  static pointToLatLng = (map, point) => {
    const clientRect = map.getDiv().getBoundingClientRect();

    const clientX = point.clientX - clientRect.left;
    const clientY = point.clientY - clientRect.top;

    const projection = map.getProjection();
    const bounds = map.getBounds();

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const topRight = projection.fromLatLngToPoint(ne);
    const bottomLeft = projection.fromLatLngToPoint(sw);

    const zoom = MapFunctions.getZoom(map);
    const scale = Math.pow(2, zoom);

    return projection.fromPointToLatLng(new google.maps.Point(clientX / scale + bottomLeft.x, clientY / scale + topRight.y));
  };

  /**
   * @param {google.maps.Map} map Google Maps JavaScript API instance
   * @param {boolean} freeze Flag indicating whether it should freeze the map
   */
  static freezeMap = (map, freeze) => {
    map.setOptions({
      draggable: !freeze,
      scrollwheel: !freeze,
      draggableCursor: freeze ? 'pointer' : null,
      disableDoubleClickZoom: freeze
    });
  };

  /**
   * @param {google.maps.Map} map Google Maps JavaScript API instance
   * @param {boolean} enable Flag indicating whether it should enable crossair cursor over the map
   */
  static enableCrossair = (map, enable) => {
    map.setOptions({
      draggableCursor: enable ? 'crosshair' : null,
      disableDoubleClickZoom: enable
    });
  };
}
