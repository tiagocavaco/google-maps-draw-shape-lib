import MapDrawShapeManager from '../src/index';

const polygonSetMapMock = jest.fn();
const addDomListenerMock = jest.fn();
const addListenerOnceMock = jest.fn();
const clearListenersMock = jest.fn();

(window as any).google = {
  maps: {
    Map: class {
      getDiv = () => document.createElement('div');
      getZoom() {}
      getBounds() {}
      setOptions() {}
    },
    LatLng: class {
      lat() {}
      lng() {}
    },
    Path: class {
      getArray = () => [];
    },
    Polygon: class {
      getPath = () => new (window as any).google.maps.Path();
      setMap = polygonSetMapMock;
    },
    Polyline: class {
      setMap() {}
    },
    OverlayView: class {
      setMap() {}
      getProjection() {}
    },
    event: class {
      static addDomListener = addDomListenerMock;
      static addListenerOnce = addListenerOnceMock;
      static clearListeners = clearListenersMock;
    }
  }
};

let map;
let polygonOptions;
let initialPointInnerHtml;
let deletePointInnerHtml;
let manager;

beforeEach(() => {
  //Google Maps JavaScript API instance
  map = new (window as any).google.maps.Map();
  //Callback function that will be called when user create or delete shape
  const onDrawCallback = (shape) => console.log(shape);
  //Flag indicating whether it should set Drawing Mode enabled
  const drawingMode = false;
  //Flag indicating whether it should set Draw Free Hand Mode enabled
  const drawFreeHandMode = false;
  //Object containing the google polygon options to be used when drawing
  polygonOptions = {
    clickable: false,
    fillColor: '#303030',
    fillOpacity: 0.1,
    strokeColor: '#000000',
    strokeWeight: 4,
    strokeOpacity: 1
  };
  //String with the inner HTML of the draw initial point overlay
  initialPointInnerHtml = `<button class="your-custom-initial-point-class" title="Initial Point"></button>`;
  //String with the inner HTML of the draw delete point overlay
  deletePointInnerHtml = `<button class="your-custom-delete-point-class" title="Delete">X</button></div>`;

  //Create Google Maps Draw Shape Library instance
  manager = new MapDrawShapeManager(map, onDrawCallback, drawingMode, drawFreeHandMode, polygonOptions, initialPointInnerHtml, deletePointInnerHtml);
});

afterEach(() => jest.clearAllMocks());

describe('MapDrawShapeManager', () => {
  it('Should be initialized with success', () => {
    expect(manager).toBeDefined();
    expect(manager.drawFreeHandMode).toBeFalsy();
    expect(manager.polygonOptions).toBe(polygonOptions);
    expect(manager.initialPointInnerHtml).toBe(initialPointInnerHtml);
    expect(manager.deletePointInnerHtml).toBe(deletePointInnerHtml);
  });

  it('Should initialize shape with success', () => {
    expect(manager).toBeDefined();
    //Example of shape returned on callback function
    const initalShape = [
      { lat: 38.71755745031312, lng: -9.34395756832437 },
      { lat: 39.780999209652855, lng: -8.82210698238687 },
      { lat: 38.91016617157451, lng: -6.82259526363687 },
      { lat: 38.71755745031312, lng: -9.34395756832437 }
    ];

    //Draws the input shape on the map
    manager.initDrawnShape(initalShape);

    expect(polygonSetMapMock).toHaveBeenCalledTimes(1);
    expect(polygonSetMapMock).toHaveBeenCalledWith(map);
  });

  it('Should clear shape with success', () => {
    expect(manager).toBeDefined();
    //Example of shape returned on callback function
    const initalShape = [
      { lat: 38.71755745031312, lng: -9.34395756832437 },
      { lat: 39.780999209652855, lng: -8.82210698238687 },
      { lat: 38.91016617157451, lng: -6.82259526363687 },
      { lat: 38.71755745031312, lng: -9.34395756832437 }
    ];

    //Draws the input shape on the map
    manager.initDrawnShape(initalShape);

    //Clears the drawn shape
    manager.resetDrawnShape();

    expect(polygonSetMapMock).toHaveBeenCalledTimes(2);
    expect(polygonSetMapMock).toHaveBeenCalledWith(null);
  });

  it('Should set in free hand mode if flag is true', () => {
    manager.setDrawFreeHandMode(true);
    expect(manager.drawFreeHandMode).toBeTruthy();
  });

  it('Should set in drawing click mode if flag is true', () => {
    manager.setDrawingMode(true);

    expect(addDomListenerMock).toHaveBeenCalledTimes(2);
    expect(addDomListenerMock).toHaveBeenCalledWith(expect.anything(), 'click', expect.anything());
    expect(addDomListenerMock).toHaveBeenCalledWith(expect.anything(), 'mousemove', expect.anything());

    expect(addListenerOnceMock).toHaveBeenCalledTimes(1);
    expect(addListenerOnceMock).toHaveBeenCalledWith(expect.anything(), 'dblclick', expect.anything());
  });

  it('Should set in drawing drag mode if flag is true and free hand mode is enabled ', () => {
    manager.setDrawFreeHandMode(true);
    manager.setDrawingMode(true);

    expect(addListenerOnceMock).toHaveBeenCalledTimes(1);
    expect(addListenerOnceMock).toHaveBeenCalledWith(expect.anything(), 'mousedown', expect.anything());
  });

  it('Should clear event listeners when drawing click mode is disabled', () => {
    manager.setDrawingMode(true);
    manager.setDrawingMode(false);

    expect(clearListenersMock).toHaveBeenCalledTimes(3);
    expect(clearListenersMock).toHaveBeenCalledWith(expect.anything(), 'click');
    expect(clearListenersMock).toHaveBeenCalledWith(expect.anything(), 'mousemove');
    expect(clearListenersMock).toHaveBeenCalledWith(expect.anything(), 'dblclick');
  });

  it('Should clear event listeners when drawing drag mode is disabled', () => {
    manager.setDrawFreeHandMode(true);
    manager.setDrawingMode(true);
    manager.setDrawingMode(false);

    expect(clearListenersMock).toHaveBeenCalledTimes(3);
    expect(clearListenersMock).toHaveBeenCalledWith(expect.anything(), 'mousedown');
    expect(clearListenersMock).toHaveBeenCalledWith(expect.anything(), 'mousemove');
    expect(clearListenersMock).toHaveBeenCalledWith(expect.anything(), 'mouseup');
  });
});
