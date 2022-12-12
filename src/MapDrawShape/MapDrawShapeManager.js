import CustomOverlayView from './Overlays/CustomOverlayView';
import MapFunctions from './Map/MapHelper';
import JstsHelper from './Geometry/JstsHelper';

export default class MapDrawShapeManager {
  /**
   * @param {google.maps.Map} map Google Maps JavaScript API instance
   * @param {Function} callback Callback function that will be called when user draws or clears the draw
   * @param {boolean} drawingMode Flag indicating whether it should set Drawing Mode enabled
   * @param {boolean} drawFreeHandMode Flag indicating whether it should set Draw Free Hand Mode enabled
   * @param {object} polygonOptions Object containing the google polygon options to be used when drawing
   * @param {string} initialPointInnerHtml String with the inner HTML of the draw initial point overlay
   * @param {string} deletePointInnerHtml String with the inner HTML of the draw delete point overlay
   */
  constructor(
    map,
    callback,
    drawingMode,
    drawFreeHandMode,
    polygonOptions,
    initialPointInnerHtml,
    deletePointInnerHtml,
    onPlotCallback
  ) {
    this.map = map;

    this.callback = callback;

    this.drawFreeHandMode = drawFreeHandMode;

    this.polygonOptions = polygonOptions;

    this.initialPointInnerHtml = initialPointInnerHtml;
    this.deletePointInnerHtml = deletePointInnerHtml;

    this.initialDrawPoint = null;

    this.startedDrawing = false;
    this.startedDrawingFreeHand = false;

    this.drawnPolylineDraft = null;
    this.drawnPolygonDraft = null;

    this.drawnShape = null;
    this.deleteDrawnShape = null;
    this.onPlotCallback = onPlotCallback;
    this.setDrawingMode(drawingMode);
  }

  /**
   * It draws a shape on the map using the provided shape
   * @param {object[]} initialShape Array of objects that contain lat lng values
   */
  initDrawnShape = (initialShape) => {
    if (initialShape?.length > 0 && !this.drawnShape) {
      const polygons = JstsHelper.processShape(initialShape);

      if (polygons.length > 0) {
        this.drawnShape = [];

        polygons.forEach((p) => {
          this.drawnShape.push(
            new google.maps.Polygon({ path: p, ...this.polygonOptions })
          );
        });

        this.#setDeleteDrawPoint();
      }
    }
  };

  /**
   * It resets the shape drawn on the map
   */
  resetDrawnShape = () => {
    if (this.drawnShape) this.drawnShape.forEach((p) => p.setMap(null));
    if (this.deleteDrawnShape) this.deleteDrawnShape.remove();

    this.drawnShape = null;
    this.deleteDrawnShape = null;
  };

  /**
   * It sets the drawing mode to free hand, when enabled user should drag to draw instead of click
   * @param {boolean} enabled Flag indicating whether it should set Draw Free Hand Mode enabled
   */
  setDrawFreeHandMode = (enabled) => {
    if (!this.startedDrawing && !this.startedDrawingFreeHand) {
      this.drawFreeHandMode = enabled;
    }
  };

  /**
   * It sets the map in drawing mode, when enabled user can star drawing
   * @param {boolean} enabled Flag indicating whether it should set Drawing Mode enabled
   */
  setDrawingMode = (enabled) => {
    if (enabled) {
      if (this.drawnShape) this.drawnShape.forEach((p) => p.setMap(null));
      if (this.deleteDrawnShape) this.deleteDrawnShape.remove();

      if (this.drawFreeHandMode) {
        this.#initDrawFreeHand();
      } else {
        this.#initDraw();
      }
    } else {
      if (this.initialDrawPoint) this.initialDrawPoint.remove();
      this.initialDrawPoint = null;

      if (this.drawFreeHandMode) {
        if (this.startedDrawingFreeHand) {
          this.startedDrawingFreeHand = false;

          MapFunctions.freezeMap(this.map, false);

          if (this.drawnShape)
            this.drawnShape.forEach((p) => p.setMap(this.map));
          if (this.deleteDrawnShape) this.deleteDrawnShape.show(this.map);

          this.#clearDrawFreeHandListeners();
        }
      } else {
        if (this.startedDrawing) {
          this.startedDrawing = false;

          MapFunctions.enableCrossair(this.map, false);

          if (this.drawnPolylineDraft) this.drawnPolylineDraft.setMap(null);
          if (this.drawnPolygonDraft) this.drawnPolygonDraft.setMap(null);

          this.drawnPolylineDraft = null;
          this.drawnPolygonDraft = null;

          if (this.drawnShape)
            this.drawnShape.forEach((p) => p.setMap(this.map));
          if (this.deleteDrawnShape) this.deleteDrawnShape.show(this.map);

          this.#clearDrawListeners();
        }
      }
    }
  };

  #setInitialDrawPoint = (point, callback) => {
    this.initialDrawPoint = new CustomOverlayView(
      this.initialPointInnerHtml,
      point,
      callback
    );

    this.initialDrawPoint.show(this.map);
  };

  #setDeleteDrawPoint = () => {
    this.deleteDrawnShape = new CustomOverlayView(
      this.deletePointInnerHtml,
      this.#getDrawnShapeHighestPoint(),
      () => {
        if (this.drawnShape) this.drawnShape.forEach((p) => p.setMap(null));
        if (this.deleteDrawnShape) this.deleteDrawnShape.remove();

        this.drawnShape = null;
        this.deleteDrawnShape = null;

        this.callback([]);
      }
    );

    if (!this.startedDrawing && !this.startedDrawingFreeHand) {
      this.drawnShape.forEach((p) => p.setMap(this.map));
      this.deleteDrawnShape.show(this.map);
    }
  };

  #getDrawnShapeHighestPoint = () => {
    let highestPoint = null;
    let maxLat = 0;

    this.drawnShape.forEach((polygon) => {
      polygon
        .getPath()
        .getArray()
        .forEach((point) => {
          const lat = point.lat();

          if (lat > maxLat) {
            maxLat = lat;
            highestPoint = point;
          }
        });
    });

    return highestPoint;
  };

  #initDraw = () => {
    if (!this.startedDrawing) {
      this.startedDrawing = true;

      MapFunctions.enableCrossair(this.map, true);

      this.#draw();
    }
  };

  #draw = () => {
    this.drawnPolylineDraft = new google.maps.Polyline({
      map: this.map,
      ...this.polygonOptions,
    });
    this.drawnPolygonDraft = new google.maps.Polygon({
      map: this.map,
      ...this.polygonOptions,
      strokeOpacity: 0,
    });

    google.maps.event.addDomListener(this.map.getDiv(), 'click', (e) => {
      const latLng = MapFunctions.pointToLatLng(this.map, e);

      if (!this.initialDrawPoint) {
        this.#setInitialDrawPoint(latLng, () => {
          polylinePath.removeAt(polylinePath.length - 1);

          this.#drawComplete();
        });
      }

      const polylinePath = this.drawnPolylineDraft.getPath();

      if (polylinePath.length > 0) {
        polylinePath.removeAt(polylinePath.length - 1);
      }

      polylinePath.push(latLng);
      polylinePath.push(latLng);

      this.drawnPolygonDraft.setPath(polylinePath);
      const lat = latLng.lat();
      const lng = latLng.lng();
      this.onPlotCallback({ lng, lat });
    });

    google.maps.event.addDomListener(this.map.getDiv(), 'mousemove', (e) => {
      const polylinePath = this.drawnPolylineDraft.getPath();

      if (polylinePath.length > 0) {
        const latLng = MapFunctions.pointToLatLng(this.map, e);
        polylinePath.setAt(polylinePath.length - 1, latLng);
      }
    });

    google.maps.event.addListenerOnce(this.map, 'dblclick', () => {
      setTimeout(() => {
        this.#drawComplete();
      }, 1);
    });
  };

  #drawComplete = () => {
    this.#clearDrawListeners();

    this.startedDrawing = false;

    MapFunctions.enableCrossair(this.map, false);

    if (this.initialDrawPoint) this.initialDrawPoint.remove();
    this.initialDrawPoint = null;

    this.drawnPolylineDraft.setMap(null);
    this.drawnPolygonDraft.setMap(null);

    const polygons = JstsHelper.processPolygon(
      this.drawnPolygonDraft.getPath().getArray()
    );

    if (polygons.length > 0) {
      this.drawnShape = [];

      let shape = [];

      polygons.forEach((p) => {
        this.drawnShape.push(
          new google.maps.Polygon({ path: p, ...this.polygonOptions })
        );

        shape = shape.concat(
          p.map((item) => {
            return { lat: item.lat(), lng: item.lng() };
          })
        );
      });

      this.#setDeleteDrawPoint();

      this.callback(shape);
    } else {
      this.#initDraw();
    }
  };

  #clearDrawListeners = () => {
    google.maps.event.clearListeners(this.map.getDiv(), 'click');
    google.maps.event.clearListeners(this.map.getDiv(), 'mousemove');
    google.maps.event.clearListeners(this.map, 'dblclick');
  };

  #initDrawFreeHand = () => {
    if (!this.startedDrawingFreeHand) {
      this.startedDrawingFreeHand = true;

      MapFunctions.freezeMap(this.map, true);

      this.#drawFreeHand();
    }
  };

  #drawFreeHand = () => {
    this.drawnPolylineDraft = new google.maps.Polyline({
      map: this.map,
      ...this.polygonOptions,
    });

    google.maps.event.addListenerOnce(this.map, 'mousedown', (e) => {
      event.preventDefault(); // eslint-disable-line no-restricted-globals
      event.stopPropagation(); // eslint-disable-line no-restricted-globals

      if (!this.initialDrawPoint) {
        this.#setInitialDrawPoint(e.latLng);
      }

      this.drawnPolylineDraft.getPath().push(e.latLng);

      google.maps.event.addListener(this.map, 'mousemove', (e) => {
        this.drawnPolylineDraft.getPath().push(e.latLng);
      });

      google.maps.event.addListenerOnce(this.map, 'mouseup', () => {
        this.#drawFreeHandComplete();
      });
    });
  };

  #drawFreeHandComplete = () => {
    this.#clearDrawFreeHandListeners();

    this.startedDrawingFreeHand = false;

    MapFunctions.freezeMap(this.map, false);

    if (this.initialDrawPoint) this.initialDrawPoint.remove();
    this.initialDrawPoint = null;

    this.drawnPolylineDraft.setMap(null);

    const polygons = JstsHelper.processPolygon(
      this.drawnPolylineDraft.getPath().getArray(),
      MapFunctions.getZoom(this.map)
    );

    if (polygons.length > 0) {
      this.drawnShape = [];

      let shape = [];

      polygons.forEach((p) => {
        this.drawnShape.push(
          new google.maps.Polygon({ path: p, ...this.polygonOptions })
        );

        shape = shape.concat(
          p.map((item) => {
            return { lat: item.lat(), lng: item.lng() };
          })
        );
      });

      this.#setDeleteDrawPoint();

      this.callback(shape);

      this.onPlotCallback(shape);
    } else {
      this.#initDrawFreeHand();
    }
  };

  #clearDrawFreeHandListeners = () => {
    google.maps.event.clearListeners(this.map, 'mousedown');
    google.maps.event.clearListeners(this.map, 'mousemove');
    google.maps.event.clearListeners(this.map, 'mouseup');
  };
}
