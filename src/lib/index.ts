import type { API } from "homebridge";

import { HarmonyTVAccessory } from "./accessory";

export default function (api: API) {
  api.registerAccessory(
    "homebridge-harmony-tv-smockle",
    "HarmonyTV",
    HarmonyTVAccessory
  );
}
