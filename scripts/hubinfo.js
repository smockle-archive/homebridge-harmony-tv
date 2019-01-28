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
if (!remoteId && !deviceId) {
  getRemoteId(host)
    .then(remoteId => console.log(remoteId))
    .catch(error => console.error(error));
  process.exit(0);
}

// Print device list and exit
if (!deviceId) {
  getDevices(host, remoteId)
    .then(remoteId => console.log(remoteId))
    .catch(error => console.error(error));
  process.exit(0);
}

// Print commands for given device and exit
else {
  getCommands(host, remoteId, deviceId)
    .then(remoteId => console.log(remoteId))
    .catch(error => console.error(error));
  process.exit(0);
}
