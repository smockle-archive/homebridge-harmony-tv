#!/usr/bin/env node

import { Hub, getHub } from "../lib/hub";
const { getRemoteId, getDevices } = Hub;

const host: string | undefined = process.argv.slice(2)[0];
const remoteId: string | undefined = process.argv.slice(2)[1];
const deviceId: string | undefined = process.argv.slice(2)[2];

// Print help and exit
if (!host && !deviceId) {
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

// Print remote identifier and exit
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
      devices.forEach((device) => console.log(device));
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
      const hub = getHub(host, remoteId, deviceId);
      const commands = await hub.getCommands();
      commands
        .reduce((commands, command) => {
          if (!command.action || !command.label) {
            return commands;
          }
          const action =
            typeof command.action !== "string"
              ? JSON.stringify(command.action)
              : command.action;
          const name =
            typeof command.action === "string"
              ? command.label.replace(" ", "")
              : command.action.command;
          return commands.concat([{ action, name, label: command.label }]);
        }, [] as { action: string; name: string; label: string }[])
        .forEach((command: { action: string; name: string; label: string }) =>
          console.log(command)
        );
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
}
