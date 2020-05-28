import type {
  AccessoryConfig,
  Logging,
  Service,
  AccessoryPlugin,
  API,
} from "homebridge";
import { getHub, Hub } from "./hub";
import {
  getInputSourceService,
  getTVService,
  getSpeakerService,
  getSwitchService,
} from "./services";

class HarmonyTVAccessory implements AccessoryPlugin {
  enabledServices: Service[] = [];
  hub: Hub;

  constructor(
    _: Logging,
    { name, host, remoteId, deviceId }: AccessoryConfig,
    api: API
  ) {
    this.hub = getHub(host, remoteId, deviceId);
    const { hub } = this;
    const tvService = getTVService({ name, hub, api });

    this.enabledServices = [
      tvService,
      getSpeakerService({ tvService, hub, api }),
      getInputSourceService({ tvService, api }),
      getSwitchService({ tvService, api }),
    ];
  }

  getServices() {
    return this.enabledServices;
  }
}

export default function (homebridge: API) {
  homebridge.registerAccessory("HarmonyTV", HarmonyTVAccessory);
}
