# Google Maps Draw Shape Library

[![npm latest][0]][1] [![ci][2]][3] [![license][4]][5]

`google-maps-draw-shape-lib` is a javascript library written over a small set of the [Google Maps API](https://developers.google.com/maps/), that allows you to draw a polygon shape over a google map and get it's coordinates.

## Install

```sh
npm i google-maps-draw-shape-lib
```

## Usage

```js
import MapDrawShapeManager from 'google-maps-draw-shape-lib';

// Google Maps JavaScript API instance
const map = new google.maps.Map(element, mapOptions);
// Callback function that will be called when user create or delete shape 
const onDrawCallback = (shape) => console.log(shape);
// Flag indicating whether it should set Drawing Mode enabled
const drawingMode = false;
// Flag indicating whether it should set Draw Free Hand Mode enabled
const drawFreeHandMode = false;
// Object containing the google polygon options to be used when drawing
const polygonOptions = {
  clickable: false,
  fillColor: "#303030",
  fillOpacity: 0.1,
  strokeColor: "#000000",
  strokeWeight: 4,
  strokeOpacity: 1
};
// String with the inner HTML of the draw initial point overlay 
const initialPointInnerHtml = `<button class="your-custom-initial-point-class" title="Initial Point"></button>`;
// String with the inner HTML of the draw delete point overlay 
const deletePointInnerHtml = `<button class="your-custom-delete-point-class" title="Delete">X</button></div>`;

// Create Google Maps Draw Shape Library instance
const manager = new MapDrawShapeManager(
  map,
  onDrawCallback, 
  drawingMode,
  drawFreeHandMode,
  polygonOptions,
  initialPointInnerHtml,
  deletePointInnerHtml
);

// Example of shape returned on callback function
const initalShape = [
  { lat: 38.71755745031312, lng: -9.34395756832437 },
  { lat: 39.780999209652855, lng: -8.82210698238687 },
  { lat: 38.91016617157451, lng: -6.82259526363687 },
  { lat: 38.71755745031312, lng: -9.34395756832437 }
];

// Draws the input shape on the map
manager.initDrawnShape(initalShape);

// Clears the drawn shape
manager.resetDrawnShape();

// Sets the draw mode to drag instead of click if drawFreeHandMode flag is true
manager.setDrawFreeHandMode(drawFreeHandMode);

// Sets the map on draw mode if drawingMode flag is true
manager.setDrawingMode(drawingMode);
```

## Examples

Example of this library being used in React: [google-maps-draw-shape-react](https://tiagocavaco.github.io/google-maps-draw-shape-react/) ([source](https://github.com/tiagocavaco/google-maps-draw-shape-react))

## License

[MIT](./LICENSE.md)

[0]: https://img.shields.io/npm/v/google-maps-draw-shape-lib
[1]: https://www.npmjs.com/package/google-maps-draw-shape-lib
[2]: https://github.com/tiagocavaco/google-maps-draw-shape-lib/actions/workflows/ci.yml/badge.svg?branch=main
[3]: https://github.com/tiagocavaco/google-maps-draw-shape-lib/actions/workflows/ci.yml
[4]: https://img.shields.io/github/license/tiagocavaco/google-maps-draw-shape-lib
[5]: https://github.com/tiagocavaco/google-maps-draw-shape-lib/blob/main/LICENSE.md
