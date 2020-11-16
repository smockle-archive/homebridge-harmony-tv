# Homebridge Harmony TV

[![npm](https://img.shields.io/npm/v/homebridge-harmony-tv-smockle.svg)](https://www.npmjs.com/package/homebridge-harmony-tv-smockle)
[![Publish Workflow](https://github.com/smockle/homebridge-harmony-tv/workflows/Publish/badge.svg)](https://github.com/smockle/homebridge-harmony-tv/actions)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=smockle/homebridge-harmony-tv)](https://dependabot.com)

Creates a HomeKit TV accessory for a Logitech Harmony-controlled TV.

# Update 2019-09-12

**I don’t use a Logitech Harmony Hub anymore, and I’m unlikely to undertake any new development on this plugin in the near future.** For now, new patch versions will continue to be published automatically when this plugin’s depedencies are updated. Please open an issue if you are interested in maintaining this plugin.

# Use Case

The target use case of this plugin is “control a non-smart TV in HomeKit via a Harmony Hub”, not “use HomeKit as an interface for all Harmony features”. If you’d like Harmony Activites to show up as inputs in HomeKit, check out the [`homebridge-harmony` plugin](https://github.com/nicoduj/homebridge-harmony).

# Installation

Review the [Installation](https://github.com/nfarina/homebridge#installation) section of the Homebridge README.

```Bash
npm install --global homebridge-harmony-tv-smockle
```

# Setup

1. Find the static IP address of your Harmony Hub. In the plugin [configuration](#Configuration), this is the `"host"` value.

2. Run `npx homebridge-harmony-tv-smockle@6.x $HOST`, if you don’t include globally-installed packages in `$PATH`) to find the unique identifier of your Harmony Hub. In the plugin [configuration](#Configuration), this is the `"remoteId"` value.

3. Run `npx homebridge-harmony-tv-smockle@6.x $HOST $REMOTE_ID`, if you don’t include globally-installed packages in `$PATH`) to find the unique identifier of the Harmony Hub-connected TV you want to control. In the plugin [configuration](#Configuration), this is the `"deviceId"` value.

# Configuration

```JSON
{
  "bridge": {
    "name": "Homebridge Harmony TV",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "description": "Homebridge Harmony TV",
  "accessories": [],
  "platforms": [{
    "platform": "HarmonyTV",
    "name": "Living Room TV",
    "host": "192.168.1.10",
    "remoteId": "22571993",
    "deviceId": "72306838"
  }]
}
```

**Notes:**

- `"platform"` must be `"HarmonyTV"`
- `"name"` values must be unique

# Useful Links

- [Homebridge Developer Documentation for Television Service](https://developers.homebridge.io/#/service/Television)
- [Homebridge Example Independent Platform Plugin](https://github.com/homebridge/homebridge-examples/blob/master/independent-platform-example-typescript/src/independent-platform.ts)
- [Node.JS HAP TV Accessory Docs](https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes-Television.js)
- [Node.JS HAP TV Accessory Example](https://github.com/KhaosT/HAP-NodeJS/blob/master/accessories/TV_accessory.js)
