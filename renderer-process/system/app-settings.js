const appConfig = require('./setting-config')
/*******************************************************************************/
/* Init Setting */
/* Theme */
// if (appSettingData.get('theme', "light") === "dark") {
//   setDarkMode();
// }
// else {
//   setLightMode();
// }
/*******************************************************************************/

document.getElementById('light-mode-icon').addEventListener('click', function() {
  appConfig.setLightMode();
  // appSettingData.set('theme', 'light');
})

document.getElementById('dark-mode-icon').addEventListener('click', function() {
  appConfig.setDarkMode();
})

