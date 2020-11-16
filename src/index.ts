import { getHarmonyClient } from "@harmonyhub/client-ws";
import type { HarmonyClient } from "@harmonyhub/client-ws";
import type {
  API,
  IndependentPlatformPlugin,
  Logging,
  PlatformConfig,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
} from "homebridge";

const PLUGIN_NAME = "homebridge-harmony-tv-smockle";
const PLATFORM_NAME = "HarmonyTV";

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, HarmonyTVPlugin);
};

class HarmonyTVPlugin implements IndependentPlatformPlugin {
  private readonly log: Logging;
  private readonly config: PlatformConfig;
  private readonly api: API;
  private readonly Service;
  private readonly Characteristic;
  private activeState:
    | API["hap"]["Characteristic"]["Active"]["ACTIVE"]
    | API["hap"]["Characteristic"]["Active"]["INACTIVE"];

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    this.activeState = this.api.hap.Characteristic.Active.INACTIVE;

    this.publishExternalAccessory(this.config.name || "TV");
    log.info("Example platform finished initializing!");
  }

  send = async (command: string) => {
    let hub: HarmonyClient | undefined;
    try {
      hub = await getHarmonyClient(this.config.host, {
        remoteId: this.config.remoteId,
      });
      this.log.info(
        `Sending command: ${command} to device with id: ${this.config.deviceId} using Harmony Hub at ${this.config.host} with id: ${this.config.remoteId}`
      );
      await hub.send("holdAction", { command, deviceId: this.config.deviceId });
      hub.end();
    } catch (error) {
      this.log.error(error);
      if (hub && hub.end instanceof Function) {
        hub.end();
      }
      return Promise.reject(error);
    }
  };

  publishExternalAccessory = (name: string) => {
    // generate a UUID
    const uuid = this.api.hap.uuid.generate(`homebridge:${PLUGIN_NAME}` + name);

    // create the accessory
    const tvAccessory = new this.api.platformAccessory(name, uuid);

    // set the accessory category
    tvAccessory.category = this.api.hap.Categories.TELEVISION;

    // add the tv service
    const tvService = tvAccessory.addService(this.Service.Television);

    // set the tv name
    tvService.setCharacteristic(this.Characteristic.ConfiguredName, name);

    // set sleep discovery characteristic
    tvService.setCharacteristic(
      this.Characteristic.SleepDiscoveryMode,
      this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
    );

    // handle on / off events using the Active characteristic
    tvService
      .getCharacteristic(this.Characteristic.Active)
      .on("get", (callback: CharacteristicGetCallback) => {
        this.log.info(
          "get Active: " + (!!this.activeState ? "ACTIVE" : "INACTIVE")
        );
        callback(undefined, this.activeState);
      })
      .on(
        "set",
        (
          newValue: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          if (!!newValue == !!this.activeState) {
            this.log.info(
              "skipping Active; new value is equal to current value"
            );
            return callback();
          }
          this.log.info("set Active => setNewValue: " + newValue);
          this.send("PowerToggle")
            .then(() => {
              this.activeState = !!newValue
                ? this.api.hap.Characteristic.Active.ACTIVE
                : this.api.hap.Characteristic.Active.INACTIVE;
              tvService.updateCharacteristic(
                this.Characteristic.Active,
                this.activeState
              );
              callback();
            })
            .catch((error) => {
              this.log.error(error);
              callback(error);
            });
        }
      );

    // handle input source changes
    tvService.setCharacteristic(this.Characteristic.ActiveIdentifier, 1);
    tvService
      .getCharacteristic(this.Characteristic.ActiveIdentifier)
      .on(
        "set",
        (
          newValue: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          // the value will be the value you set for the Identifier Characteristic
          // on the Input Source service that was selected - see input sources below.
          this.log.info("set Active Identifier => setNewValue: " + newValue);
          this.send("InputHdmi1")
            .then(() => callback())
            .catch((error) => {
              this.log.error(error);
              callback(error);
            });
        }
      );

    // handle remote control input
    tvService
      .getCharacteristic(this.Characteristic.RemoteKey)
      .on(
        "set",
        (
          newValue: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          const command: string | undefined = (() => {
            switch (newValue) {
              case this.Characteristic.RemoteKey.ARROW_UP:
                return "DirectionUp";
              case this.Characteristic.RemoteKey.ARROW_DOWN:
                return "DirectionDown";
              case this.Characteristic.RemoteKey.ARROW_LEFT:
                return "DirectionLeft";
              case this.Characteristic.RemoteKey.ARROW_RIGHT:
                return "DirectionRight";
              case this.Characteristic.RemoteKey.SELECT:
              case this.Characteristic.RemoteKey.PLAY_PAUSE:
                return "Select";
              case this.Characteristic.RemoteKey.INFORMATION:
              case this.Characteristic.RemoteKey.BACK:
              case this.Characteristic.RemoteKey.EXIT:
                return "Menu";
            }
          })();
          if (!command) {
            this.log.error(
              `skipping Remote Key Pressed; unknown newValue: ${newValue}`
            );
            callback();
          } else {
            this.log.info(`set Remote Key Pressed: ${command}`);
            this.send(command)
              .then(() => callback())
              .catch((error) => {
                this.log.error(error);
                callback(error);
              });
          }
        }
      );

    /**
     * Create a speaker service to allow volume control
     */

    const speakerService = tvAccessory.addService(
      this.Service.TelevisionSpeaker
    );

    speakerService
      .setCharacteristic(
        this.Characteristic.Active,
        this.Characteristic.Active.ACTIVE
      )
      .setCharacteristic(
        this.Characteristic.VolumeControlType,
        this.Characteristic.VolumeControlType.RELATIVE
      );

    // handle volume control
    speakerService
      .getCharacteristic(this.Characteristic.VolumeSelector)
      .on(
        "set",
        (
          newValue: CharacteristicValue,
          callback: CharacteristicSetCallback
        ) => {
          const command = (() => {
            switch (newValue) {
              case this.Characteristic.VolumeSelector.INCREMENT:
                return "VolumeUp";
              case this.Characteristic.VolumeSelector.DECREMENT:
                return "VolumeDown";
            }
          })();
          if (!command) {
            this.log.error(
              `skipping VolumeSelector; unknown newValue: ${newValue}`
            );
            callback();
          } else {
            this.log.info(`set VolumeSelector: ${command}`);
            this.send(command)
              .then(() => callback())
              .catch((error) => {
                this.log.error(error);
                callback(error);
              });
          }
        }
      );

    /**
     * Create TV Input Source Services
     * These are the inputs the user can select from.
     * When a user selected an input the corresponding Identifier Characteristic
     * is sent to the TV Service ActiveIdentifier Characteristic handler.
     */

    // HDMI 1 Input Source
    const hdmi1InputService = tvAccessory.addService(
      this.Service.InputSource,
      "hdmi1",
      "HDMI 1"
    );
    hdmi1InputService
      .setCharacteristic(this.Characteristic.Identifier, 1)
      .setCharacteristic(this.Characteristic.ConfiguredName, "HDMI 1")
      .setCharacteristic(
        this.Characteristic.IsConfigured,
        this.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.Characteristic.InputSourceType,
        this.Characteristic.InputSourceType.HDMI
      );
    tvService.addLinkedService(hdmi1InputService); // link to tv service

    /**
     * Publish as external accessory
     * Only one TV can exist per bridge, to bypass this limitation, you should
     * publish your TV as an external accessory.
     */

    this.api.publishExternalAccessories(PLUGIN_NAME, [tvAccessory]);
  };
}
