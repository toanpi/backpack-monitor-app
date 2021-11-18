const {ipcMain, dialog} = require('electron')
const SerialPort = require('serialport')
var render = require('../../main')
var packageParser = require('./packet-interpreter')
const Readline = SerialPort.parsers.Readline;


var serialManager = {
  'port-0': {portID: '', baudRate: 115200, port: 5, portPath: '', handler: undefined},
  'port-1': {portID: '', baudRate: 115200, port: 3, portPath: '', handler: undefined},
  'port-2': {portID: '', baudRate: 115200, port: 5, portPath: '', handler: undefined},
  'port-3': {portID: '', baudRate: 115200, port: 7, portPath: '', handler: undefined},
  'port-4': {portID: '', baudRate: 115200, port: 9, portPath: '', handler: undefined},
  'port-5': {portID: '', baudRate: 115200, port: 11, portPath: '', handler: undefined},
  'port-6': {portID: '', baudRate: 115200, port: 13, portPath: '', handler: undefined},
  'port-7': {portID: '', baudRate: 115200, port: 15, portPath: '', handler: undefined},
  'port-8': {portID: '', baudRate: 115200, port: 17, portPath: '', handler: undefined},
  'port-9': {portID: '', baudRate: 115200, port: 19, portPath: '', handler: undefined},
  'port-10': {portID:'', baudRate: 115200, port: 21, portPath: '', handler: undefined},
}

const DELIMITER = "\n\r"

//******************************************************************************
//   Process Data
//******************************************************************************
function processRawData(data) {
  return packageParser.processRawData(data)
}

//******************************************************************************
//   Handle Serial Data
//******************************************************************************
function sendDataRender(data, portID) {
  render.sendRenderRequest("serial-data", {portID: portID, data: data});
}

function sendEventRender(data, portID) {
  render.sendRenderRequest("serial-event", {portID: portID, data: data});
}

function getPortHandler(portID) {
  return serialManager[portID].handler
}

function portClear(portID) {
  serialManager[portID].handler = undefined;
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
  Toan Huynh, 11/06/2021
*******************************************************************************/
function portClose(portHandler, portNum, portId) {
  if (portHandler) {
    portClear(portId);
    portHandler.close(function (err) {
      console.log("Port closed " + portNum);
      // portClear(portId)
    });
    return { status: "disconnected", port: portId };;
  } else {
    dialog.showErrorBox(`Unable to close port ${portNum} !`, "");
    return { status: "error", error: "Unable to close port" };
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
  Toan Huynh, 11/06/2021
*******************************************************************************/
function portConnect(portNum, portID, baudRate, type) {
  if (!serialManager[portID] || serialManager[portID].handler != undefined) {
    dialog.showErrorBox(`Port ${portNum} Access Error!`, "");
    return { status: "error", error: "Accesss error" };
  }

  serialManager[portID].baudRate = baudRate;
  serialManager[portID].port = portNum;
  serialManager[portID].portPath = "COM" + portNum;

  try {
    serialManager[portID].handler = new SerialPort(serialManager[portID].portPath, {baudRate: baudRate,});
  
    let portHandler = serialManager[portID].handler
  
    console.log("Connected " + serialManager[portID].portPath);

    //******************************************************************************
    //   Open Event Handler
    //******************************************************************************
    portHandler.on("open", function (err) {
      console.log("Open " + portNum)
      render.sendRenderRequest("serial-event", {event: "open", portID: portID,});
    });

    //******************************************************************************
    //   Error Event Handler
    //******************************************************************************
    portHandler.on("error", function (err) {
      console.log("Error: ", err);

      if (getPortHandler(portID) != undefined) {
        portClear(portID);
        dialog.showErrorBox(`Error on port ${portNum}!`, "");
        render.sendRenderRequest("serial-event", {event: "error", portID: portID,});
      }

    });

    //******************************************************************************
    //   Close Event Handler
    //******************************************************************************
    portHandler.on("close", function (err) {
      console.log(`Disconnect on port ${portNum}!`);
      if (getPortHandler(portID) != undefined) {
        portClear(portID);
        // dialog.showErrorBox(`Close on port ${portNum}!`, "");
        render.sendRenderRequest("serial-event", {event: "close",portID: portID,});
      }      
    });

    //******************************************************************************
    //   Data Event Handler
    //******************************************************************************
    // String
    const parser = portHandler.pipe(new Readline({ delimiter: DELIMITER }));

    parser.on("data", (data) => {
      if (type === "string") {
        sendDataRender(data, portID);
      } else {
        // Raw data
        sendDataRender(processRawData(data), portID);
      }
    });

    return { status: "connected" };

  } catch (error) {
    console.log(error);
    dialog.showErrorBox(`Port ${portNum} Connect Failed`, "");
    return { status: "error", error: "Connect failed!" };
  }
}

/*******************************************************************************
Function:
  serial-event
Input Parameters:
  ---
Output Parameters:
  ---
Description:
  ---
Notes:
  ---
Author, Date:
  Toan Huynh, 11/06/2021
*******************************************************************************/
ipcMain.on("serial-event", (event, arg) => {
  
  switch (true) {
    case arg.event == "connect":
      event.returnValue = portConnect(arg.port, arg.portID, arg.baudRate, arg.type);
      break;
      
      case arg.event == "disconnect":
      {
        let portHandler = getPortHandler(arg.portID);
        event.returnValue = portClose(portHandler, arg.port, arg.portID);
      }
      break;
      
      case arg.event == "check-port":
      {
        let portHandler = getPortHandler(arg.portID);
        event.returnValue = {
          status: portHandler ? "connected" : "disconnected",
          port: arg.portID,
        };
      }
      break;
    case arg.event == "list-ports":
      listSysPorts(true);
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
  Toan Huynh, 11/06/2021
*******************************************************************************/
var portList = []

function checkPortExists(portNum, sn) {
  for (var i = 0; i < portList.length; i++) {
    if (portList[i].value == portNum && portList[i].name.includes(sn)) {
      return true;
    }
  }
  return false;
}

function listSysPorts(forceUpdate) {
  SerialPort.list().then(function(ports){
  let _portsList = []
  let needUpdate = false;

  ports.forEach(function(port){
    let portNum = port.path.replace(/^\D+/g, "");
    needUpdate = !checkPortExists(portNum, port.serialNumber);
    _portsList.push({value: portNum, name: `${port.manufacturer} (SN: ${port.serialNumber})`});
  })

  if(needUpdate || _portsList.length != portList.length || forceUpdate) {
    portList = Array.from(_portsList);
    console.log('Update ports list', portList)
    render.sendRenderRequest("serial-event", {event: "list", data: _portsList});
  }
});
}


/*******************************************************************************
Function:
  write()
Input Parameters:
  ---
Output Parameters:
  ---
Description:
  Write data to the serial port
Notes:
  ---
Author, Date:
  Toan Huynh, 11/06/2021
*******************************************************************************/
function write(portID, data) {
  let portHandler = getPortHandler(portID);

  if (portHandler) {
    portHandler.write(data);
    return { status: "success", log: "" };
  } else {
    return { status: "error", log: "No devive found!" };
  }
}

//******************************************************************************
//   Update the serial port list
//******************************************************************************
setInterval(function () {
  listSysPorts(false);
}, 1000);


//******************************************************************************
//   EXPORT
//******************************************************************************
module.exports = {write}
