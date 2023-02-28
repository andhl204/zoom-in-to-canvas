const store = {
  canvasWidth: 0,
  canvasHeight: 0,
  sWidth: 0,
  sHeight: 0,
  sx: 0,
  sy: 0,
  zoomRatio: 0,
  x: 0,
  y: 0,
  imgElement: new Image(),
  hoveringSquare: true,
};

export const zoomIn = (zoomRatio: number, imageId: string, canvasId: string, hoveringSquare: boolean = true) => {
  (store.zoomRatio = zoomRatio), (store.hoveringSquare = hoveringSquare);
  const { image, canvas } = getImageAndCanvasTag(imageId, canvasId);
  if (image instanceof HTMLImageElement && canvas instanceof HTMLCanvasElement) {
    image.decode().then(() => {
      const context = setZoomCanvasSettings(canvas);
      if (hoveringSquare) {
        store.imgElement = renderNewImageElement(image);
        store.imgElement.decode().then(() => {
          if (context) onImageLoad(context);
        });
      } else if (context) {
        store.imgElement = image
        onImageLoad(context);
      }
    });
  }
};

const onImageLoad = (context: CanvasRenderingContext2D) => {
  const { canvasWidth, canvasHeight, zoomRatio, imgElement } = store;
  store.sWidth = (canvasWidth / zoomRatio) * (imgElement.naturalWidth / imgElement.width);
  store.sHeight = (canvasHeight / zoomRatio) * (imgElement.naturalHeight / imgElement.height);
  context.drawImage(imgElement, 0, 0, store.sWidth, store.sHeight, 0, 0, canvasWidth, canvasHeight);   
  const hoverCanvas = renderHoverCanvas();
  if (store.hoveringSquare) {
    drawHoverContext(hoverCanvas);
  }
  imgElement.addEventListener("mousemove", (e) => imgElementMousemoveEventListner(context, e, hoverCanvas));
};

const imgElementMousemoveEventListner = (context: CanvasRenderingContext2D | null, e: MouseEvent, hoverCanvas: HTMLCanvasElement) => {
  const { canvasWidth, canvasHeight, sWidth, sHeight, imgElement } = store;
  const rect = imgElement.getBoundingClientRect();
  const x = e.clientX - rect.left,
    y = e.clientY - rect.top;
  getSPosition(x, y);
  context?.drawImage(imgElement, store.sx, store.sy, sWidth, sHeight, 0, 0, canvasWidth, canvasHeight);
  if (store.hoveringSquare) drawHoverContext(hoverCanvas);
};

const getSPosition = (x: number, y: number) => {
  const { canvasWidth, canvasHeight, imgElement, sWidth, sHeight, zoomRatio } = store;
  store.sx =
    x + (canvasWidth / zoomRatio) * 0.5 < imgElement.width
      ? x - (canvasWidth / zoomRatio) * 0.5 > 0
        ? (x * imgElement.naturalWidth) / imgElement.width - 0.5 * sWidth
        : 0
      : (imgElement.width - canvasWidth / zoomRatio) * (imgElement.naturalWidth / imgElement.width);
  store.sy =
    y + (canvasHeight / zoomRatio) * 0.5 < imgElement.height
      ? y - (canvasHeight / zoomRatio) * 0.5 > 0
        ? (y * imgElement.naturalHeight) / imgElement.height - 0.5 * sHeight
        : 0
      : (imgElement.height - canvasHeight / zoomRatio) * (imgElement.naturalHeight / imgElement.height);
};

const getImageAndCanvasTag = (imageId: string, canvasId: string) => {
  const image = document.getElementById(imageId),
    canvas = document.getElementById(canvasId);
  return { image, canvas };
};

const setZoomCanvasSettings = (canvas: HTMLCanvasElement) => {
  store.canvasWidth = canvas.clientWidth;
  store.canvasHeight = canvas.clientHeight;
  const context = canvas.getContext("2d");
  return context;
};

const renderHoverCanvas = () => {
  const { imgElement } = store;
  const hoverCanvas = document.createElement("canvas");
  (hoverCanvas.width = imgElement.width), (hoverCanvas.height = imgElement.height);
  const rect = imgElement.getBoundingClientRect();
  hoverCanvas.style.zIndex = "2";
  renderInRespectToAnother(hoverCanvas, rect);
  hoverCanvas.style.pointerEvents = "none";
  return hoverCanvas;
};

const drawHoverContext = (hoverCanvas: HTMLCanvasElement) => {
  const { imgElement, sx, sy, sWidth, sHeight } = store;
  const hoverContext = hoverCanvas.getContext("2d");
  if (hoverContext) {
    hoverContext.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
    hoverContext.fillStyle = "rgba(255, 255, 255, 0.3)";
    hoverContext.fillRect(
      (sx * imgElement.width) / imgElement.naturalWidth,
      (sy * imgElement.height) / imgElement.naturalHeight,
      (sWidth * imgElement.width) / imgElement.naturalWidth,
      (sHeight * imgElement.height) / imgElement.naturalHeight,
    );
  }
};

const renderNewImageElement = (image: HTMLImageElement) => {
  const imgElement = new Image();
  image.getAttributeNames().map((name) => {
    imgElement.setAttribute(name, image.getAttribute(name) || "");
  });
  const styles = window.getComputedStyle(image);
  imgElement.style.cssText = Array.from(styles).reduce((name, property) => `${name}${property}:${(styles.getPropertyValue(property), "")}`);
  imgElement.style.margin = "0"
  const rect = image.getBoundingClientRect();
  renderInRespectToAnother(imgElement, rect);
  image.style.visibility = "hidden";
  return imgElement;
};
  
 const renderInRespectToAnother = (element: HTMLElement, rect: DOMRect) => {
  element.style.position = "absolute";
  element.style.top = `${rect.top}px`;
  element.style.left = `${rect.left}px`;
  document.body.appendChild(element);
};