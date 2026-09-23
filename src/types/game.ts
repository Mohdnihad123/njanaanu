export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'heavy_rain' | 'fog' | 'storm';

export type TimeOfDayPreset = 'sunrise' | 'morning' | 'afternoon' | 'sunset' | 'night' | 'late_night';

export interface VehicleDefinition {
  id: string;
  name: string;
  category: 'supercar' | 'sedan' | 'suv' | 'truck' | 'motorcycle' | 'taxi';
  description: string;
  topSpeed: number; // km/h
  acceleration: number; // 0-100 factor
  braking: number;
  handling: number; // turning responsiveness
  driftFactor: number;
  weight: number;
  price: number;
  unlocked: boolean;
  color: string;
  accentColor: string;
  soundPitch: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  cash: number;
  stamina: number;
  reputation: number;
  collectiblesFound: number;
  totalCollectibles: number;
  completedMissions: string[];
  wantedLevel: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'courier' | 'speed_trap' | 'drift' | 'escort' | 'stunt' | 'tour';
  rewardCash: number;
  rewardRep: number;
  timeLimit?: number; // seconds
  targetScore?: number;
  targetSpeed?: number; // km/h
  checkpoints: { x: number; z: number; name: string }[];
  currentCheckpointIndex: number;
  isActive: boolean;
  isCompleted: boolean;
}

export interface Landmark {
  id: string;
  name: string;
  district: string;
  description: string;
  position: { x: number; y: number; z: number };
  discovered: boolean;
}

export interface InteractiveShop {
  id: string;
  name: string;
  category: 'tuning' | 'diner' | 'gas_station' | 'dealership' | 'observation';
  district: string;
  prompt: string;
  position: { x: number; y: number; z: number };
}

export interface GameSettings {
  graphicsQuality: 'high' | 'medium' | 'low';
  shadows: boolean;
  ssao: boolean;
  shadowResolution: '4096' | '2048';
  trafficDensity: 'high' | 'medium' | 'low' | 'off';
  viewDistance: number;
  soundVolume: number;
  musicVolume: number;
  radioStation: 'pulse_synthwave' | 'metro_beats' | 'coastal_chill' | 'off';
  cameraView: 'third_person_close' | 'third_person_far' | 'first_person_hood';
  speedUnit: 'kmh' | 'mph';
  timeSpeed: number; // multiplier
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  nitro: boolean;
  horn: boolean;
  interact: boolean;
  headlights: boolean;
  resetCar: boolean;
  sprint: boolean;
  jump: boolean;
  cameraToggle: boolean;
}
