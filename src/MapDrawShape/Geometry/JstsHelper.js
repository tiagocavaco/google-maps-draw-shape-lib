import * as jsts from 'jsts/dist/jsts';

export default class JstsHelper {
  /**
   * @param {object[]} shape Array of objects that contain lat lng values
   * @param {bool} validate Flag indicating whether it should validate the shape
   * @returns {object[]} Array of that contains polygons that are Lists of google.maps.LatLng objects
   */
  static processShape = (shape, validate) => {
    let polygons = [];

    if (shape?.length > 2) {
      let shapePolygons = [];

      let polygon = [];

      let firstCoordinate = null;

      for (let i = 0; i < shape.length; i++) {
        if (!firstCoordinate) {
          firstCoordinate = shape[i];

          polygon = [];
          polygon.push(validate ? new jsts.geom.Coordinate(shape[i].lng, shape[i].lat) : new google.maps.LatLng(shape[i].lat, shape[i].lng));

          continue;
        }

        polygon.push(validate ? new jsts.geom.Coordinate(shape[i].lng, shape[i].lat) : new google.maps.LatLng(shape[i].lat, shape[i].lng));

        if (firstCoordinate.lat === shape[i].lat && firstCoordinate.lng === shape[i].lng) {
          if (polygon.length > 3) {
            shapePolygons.push(polygon);
          }

          firstCoordinate = null;
        } else {
          if (i === shape.length - 1) {
            polygon.push(polygon[0]);

            if (polygon.length > 3) {
              shapePolygons.push(polygon);
            }
          }
        }
      }

      if (!validate) {
        polygons = shapePolygons;
      } else {
        if (shapePolygons.length > 0) {
          const geometryFactory = new jsts.geom.GeometryFactory();

          const jstsPolygons = shapePolygons.map((item) => {
            const shell = geometryFactory.createLinearRing(item);
            return geometryFactory.createPolygon(shell);
          });

          const jstsPolygon = jstsPolygons.length > 1 ? geometryFactory.createMultiPolygon(jstsPolygons) : jstsPolygons[0];

          const validPolygon = this.#validateGeometry(jstsPolygon);

          if (validPolygon && validPolygon.getCoordinates().length) {
            polygons = this.#convertFromJstsGeometry(validPolygon);
          }
        }
      }
    }

    return polygons;
  };

  /**
   * @param {google.maps.LatLng[]} path Array of google.maps.LatLng objects
   * @param {number} simplifyZoom Zoom level to take into account when simplifying the shape
   * @returns {object[]} Array of that contains polygons that are Lists of google.maps.LatLng objects
   */
  static processPolygon = (path, simplifyZoom) => {
    let polygons = [];

    if (path?.length > 2) {
      const coordinates = path.map((item) => {
        return new jsts.geom.Coordinate(item.lng(), item.lat());
      });

      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
      }

      const geometryFactory = new jsts.geom.GeometryFactory();

      const shell = geometryFactory.createLinearRing(coordinates);

      let jstsPolygon = geometryFactory.createPolygon(shell);

      if (simplifyZoom) {
        jstsPolygon = this.#simplifyPolygon(jstsPolygon, simplifyZoom);
      }

      const validPolygon = this.#validateGeometry(jstsPolygon);

      if (validPolygon && validPolygon.getCoordinates().length) {
        polygons = this.#convertFromJstsGeometry(validPolygon);
      }
    }

    return polygons;
  };

  static #simplifyPolygon = (polygon, zoom) => {
    let tolerance = 0.1;

    switch (zoom) {
      case 7:
      case 8:
      case 9: {
        tolerance = 0.01;
        break;
      }
      case 10:
      case 11:
      case 12:
      case 13: {
        tolerance = 0.001;
        break;
      }
      case 14:
      case 15:
      case 16:
      case 17: {
        tolerance = 0.0001;
        break;
      }
      case 18:
      case 19:
      case 20:
      case 21:
      case 22: {
        tolerance = 0.00001;
        break;
      }
      default:
        tolerance = 0.1;
    }

    return jsts.simplify.TopologyPreservingSimplifier.simplify(polygon, tolerance);
  };

  static #convertFromJstsGeometry = (geom) => {
    let polygons = [];

    // Sets shape on clockwise order
    geom.normalize();

    if (geom instanceof jsts.geom.Polygon) {
      const polygon = this.#convertFromJstsCoordinates(geom.getCoordinates());

      polygons.push(polygon);
    }

    if (geom instanceof jsts.geom.MultiPolygon) {
      for (let n = geom.getNumGeometries(); n > 0; n--) {
        const polygon = this.#convertFromJstsCoordinates(geom.getGeometryN(n - 1).getCoordinates());

        polygons.push(polygon);
      }
    }

    return polygons;
  };

  static #convertFromJstsCoordinates = (coordinates) => {
    let path = [];

    if (coordinates) {
      let lastCoordinate = null;

      for (let i = 0; i < coordinates.length; i++) {
        if (!lastCoordinate || !(lastCoordinate.x === coordinates[i].x && lastCoordinate.y === coordinates[i].y)) {
          lastCoordinate = coordinates[i];

          path.push(new google.maps.LatLng(lastCoordinate.y, lastCoordinate.x));
        }
      }
    }

    return path;
  };

  static #validateGeometry = (geom) => {
    if (geom instanceof jsts.geom.Polygon) {
      if (geom.isValid()) {
        return geom;
      }

      let polygonizer = new jsts.operation.polygonize.Polygonizer();

      this.#addPolygon(geom, polygonizer);

      return this.#toPolygonGeometry(polygonizer.getPolygons());
    } else if (geom instanceof jsts.geom.MultiPolygon) {
      if (geom.isValid()) {
        return geom;
      }

      let polygonizer = new jsts.operation.polygonize.Polygonizer();

      for (let n = geom.getNumGeometries(); n > 0; n--) {
        this.#addPolygon(geom.getGeometryN(n - 1), polygonizer);
      }

      return this.#toPolygonGeometry(polygonizer.getPolygons());
    } else {
      return geom;
    }
  };

  static #addPolygon = (polygon, polygonizer) => {
    this.#addLineString(polygon.getExteriorRing(), polygonizer);

    for (let n = polygon.getNumInteriorRing(); n > 0; n--) {
      this.#addLineString(polygon.getInteriorRingN(n), polygonizer);
    }
  };

  static #addLineString = (lineString, polygonizer) => {
    if (lineString instanceof jsts.geom.LinearRing) {
      lineString = lineString.getFactory().createLineString(lineString.getCoordinateSequence());
    }

    let point = lineString.getFactory().createPoint(lineString.getCoordinateN(0));
    let toAdd = lineString.union(point);

    polygonizer.add(toAdd);
  };

  static #toPolygonGeometry = (polygons) => {
    switch (polygons.size()) {
      case 0:
        return null;
      case 1:
        return polygons.iterator().next();
      default:
        let iter = polygons.iterator();
        let ret = iter.next();

        while (iter.hasNext()) {
          ret = ret.symDifference(iter.next());
        }

        return ret;
    }
  };
}
