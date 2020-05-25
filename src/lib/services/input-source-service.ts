import { Characteristic, Service } from "homebridge";

type InputSourceServiceProps = {
  tvService: Service;
};

export function getInputSourceService({ tvService }: InputSourceServiceProps) {
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
