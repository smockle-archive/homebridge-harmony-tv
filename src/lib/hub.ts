import { HarmonyHub } from "harmonyhub-api";
import { request } from "./request";

export class Hub {
  private readonly hub: HarmonyHub;
  private readonly deviceId: string;

  constructor(host: string, remoteId: string, deviceId: string) {
    this.hub = new HarmonyHub(host, remoteId);
    this.deviceId = deviceId;
  }

  static async getRemoteId(host: string): Promise<string> {
    const body = JSON.stringify({
      id: 1,
      cmd: "setup.account?getProvisionInfo",
      params: {},
    });
    const options = {
      method: "POST",
      host,
      port: 8088,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        Origin: "http://sl.dhg.myharmony.com",
      },
    };
    return await request(options, body);
  }

  static async getDevices(
    host: string,
    remoteId: string
  ): Promise<{ label: string; id: string }[]> {
    const hub = new HarmonyHub(host, remoteId);
    try {
      await hub.connect();
      const devices = await hub.getDevices();
      hub.disconnect();
      return devices.map(({ label, id }) => ({ label, id }));
    } catch (error) {
      hub.disconnect();
      throw error;
    }
  }

  getCommands = async (): Promise<
    {
      action: { command: string; type: string; deviceId: string } | string;
      name: string;
      label: string;
    }[]
  > => {
    try {
      await this.hub.connect();
      const commands = await this.hub.getCommands(this.deviceId);
      await this.hub.disconnect();
      return commands;
    } catch (error) {
      this.hub.disconnect();
      return Promise.reject(error);
    }
  };

  send = async (command: string) => {
    try {
      await this.hub.connect();
      await this.hub.sendCommand(command, this.deviceId);
      await this.hub.disconnect();
    } catch (error) {
      this.hub.disconnect();
      return Promise.reject(error);
    }
  };
}

let hub: Hub;
export function getHub(host: string, remoteId: string, deviceId: string) {
  hub = hub instanceof Hub ? hub : new Hub(host, remoteId, deviceId);
  return hub;
}
