/*global google*/

export default class CustomOverlayView {
  /**
   * @param {string} content String with the inner HTML of the overlay
   * @param {google.maps.LatLng} position Google LatLng object with the position of the overlay on the map
   * @param {Function} callback Funcion to be called when click in the overlay
   */
  constructor(content, position, callback) {
    this.content = content;
    this.position = position;
    this.callback = callback;

    //Typescript ReferenceError: google is not defined
    //It is not possible to directly extend a google.maps.* class since it actually isn't available
    this.extend(CustomOverlayView, google.maps.OverlayView);
  }

  onAdd = () => {
    this.div = document.createElement('div');
    this.div.style.cssText = 'position: absolute; transform: translate(-50%, -50%);';
    this.div.innerHTML = this.content;

    if (this.callback) {
      google.maps.event.addDomListener(this.div, 'click', this.callback);
    }

    this.getPanes().floatPane.appendChild(this.div);
  };

  onRemove = () => {
    if (this.div) {
      google.maps.event.clearInstanceListeners(this.div);

      this.div.parentNode.removeChild(this.div);
      delete this.div;
    }
  };

  close = () => {
    this.setMap(null);
  };

  draw = () => {
    const position = this.position;

    const projection = this.getProjection();

    if (!position || !projection) {
      return;
    }

    const point = projection.fromLatLngToDivPixel(position);

    if (this.div) {
      this.div.style.top = point.y + 'px';
      this.div.style.left = point.x + 'px';
    }
  };

  show = (map) => {
    this.setMap(map);

    this.draw();
  };

  remove = () => {
    this.close();
  };

  extend = (type1, type2) => {
    for (let property in type2.prototype) {
      type1.prototype[property] = type2.prototype[property];
    }
  };
}
