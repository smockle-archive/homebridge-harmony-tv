import type { CharacteristicValue, Service, API } from "homebridge";

type SwitchServiceProps = {
  tvService: Service;
  api: API;
};

export function getSwitchService({ tvService, api }: SwitchServiceProps) {
  const { Service, Characteristic } = api.hap;

  let powerState: boolean = false;

  const switchService = new Service.Switch(
    tvService.displayName + " Power Switch"
  );

  switchService
    .getCharacteristic(Characteristic.On)
    .on("get", () => powerState)
    .on("set", (value: CharacteristicValue) => {
      powerState = !!value;
      tvService.updateCharacteristic(Characteristic.Active, Number(!!value));
    });

  tvService.addLinkedService(switchService);
  return switchService;
}
