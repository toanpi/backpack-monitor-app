const Store = require('electron-store');
const settings = new Store();

var serial = require('./serial-handler')
const {ipcRenderer} = require('electron')
const FLIR_CAM_PORT = 5;


var port5Btn = document.getElementById(`port-${FLIR_CAM_PORT}-btn`)
let canvas = document.getElementById('flir-cam-image');
const canvasContainer = document.getElementById('canvas-container');
var zoomValArea = document.getElementById('flir-cam-scale-value')
var zoomOutBtn = document.getElementById('flir-cam-scale-out')
var zoomInBtn = document.getElementById('flir-cam-scale-in')
var zoomResetBtn = document.getElementById('flir-cam-scale-reset')
var camPlayBtn = document.getElementById('flir-cam-play')
var camPauseBtn = document.getElementById('flir-cam-pause')
var camCaptureBtn = document.getElementById('flir-cam-capture')
var camSettingSaveBtn = document.getElementById('flir-cam-setting-save')

var camBootupBtn = document.getElementById('flir-cam-bootup');
var camShutdownBtn = document.getElementById('flir-cam-shut-down');
var camPowerOffBtn = document.getElementById('flir-cam-power-off');
var camPowerOnBtn = document.getElementById('flir-cam-power-on');

var camAlwaysONBtn = document.getElementById('flir-cam-always-on');
var BtnLowPowerBtn = document.getElementById('flir-cam-power-optimize');
var BtnRunFccBtn = document.getElementById('flir-cam-run-ffc');
var BtnGetInfoBtn = document.getElementById('flir-cam-get-info');


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
  Toan Huynh, 11/10/2021
*******************************************************************************/
function cmdReq(event, portIdx) {

  let req = {
    event: event,
    portID: "port-" + portIdx,
    video_interval: getDataById("flir-cam-setting-capture-interval"),
  };

  switch (true) {
    case event == "start-video":
      break;
    case event == "stop-video":
      break;
    case event == "start-capture":
      break;
    case event == "update-video-interval":
      break;
    default:
      // req = null;
      break;
  }

  console.log(req);

  if (req) {
    return serial.actionReq(portIdx, req);
  }
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
  Toan Huynh, 11/10/2021
*******************************************************************************/
function updateLogPath()
{
  let logDir = getDataById('flir-cam-setting-log-dir', "")
  let logName = getDataById('flir-cam-setting-log-name', "")

  ipcRenderer.send("rt685-event", {
    event: "update-log-path",
    logDir: logDir,
    logName: logName
  });

}
/*******************************************************************************
Function:
  initData()
Input Parameters:
  ---
Output Parameters:
  ---
Description:
  ---
Notes:
  ---
Author, Date:
  Toan Huynh, 11/08/2021
*******************************************************************************/
function initData(id, defaultValue) {
  document.getElementById(id).value = settings.get(id, defaultValue)
}

function storeData(id) {
  settings.set(id, document.getElementById(id).value);
}

function getDataById(id) {
  return document.getElementById(id).value
}

//******************************************************************************
//   Button Handler
//******************************************************************************
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

camPlayBtn.addEventListener("click", () => {
  cmdReq("flir-cam-start-video", FLIR_CAM_PORT);
})

camPauseBtn.addEventListener("click", () => {
  cmdReq("flir-cam-stop-video", FLIR_CAM_PORT);
})


camCaptureBtn.addEventListener("click", () => {
  cmdReq("flir-cam-start-capture", FLIR_CAM_PORT);
})

camSettingSaveBtn.addEventListener("click", () => {
  storeData('flir-cam-setting-log-dir')
  // storeData('flir-cam-setting-log-name')
  storeData('flir-cam-setting-capture-interval')
  updateLogPath();
  cmdReq("flir-cam-update-video-interval", FLIR_CAM_PORT);
})


camBootupBtn.addEventListener("click", () =>{
  cmdReq("flir-cam-bootup", FLIR_CAM_PORT);
});
camShutdownBtn.addEventListener("click", () =>{
  cmdReq("flir-cam-shut-down", FLIR_CAM_PORT);
});
camPowerOffBtn.addEventListener("click", () =>{
  cmdReq("flir-cam-power-off", FLIR_CAM_PORT);
});
camPowerOnBtn.addEventListener("click", () =>{
  cmdReq("flir-cam-power-on", FLIR_CAM_PORT);
});

camAlwaysONBtn.addEventListener('click', () => {
  cmdReq("flir-cam-always-on", FLIR_CAM_PORT);
})

BtnLowPowerBtn.addEventListener('click', () => {
  cmdReq("flir-cam-power-optimize", FLIR_CAM_PORT);
})

BtnRunFccBtn.addEventListener('click', () => {
  cmdReq("flir-cam-run-ffc", FLIR_CAM_PORT);
})

BtnGetInfoBtn.addEventListener('click', () => {
  cmdReq("flir-cam-get-info", FLIR_CAM_PORT);
})

//******************************************************************************
//   INIT
//******************************************************************************
serial.getPortInput(FLIR_CAM_PORT).value = settings.get('port-'+ FLIR_CAM_PORT, 3)
serial.getBaudrateInput(FLIR_CAM_PORT).value = settings.get('baudrate'+ FLIR_CAM_PORT, 115200)

const now = new Date();
initData('flir-cam-setting-log-name', `flir_cam_log_${now.getMonth()}_${now.getDate()}_${now.getFullYear()}`)
initData('flir-cam-setting-log-dir', "c:\\")
initData('flir-cam-setting-capture-interval', 1)

serial.checkPortConnected(FLIR_CAM_PORT, port5Btn);
updateZoomLevel(imageScale);

updateLogPath();

if(port5Btn){
  port5Btn.addEventListener("click", () => {
    serial.connectReq(FLIR_CAM_PORT, port5Btn, 'raw');
    settings.set('flir-cam-port', serial.getPortInput(FLIR_CAM_PORT).value)
    settings.set('flir-cam-baudrate', serial.getBaudrateInput(FLIR_CAM_PORT).value)
  });
}
