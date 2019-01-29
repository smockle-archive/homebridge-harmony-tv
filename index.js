// @ts-check
const { HarmonyHub } = require("harmonyhub-api");
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

// HarmonyTVAccessory

function HarmonyTVAccessory(log, config) {
  this.log = log;
  this.config = config;
  this.name = config.name;
  this.deviceId = config.deviceId;
  this.commands = config.commands;
  this.enabledServices = [];

  this.hub = new HarmonyHub(config.host, config.remoteId);
  const inputs = config.commands.filter(({ name }) =>
    name.match(/^Input[\w\d]+/)
  );

  // TV

  this.tvService = new Service.Television(this.name, "Television");
  this.tvService.setCharacteristic(Characteristic.ConfiguredName, this.name);
  this.tvService.setCharacteristic(
    Characteristic.SleepDiscoveryMode,
    Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
  );
  this.tvService
    .getCharacteristic(Characteristic.Active)
    .on("set", (newValue, callback) => {
      switch (true) {
        case newValue === 0 &&
          this.supportsCommand("PowerOff") &&
          this.supportsCommand("PowerOn"):
          this.sendCommand("PowerOff");
          break;
        case newValue === 1 &&
          this.supportsCommand("PowerOff") &&
          this.supportsCommand("PowerOn"):
          this.sendCommand("PowerOn");
          break;
        case this.supportsCommand("PowerToggle"):
          this.sendCommand("PowerToggle");
          break;
      }
      callback(null);
    });
  this.tvService
    .getCharacteristic(Characteristic.RemoteKey)
    .on("set", (newValue, callback) => {
      switch (true) {
        case newValue === 4 && this.supportsCommand("DirectionUp"):
          this.sendCommand("DirectionUp");
          break;
        case newValue === 5 && this.supportsCommand("DirectionDown"):
          this.sendCommand("DirectionDown");
          break;
        case newValue === 6 && this.supportsCommand("DirectionLeft"):
          this.sendCommand("DirectionLeft");
          break;
        case newValue === 7 && this.supportsCommand("DirectionRight"):
          this.sendCommand("DirectionRight");
          break;
        case newValue === 8 && this.supportsCommand("Select"):
        case newValue === 11 &&
          this.supportsCommand("Select") &&
          !this.supportsCommand("Play"):
          this.sendCommand("Select");
          break;
        case newValue === 11 && this.supportsCommand("Play"):
          this.sendCommand("Play");
          break;
        case newValue === 15 && this.supportsCommand("Menu"):
        case newValue === 9 &&
          !this.supportsCommand("Back") &&
          this.supportsCommand("Menu"):
        case newValue === 10 &&
          !this.supportsCommand("Home") &&
          this.supportsCommand("Menu"):
          this.sendCommand("Menu");
          break;
        case newValue === 9 && this.supportsCommand("Back"):
          this.sendCommand("Back");
          break;
        case newValue === 10 && this.supportsCommand("Home"):
          this.sendCommand("Home");
          break;
      }
      callback(null);
    });

  // Speaker

  this.speakerService = new Service.TelevisionSpeaker(
    this.name + " Volume",
    "volumeService"
  );
  this.speakerService
    .setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE)
    .setCharacteristic(
      Characteristic.VolumeControlType,
      Characteristic.VolumeControlType.ABSOLUTE
    );
  this.speakerService
    .getCharacteristic(Characteristic.VolumeSelector)
    .on("set", (newValue, callback) => {
      console.log(`set VolumeSelector => setNewValue: ${newValue}`);
      callback(null);
    });
  this.tvService.addLinkedService(this.speakerService);
  this.enabledServices.push(this.speakerService);

  // Inputs

  this.tvService.setCharacteristic(Characteristic.ActiveIdentifier, 0);
  this.tvService
    .getCharacteristic(Characteristic.ActiveIdentifier)
    .on("set", (newValue, callback) => {
      const { name: command } = inputs[newValue];
      if (this.supportsCommand(command)) {
        this.sendCommand(command);
      }
      callback(null);
    });
  inputs.forEach((input, index) => {
    const name = input.name.replace(/^Input/, "");
    const type = (() => {
      switch (true) {
        case name.match(/hdmi/i):
          return Characteristic.InputSourceType.HDMI;
        case name.match(/ypbpr/i):
          return Characteristic.InputSourceType.COMPONENT_VIDEO;
        default:
          return Characteristic.InputSourceType.OTHER;
      }
    })();
    this[`input${name.toUpperCase()}Service`] = new Service.InputSource(
      name.toLowerCase(),
      name.replace(/^([\w]+)([\d]+)$/, "$1 $2").toUpperCase()
    );
    this[`input${name.toUpperCase()}Service`]
      .setCharacteristic(Characteristic.Identifier, index)
      .setCharacteristic(
        Characteristic.ConfiguredName,
        name.replace(/^([\w]+)([\d]+)$/, "$1 $2").toUpperCase()
      )
      .setCharacteristic(
        Characteristic.IsConfigured,
        Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(Characteristic.InputSourceType, type);
    this.tvService.addLinkedService(this[`input${name.toUpperCase()}Service`]);
    this.enabledServices.push(this[`input${name.toUpperCase()}Service`]);
  });

  this.enabledServices.push(this.tvService);
}

HarmonyTVAccessory.prototype.getServices = function() {
  return this.enabledServices;
};

HarmonyTVAccessory.prototype.supportsCommand = function(command) {
  return this.commands.some(({ name }) => name === command);
};

HarmonyTVAccessory.prototype.sendCommand = function(command) {
  return this.hub.connect().then(() => {
    this.hub.sendCommand(command, this.deviceId);
    setTimeout(() => this.hub.disconnect(), 300);
  });
};
