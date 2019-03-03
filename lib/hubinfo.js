// @ts-check
const Harmony = require("harmony-websocket");

async function getDevices(host) {
  const hub = new Harmony();
  try {
    await hub.connect(host);
    const devices = await hub.getDevices();
    hub.end();
    return devices.map(({ label, id }) => ({ label, id }));
  } catch (error) {
    hub.end();
    throw error;
  }
}

async function getCommands(host, deviceId) {
  const hub = new Harmony();
  try {
    await hub.connect(host);
    const commands = await hub.getDeviceCommands(deviceId);
    hub.end();
    return commands;
  } catch (error) {
    hub.end();
    throw error;
  }
}

module.exports = {
  getDevices,
  getCommands
};
