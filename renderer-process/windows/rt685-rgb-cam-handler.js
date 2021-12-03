var serial = require('./serial-handler')
const {ipcRenderer} = require('electron')
var rt685Core = require('./rt685-core')


let canvas = document.getElementById('rgb-cam-image');
// const canvasContainer = document.getElementById('rgb-cam-canvas-container');
var zoomValArea = document.getElementById('rgb-cam-scale-value')
var zoomOutBtn = document.getElementById('rgb-cam-scale-out')
var zoomInBtn = document.getElementById('rgb-cam-scale-in')
var zoomResetBtn = document.getElementById('rgb-cam-scale-reset')
var camPlayBtn = document.getElementById('rgb-cam-play')
var camPauseBtn = document.getElementById('rgb-cam-pause')
var camCaptureBtn = document.getElementById('rgb-cam-capture')
var camSettingSaveBtn = document.getElementById('rgb-cam-setting-save')

var camBootupBtn = document.getElementById('rgb-cam-bootup');
var camShutdownBtn = document.getElementById('rgb-cam-shut-down');
var camPowerOffBtn = document.getElementById('rgb-cam-power-off');
var camPowerOnBtn = document.getElementById('rgb-cam-power-on');

var camAlwaysONBtn = document.getElementById('rgb-cam-always-on');
var BtnLowPowerBtn = document.getElementById('rgb-cam-power-optimize');
var BtnGetInfoBtn = document.getElementById('rgb-cam-get-info');


var imageScale = 1;

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
    video_interval: rt685Core.getDataById("rgb-cam-setting-capture-interval"),
  };

  rt685Core.showLog("[APP] Sent request " + event +" to the board. Please wait..");

  console.log(req);

  if (req) {
    return serial.actionReq(portIdx, req);
  }
}
/*******************************************************************************
Function:
  updateLogPath()
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
  let logDir = rt685Core.getDataById('rgb-cam-setting-log-dir', "")
  let logName = rt685Core.getDataById('rgb-cam-setting-log-name', "")

  ipcRenderer.send("rt685-event", {
    event: "update-rgb-log-path",
    logDir: logDir,
    logName: logName
  });

}

function updateZoomLevel(zoomLevel) {
  zoomValArea.innerHTML = zoomLevel * 100 + "%";
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
  imageScale = 1;
  updateZoomLevel(imageScale);
});

camPlayBtn.addEventListener("click", () => {
  cmdReq("rgb-cam-start-video", rt685Core.RT685_COM_PORT);
})

camPauseBtn.addEventListener("click", () => {
  cmdReq("rgb-cam-stop-video", rt685Core.RT685_COM_PORT);
})


camCaptureBtn.addEventListener("click", () => {
  cmdReq("rgb-cam-start-capture", rt685Core.RT685_COM_PORT);
})

camSettingSaveBtn.addEventListener("click", () => {
  rt685Core.storeData('rgb-cam-setting-log-dir')
  // rt685Core.storeData('rgb-cam-setting-log-name')
  rt685Core.storeData('rgb-cam-setting-capture-interval')
  updateLogPath();
  cmdReq("rgb-cam-update-video-interval", rt685Core.RT685_COM_PORT);
})


camBootupBtn.addEventListener("click", () =>{
  cmdReq("rgb-cam-bootup", rt685Core.RT685_COM_PORT);
});
camShutdownBtn.addEventListener("click", () =>{
  cmdReq("rgb-cam-shut-down", rt685Core.RT685_COM_PORT);
});
camPowerOffBtn.addEventListener("click", () =>{
  cmdReq("rgb-cam-power-off", rt685Core.RT685_COM_PORT);
});
camPowerOnBtn.addEventListener("click", () =>{
  cmdReq("rgb-cam-power-on", rt685Core.RT685_COM_PORT);
});

camAlwaysONBtn.addEventListener('click', () => {
  cmdReq("rgb-cam-always-on", rt685Core.RT685_COM_PORT);
})

BtnLowPowerBtn.addEventListener('click', () => {
  cmdReq("rgb-cam-power-optimize", rt685Core.RT685_COM_PORT);
})

BtnGetInfoBtn.addEventListener('click', () => {
  cmdReq("rgb-cam-get-info", rt685Core.RT685_COM_PORT);
})

//******************************************************************************
//   EVENT HANDLER
//******************************************************************************
ipcRenderer.on("serial-data", (event, arg) => {
  if (arg.portID === "port-" + rt685Core.RT685_COM_PORT) {
    if (arg.data.camera == 'rgb') {
      rt685Core.processCamData(arg.data, canvas, imageScale);
    }
  }
});

//******************************************************************************
//   INIT
//******************************************************************************
const now = new Date();
rt685Core.initData('rgb-cam-setting-log-name', `rgb_cam_log_${now.getMonth()}_${now.getDate()}_${now.getFullYear()}`)
rt685Core.initData('rgb-cam-setting-log-dir', "c:\\")
rt685Core.initData('rgb-cam-setting-capture-interval', 1000)

updateZoomLevel(imageScale);

updateLogPath();
