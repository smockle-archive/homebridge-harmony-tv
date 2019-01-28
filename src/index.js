const { HarmonyTVAccessory } = require("./harmony-tv-accessory");
let Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory(
    "homebridge-harmony-tv-smockle-temp",
    "HarmonyTV",
    HarmonyTVAccessory
  );
};
