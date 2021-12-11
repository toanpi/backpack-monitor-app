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

var BtnGetInfoBtn = document.getElementById('rgb-cam-get-info');
var regWriteBtn = document.getElementById('rgb-cam-reg-write')
var regReadBtn = document.getElementById('rgb-cam-reg-read')
var brightNessBtn = document.getElementById('rgb-cam-brightness-set')
var gainCeilingBtn = document.getElementById('rgb-cam-gain-ceiling-set')
var autoGainBtn = document.getElementById('rgb-cam-auto-gain-set')
var exposureBtn = document.getElementById('rgb-cam-exposure-set')
var frameRateBtn = document.getElementById('rgb-cam-frame-rate-set')
var frameSizeBtn = document.getElementById('rgb-cam-frame-size-set')
// var pixelFormatBtn = document.getElementById('rgb-cam-pixel-format-set')
var videoModeBtn = document.getElementById('rgb-cam-video-mode-set')

// var camBootupBtn = document.getElementById('rgb-cam-bootup');
// var camShutdownBtn = document.getElementById('rgb-cam-shut-down');
// var camPowerOffBtn = document.getElementById('rgb-cam-power-off');
// var camPowerOnBtn = document.getElementById('rgb-cam-power-on');
// var camAlwaysONBtn = document.getElementById('rgb-cam-always-on');
// var BtnLowPowerBtn = document.getElementById('rgb-cam-power-optimize');


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

function cmdReqWithParam(event, param) {

  let req = {
    event: event,
    portID: serial.getPortId(rt685Core.RT685_COM_PORT),
  };

  let cmd = Object.assign({}, req, param);

  rt685Core.showLog("[APP] Sent request " + event +" to the board. Please wait..");

  if (cmd) {
    return serial.actionReq(rt685Core.RT685_COM_PORT, cmd);
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


// camBootupBtn.addEventListener("click", () =>{
//   cmdReq("rgb-cam-bootup", rt685Core.RT685_COM_PORT);
// });
// camShutdownBtn.addEventListener("click", () =>{
//   cmdReq("rgb-cam-shut-down", rt685Core.RT685_COM_PORT);
// });
// camPowerOffBtn.addEventListener("click", () =>{
//   cmdReq("rgb-cam-power-off", rt685Core.RT685_COM_PORT);
// });
// camPowerOnBtn.addEventListener("click", () =>{
//   cmdReq("rgb-cam-power-on", rt685Core.RT685_COM_PORT);
// });

// camAlwaysONBtn.addEventListener('click', () => {
//   cmdReq("rgb-cam-always-on", rt685Core.RT685_COM_PORT);
// })

// BtnLowPowerBtn.addEventListener('click', () => {
//   cmdReq("rgb-cam-power-optimize", rt685Core.RT685_COM_PORT);
// })

regWriteBtn.addEventListener("click", () => {
  let cmd = {
    register : rt685Core.getDataById("rgb-cam-reg-addr"),
    value : rt685Core.getDataById('rgb-cam-reg-value'),
  }
  cmdReqWithParam("rgb-cam-set-reg-write", cmd);
});

regReadBtn.addEventListener("click", () => {
  let cmd = {
    register : rt685Core.getDataById('rgb-cam-reg-addr-read'),
  }
  cmdReqWithParam("rgb-cam-set-reg-read", cmd);
});

brightNessBtn.addEventListener("click", () => {
  let cmd = {
     level : rt685Core.getDataById('rgb-cam-brightness'),
  }

  cmdReqWithParam("rgb-cam-set-brightness", cmd);
});

gainCeilingBtn.addEventListener("click", () => {
  let cmd = {
    gainceiling : rt685Core.getDataById('rgb-cam-gain-ceiling'),
  }
  cmdReqWithParam("rgb-cam-set-gainceiling", cmd);
});

autoGainBtn.addEventListener("click", () => {
  let cmd = {
    enable : rt685Core.getDataById('rgb-cam-auto-gain-enable'),
    gain_db : rt685Core.getDataById('rgb-cam-auto-gain-db'),
    gain_db_ceiling : rt685Core.getDataById('rgb-cam-auto-gain-ceiling'),
  }
  cmdReqWithParam("rgb-cam-set-auto-gain", cmd);
});

exposureBtn.addEventListener("click", () => {
  let cmd = {
    enable : rt685Core.getDataById('rgb-cam-exposure-enable'),
    exposure_us : rt685Core.getDataById('rgb-cam-exposure-time'),
  }
  cmdReqWithParam("rgb-cam-set-exposure", cmd);
});

frameRateBtn.addEventListener("click", () => {
  let cmd = {
    frame_rate : rt685Core.getDataById('rgb-cam-frame-rate'),
  }
  cmdReqWithParam("rgb-cam-set-framerate", cmd);
});

frameSizeBtn.addEventListener("click", () => {
  let cmd = {
    frame_size : rt685Core.getDataById('rgb-cam-frame-size'),
  }
  cmdReqWithParam("rgb-cam-set-frame-size", cmd);
});

// pixelFormatBtn.addEventListener("click", () => {
//   let cmd = {
//     pixel_format : rt685Core.getDataById('rgb-cam-pixel-format'),
//   }
//   cmdReqWithParam("rgb-cam-set-pixel-format", cmd);
// });

videoModeBtn.addEventListener("click", () => {
  let cmd = {
    mode : rt685Core.getDataById('rgb-cam-video-mode'),
    frame_cnt : rt685Core.getDataById('rgb-cam-video-frame-count'),
  }
  cmdReqWithParam("rgb-cam-set-video-mode", cmd);
});



BtnGetInfoBtn.addEventListener('click', () => {
  cmdReq("rgb-cam-get-info", rt685Core.RT685_COM_PORT);
})

//******************************************************************************
//   EVENT HANDLER
//******************************************************************************
ipcRenderer.on("serial-data", (event, arg) => {
  if (arg.portID === "port-" + rt685Core.RT685_COM_PORT) {
    if (arg.data.camera == 'rgb') {
      rt685Core.showLog("[APP] Received packet from RGB camera");
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
