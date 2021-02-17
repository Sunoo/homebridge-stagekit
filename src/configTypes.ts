import { PlatformIdentifier, PlatformName } from 'homebridge';

export type StageKitPlatformConfig = {
  platform: PlatformName | PlatformIdentifier;
  name?: string;
  fog_pulse_seconds?: number;
  party_mode_seconds?: number;
  random_leds?: boolean;
};