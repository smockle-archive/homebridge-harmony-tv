#!/usr/bin/env node
// @ts-check
const { getRemoteId, getDevices, getCommands } = require("../lib/hubinfo");

const host = process.argv.slice(2)[0];
const remoteId = process.argv.slice(2)[1];
const deviceId = process.argv.slice(2)[2];

// Print help and exit
if (!host && !remoteId && !deviceId) {
  console.log(`hubinfo
  Lists unique identifier for a Harmony Hub, connected devices and supported commands
  
  Usage:
    $ hubinfo host [remoteId] [deviceId]
  
  Examples:
    $ hubinfo 192.168.1.10
    $ hubinfo 192.168.1.10 22571993
    $ hubinfo 192.168.1.10 22571993 72306838`);
  process.exit(0);
}

// Print remoteId and exit
if (host && !remoteId && !deviceId) {
  (async () => {
    try {
      const remoteId = await getRemoteId(host);
      console.log(remoteId);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
}

// Print device list and exit
if (host && remoteId && !deviceId) {
  (async () => {
    try {
      const devices = await getDevices(host, remoteId);
      devices.forEach(device => console.log(device));
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
}

// Print commands for given device and exit
if (host && remoteId && deviceId) {
  (async () => {
    try {
      const commands = await getCommands(host, remoteId, deviceId);
      commands.forEach(command => console.log(command));
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
}
