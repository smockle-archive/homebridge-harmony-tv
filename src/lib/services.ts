import type {
  PlatformConfig,
  CharacteristicSetCallback,
  CharacteristicValue,
  Logging,
  PlatformAccessory,
  API,
} from "homebridge";
import { getHub } from "./hub";

export function addSwitchServices(
  switchAccessory: PlatformAccessory,
  tvAccessory: PlatformAccessory,
  log: Logging,
  __: PlatformConfig,
  api: API
): PlatformAccessory {
  const { Service, Characteristic } = api.hap;

  // get the Switch service if it exists
  let switchService = switchAccessory.getService(Service.Switch);
  // otherwise create a new Switch service
  if (!switchService) {
    switchService = switchAccessory.addService(Service.Switch);
  }

  switchService
    .getCharacteristic(Characteristic.On)
    .on(
      "set",
      (newState: CharacteristicValue, callback: CharacteristicSetCallback) => {
        const tvService = tvAccessory.getService(Service.Television);
        if (!tvService) {
          log.error("Television Service not found");
        }
        tvService
          ?.getCharacteristic(Characteristic.Active)
          .updateValue(Number(!!newState));
        callback(null);
      }
    );

  return switchAccessory;
}

export function addTelevisionServices(
  tvAccessory: PlatformAccessory,
  log: Logging,
  { name, host, remoteId, deviceId, commands }: PlatformConfig,
  api: API
): PlatformAccessory {
  const { Service, Characteristic } = api.hap;

  const hub = getHub(host, remoteId, deviceId);

  const inputs: {
    action: string;
    name: string;
  }[] = commands.filter(({ name }: { name: string }) =>
    name.match(/^Input[\w\d]+/)
  );

  // TV

  // get the Television service if it exists
  let tvService = tvAccessory.getService(Service.Television);
  // otherwise create a new Television service
  if (!tvService) {
    tvService = tvAccessory.addService(Service.Television);
  }
  tvService.setCharacteristic(Characteristic.ConfiguredName, name!);
  tvService.setCharacteristic(
    Characteristic.SleepDiscoveryMode,
    Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
  );
  tvService
    .getCharacteristic(Characteristic.Active)
    .on(
      "set",
      (_: CharacteristicValue, callback: CharacteristicSetCallback) => {
        return hub
          .send("PowerToggle")
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
      (newValue: CharacteristicValue, callback: CharacteristicSetCallback) => {
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

  // Speaker

  // get the TelevisionSpeaker service if it exists
  let speakerService = tvAccessory.getService(Service.TelevisionSpeaker);
  // otherwise create a new TelevisionSpeaker service
  if (!speakerService) {
    speakerService = tvAccessory.addService(Service.TelevisionSpeaker);
  }
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
      (newValue: CharacteristicValue, callback: CharacteristicSetCallback) => {
        const sendVolumeCommand = (() => {
          switch (true) {
            case newValue === Characteristic.VolumeSelector.INCREMENT:
              return hub.send("VolumeUp");
            case newValue === Characteristic.VolumeSelector.DECREMENT:
              return hub.send("VolumeDown");
            default:
              return Promise.reject(new Error("Failed to send volume command"));
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

  // Inputs

  tvService.setCharacteristic(Characteristic.ActiveIdentifier, 0);
  tvService
    .getCharacteristic(Characteristic.ActiveIdentifier)
    .on(
      "set",
      (newValue: CharacteristicValue, callback: CharacteristicSetCallback) => {
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
    // get the TelevisionSpeaker service if it exists
    let inputSourceService = tvAccessory.getService(Service.InputSource);
    // otherwise create a new TelevisionSpeaker service
    if (!inputSourceService) {
      inputSourceService = tvAccessory.addService(Service.InputSource);
    }
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
    tvService!.addLinkedService(inputSourceService);
  });

  return tvAccessory;
}
