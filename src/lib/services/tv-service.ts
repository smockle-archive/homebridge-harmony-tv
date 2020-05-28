import type { CharacteristicValue, API } from "homebridge";
import type { Hub } from "../hub";

type TVServiceProps = {
  name: string;
  hub: Hub;
  api: API;
};

export function getTVService({ name, hub, api }: TVServiceProps) {
  const { Service, Characteristic } = api.hap;

  const tvService = new Service.Television(name, "Television");

  tvService.setCharacteristic(Characteristic.ConfiguredName, name);

  tvService.setCharacteristic(
    Characteristic.SleepDiscoveryMode,
    Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
  );

  // Power
  tvService
    .getCharacteristic(Characteristic.Active)
    .on("set", async (_: CharacteristicValue) => {
      return await hub.send("PowerToggle");
    });

  // Remote Keys
  tvService
    .getCharacteristic(Characteristic.RemoteKey)
    .on("set", async (remoteKey: CharacteristicValue) => {
      const remoteKeys = new Map([
        [Characteristic.RemoteKey.ARROW_UP, "DirectionUp"],
        [Characteristic.RemoteKey.ARROW_DOWN, "DirectionDown"],
        [Characteristic.RemoteKey.ARROW_LEFT, "DirectionLeft"],
        [Characteristic.RemoteKey.ARROW_RIGHT, "DirectionRight"],
        [Characteristic.RemoteKey.SELECT, "Select"],
        [Characteristic.RemoteKey.PLAY_PAUSE, "Select"],
        [Characteristic.RemoteKey.INFORMATION, "Menu"],
        [Characteristic.RemoteKey.BACK, "Menu"],
        [Characteristic.RemoteKey.EXIT, "Menu"],
      ]);
      const command = remoteKeys.get(Number(remoteKey));
      if (command) {
        return await hub.send(command);
      } else {
        return Promise.reject(new Error("Failed to send command"));
      }
    })
    .setProps({
      validValues: [
        Characteristic.RemoteKey.ARROW_UP,
        Characteristic.RemoteKey.ARROW_DOWN,
        Characteristic.RemoteKey.ARROW_LEFT,
        Characteristic.RemoteKey.ARROW_RIGHT,
        Characteristic.RemoteKey.SELECT,
        Characteristic.RemoteKey.PLAY_PAUSE,
        Characteristic.RemoteKey.INFORMATION,
        Characteristic.RemoteKey.BACK,
        Characteristic.RemoteKey.EXIT,
      ],
    });

  // Input Sources
  tvService.setCharacteristic(Characteristic.ActiveIdentifier, 0);
  tvService
    .getCharacteristic(Characteristic.ActiveIdentifier)
    .on("set", async (input: CharacteristicValue) => {
      if (input === 0) {
        return await hub.send("InputHdmi1");
      } else {
        return Promise.reject(new Error("Failed to send command"));
      }
    })
    .setProps({
      validValues: [0],
    });

  return tvService;
}
