var path = require('path');
const {ipcMain, dialog} = require('electron')
fs = require('fs');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;


var LOGPATH = ""


function setLogPath(logName, logDir) {
  if (!logName) {
    dialog.showErrorBox(`Log name is invalid ${logName}!`, "");
    return;
  }

  if (!logDir) {
    dialog.showErrorBox(`Log directory is invalid ${logDir}!`, "");
    return;
  }

  LOGPATH = path.join(logDir, logName);

  fs.access(logDir, function (error) {
    if (error) {
      dialog.showErrorBox(logDir + ": directory does not exist!", "");
      LOGPATH = "";
    } else {
      console.log("New log path: " + LOGPATH);
    }
  });
}

function writeLog(width, height, raw, logPath, now, systemTick, coreClock) {
  if (!logPath) {
    return;
  }

  let log = [];

  log.push(now.toISOString());
  log.push(width);
  log.push(height);
  log.push(systemTick);
  log.push(coreClock);
  log = log.concat(raw);

  const csvWriter = createCsvWriter({
    header: ["timestamp"],
    // path: 'C:\\Users\\Dell\\Downloads\\test3.csv',
    path: logPath + ".csv",
    append: true,
  });

  csvWriter
    .writeRecords([log]) // returns a promise
    .then(() => {
      // console.log("...Done");
    })
    .catch((error) => {
      dialog.showErrorBox(error + "", "");
    });
}

// Pass 8-bit (each) R,G,B, get back 16-bit packed color
function color565(r, g, b) {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}


/*******************************************************************************
Function:
  processCamRawImage()
Input Parameters:
  ---
Output Parameters:
  ---
Description:
  ---
Notes:
  ---
Author, Date:
  Toan Huynh, 12/02/2021
*******************************************************************************/
function processCamRawImage(dataString, dataSize) {
  if (!dataString) return;
  
  // let colorMap = IronBlackColorMap;
  let now = new Date();
  let colorData = [];
  let pixelData = [];
  let rawLen = (dataString.length - 24) / 2;

  let raw = Buffer.alloc(rawLen, dataString.slice(24), "hex");
  let minval = Number.MAX_SAFE_INTEGER;

  let width = parseInt(dataString.slice(0, 4), 16);
  let height = parseInt(dataString.slice(4, 8), 16);
  // System tick
  let systemTick = parseInt(dataString.slice(8, 16), 16);
  let coreClock = parseInt(dataString.slice(16, 24), 16);

  let maxVal = 0;

  console.log(`Received paket: ${raw[0]} ${raw[raw.length - 1]} width ${width} height ${height} length ${raw.length} system tick ${systemTick} core clock ${coreClock}`);

  if (raw.length != width * height) {
    console.log("Packet is invalid! " + raw.length);
    return {
      log:
        "[APP] Missing some packets from board (Received " +
        Math.round(raw.length / 1024) +
        "KB) at " +
        now.getHours() +
        ":" +
        now.getMinutes() +
        ":" +
        now.getSeconds(),
    };
  }

  //******************************************************************************
  //   Process raw image
  //******************************************************************************
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let pixel = raw.readUInt8(i * width + j);
      pixelData.push(pixel);

      if (pixel > maxVal) {
        maxVal = pixel;
      }
      if (pixel < minval) {
        minval = pixel;
      }
    }
  }

  let diff = maxVal - minval;

  //******************************************************************************
  //   Covert to pixel data format
  //******************************************************************************
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let pixel = Math.floor(((pixelData[i * width + j] - minval) * 255) / diff)
      colorData.push({
        r: pixel,
        g: pixel,
        b: pixel,
      });
    }
  }

  writeLog(width, height, pixelData, LOGPATH, now, systemTick, coreClock);

  return {
    type: 'raw',
    camera: 'rgb',
    format: "",
    width: width,
    height: height,
    colorData: colorData,
  };
}

//******************************************************************************
//   EVENT HANDLING
//******************************************************************************
ipcMain.on("rt685-event", (event, arg) => {
  switch (true) {
    case arg.event == "update-rgb-log-path":
    setLogPath(arg.logName, arg.logDir)
    break;
  }
});

//******************************************************************************
//   EXPORT
//******************************************************************************
module.exports = {
  processCamRawImage,
}
