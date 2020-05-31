import type {
  AccessoryConfig,
  CharacteristicSetCallback,
  CharacteristicValue,
  Logging,
  Service,
  AccessoryPlugin,
  API,
} from "homebridge";
import { Hub, getHub } from "./hub";

export class HarmonyTVAccessory implements AccessoryPlugin {
  name: string;
  enabledServices: Service[];
  hub: Hub;
  previousPowerState: unknown;

  constructor(
    log: Logging,
    { name, host, remoteId, deviceId, commands }: AccessoryConfig,
    api: API
  ) {
    const { Service, Characteristic } = api.hap;

    this.name = name;
    this.enabledServices = [];

    this.hub = getHub(host, remoteId, deviceId);
    this.previousPowerState = null;

    const inputs: {
      action: string;
      name: string;
    }[] = commands.filter(({ name }: { name: string }) =>
      name.match(/^Input[\w\d]+/)
    );

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
              case newValue !== this.previousPowerState:
                return this.hub
                  .send("PowerToggle")
                  .then(() => (this.previousPowerState = newValue));
              case newValue === this.previousPowerState:
                return new Promise((resolve) => {
                  log.debug("Ignored duplicate power command");
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
              log.error(error);
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
              case newValue === Characteristic.RemoteKey.ARROW_UP:
                return this.hub.send("DirectionUp");
              case newValue === Characteristic.RemoteKey.ARROW_DOWN:
                return this.hub.send("DirectionDown");
              case newValue === Characteristic.RemoteKey.ARROW_LEFT:
                return this.hub.send("DirectionLeft");
              case newValue === Characteristic.RemoteKey.ARROW_RIGHT:
                return this.hub.send("DirectionRight");
              case newValue === Characteristic.RemoteKey.SELECT:
              case newValue === Characteristic.RemoteKey.PLAY_PAUSE:
                return this.hub.send("Select");
              case newValue === Characteristic.RemoteKey.INFORMATION:
              case newValue === Characteristic.RemoteKey.BACK:
              case newValue === Characteristic.RemoteKey.EXIT:
                return this.hub.send("Menu");
              default:
                return Promise.reject(new Error("Failed to send command"));
            }
          })();
          return sendCommand
            .then(() => callback(null))
            .catch((error) => {
              log.error(error);
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
              case newValue === Characteristic.VolumeSelector.INCREMENT:
                return this.hub.send("VolumeUp");
              case newValue === Characteristic.VolumeSelector.DECREMENT:
                return this.hub.send("VolumeDown");
              default:
                return Promise.reject(
                  new Error("Failed to send volume command")
                );
            }
          })();
          return sendVolumeCommand
            .then(() => callback(null))
            .catch((error) => {
              log.error(error);
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
            return this.hub.send(command);
          })();
          return sendInputCommand
            .then(() => callback(null))
            .catch((error) => {
              log.error(error);
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
}
