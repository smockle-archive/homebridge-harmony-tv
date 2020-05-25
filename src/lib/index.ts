import { AccessoryConfig, Logging, Service, API } from "homebridge";
import { getHub, Hub } from "./hub";
import {
  getInputSourceService,
  getTVService,
  getSpeakerService,
  getSwitchService,
} from "./services";

class HarmonyTVAccessory {
  enabledServices: Service[] = [];
  hub: Hub;

  constructor(_: Logging, { name, host, remoteId, deviceId }: AccessoryConfig) {
    this.hub = getHub(host, remoteId, deviceId);
    const { hub } = this;
    const tvService = getTVService({ name, hub });

    this.enabledServices = [
      tvService,
      getSpeakerService({ tvService, hub }),
      getInputSourceService({ tvService }),
      getSwitchService({ tvService }),
    ];
  }

  getServices() {
    return this.enabledServices;
  }
}

export default function (homebridge: API) {
  homebridge.registerAccessory("HarmonyTV", HarmonyTVAccessory);
}
