import type {
  PlatformConfig,
  Logging,
  API,
  PlatformAccessory,
} from "homebridge";
import { addSwitchServices, addTelevisionServices } from "./services";

export const PluginName = "homebridge-harmony-tv-smockle";
export const PlatformName = "HarmonyTV";
export const PlatformVersion = "0003";

export class HarmonyTVPlatform {
  accessories: PlatformAccessory[];

  constructor(log: Logging, config: PlatformConfig, api: API) {
    // Store restored cached accessories here
    this.accessories = [];

    /**
     * Platforms should wait until the "didFinishLaunching" event has fired before
     * registering any new accessories.
     */
    api.on("didFinishLaunching", () => {
      const tvUUID = api.hap.uuid.generate(
        `${PlatformName}-${PlatformVersion} TV`
      );
      let tvAccessory = this.accessories.find(
        (accessory) => accessory.UUID === tvUUID
      );
      if (!tvAccessory) {
        tvAccessory = new api.platformAccessory("TV", tvUUID);
        addTelevisionServices(tvAccessory, log, config, api);
      }

      const switchUUID = api.hap.uuid.generate(
        `${PlatformName}-${PlatformVersion} TV Power State`
      );
      let switchAccessory = this.accessories.find(
        (accessory) => accessory.UUID === switchUUID
      );
      if (!switchAccessory) {
        switchAccessory = new api.platformAccessory(
          "TV Power State",
          switchUUID
        );
        addSwitchServices(switchAccessory, tvAccessory, log, config, api);
      }

      api.registerPlatformAccessories(PluginName, PlatformName, [
        tvAccessory,
        switchAccessory,
      ]);
    });
  }

  /**
   * REQUIRED - Homebridge will call the "configureAccessory" method once for every cached
   * accessory restored
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.accessories.push(accessory);
  }
}
