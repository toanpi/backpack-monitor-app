var serial = require('./serial-handler')
const {ipcRenderer} = require('electron')
const FLIR_CAM_PORT = 5;


var port5Btn = document.getElementById(`port-${FLIR_CAM_PORT}-btn`)
let canvas = document.getElementById('flir-cam-capture');
const canvasContainer = document.getElementById('canvas-container');
var zoomValArea = document.getElementById('flir-cam-scale-value')
var zoomOutBtn = document.getElementById('flir-cam-scale-out')
var zoomInBtn = document.getElementById('flir-cam-scale-in')
var zoomResetBtn = document.getElementById('flir-cam-scale-reset')
var camPlayBtn = document.getElementById('flir-cam-play')
var camPauseBtn = document.getElementById('flir-cam-pause')

const lastPos = { x: 0, y: 0 };
let isDragging = false;
const root = document.documentElement;
var imageScale = 5;

/*******************************************************************************
Function:
  ()
Input Parameters:
  ---
Output Parameters:
  ---
Description:
  ---
Notes:
  ---
Author, Date:
  Toan Huynh, 11/05/2021
*******************************************************************************/
function showImg(scale, width, height, colorData) {
  let ctx = canvas.getContext('2d');
  canvas.width = width * scale;
  canvas.height = height * scale;
  for (let x = 0; x < width; x++){
    for (let y = 0; y < height; y++){
      let color = colorData[(y * width) + x];
      ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + 1.0 + ")";
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  // scaleDisplay.innerHTML = "Zoom: " + String(scale * 100) + "%";
}

function onMouseDown(e) {
  lastPos.x = e.clientX;
  lastPos.y = e.clientY;
  canvasContainer.style.cursor = 'grabbing';
  isDragging = true;
};

function onMouseMove(e) {
  if (isDragging) {
    canvasContainer.style.cursor = 'grabbing';
    const dx = lastPos.x - e.clientX;
    const dy = lastPos.y - e.clientY;
    canvasContainer.scrollLeft += dx;
    root.scrollTop += dy;
    lastPos.x = e.clientX;
    lastPos.y = e.clientY;
  }
};
function onMouseUp(e) {
  canvasContainer.style.cursor = 'grab';
  isDragging = false;
};

if (canvasContainer) {
  canvasContainer.onmousedown = onMouseDown;
  canvasContainer.onmousemove = onMouseMove;
  canvasContainer.onmouseup = onMouseUp;
}

/*******************************************************************************
Function:
  ()
Input Parameters:
  ---
Output Parameters:
  ---
Description:
  ---
Notes:
  ---
Author, Date:
  Toan Huynh, 11/05/2021
*******************************************************************************/
function processCamData(data) {
  let width = data.width;
  let height = data.height;
  let colorData = data.colorData;
  showImg(imageScale, width, height, colorData);
}

function updateZoomLevel(zoomLevel) {
  zoomValArea.innerHTML = zoomLevel * 100 + "%";
}

//******************************************************************************
//   DATA HANDLER
//******************************************************************************
ipcRenderer.on("serial-data", (event, arg) => {
  if (arg.portID === "port-" + FLIR_CAM_PORT) {
    if (arg.data.hasOwnProperty("colorData")) {
      processCamData(arg.data);
    } else {
      if (arg.data.hasOwnProperty("log"))
        serial.showOnScreen(arg.portID, arg.data.log);
    }
  }
});

ipcRenderer.on("serial-event", (event, arg) => {
  switch (true) {
    case arg.event == "error":
    case arg.event == "close":
      //{event: "error", portID: portID}
      if (arg.portID === "port-" + FLIR_CAM_PORT) {
        serial.updatePortStatus("disconnected", port5Btn);
      }
    break;
  }
});

//******************************************************************************
//   Check port status
//******************************************************************************
if(port5Btn){
  port5Btn.addEventListener("click", () => {
    serial.connectReq(FLIR_CAM_PORT, port5Btn, 'raw');
  });
}

serial.checkPortConnected(FLIR_CAM_PORT, port5Btn);
updateZoomLevel(imageScale);



zoomOutBtn.addEventListener("click", () => {
  if (imageScale < 100) {
    imageScale++;
  }
  updateZoomLevel(imageScale);
});

zoomInBtn.addEventListener("click", () => {
  if (imageScale > 1) {
    imageScale--;
  }
  updateZoomLevel(imageScale);
});

zoomResetBtn.addEventListener("click", () => {
  imageScale = 5;
  updateZoomLevel(imageScale);
});

// camPlayBtn.addEventListener("click", () => {
    
// })

// camPauseBtn.addEventListener("click", () => {

// })
