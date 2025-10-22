declare namespace naver.maps {
  interface Map {
    getCenter(): LatLng;
    setCenter(center: LatLng | LatLngLiteral): void;
    getZoom(): number;
    setZoom(zoom: number): void;
    getBounds(): Bounds;
    setBounds(bounds: Bounds): void;
    panTo(point: LatLng | LatLngLiteral): void;
    panBy(deltaX: number, deltaY: number): void;
    setOptions(options: MapOptions): void;
    getOptions(): MapOptions;
    getSize(): Size;
    getProjection(): Projection;
    getMapTypeId(): MapTypeId;
    setMapTypeId(mapTypeId: MapTypeId): void;
    getMapTypes(): MapType[];
    addListener(eventName: string, listener: Function): void;
    removeListener(eventName: string, listener: Function): void;
    hasListener(eventName: string): boolean;
    trigger(eventName: string, data?: any): void;
    destroy(): void;
  }

  interface LatLng {
    lat(): number;
    lng(): number;
    equals(latLng: LatLng): boolean;
    toString(): string;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface Size {
    width: number;
    height: number;
  }

  interface Bounds {
    getNE(): LatLng;
    getSW(): LatLng;
    getCenter(): LatLng;
    isEmpty(): boolean;
    hasPoint(point: LatLng): boolean;
    hasBounds(bounds: Bounds): boolean;
    extend(point: LatLng): Bounds;
    toString(): string;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeId?: MapTypeId;
    size?: Size;
    maxZoom?: number;
    minZoom?: number;
    disableDoubleClickZoom?: boolean;
    disableDoubleClick?: boolean;
    scrollWheel?: boolean;
    keyboardShortcuts?: boolean;
    draggable?: boolean;
    pinchZoom?: boolean;
    zoomControl?: boolean;
    zoomControlOptions?: ZoomControlOptions;
    mapDataControl?: boolean;
    scaleControl?: boolean;
    logoControl?: boolean;
    logoControlOptions?: LogoControlOptions;
    mapTypeControl?: boolean;
    mapTypeControlOptions?: MapTypeControlOptions;
    overviewMapControl?: boolean;
    overviewMapControlOptions?: OverviewMapControlOptions;
  }

  interface ZoomControlOptions {
    position?: Position;
    style?: ZoomControlStyle;
  }

  interface LogoControlOptions {
    position?: Position;
  }

  interface MapTypeControlOptions {
    position?: Position;
    style?: MapTypeControlStyle;
    mapTypeIds?: MapTypeId[];
  }

  interface OverviewMapControlOptions {
    position?: Position;
    opened?: boolean;
  }

  enum Position {
    TOP_LEFT = 'TOP_LEFT',
    TOP_CENTER = 'TOP_CENTER',
    TOP_RIGHT = 'TOP_RIGHT',
    LEFT_TOP = 'LEFT_TOP',
    LEFT_CENTER = 'LEFT_CENTER',
    LEFT_BOTTOM = 'LEFT_BOTTOM',
    RIGHT_TOP = 'RIGHT_TOP',
    RIGHT_CENTER = 'RIGHT_CENTER',
    RIGHT_BOTTOM = 'RIGHT_BOTTOM',
    BOTTOM_LEFT = 'BOTTOM_LEFT',
    BOTTOM_CENTER = 'BOTTOM_CENTER',
    BOTTOM_RIGHT = 'BOTTOM_RIGHT'
  }

  enum ZoomControlStyle {
    SMALL = 'SMALL',
    LARGE = 'LARGE'
  }

  enum MapTypeControlStyle {
    BUTTON = 'BUTTON',
    DROPDOWN = 'DROPDOWN'
  }

  enum MapTypeId {
    NORMAL = 'normal',
    SATELLITE = 'satellite',
    HYBRID = 'hybrid',
    TERRAIN = 'terrain'
  }

  interface MapType {
    getName(): string;
    getMinZoom(): number;
    getMaxZoom(): number;
    getTileSize(): Size;
    getTileUrl(x: number, y: number, z: number): string;
  }

  interface Projection {
    fromCoordToOffset(coord: LatLng): Point;
    fromOffsetToCoord(offset: Point): LatLng;
    getBounds(): Bounds;
    getZoom(): number;
  }

  interface Point {
    x: number;
    y: number;
  }

  interface Marker {
    getPosition(): LatLng;
    setPosition(position: LatLng | LatLngLiteral): void;
    getMap(): Map | null;
    setMap(map: Map | null): void;
    getTitle(): string;
    setTitle(title: string): void;
    getIcon(): Icon | string;
    setIcon(icon: Icon | string): void;
    getZIndex(): number;
    setZIndex(zIndex: number): void;
    getVisible(): boolean;
    setVisible(visible: boolean): void;
    getClickable(): boolean;
    setClickable(clickable: boolean): void;
    getDraggable(): boolean;
    setDraggable(draggable: boolean): void;
    getAnimation(): Animation;
    setAnimation(animation: Animation): void;
    addListener(eventName: string, listener: Function): void;
    removeListener(eventName: string, listener: Function): void;
    hasListener(eventName: string): boolean;
    trigger(eventName: string, data?: any): void;
  }

  interface Icon {
    content: string;
    size?: Size;
    anchor?: Point;
    origin?: Point;
    scaledSize?: Size;
  }

  enum Animation {
    NONE = 0,
    BOUNCE = 1,
    DROP = 2
  }

  interface MarkerOptions {
    position: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: Icon | string;
    zIndex?: number;
    visible?: boolean;
    clickable?: boolean;
    draggable?: boolean;
    animation?: Animation;
  }

  class Map {
    constructor(container: HTMLElement | string, options?: MapOptions);
  }

  class Marker {
    constructor(options: MarkerOptions);
  }

  class LatLng {
    constructor(lat: number, lng: number);
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Bounds {
    constructor(sw: LatLng, ne: LatLng);
  }

  class Point {
    constructor(x: number, y: number);
  }

  namespace Event {
    function addListener(instance: any, eventName: string, listener: Function): void;
    function removeListener(instance: any, eventName: string, listener: Function): void;
    function hasListener(instance: any, eventName: string): boolean;
    function trigger(instance: any, eventName: string, data?: any): void;
  }
}
