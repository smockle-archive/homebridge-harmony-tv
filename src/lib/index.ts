import { API } from "homebridge";

import { HarmonyTVAccessory } from "./harmony-tv-accessory";

export default function (homebridge: API) {
  homebridge.registerAccessory(
    "homebridge-harmony-tv-smockle",
    "HarmonyTV",
    HarmonyTVAccessory
  );
}
