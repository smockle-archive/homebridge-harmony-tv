# Homebridge Harmony TV

[![npm](https://img.shields.io/npm/v/homebridge-harmony-tv-smockle.svg)](https://www.npmjs.com/package/homebridge-harmony-tv-smockle)
[![Build Status](https://travis-ci.com/smockle/homebridge-harmony-tv.svg?branch=master)](https://travis-ci.com/smockle/homebridge-harmony-tv)
[![Known Vulnerabilities](https://snyk.io/test/github/smockle/homebridge-harmony-tv/badge.svg?targetFile=package.json)](https://snyk.io/test/github/smockle/homebridge-harmony-tv?targetFile=package.json)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=smockle/homebridge-harmony-tv)](https://dependabot.com)

Creates a HomeKit TV accessory for a Logitech Harmony-controlled TV.

# Use Case

The target use case of this plugin is “control a non-smart TV in HomeKit via a Harmony Hub”, not “use HomeKit as an interface for all Harmony features”. If you’d like Harmony Activites to show up as inputs in HomeKit, check out the [`homebridge-harmony` plugin](https://github.com/nicoduj/homebridge-harmony).

# Installation

Review the [Installation](https://github.com/nfarina/homebridge#installation) section of the Homebridge README.

```Bash
npm install -g homebridge-harmony-tv-smockle
```

# Setup

1. Find the static IP address of your Harmony Hub. In the plugin [configuration](#Configuration), this is the `"host"` value.

2. Run `node "$(npm root -g)/homebridge-harmony-tv-smockle/scripts/hubinfo.js" $HOST` to find the unique identifier of the Harmony Hub-connected TV you want to control. In the plugin [configuration](#Configuration), this is the `"deviceId"` value.

3. Run `node "$(npm root -g)/homebridge-harmony-tv-smockle/scripts/hubinfo.js" $HOST $DEVICE_ID` to find the list of commands supported by your Harmony Hub-connected TV. In the plugin [configuration](#Configuration), this is the `"commands"` value.

# Configuration

```JSON
{
  "bridge": {
    "name": "TV Bridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "description": "SmartHome with Homebridge",
  "accessories": [{
    "accessory": "HarmonyTV",
    "name": "Living Room TV",
    "host": "192.168.1.10",
    "deviceId": "72306838",
    "commands": [{
      "action": "{\"command\":\"PowerToggle\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "PowerToggle",
      "label": "Power Toggle"
    }, {
      "action": "{\"command\":\"VolumeDown\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "VolumeDown",
      "label": "Volume Down"
    }, {
      "action": "{\"command\":\"VolumeUp\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "VolumeUp",
      "label": "Volume Up"
    }, {
      "action": "{\"command\":\"DirectionDown\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "DirectionDown",
      "label": "Direction Down"
    }, {
      "action": "{\"command\":\"DirectionLeft\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "DirectionLeft",
      "label": "Direction Left"
    }, {
      "action": "{\"command\":\"DirectionRight\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "DirectionRight",
      "label": "Direction Right"
    }, {
      "action": "{\"command\":\"DirectionUp\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "DirectionUp",
      "label": "Direction Up"
    }, {
      "action": "{\"command\":\"Select\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "Select",
      "label": "Select"
    }, {
      "action": "{\"command\":\"Menu\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "Menu",
      "label": "Menu"
    }, {
      "action": "{\"command\":\"InputHdmi1\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "InputHdmi1",
      "label": "InputHdmi1"
    }, {
      "action": "{\"command\":\"InputHdmi2\",\"type\":\"IRCommand\",\"deviceId\":\"72306838\"}",
      "name": "InputHdmi2",
      "label": "InputHdmi2"
    }]
  }]
}
```

**Notes:**

- `"accessory"` must be `"HarmonyTV"`
- `"name"` values must be unique

# Useful Links

- [Harmony HTTP](https://github.com/smockle/harmony-http)
- [Node.JS HAP TV Accessory Docs](https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes-Television.js)
- [Node.JS HAP TV Accessory Example](https://github.com/KhaosT/HAP-NodeJS/blob/master/accessories/TV_accessory.js)
- [WIP Homebridge plug-in for Sony TVs](https://github.com/arnif/homebridge-sony-television)
