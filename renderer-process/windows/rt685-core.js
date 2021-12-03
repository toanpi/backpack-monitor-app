const Store = require('electron-store');
const settings = new Store();

var serial = require('./serial-handler')
const {ipcRenderer} = require('electron')
const RT685_COM_PORT = 5;

const lastPos = { x: 0, y: 0 };
let isDragging = false;
const root = document.documentElement;
var port5Btn = document.getElementById(`port-${RT685_COM_PORT}-btn`)

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
function showImg(scale, width, height, colorData, canvas) {
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

// if (canvasContainer) {
//   canvasContainer.onmousedown = onMouseDown;
//   canvasContainer.onmousemove = onMouseMove;
//   canvasContainer.onmouseup = onMouseUp;
// }

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
function processCamData(data, canvas, scale) {
  let width = data.width;
  let height = data.height;
  let colorData = data.colorData;
  showImg(scale, width, height, colorData, canvas);
}

//******************************************************************************
//   DATA HANDLER
//******************************************************************************
ipcRenderer.on("serial-data", (event, arg) => {
  if (arg.portID === "port-" + RT685_COM_PORT) {
    if (arg.data.hasOwnProperty("log"))
      serial.showOnScreen(arg.portID, arg.data.log);
  }
});

ipcRenderer.on("serial-event", (event, arg) => {
  switch (true) {
    case arg.event == "error":
    case arg.event == "close":
      //{event: "error", portID: portID}
      if (arg.portID === "port-" + RT685_COM_PORT) {
        serial.updatePortStatus("disconnected", port5Btn);
      }
    break;
  }
});

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
  Toan Huynh, 12/03/2021
*******************************************************************************/
function showLog(log){
  serial.showOnScreen(serial.getPortId(RT685_COM_PORT), log);
}

//******************************************************************************
//   INIT
//******************************************************************************
serial.getPortInput(RT685_COM_PORT).value = settings.get('port-'+ RT685_COM_PORT, 3)
serial.getBaudrateInput(RT685_COM_PORT).value = settings.get('baudrate-'+ RT685_COM_PORT, 921600)
serial.checkPortConnected(RT685_COM_PORT, port5Btn);

if(port5Btn){
  port5Btn.addEventListener("click", () => {
    serial.connectReq(RT685_COM_PORT, port5Btn, 'raw');
    settings.set('port-'+ RT685_COM_PORT, serial.getPortInput(RT685_COM_PORT).value)
    settings.set('baudrate-'+ RT685_COM_PORT, serial.getBaudrateInput(RT685_COM_PORT).value)
  });
}

//******************************************************************************
//   EXPORT
//******************************************************************************
module.exports = {
  initData,
  storeData,
  getDataById,
  processCamData,
  RT685_COM_PORT,
  showLog
}
