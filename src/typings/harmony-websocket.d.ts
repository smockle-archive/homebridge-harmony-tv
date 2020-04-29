declare module "harmony-websocket" {
  import { EventEmitter } from "events";
  export default class Harmony extends EventEmitter {
    connect(ip: string): Promise<unknown>;
    isOpened(): boolean;
    close(): boolean;
    _getRemoteId(): Promise<unknown>;
    _connect(): Promise<unknown>;
    _heartbeat(): void;
    _onMessage(message: string): void;
    getCapabilities(): Promise<unknown>;
    getConfig(): Promise<unknown>;
    getAutomationConfig(): Promise<unknown>;
    getActivities(): Promise<{ id: string; label: string }>;
    getCurrentActivity(): Promise<unknown>;
    startActivity(activityId: string): Promise<unknown>;
    getActivityCommands(
      activityId: string
    ): Promise<{ action: unknown; label: string }>;
    getDevices(): Promise<{ id: string; label: string }[]>;
    getDeviceCommands(
      deviceId: string
    ): Promise<{ action: { command: string }; label: string }[]>;
    getAutomationCommands(): Promise<unknown>;
    sendCommandWithDelay(
      action: string,
      hold: number
    ): Promise<{ cmd: string; code: number; id: string; msg: string }>;
    sendCommand(action: string): Promise<unknown>;
    sendAutomationCommand(action: string): Promise<unknown>;
  }
}
