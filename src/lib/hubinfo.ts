import http from "http";
import { HarmonyHub } from "harmonyhub-api";

function request(options: string | http.RequestOptions | URL, body: any) {
  return new Promise((resolve, reject) => {
    const request = http.request(options, (response) => {
      const data: Uint8Array[] = [];
      response.on("data", (chunk) => data.push(chunk));
      response.on("end", () => {
        resolve(JSON.parse(Buffer.concat(data).toString()).data.activeRemoteId);
      });
    });
    request.on("error", (error) => reject(error));
    request.write(body);
    request.end();
  });
}

export async function getRemoteId(host: string) {
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
  const response = await request(options, body);
  return response;
}

export async function getDevices(host: string, remoteId: string) {
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

export async function getCommands(
  host: string,
  remoteId: string,
  deviceId: string
) {
  const hub = new HarmonyHub(host, remoteId);
  try {
    await hub.connect();
    const commands = await hub.getCommands(deviceId);
    hub.disconnect();
    return commands;
  } catch (error) {
    hub.disconnect();
    throw error;
  }
}
