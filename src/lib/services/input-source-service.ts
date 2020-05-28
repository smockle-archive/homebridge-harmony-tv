import type { Service, API } from "homebridge";

type InputSourceServiceProps = {
  tvService: Service;
  api: API;
};

export function getInputSourceService({
  tvService,
  api,
}: InputSourceServiceProps) {
  const { Service, Characteristic } = api.hap;

  const inputSourceService = new Service.InputSource("hdmi1", "HDMI 1");

  inputSourceService.setCharacteristic(
    Characteristic.InputSourceType,
    Characteristic.InputSourceType.HDMI
  );

  inputSourceService.setCharacteristic(Characteristic.Identifier, 0);

  inputSourceService.setCharacteristic(Characteristic.ConfiguredName, "HDMI 1");

  inputSourceService.setCharacteristic(
    Characteristic.IsConfigured,
    Characteristic.IsConfigured.CONFIGURED
  );

  tvService.addLinkedService(inputSourceService);
  return inputSourceService;
}
