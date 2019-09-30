// @ts-check
const Harmony = require("harmony-websocket");

async function getDevices(host) {
  const hub = new Harmony();
  try {
    await hub.connect(host);
    const devices = await hub.getDevices();
    hub.close();
    return devices.map(({ label, id }) => ({ label, id }));
  } catch (error) {
    hub.close();
    throw error;
  }
}

async function getCommands(host, deviceId) {
  const hub = new Harmony();
  try {
    await hub.connect(host);
    const commands = await hub.getDeviceCommands(deviceId);
    hub.close();
    return commands;
  } catch (error) {
    hub.close();
    throw error;
  }
}

module.exports = {
  getDevices,
  getCommands
};
