// @ts-check
const http = require("http");
const { HarmonyHub } = require("harmonyhub-api");

const getRemoteId = host => {
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
};

const getDevices = (host, remoteId) => {
  const hub = new HarmonyHub(host, remoteId);
  return new Promise((resolve, reject) => {
    hub
      .connect()
      .then(() => {
        return hub.getDevices();
      })
      .then(devices => {
        hub.disconnect();
        resolve(devices.map(({ label, id }) => ({ label, id })));
      })
      .catch(error => {
        hub.disconnect();
        reject(error);
      });
  });
};

const getCommands = (host, remoteId, deviceId) => {
  const hub = new HarmonyHub(host, remoteId);
  return new Promise((resolve, reject) => {
    hub
      .connect()
      .then(() => {
        return hub.getCommands(deviceId);
      })
      .then(commands => {
        hub.disconnect();
        resolve(commands);
      })
      .catch(error => {
        hub.disconnect();
        reject(error);
      });
  });
};

module.exports = {
  getRemoteId,
  getDevices,
  getCommands
};
