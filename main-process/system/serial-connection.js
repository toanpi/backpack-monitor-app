const {ipcMain, dialog} = require('electron')
const SerialPort = require('serialport')
var render = require('../../main')
var packageParser = require('./packet-interpreter')
const Readline = SerialPort.parsers.Readline;


var serialManager = {
  'port-0': {portID: 'port-9', baudRate: 115200, port: 5, portPath: '', handler: undefined},
  'port-1': {portID: 'port-1', baudRate: 115200, port: 3, portPath: '', handler: undefined},
  'port-2': {portID: 'port-2', baudRate: 115200, port: 5, portPath: '', handler: undefined},
  'port-3': {portID: 'port-3', baudRate: 115200, port: 7, portPath: '', handler: undefined},
  'port-4': {portID: 'port-4', baudRate: 115200, port: 9, portPath: '', handler: undefined},
  'port-5': {portID: 'port-5', baudRate: 115200, port: 11, portPath: '', handler: undefined},
  'port-6': {portID: 'port-6', baudRate: 115200, port: 13, portPath: '', handler: undefined},
  'port-7': {portID: 'port-7', baudRate: 115200, port: 15, portPath: '', handler: undefined},
  'port-8': {portID: 'port-8', baudRate: 115200, port: 17, portPath: '', handler: undefined},
  'port-8': {portID: 'port-9', baudRate: 115200, port: 19, portPath: '', handler: undefined},
  'port-10': {portID: 'port-10', baudRate: 115200, port: 21, portPath: '', handler: undefined},
}

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


ipcMain.on('serial-event', (event, arg) => {
  
  if(arg.event === 'connect'){

    if(serialManager[arg.portID] && serialManager[arg.portID].handler == undefined){
      serialManager[arg.portID].baudRate = arg.baudRate
      serialManager[arg.portID].port = arg.port
      serialManager[arg.portID].portPath = 'COM' + arg.port

      try {
        serialManager[arg.portID].handler = new SerialPort(
          serialManager[arg.portID].portPath,
          {
            baudRate: arg.baudRate,
          }
        );

        console.log("Connected " + serialManager[arg.portID].portPath);

        // String
        const parser = serialManager[arg.portID].handler.pipe(
          new Readline({ delimiter: "\n\r" })
          );
          
          parser.on("data", (data) => {
            if (arg.type === "string") {
              sendDataRender(data, arg.portID);
            } else {
              // Raw data
              sendDataRender(processRawData(data), arg.portID);
            }
          });

        // Raw data
        // serialManager[arg.portID].handler.on('data', data => {
        //   console.log("Raw: " + data.length + " " + data.toString('hex'))
        //   sendDataRender(data, arg.portID)
        // })

        event.returnValue = { status: "connected" };
      } catch (error) {
        console.log(error)
        dialog.showErrorBox(`Port ${arg.port} Connect Failed` , '')
        event.returnValue = {status: 'error', error: 'Connect failed!'}
      }

    } else {
      event.returnValue = {status: 'error', error: "Accesss error"}
      dialog.showErrorBox(`Port ${arg.port} Access Error!` , '')
    }
  } else if(arg.event === 'disconnect'){

    if(serialManager[arg.portID].handler){
      serialManager[arg.portID].handler.close(function (err) {
        console.log('port closed ' + arg.port);
        serialManager[arg.portID].handler = undefined
        event.returnValue = {status: 'disconnected', port: arg.port}
      });
    } else {
      event.returnValue = {status: 'error', error: "Unable to close port"}
      dialog.showErrorBox(`Unable to close port ${arg.port} !` , '')
    }
  } else if(arg.event === 'check-port'){

    if (serialManager[arg.portID].handler) {
      event.returnValue = { status: "connected", port: arg.portID };
    } else {
      event.returnValue = { status: "disconnected", port: arg.portID };
    }
  }

 
})

SerialPort.list().then(function(ports){
  var portList = []

  ports.forEach(function(port){
    console.log("Port: ", port);
    portList.push(port.path.replace( /^\D+/g, ''))
  })

  render.sendRenderRequest("serial-event", {event: 'list', data: portList});
});

function write(portID, data) {
  if (serialManager[portID].handler) {
    serialManager[portID].handler.write(data);
    return { status: "success", log: "" };
  } else {
    return { status: "error", log: "No devive found!" };
  }
}

module.exports = {write}
