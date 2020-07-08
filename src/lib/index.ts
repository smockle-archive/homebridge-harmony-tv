import type { API } from "homebridge";

import { HarmonyTVPlatform } from "./harmony-tv-platform";

export default function (api: API) {
  api.registerPlatform("HarmonyTV", HarmonyTVPlatform);
}
