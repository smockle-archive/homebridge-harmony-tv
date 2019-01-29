// @ts-check
const http = require("http");
const { HarmonyHub } = require("harmonyhub-api");

function request(options, body) {
  return new Promise((resolve, reject) => {
    const request = http.request(options, response => {
      const data = [];
      response.on("data", chunk => data.push(chunk));
      response.on("end", () => {
        resolve(JSON.parse(Buffer.concat(data).toString()).data.remoteId);
      });
    });
    request.on("error", error => reject(error));
    request.write(body);
    request.end();
  });
}

async function getRemoteId(host) {
  const body = JSON.stringify({
    id: 0,
    cmd: "connect.discoveryinfo?get",
    params: {}
  });
  const options = {
    method: "POST",
    host,
    port: 8088,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      Origin: "http://localhost.nebula.myharmony.com"
    }
  };
  const response = await request(options, body);
  return response;
}

async function getDevices(host, remoteId) {
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

async function getCommands(host, remoteId, deviceId) {
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

module.exports = {
  getRemoteId,
  getDevices,
  getCommands
};
