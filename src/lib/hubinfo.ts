import Harmony from "harmony-websocket";

export async function getDevices(host: string) {
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

export async function getCommands(host: string, deviceId: string) {
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
