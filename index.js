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
        case this.supportsCommand("PowerOff") &&
          this.supportsCommand("PowerOn") &&
          newValue === 0:
          this.sendCommand("PowerOff");
          break;
        case this.supportsCommand("PowerOff") &&
          this.supportsCommand("PowerOn") &&
          newValue === 1:
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
      console.log(`set Remote Key => setNewValue: ${newValue}`);
      callback(null);
    });
  this.enabledServices.push(this.tvService);

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

  const inputs = this.commands.filter(({ name }) => {
    name.startsWith("Input") && name !== "Input";
  });
  this.tvService.setCharacteristic(Characteristic.ActiveIdentifier, 1);
  this.tvService
    .getCharacteristic(Characteristic.ActiveIdentifier)
    .on("set", (newValue, callback) => {
      const { command } = inputs[newValue];
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
    this[`input${name}Service`] = new Service.InputSource(name, name);
    this[`input${name}Service`]
      .setCharacteristic(Characteristic.Identifier, index)
      .setCharacteristic(Characteristic.ConfiguredName, name)
      .setCharacteristic(
        Characteristic.IsConfigured,
        Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(Characteristic.InputSourceType, type);
    this.tvService.addLinkedService(this[`input${name}Service`]);
    this.enabledServices.push(this[`input${name}Service`]);
  });
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
