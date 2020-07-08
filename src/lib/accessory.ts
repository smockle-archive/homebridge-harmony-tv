import type {
  AccessoryConfig,
  CharacteristicSetCallback,
  CharacteristicValue,
  Logging,
  AccessoryPlugin,
  API,
  Service,
} from "homebridge";
import { getHub } from "./hub";

export class HarmonyTVAccessory implements AccessoryPlugin {
  enabledServices: Service[] = [] as Service[];

  constructor(
    log: Logging,
    { name, host, remoteId, deviceId, commands }: AccessoryConfig,
    api: API
  ) {
    const { Service, Characteristic } = api.hap;

    const hub = getHub(host, remoteId, deviceId);

    const inputs: {
      action: string;
      name: string;
    }[] = commands.filter(({ name }: { name: string }) =>
      name.match(/^Input[\w\d]+/)
    );

    // TV

    let tvService = new Service.Television("TV", "Television");
    tvService.setCharacteristic(Characteristic.ConfiguredName, name!);
    tvService.setCharacteristic(
      Characteristic.SleepDiscoveryMode,
      Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
    );
    let activeState = 0;
    tvService
      .getCharacteristic(Characteristic.Active)
      .on(
        "set",
        (
          newActiveState: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          if (activeState === Number(!!newActiveState)) {
            return callback(null);
          }
          return hub
            .send("PowerToggle")
            .then(() => (activeState = Number(!!newActiveState)))
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
                return hub.send("DirectionUp");
              case newValue === Characteristic.RemoteKey.ARROW_DOWN:
                return hub.send("DirectionDown");
              case newValue === Characteristic.RemoteKey.ARROW_LEFT:
                return hub.send("DirectionLeft");
              case newValue === Characteristic.RemoteKey.ARROW_RIGHT:
                return hub.send("DirectionRight");
              case newValue === Characteristic.RemoteKey.SELECT:
              case newValue === Characteristic.RemoteKey.PLAY_PAUSE:
                return hub.send("Select");
              case newValue === Characteristic.RemoteKey.INFORMATION:
              case newValue === Characteristic.RemoteKey.BACK:
              case newValue === Characteristic.RemoteKey.EXIT:
                return hub.send("Menu");
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
    this.enabledServices.push(tvService);

    // Speaker

    let speakerService = new Service.TelevisionSpeaker(
      "TV Volume",
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
                return hub.send("VolumeUp");
              case newValue === Characteristic.VolumeSelector.DECREMENT:
                return hub.send("VolumeDown");
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
            return hub.send(command);
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

    // Switch

    const switchService = new Service.Switch(`${name} Power State`);
    switchService
      .getCharacteristic(Characteristic.On)
      .on(
        "set",
        (
          newState: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          tvService
            .getCharacteristic(Characteristic.Active)
            .updateValue(Number(!!newState));
          callback(null);
        }
      );
    tvService.addLinkedService(switchService);
    this.enabledServices.push(switchService);
  }

  getServices() {
    return this.enabledServices;
  }
}
