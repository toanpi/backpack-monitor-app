const {ipcRenderer} = require('electron')
const {dialog} = require('electron').remote

const COLLECTOR_PORT_IDX = 0; // Collector port ID always 0
//******************************************************************************
//   System Configuration
//******************************************************************************

function fillOptions(dataArray) {
  var options = '';

  for (var i = 0; i < dataArray.length; i++) {
    options += `<option value="${dataArray[i]}"></option>`
  }
  return options
}

function fillOptionsWithName(dataArray) {
  var options = '';

  for (var i = 0; i < dataArray.length; i++) {
    options += `<option value="${dataArray[i].value}">${dataArray[i].name}</option>`
  }
  return options
}

// Baud rate
var baudRates = [9600, 14400, 19200, 38400, 57600, 115200];
document.getElementById('baurdrates').innerHTML = fillOptions(baudRates);

//******************************************************************************
//   Serial Handler
//******************************************************************************
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
function connectReq(portIdx, portBtn, type) {
  portBtn.disabled = true;

  let event = 'connect';

  if(portBtn.innerHTML === 'Connect'){
    event = 'connect';
  } else {
    event = 'disconnect';
  }

  const reply = ipcRenderer.sendSync("serial-event", {
    event: event,
    port: parseInt(document.getElementById("port-" + portIdx).value),
    baudRate: parseInt(document.getElementById("baudrate-" + portIdx).value),
    portID: "port-" + portIdx,
    type: type
  });

  console.log(reply);

  portBtn.disabled = false

  if (reply && reply.status === "connected") {
    updatePortStatus('connected', portBtn)
    return true;
  } else if (reply && reply.status === "disconnected") {
    updatePortStatus('disconnected', portBtn)
    return false;
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
  Toan Huynh, 11/05/2021
*******************************************************************************/
function checkPortConnected(portIdx, portBtn){

  const reply = ipcRenderer.sendSync("serial-event", {
    event: 'check-port',
    portID: "port-" + portIdx,
  });

  if (reply && reply.status === "connected") {
    updatePortStatus('connected', portBtn)
    return true;
  } else if (reply && reply.status === "disconnected") {
    updatePortStatus('disconnected', portBtn)
    return false;
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
  Toan Huynh, 11/05/2021
*******************************************************************************/
function actionReq(portIdx, req) {
  if (portIdx != COLLECTOR_PORT_IDX) {
    return;
  }

  if(req){
    const reply = ipcRenderer.sendSync("serial-req", req);
    console.log(reply);
  
    if(reply.status != "success") {
      dialog.showErrorBox(reply.log, '')
    } 
  } else {
    dialog.showErrorBox(`Argument is invalid!` , '')
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
  Toan Huynh, 11/05/2021
*******************************************************************************/
function showOnScreen(portID, data){
  var textarea = document.getElementById(portID + "-screen");
  textarea.innerHTML += "\n" + data;
  textarea.scrollTop = textarea.scrollHeight;
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
function updatePortStatus(status, portBtn) {
  switch(true){
    case status == "connected":
      portBtn.innerHTML = "Disconnect";
      break;
    case status == "disconnected":
      portBtn.innerHTML = "Connect";
      break;
  }
}

//******************************************************************************
//   EVENT HANDLER
//******************************************************************************
ipcRenderer.on('serial-event', (event, arg) => {
  console.log(arg);
  switch (true){
    case arg.event == "list":
      document.getElementById('ports').innerHTML = fillOptionsWithName(arg.data);
      break;
    case arg.event == "open":
      // {event: "open", portID: portID}
    case arg.event == "close":
      // {event: "close",portID: portID}
      console.log(arg.data);
    break;
    case arg.event == "error":
      //{event: "error", portID: portID}
    break;
  }
})

//******************************************************************************
//   START UP
//******************************************************************************
ipcRenderer.send("serial-event", {
  event: "list-ports",
});

//******************************************************************************
//   EXport
//******************************************************************************
module.exports = {
  connectReq,
  checkPortConnected,
  actionReq,
  showOnScreen,
  fillOptions,
  updatePortStatus,
  fillOptionsWithName
};

