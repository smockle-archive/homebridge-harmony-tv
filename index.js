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

  this.tvService.setCharacteristic(Characteristic.ActiveIdentifier, 1);
  this.tvService
    .getCharacteristic(Characteristic.ActiveIdentifier)
    .on("set", (newValue, callback) => {
      console.log(`set Active Identifier => setNewValue: ${newValue}`);
      callback(null);
    });
  this.tvService
    .getCharacteristic(Characteristic.RemoteKey)
    .on("set", (newValue, callback) => {
      console.log(`set Remote Key => setNewValue: ${newValue}`);
      callback(null);
    });

  this.inputHDMI1Service = new Service.InputSource("hdmi1", "HDMI 1");
  this.inputHDMI1Service
    .setCharacteristic(Characteristic.Identifier, 1)
    .setCharacteristic(Characteristic.ConfiguredName, "HDMI 1")
    .setCharacteristic(
      Characteristic.IsConfigured,
      Characteristic.IsConfigured.CONFIGURED
    )
    .setCharacteristic(
      Characteristic.InputSourceType,
      Characteristic.InputSourceType.HDMI
    );
  this.tvService.addLinkedService(this.inputHDMI1Service);
  this.enabledServices.push(this.inputHDMI1Service);

  this.inputHDMI2Service = new Service.InputSource("hdmi2", "HDMI 2");
  this.inputHDMI2Service
    .setCharacteristic(Characteristic.Identifier, 2)
    .setCharacteristic(Characteristic.ConfiguredName, "HDMI 2")
    .setCharacteristic(
      Characteristic.IsConfigured,
      Characteristic.IsConfigured.CONFIGURED
    )
    .setCharacteristic(
      Characteristic.InputSourceType,
      Characteristic.InputSourceType.HDMI
    );
  this.tvService.addLinkedService(this.inputHDMI2Service);
  this.enabledServices.push(this.inputHDMI2Service);

  this.inputHDMI3Service = new Service.InputSource("hdmi3", "HDMI 3");
  this.inputHDMI3Service
    .setCharacteristic(Characteristic.Identifier, 3)
    .setCharacteristic(Characteristic.ConfiguredName, "HDMI 3")
    .setCharacteristic(
      Characteristic.IsConfigured,
      Characteristic.IsConfigured.CONFIGURED
    )
    .setCharacteristic(
      Characteristic.InputSourceType,
      Characteristic.InputSourceType.HDMI
    );
  this.tvService.addLinkedService(this.inputHDMI3Service);
  this.enabledServices.push(this.inputHDMI3Service);

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
