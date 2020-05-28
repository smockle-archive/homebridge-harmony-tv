import { HarmonyHub } from "harmonyhub-api";
import type {
  AccessoryConfig,
  CharacteristicSetCallback,
  CharacteristicValue,
  Logging,
  Service,
  AccessoryPlugin,
  API,
} from "homebridge";

export class HarmonyTVAccessory implements AccessoryPlugin {
  log: Logging;
  config: AccessoryConfig;
  name: string;
  remoteId: string;
  deviceId: string;
  commands: { action: string; name: string }[];
  enabledServices: Service[];
  hub: HarmonyHub;
  previousPowerState: unknown;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    const { Service, Characteristic } = api.hap;

    this.log = log;
    this.config = config;
    this.name = config.name;
    this.remoteId = config.remoteId;
    this.deviceId = config.deviceId;
    this.commands = config.commands;
    this.enabledServices = [];

    this.hub = new HarmonyHub(config.host, config.remoteId);
    this.previousPowerState = null;
    if (!config.commands || !(config.commands instanceof Array)) {
      throw new Error(
        `Missing an array of 'commands'. Check your configuration file. For help with this error, see https://github.com/smockle/homebridge-harmony-tv#configuration.`
      );
    }
    const inputs: {
      action: string;
      name: string;
    }[] = config.commands.filter(({ name }) => name.match(/^Input[\w\d]+/));

    // TV

    const tvService = new Service.Television(this.name, "Television");
    tvService.setCharacteristic(Characteristic.ConfiguredName, this.name);
    tvService.setCharacteristic(
      Characteristic.SleepDiscoveryMode,
      Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
    );
    tvService
      .getCharacteristic(Characteristic.Active)
      .on(
        "set",
        (
          newValue: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          const sendPowerCommand = (() => {
            switch (true) {
              case newValue === 0 &&
                this.supportsCommand("PowerOff") &&
                this.supportsCommand("PowerOn"):
                return this.sendCommand("PowerOff");
              case newValue === 1 &&
                this.supportsCommand("PowerOff") &&
                this.supportsCommand("PowerOn"):
                return this.sendCommand("PowerOn");
              case newValue !== this.previousPowerState &&
                this.supportsCommand("PowerToggle"):
                return this.sendCommand("PowerToggle").then(
                  () => (this.previousPowerState = newValue)
                );
              case newValue === this.previousPowerState:
                return new Promise((resolve) => {
                  this.log.debug("Ignored duplicate power command");
                  resolve();
                });
              default:
                return Promise.reject(
                  new Error("Failed to send power command")
                );
            }
          })();
          return sendPowerCommand
            .then(() => callback(null))
            .catch((error) => {
              this.log.error(error);
              callback(error);
            });
        }
      );
    tvService
      .getCharacteristic(Characteristic.RemoteKey)
      .on(
        "set",
        (
          newValue: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          const sendCommand = (() => {
            switch (true) {
              case newValue === Characteristic.RemoteKey.ARROW_UP &&
                this.supportsCommand("DirectionUp"):
                return this.sendCommand("DirectionUp");
              case newValue === Characteristic.RemoteKey.ARROW_DOWN &&
                this.supportsCommand("DirectionDown"):
                return this.sendCommand("DirectionDown");
              case newValue === Characteristic.RemoteKey.ARROW_LEFT &&
                this.supportsCommand("DirectionLeft"):
                return this.sendCommand("DirectionLeft");
              case newValue === Characteristic.RemoteKey.ARROW_RIGHT &&
                this.supportsCommand("DirectionRight"):
                return this.sendCommand("DirectionRight");
              case newValue === Characteristic.RemoteKey.SELECT &&
                this.supportsCommand("Select"):
              case newValue === Characteristic.RemoteKey.PLAY_PAUSE &&
                this.supportsCommand("Select") &&
                !this.supportsCommand("Play"):
                return this.sendCommand("Select");
              case newValue === Characteristic.RemoteKey.PLAY_PAUSE &&
                this.supportsCommand("Play"):
                return this.sendCommand("Play");
              case newValue === Characteristic.RemoteKey.INFORMATION &&
                this.supportsCommand("Menu"):
              case newValue === Characteristic.RemoteKey.BACK &&
                !this.supportsCommand("Back") &&
                this.supportsCommand("Menu"):
              case newValue === Characteristic.RemoteKey.EXIT &&
                !this.supportsCommand("Home") &&
                this.supportsCommand("Menu"):
                return this.sendCommand("Menu");
              case newValue === Characteristic.RemoteKey.BACK &&
                this.supportsCommand("Back"):
                return this.sendCommand("Back");
              case newValue === Characteristic.RemoteKey.EXIT &&
                this.supportsCommand("Home"):
                return this.sendCommand("Home");
              default:
                return Promise.reject(new Error("Failed to send command"));
            }
          })();
          return sendCommand
            .then(() => callback(null))
            .catch((error) => {
              this.log.error(error);
              callback(error);
            });
        }
      );

    // Speaker

    const speakerService = new Service.TelevisionSpeaker(
      this.name + " Volume",
      "volumeService"
    );
    speakerService
      .setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE)
      .setCharacteristic(
        Characteristic.VolumeControlType,
        Characteristic.VolumeControlType.RELATIVE
      );
    speakerService
      .getCharacteristic(Characteristic.VolumeSelector)
      .on(
        "set",
        (
          newValue: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          const sendVolumeCommand = (() => {
            switch (true) {
              case newValue === Characteristic.VolumeSelector.INCREMENT &&
                this.supportsCommand("VolumeUp"):
                return this.sendCommand("VolumeUp");
              case newValue === Characteristic.VolumeSelector.DECREMENT &&
                this.supportsCommand("VolumeDown"):
                return this.sendCommand("VolumeDown");
              default:
                return Promise.reject(
                  new Error("Failed to send volume command")
                );
            }
          })();
          return sendVolumeCommand
            .then(() => callback(null))
            .catch((error) => {
              this.log.error(error);
              callback(error);
            });
        }
      );
    tvService.addLinkedService(speakerService);
    this.enabledServices.push(speakerService);

    // Inputs

    tvService.setCharacteristic(Characteristic.ActiveIdentifier, 0);
    tvService
      .getCharacteristic(Characteristic.ActiveIdentifier)
      .on(
        "set",
        (
          newValue: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          if (typeof newValue !== "number") {
            return Promise.reject(new Error("Failed to send input command"));
          }
          const { name: command } = inputs[newValue];
          const sendInputCommand = (() => {
            if (this.supportsCommand(command)) {
              return this.sendCommand(command);
            } else {
              return Promise.reject(new Error("Failed to send input command"));
            }
          })();
          return sendInputCommand
            .then(() => callback(null))
            .catch((error) => {
              this.log.error(error);
              callback(error);
            });
        }
      );
    inputs.forEach((input, index) => {
      const name = input.name.replace(/^Input/, "");
      const type = (() => {
        switch (true) {
          case !!name.match(/hdmi/i):
            return Characteristic.InputSourceType.HDMI;
          case !!name.match(/ypbpr/i):
            return Characteristic.InputSourceType.COMPONENT_VIDEO;
          default:
            return Characteristic.InputSourceType.OTHER;
        }
      })();
      const inputSourceService = new Service.InputSource(
        name.toLowerCase(),
        name.replace(/^([\w]+)([\d]+)$/, "$1 $2").toUpperCase()
      );
      inputSourceService
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
      tvService.addLinkedService(inputSourceService);
      this.enabledServices.push(inputSourceService);
    });

    this.enabledServices.push(tvService);
  }

  getServices() {
    return this.enabledServices;
  }

  supportsCommand(command: string): boolean {
    return this.commands.some(({ name }) => name === command);
  }

  sendCommand(commandName: string) {
    const command = this.commands.find(({ name }) => name === commandName);
    if (!command) {
      return Promise.reject(
        new Error(
          `Command ${commandName} not found for device with id ${this.deviceId}. For help with this error, see https://github.com/smockle/homebridge-harmony-tv#setup.`
        )
      );
    }
    if (!command.action) {
      return Promise.reject(
        new Error(
          `Command ${commandName} is missing a value for 'action'. Check your configuration file. For help with this error, see https://github.com/smockle/homebridge-harmony-tv#configuration.`
        )
      );
    }
    return new Promise((resolve, reject) => {
      this.hub
        .connect()
        .then(() => {
          this.hub.sendCommand(commandName, this.deviceId);
        })
        .then(() => {
          this.hub.disconnect();
        })
        .then(() => {
          resolve();
        })
        .catch((error: Error) => reject(error));
    });
  }
}