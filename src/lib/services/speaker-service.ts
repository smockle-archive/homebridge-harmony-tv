import type { CharacteristicValue, Service, API } from "homebridge";
import type { Hub } from "../hub";

type SpeakerServiceProps = {
  tvService: Service;
  hub: Hub;
  api: API;
};

export function getSpeakerService({
  tvService,
  hub,
  api,
}: SpeakerServiceProps) {
  const { Service, Characteristic } = api.hap;

  const speakerService = new Service.TelevisionSpeaker(
    tvService.displayName + " Volume",
    "volumeService"
  );

  speakerService.setCharacteristic(
    Characteristic.Active,
    Characteristic.Active.ACTIVE
  );

  // Relative Volume Control
  speakerService.setCharacteristic(
    Characteristic.VolumeControlType,
    Characteristic.VolumeControlType.RELATIVE
  );

  // Volume Commands
  speakerService
    .getCharacteristic(Characteristic.VolumeSelector)
    .on("set", async (remoteKey: CharacteristicValue) => {
      const remoteKeys = new Map([
        [Characteristic.VolumeSelector.INCREMENT, "VolumeUp"],
        [Characteristic.VolumeSelector.DECREMENT, "VolumeDown"],
      ]);
      const command = remoteKeys.get(Number(remoteKey));
      if (command) {
        return await hub.send(command);
      } else {
        return Promise.reject(new Error("Failed to send volume command"));
      }
    })
    .setProps({
      validValues: [
        Characteristic.VolumeSelector.INCREMENT,
        Characteristic.VolumeSelector.DECREMENT,
      ],
    });

  tvService.addLinkedService(speakerService);
  return speakerService;
}
