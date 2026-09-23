import React, { useState } from 'react';
import { 
  VehicleDefinition, 
  PlayerStats, 
  Mission, 
  Landmark, 
  WeatherType, 
  GameSettings 
} from '../types/game';
import { GarageShowroom } from './GarageShowroom';
import { 
  X, 
  Map, 
  Car, 
  Sun, 
  Flag, 
  Settings as SettingsIcon, 
  Play, 
  Lock, 
  Check, 
  DollarSign, 
  Compass, 
  Volume2, 
  Palette, 
  Navigation, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Gauge
} from 'lucide-react';

interface PauseMenuProps {
  initialTab?: string;
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleDefinition[];
  currentVehicleId: string;
  playerStats: PlayerStats;
  missions: Mission[];
  landmarks: Landmark[];
  timeOfDay: number;
  weather: WeatherType;
  settings: GameSettings;
  playerPos: { x: number; z: number };
  customWaypoint: { x: number; z: number } | null;
  onSelectVehicle: (id: string) => void;
  onUnlockVehicle: (id: string) => void;
  onChangeVehicleColor: (vehicleId: string, colorHex: string) => void;
  onChangeTime: (hour: number) => void;
  onChangeWeather: (weather: WeatherType) => void;
  onStartMission: (missionId: string) => void;
  onSetCustomWaypoint: (pos: { x: number; z: number } | null) => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  initialTab = 'resume',
  isOpen,
  onClose,
  vehicles,
  currentVehicleId,
  playerStats,
  missions,
  landmarks,
  timeOfDay,
  weather,
  settings,
  playerPos,
  customWaypoint,
  onSelectVehicle,
  onUnlockVehicle,
  onChangeVehicleColor,
  onChangeTime,
  onChangeWeather,
  onStartMission,
  onSetCustomWaypoint,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedGarageVehicleId, setSelectedGarageVehicleId] = useState<string>(currentVehicleId);

  if (!isOpen) return null;

  const selectedVehicle = vehicles.find((v) => v.id === selectedGarageVehicleId) || vehicles[0];

  const paintColors = [
    { name: 'Crimson Red', hex: '#e11d48' },
    { name: 'Sapphire Blue', hex: '#0284c7' },
    { name: 'Matte Obsidian', hex: '#0f172a' },
    { name: 'Electric Cyan', hex: '#06b6d4' },
    { name: 'Emerald Green', hex: '#15803d' },
    { name: 'Sunset Orange', hex: '#ea580c' },
    { name: 'Iconic Gold', hex: '#eab308' },
    { name: 'Pure White', hex: '#f8fafc' },
    { name: 'Violet Pulse', hex: '#8b5cf6' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shadow-md">
              SM
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">SOLARIA METRO</h1>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Rep: {playerStats.reputation}</span>
                <span>·</span>
                <span className="text-emerald-400 font-mono font-bold">${playerStats.cash.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'resume', label: 'Resume', icon: Play },
              { id: 'map', label: 'City Map', icon: Map },
              { id: 'garage', label: 'Vehicle Garage', icon: Car },
              { id: 'environment', label: 'Atmosphere', icon: Sun },
              { id: 'missions', label: 'Missions', icon: Flag },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'resume') {
                      onClose();
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Tab Scroller */}
        <div className="flex md:hidden items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-900/40 overflow-x-auto">
          {[
            { id: 'map', label: 'Map', icon: Map },
            { id: 'garage', label: 'Garage', icon: Car },
            { id: 'environment', label: 'Atmosphere', icon: Sun },
            { id: 'missions', label: 'Missions', icon: Flag },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-sky-500 text-white' : 'text-slate-400 bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* TAB 1: CITY MAP & GPS */}
          {activeTab === 'map' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Interactive City Blueprint Map */}
              <div className="relative flex-1 min-h-[380px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden group">
                <img
                  src="/src/assets/images/solaria_city_map_1790142514103.jpg"
                  alt="Solaria Metro Tactical City Map"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = ((e.clientX - rect.left) / rect.width) * 400 - 200;
                    const clickZ = ((e.clientY - rect.top) / rect.height) * 400 - 200;
                    onSetCustomWaypoint({ x: clickX, z: clickZ });
                  }}
                />

                {/* Player Current Location Blip */}
                <div
                  className="absolute w-4 h-4 bg-sky-400 rounded-full border-2 border-white shadow-[0_0_10px_#38bdf8] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${((playerPos.x + 200) / 400) * 100}%`,
                    top: `${((playerPos.z + 200) / 400) * 100}%`,
                  }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-sky-500 text-white text-[9px] font-bold rounded shadow">
                    YOU
                  </div>
                </div>

                {/* Custom GPS Waypoint marker */}
                {customWaypoint && (
                  <div
                    className="absolute w-5 h-5 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_12px_#f43f5e] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none animate-bounce"
                    style={{
                      left: `${((customWaypoint.x + 200) / 400) * 100}%`,
                      top: `${((customWaypoint.z + 200) / 400) * 100}%`,
                    }}
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}

                {/* Landmarks Markers */}
                {landmarks.map((lm) => (
                  <div
                    key={lm.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      left: `${((lm.position.x + 200) / 400) * 100}%`,
                      top: `${((lm.position.z + 200) / 400) * 100}%`,
                    }}
                  >
                    <div className="w-3 h-3 bg-amber-400 rounded-full shadow border border-white" />
                  </div>
                ))}

                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-lg border border-slate-700 text-[11px] text-slate-300">
                  Click on map to set custom GPS Waypoint
                </div>
              </div>

              {/* Map Legend & Landmarks Panel */}
              <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Districts & Landmarks</h3>
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {landmarks.map((lm) => (
                      <div key={lm.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{lm.name}</div>
                          <div className="text-[11px] text-slate-400">{lm.district}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{lm.discovered ? 'Discovered' : 'Undiscovered'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {customWaypoint && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-rose-300">Active GPS Waypoint</div>
                      <div className="text-[11px] text-slate-400">Target beacon illuminated</div>
                    </div>
                    <button
                      onClick={() => onSetCustomWaypoint(null)}
                      className="px-2.5 py-1 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VEHICLE GARAGE */}
          {activeTab === 'garage' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-y-auto">
              {/* Vehicle Showcase Card with Interactive 3D Turntable */}
              <div className="relative flex-1 min-h-[480px] bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between p-5">
                {/* Vehicle Header */}
                <div className="relative z-10 flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs uppercase font-mono tracking-widest text-sky-400 font-bold">
                      {selectedVehicle.category}
                    </span>
                    <h2 className="text-2xl font-black text-white mt-0.5 tracking-tight">{selectedVehicle.name}</h2>
                    <p className="text-xs text-slate-300 max-w-md mt-1">{selectedVehicle.description}</p>
                  </div>

                  <div className="px-3.5 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-700 text-right shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Status</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono">
                      {selectedVehicle.unlocked ? 'OWNED' : `$${selectedVehicle.price.toLocaleString()}`}
                    </div>
                  </div>
                </div>

                {/* 3D Live Vehicle Turntable */}
                <div className="relative z-10 w-full h-64 md:h-72 my-1 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/50 shadow-inner">
                  <GarageShowroom vehicle={selectedVehicle} />
                </div>

                {/* Specs Meter Grid */}
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/70 backdrop-blur-md p-4 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-400">Top Speed</div>
                    <div className="text-lg font-bold font-mono text-white">{selectedVehicle.topSpeed} km/h</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-sky-400 h-full rounded-full" style={{ width: `${(selectedVehicle.topSpeed / 250) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Acceleration</div>
                    <div className="text-lg font-bold font-mono text-white">{selectedVehicle.acceleration}/100</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${selectedVehicle.acceleration}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Handling</div>
                    <div className="text-lg font-bold font-mono text-white">{selectedVehicle.handling}/100</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${selectedVehicle.handling}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Braking</div>
                    <div className="text-lg font-bold font-mono text-white">{selectedVehicle.braking}/100</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-rose-400 h-full rounded-full" style={{ width: `${selectedVehicle.braking}%` }} />
                    </div>
                  </div>
                </div>

                {/* Custom Body Paint Swatches */}
                <div className="relative z-10 flex flex-wrap items-center gap-2 mt-4 bg-slate-950/70 backdrop-blur-md p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-300 mr-2">
                    <Palette className="w-3.5 h-3.5 text-sky-400" /> Paint Finish:
                  </div>
                  {paintColors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => onChangeVehicleColor(selectedVehicle.id, color.hex)}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                        selectedVehicle.color === color.hex ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="relative z-10 flex items-center justify-end gap-3 mt-4">
                  {selectedVehicle.unlocked ? (
                    <button
                      onClick={() => {
                        onSelectVehicle(selectedVehicle.id);
                        onClose();
                      }}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-xs shadow-lg transition-all"
                    >
                      {currentVehicleId === selectedVehicle.id ? 'Currently Selected' : 'Deploy This Car'}
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnlockVehicle(selectedVehicle.id)}
                      disabled={playerStats.cash < selectedVehicle.price}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
                        playerStats.cash >= selectedVehicle.price
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>Unlock for ${selectedVehicle.price.toLocaleString()}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Vehicle Selection List */}
              <div className="w-full lg:w-72 flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Fleet Catalog</h3>
                {vehicles.map((v) => {
                  const isSelected = selectedGarageVehicleId === v.id;
                  const isCurrent = currentVehicleId === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedGarageVehicleId(v.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-sky-500 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white">{v.name}</div>
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-slate-600"
                          style={{ backgroundColor: v.color }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span className="capitalize">{v.category}</span>
                        {isCurrent && <span className="text-sky-400 font-bold">Active</span>}
                        {!v.unlocked && <span className="text-amber-400 font-mono">${v.price.toLocaleString()}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ATMOSPHERE & WEATHER */}
          {activeTab === 'environment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto py-4">
              {/* Time of Day Control */}
              <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" /> Time of Day
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Current: {Math.floor(timeOfDay)}:00</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.5"
                  value={timeOfDay}
                  onChange={(e) => onChangeTime(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />

                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { label: 'Sunrise', hour: 6.0 },
                    { label: 'Morning', hour: 9.5 },
                    { label: 'Noon', hour: 13.0 },
                    { label: 'Sunset', hour: 18.5 },
                    { label: 'Night', hour: 21.5 },
                    { label: 'Midnight', hour: 0.0 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onChangeTime(p.hour)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs font-medium text-slate-300 text-center transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather System Control */}
              <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" /> Weather Simulation
                </h3>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { id: 'sunny', label: 'Clear & Sunny' },
                    { id: 'cloudy', label: 'Overcast Clouds' },
                    { id: 'rain', label: 'Light Rain' },
                    { id: 'heavy_rain', label: 'Heavy Rain' },
                    { id: 'fog', label: 'Dense Fog' },
                    { id: 'storm', label: 'Thunderstorm' },
                  ].map((w) => {
                    const isCurrent = weather === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => onChangeWeather(w.id as WeatherType)}
                        className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                          isCurrent
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                            : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MISSIONS & OBJECTIVES */}
          {activeTab === 'missions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto py-2">
              {missions.map((m) => {
                const isCompleted = playerStats.completedMissions.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
                          {m.type.replace('_', ' ')}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                            COMPLETED
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{m.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-800/80">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        +${m.rewardCash.toLocaleString()} · {m.rewardRep} REP
                      </div>
                      <button
                        onClick={() => {
                          onStartMission(m.id);
                          onClose();
                        }}
                        className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Start Mission
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto py-4 flex flex-col gap-6">
              {/* Graphics Quality */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Graphics Preset</div>
                  <div className="text-[11px] text-slate-400">Geometry, textures & shadows</div>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {['high', 'medium', 'low'].map((g) => (
                    <button
                      key={g}
                      onClick={() => onUpdateSettings({ graphicsQuality: g as 'high' | 'medium' | 'low' })}
                      className={`px-3 py-1 text-xs capitalize rounded-md ${
                        settings.graphicsQuality === g ? 'bg-sky-500 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Space Ambient Occlusion (SSAO) */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    Screen Space Ambient Occlusion (SSAO)
                  </div>
                  <div className="text-[11px] text-slate-400">Deep corner contact crevices & tree canopy depth shading</div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ssao: settings.ssao === false ? true : false })}
                  className={`px-3 py-1.5 text-xs rounded-lg font-bold tracking-wider transition-all ${
                    settings.ssao !== false
                      ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20'
                      : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400'
                  }`}
                >
                  {settings.ssao !== false ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Shadow Map Resolution */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Shadow Map Resolution</div>
                  <div className="text-[11px] text-slate-400">Higher resolution shadow maps for razor sharp building & canopy shadows</div>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(['4096', '2048'] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => onUpdateSettings({ shadowResolution: res })}
                      className={`px-3 py-1 text-xs rounded-md font-bold ${
                        (settings.shadowResolution || '4096') === res ? 'bg-sky-500 text-white shadow' : 'text-slate-400'
                      }`}
                    >
                      {res === '4096' ? '4096 (Ultra 4K)' : '2048 (High)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speedometer Unit */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Speedometer Units</div>
                  <div className="text-[11px] text-slate-400">Toggle KM/H or MPH</div>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(['kmh', 'mph'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => onUpdateSettings({ speedUnit: unit })}
                      className={`px-3 py-1 text-xs uppercase rounded-md ${
                        settings.speedUnit === unit ? 'bg-sky-500 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radio Station Select */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Radio Station</div>
                  <div className="text-[11px] text-slate-400">Procedural in-game broadcast</div>
                </div>
                <select
                  value={settings.radioStation}
                  onChange={(e) => onUpdateSettings({ radioStation: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
                >
                  <option value="pulse_synthwave">Pulse Synthwave</option>
                  <option value="metro_beats">Metro Beats</option>
                  <option value="coastal_chill">Coastal Chill</option>
                  <option value="off">Radio Off</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
