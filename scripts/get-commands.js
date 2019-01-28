#!/usr/bin/env node
// @ts-check
const { HarmonyHub } = require("harmonyhub-api");

const host = process.argv.slice(2)[0];
const remoteId = process.argv.slice(2)[1];

if (!host || !remoteId) {
  console.log(`list-activities
List all activities for all devices connected to a Harmony Hub

Usage:
  $ list-activities host remoteId

Example:
  $ list-activities 192.168.1.10 22571993`);
} else {
  const hub = new HarmonyHub(host, remoteId);
  hub
    .connect()
    .then(() => {
      console.log("Connected to the hub");
      console.log("Getting devices…");
      return hub.getDevices();
    })
    .then(devicesRaw => {
      const devices = devicesRaw.map(({ label, id }) => ({ label, id }));
      devices.forEach(device => console.log(device));

      console.log("Getting commands…");
      const commands = Promise.all(
        devices.map(({ id }) => hub.getCommands(id))
      );
      return Promise.all([devices, commands]);
    })
    .then(([devices, commands]) => {
      // @ts-ignore
      devices.forEach((device, index) => {
        console.log(`Commands for ${device.label}`);
        console.log(commands[index]);
      });
      return Promise.resolve(null);
    })
    .then(() => {
      hub.disconnect();
    })
    .catch(() => {
      hub.disconnect();
    });
}
