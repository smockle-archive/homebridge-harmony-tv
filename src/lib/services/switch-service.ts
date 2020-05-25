import {
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicValue,
  Service,
} from "homebridge";

type SwitchServiceProps = {
  tvService: Service;
};

export function getSwitchService({ tvService }: SwitchServiceProps) {
  let powerState: boolean = false;

  const switchService = new Service.Switch(
    tvService.displayName + " Power Switch"
  );

  switchService
    .getCharacteristic(Characteristic.On)
    .on(CharacteristicEventTypes.GET, () => powerState)
    .on(CharacteristicEventTypes.SET, (value: CharacteristicValue) => {
      powerState = !!value;
      tvService.updateCharacteristic(Characteristic.Active, Number(!!value));
    });

  tvService.addLinkedService(switchService);
  return switchService;
}
