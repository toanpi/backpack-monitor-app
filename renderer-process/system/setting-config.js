const Store = require('electron-store');
const settings = new Store();

/*******************************************************************************/
/* Init Setting */
/* Theme */
var currentTheme = settings.get('theme');

if(currentTheme == 'dark')
{
  setDarkMode();
} else {
  setLightMode();
}

/*******************************************************************************/

function setDarkMode() {
  document.documentElement.style.setProperty('--color', 'rgb(209, 206, 206)');
  document.documentElement.style.setProperty('--color-link', 'rgb(223, 217, 217)');
  document.documentElement.style.setProperty('--color-body-bg', '#0C1017');
  document.documentElement.style.setProperty('--color-strong', 'white');
  document.documentElement.style.setProperty('--color-bg', '#151b27');
  document.documentElement.style.setProperty('--color-border', '#151b27');
  document.documentElement.style.setProperty('--color-subtle', 'rgb(250, 248, 248)');
  // document.documentElement.style.setProperty('--color-accent', 'hsl(133, 93%, 38%)');
  
  currentTheme = 'dark';
  settings.set('theme', currentTheme)
}

function setLightMode() {
  document.documentElement.style.setProperty('--color', 'rgb(97, 94, 94)');
  document.documentElement.style.setProperty('--color-link', 'hsl(0,0%,22%)');
  document.documentElement.style.setProperty('--color-body-bg', 'white');
  document.documentElement.style.setProperty('--color-strong', 'hsl(0,0%,11%)');
  document.documentElement.style.setProperty('--color-bg', 'hsl(0,0%,96%)');
  document.documentElement.style.setProperty('--color-border', 'hsl(0,0%,96%)');
  document.documentElement.style.setProperty('--color-subtle', 'hsl(0,0%,44%)');
  // document.documentElement.style.setProperty('--color-accent', 'hsl(222, 53%, 50%)');

  currentTheme = 'light';
  settings.set('theme', currentTheme)
}

// Chart Colors

function getChartsBgColors() {
  return currentTheme == "light" ? "white" : "#151b27";
}

function getChartsYaxisLineWidth() {
  return currentTheme == "light" ? 1 : 0.2;
}

function getChartColors() {
  if(currentTheme == "light") {
    return [
      "black",
      "#48D1CC",
      "#FF00FF",
      "#FFFF00",
      "#1E90FF",
      "#9400D3",
      "#ff0066",
      "#00FF00",
      "#FF8C00",
      "#00FFFF",
      "#003366",
      "#008080",
      "#8B008B"
    ]

  } else if(currentTheme == "dark")
  {
    return [
      "white",
      "#48D1CC",
      "#FF00FF",
      "#FFFF00",
      "#1E90FF",
      "#9400D3",
      "#ff0066",
      "#00FF00",
      "#FF8C00",
      "#00FFFF",
      "#003366",
      "#008080",
      "#8B008B"
    ]
  } else 
  {
    return [
      "white",
      "#FF1493",
      "#FF00FF",
      "#FFFF00",
      "#1E90FF",
      "#9400D3",
      "#ff0066",
      "#00FF00",
      "#FF8C00",
      "#00FFFF",
      "#003366",
      "#008080",
      "#8B008B"
    ]
  }
}

module.exports = {getChartsBgColors, setDarkMode, setLightMode, getChartColors, getChartsYaxisLineWidth}
