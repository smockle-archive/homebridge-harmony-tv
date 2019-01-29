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
  this.previousPowerState = null;
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
        case newValue !== this.previousPowerState &&
          this.supportsCommand("PowerToggle"):
          this.sendCommand("PowerToggle");
          this.previousPowerState = newValue;
          break;
      }
      callback(null);
    });
  this.tvService
    .getCharacteristic(Characteristic.RemoteKey)
    .on("set", (newValue, callback) => {
      switch (true) {
        case newValue === Characteristic.RemoteKey.ARROW_UP &&
          this.supportsCommand("DirectionUp"):
          this.sendCommand("DirectionUp");
          break;
        case newValue === Characteristic.RemoteKey.ARROW_DOWN &&
          this.supportsCommand("DirectionDown"):
          this.sendCommand("DirectionDown");
          break;
        case newValue === Characteristic.RemoteKey.ARROW_LEFT &&
          this.supportsCommand("DirectionLeft"):
          this.sendCommand("DirectionLeft");
          break;
        case newValue === Characteristic.RemoteKey.ARROW_RIGHT &&
          this.supportsCommand("DirectionRight"):
          this.sendCommand("DirectionRight");
          break;
        case newValue === Characteristic.RemoteKey.SELECT &&
          this.supportsCommand("Select"):
        case newValue === Characteristic.RemoteKey.PLAY_PAUSE &&
          this.supportsCommand("Select") &&
          !this.supportsCommand("Play"):
          this.sendCommand("Select");
          break;
        case newValue === Characteristic.RemoteKey.PLAY_PAUSE &&
          this.supportsCommand("Play"):
          this.sendCommand("Play");
          break;
        case newValue === Characteristic.RemoteKey.INFORMATION &&
          this.supportsCommand("Menu"):
        case newValue === Characteristic.RemoteKey.BACK &&
          !this.supportsCommand("Back") &&
          this.supportsCommand("Menu"):
        case newValue === Characteristic.RemoteKey.EXIT &&
          !this.supportsCommand("Home") &&
          this.supportsCommand("Menu"):
          this.sendCommand("Menu");
          break;
        case newValue === Characteristic.RemoteKey.BACK &&
          this.supportsCommand("Back"):
          this.sendCommand("Back");
          break;
        case newValue === Characteristic.RemoteKey.EXIT &&
          this.supportsCommand("Home"):
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
      Characteristic.VolumeControlType.RELATIVE
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
