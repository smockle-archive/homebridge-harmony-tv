#!/usr/bin/env node
// @ts-check
const { getDevices, getCommands } = require("../lib/hubinfo");

const host = process.argv.slice(2)[0];
const deviceId = process.argv.slice(2)[1];

// Print help and exit
if (!host && !deviceId) {
  console.log(`hubinfo
  Lists unique identifier for a Harmony Hub, connected devices and supported commands
  
  Usage:
    $ hubinfo host [deviceId]
  
  Examples:
    $ hubinfo 192.168.1.10
    $ hubinfo 192.168.1.10 72306838`);
  process.exit(0);
}

// Print device list and exit
if (host && !deviceId) {
  (async () => {
    try {
      const devices = await getDevices(host);
      devices.forEach(device => console.log(device));
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
}

// Print commands for given device and exit
if (host && deviceId) {
  (async () => {
    try {
      const commands = await getCommands(host, deviceId);
      commands
        .reduce((commands, command) => {
          if (!command.action || !command.label) {
            return commands;
          }
          const action =
            typeof command.action !== "string"
              ? JSON.stringify(command.action)
              : command.action;
          const name = !command.action.command
            ? command.label.replace(" ", "")
            : command.action.command;
          return commands.concat([{ action, name, label: command.label }]);
        }, [])
        .forEach(command => console.log(command));
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
}
