import React from 'react';
import { PlayerStats, Mission, WeatherType, InteractiveShop } from '../types/game';
import { VehicleInstance } from '../game/VehicleSystem';
import { 
  Gauge, 
  Flame, 
  Heart, 
  DollarSign, 
  Compass, 
  CloudRain, 
  Sun, 
  Cloud, 
  CloudLightning, 
  Eye, 
  Sliders, 
  MapPin, 
  Radio, 
  Zap, 
  Wrench,
  Navigation,
  Car,
  User
} from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  vehicle: VehicleInstance | null;
  onFoot: boolean;
  canEnterVehicle: VehicleInstance | null;
  nearShop: InteractiveShop | null;
  activeMission: Mission | null;
  missionTimer: number;
  driftScore: number;
  timeOfDay: number;
  weather: WeatherType;
  radioStation: string;
  speedUnit: 'kmh' | 'mph';
  onOpenPause: (tab?: string) => void;
  onOpenShop: (shop: InteractiveShop) => void;
  onToggleRadio: () => void;
  onToggleCamera: () => void;
  onInteract: () => void;
  playerPos: { x: number; z: number };
  playerHeading: number;
  policeCars: { x: number; z: number }[];
  shops: InteractiveShop[];
  customWaypoint: { x: number; z: number } | null;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  vehicle,
  onFoot,
  canEnterVehicle,
  nearShop,
  activeMission,
  missionTimer,
  driftScore,
  timeOfDay,
  weather,
  radioStation,
  speedUnit,
  onOpenPause,
  onOpenShop,
  onToggleRadio,
  onToggleCamera,
  onInteract,
  playerPos,
  playerHeading,
  policeCars,
  shops,
  customWaypoint,
}) => {
  // Speed calculation
  const rawSpeedKmh = vehicle ? Math.abs(vehicle.speedKmh) : 0;
  const displaySpeed = Math.round(speedUnit === 'mph' ? rawSpeedKmh * 0.621371 : rawSpeedKmh);
  const maxSpeed = vehicle ? (speedUnit === 'mph' ? vehicle.def.topSpeed * 0.621371 : vehicle.def.topSpeed) : 100;
  const speedRatio = Math.min(1.0, displaySpeed / maxSpeed);

  // Time format
  const hours = Math.floor(timeOfDay);
  const minutes = Math.floor((timeOfDay % 1) * 60);
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Weather icon
  const getWeatherIcon = () => {
    switch (weather) {
      case 'rain':
      case 'heavy_rain':
        return <CloudRain className="w-4 h-4 text-sky-400" />;
      case 'storm':
        return <CloudLightning className="w-4 h-4 text-amber-400" />;
      case 'fog':
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-slate-300" />;
      default:
        return <Sun className="w-4 h-4 text-amber-400" />;
    }
  };

  // Dynamic rotating minimap canvas setup
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Save initial state
    ctx.save();

    // Create circular clip path for the radar
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#020617'; // Tech dark navy fill
    ctx.fill();
    ctx.strokeStyle = '#38bdf8'; // Sky blue border
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip(); // Restrict drawing to radar boundaries

    // Draw techy concentric scanner rings
    ctx.strokeStyle = 'rgba(56,189,248,0.08)';
    ctx.lineWidth = 1;
    [30, 60, 90].forEach(radius => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw scanning sweep
    const sweepAngle = (Date.now() / 900) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * cx, cy + Math.sin(sweepAngle) * cy);
    ctx.strokeStyle = 'rgba(16,185,129,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // -------------------------------------------------------------
    // ROTATING CITY GRID LAYER
    // -------------------------------------------------------------
    ctx.save();
    ctx.translate(cx, cy);
    // Rotate counter-clockwise by playerHeading so that UP on screen represents player's FORWARD
    ctx.rotate(-playerHeading);

    const zoom = 1.7; // Map zoom multiplier

    // Draw Waterfront Promenade (ocean blue fill at west boundary)
    ctx.fillStyle = 'rgba(14,165,233,0.1)';
    ctx.fillRect((-400 - playerPos.x) * zoom, (-400 - playerPos.z) * zoom, 230 * zoom, 800 * zoom);

    // Main city street grid coordinates
    const streets = [-137, -77, -17, 43, 103, 157];

    // Draw under-asphalt block roads
    ctx.strokeStyle = '#1e293b'; // dark slate asphalt
    ctx.lineWidth = 12 * zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. NS streets
    streets.forEach(sx => {
      ctx.beginPath();
      ctx.moveTo((sx - playerPos.x) * zoom, (-250 - playerPos.z) * zoom);
      ctx.lineTo((sx - playerPos.x) * zoom, 250 * zoom);
      ctx.stroke();
    });

    // 2. EW streets
    streets.forEach(sz => {
      ctx.beginPath();
      ctx.moveTo((-250 - playerPos.x) * zoom, (sz - playerPos.z) * zoom);
      ctx.lineTo(250 * zoom, (sz - playerPos.z) * zoom);
      ctx.stroke();
    });

    // Draw clean inner lane lines
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2 * zoom;
    streets.forEach(sx => {
      ctx.beginPath();
      ctx.moveTo((sx - playerPos.x) * zoom, (-250 - playerPos.z) * zoom);
      ctx.lineTo((sx - playerPos.x) * zoom, 250 * zoom);
      ctx.stroke();
    });
    streets.forEach(sz => {
      ctx.beginPath();
      ctx.moveTo((-250 - playerPos.x) * zoom, (sz - playerPos.z) * zoom);
      ctx.lineTo(250 * zoom, (sz - playerPos.z) * zoom);
      ctx.stroke();
    });

    // -------------------------------------------------------------
    // ACTIVE MISSION ROUTE (Amber navigation line)
    // -------------------------------------------------------------
    if (activeMission) {
      const activeCheckpoint = activeMission.checkpoints[activeMission.currentCheckpointIndex];
      if (activeCheckpoint) {
        const cX = (activeCheckpoint.x - playerPos.x) * zoom;
        const cY = (activeCheckpoint.z - playerPos.z) * zoom;

        // Orange path route trace
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4 * zoom;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0); // start at player center
        ctx.lineTo(cX, cY);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Checkpoint target ring blip
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cX, cY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // -------------------------------------------------------------
    // CUSTOM WAYPOINT GPS ROUTE (Glow cyan line)
    // -------------------------------------------------------------
    if (customWaypoint) {
      const wX = (customWaypoint.x - playerPos.x) * zoom;
      const wY = (customWaypoint.z - playerPos.z) * zoom;

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3.5 * zoom;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wX, wY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw blue GPS pin blip
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(wX, wY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // -------------------------------------------------------------
    // INTERACTIVE LANDMARKS/SHOPS MAP BLIPS
    // -------------------------------------------------------------
    shops.forEach(sh => {
      const sX = (sh.position.x - playerPos.x) * zoom;
      const sY = (sh.position.z - playerPos.z) * zoom;

      let color = '#3b82f6';
      let symbol = 'D';
      if (sh.category === 'gas_station') {
        color = '#0ea5e9'; // gas: sky-blue
        symbol = '⛽';
      } else if (sh.category === 'tuning') {
        color = '#ea580c'; // custom workshop: orange
        symbol = '🔧';
      } else if (sh.category === 'dealership') {
        color = '#8b5cf6'; // car dealer: violet
        symbol = '🚗';
      } else if (sh.category === 'diner') {
        color = '#10b981'; // diner: green
        symbol = '🍔';
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sX, sY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Blip Text
      ctx.fillStyle = '#ffffff';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, sX, sY);
    });

    // -------------------------------------------------------------
    // CHASING POLICE DYNAMIC RED-BLUE FLASHING BLIPS
    // -------------------------------------------------------------
    if (stats.wantedLevel > 0) {
      policeCars.forEach((cop, idx) => {
        const cX = (cop.x - playerPos.x) * zoom;
        const cY = (cop.z - playerPos.z) * zoom;

        const flashColor = (Date.now() + idx * 220) % 440 < 220 ? '#ef4444' : '#3b82f6';
        ctx.fillStyle = flashColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cX, cY, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }

    ctx.restore(); // Restore translations
    ctx.restore(); // Restore circle clipping

    // -------------------------------------------------------------
    // PLAYER ARROW CENTER BLIP (Always locked in center!)
    // -------------------------------------------------------------
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -6.5);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 1.5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Draw static cardinal points overlay
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, 11);
    ctx.fillText('S', cx, height - 10);
    ctx.fillText('W', 11, cy);
    ctx.fillText('E', width - 11, cy);

  }, [playerPos, playerHeading, activeMission, policeCars, shops, customWaypoint, stats.wantedLevel]);

  // Gear indicator
  let gear = 'N';
  if (vehicle) {
    if (vehicle.speedKmh < -1) gear = 'R';
    else if (vehicle.speedKmh > 1) {
      const g = Math.min(6, Math.floor((rawSpeedKmh / vehicle.def.topSpeed) * 5) + 1);
      gear = g.toString();
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden font-sans">
      {/* Top Header Row */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Player Profile & Resources */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
              SM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200 tracking-wide">SOLARIA METRO</span>
                <span className="text-[10px] text-amber-400 font-mono">REP {stats.reputation}</span>
              </div>
              <div className="flex items-center gap-3 text-xs mt-0.5">
                <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{stats.cash.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{stats.collectiblesFound}/{stats.totalCollectibles} Tokens</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health & Vehicle Integrity Bars */}
          <div className="flex flex-col gap-1 w-48 px-3 py-2 bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Health
              </span>
              <span className="font-mono text-xs">{stats.health}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.health}%` }}
              />
            </div>

            {!onFoot && vehicle && (
              <>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
                  <span className="flex items-center gap-1">
                    <Car className="w-3 h-3 text-sky-400" /> Integrity
                  </span>
                  <span className="font-mono text-xs">{Math.round(vehicle.health)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${vehicle.health}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center: Environment & Quick Action Header */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg text-xs text-slate-200 shadow-md">
            {getWeatherIcon()}
            <span className="capitalize font-medium">{weather.replace('_', ' ')}</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono">{timeString}</span>
          </div>

          <button
            onClick={onToggleRadio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              radioStation !== 'off'
                ? 'bg-indigo-600/80 border-indigo-400 text-white shadow-md'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Radio"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline capitalize">
              {radioStation === 'off' ? 'Radio Off' : radioStation.replace('_', ' ')}
            </span>
          </button>

          <button
            onClick={onToggleCamera}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Change Camera View [C]"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={onInteract}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-md ${
              onFoot
                ? 'bg-sky-600 hover:bg-sky-500 border-sky-400 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white'
            }`}
            title="Toggle Driving / Walk On Foot (Human) [F]"
          >
            {onFoot ? (
              <>
                <Car className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Drive Car</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Walk (Human)</span>
              </>
            )}
            <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 bg-black/30 rounded">F</kbd>
          </button>

          <button
            onClick={() => onOpenPause()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:bg-slate-800 transition-colors shadow-md"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-medium">Menu</span>
            <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 bg-slate-800 border border-slate-600 rounded text-slate-400">ESC</kbd>
          </button>
        </div>

        {/* Right: Circular Radar Minimap */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div
            onClick={() => onOpenPause('map')}
            className="relative w-36 h-36 md:w-44 md:h-44 rounded-full border-2 border-sky-500/40 bg-slate-950/85 backdrop-blur-md shadow-2xl overflow-hidden cursor-pointer hover:border-sky-400 transition-colors flex items-center justify-center"
            title="Click to expand Full City Map"
          >
            <canvas
              ref={canvasRef}
              width={176}
              height={176}
              className="w-full h-full rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Middle: Interactive Prompts & Mission Tracker */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        {/* Enter Vehicle Prompt */}
        {onFoot && canEnterVehicle && (
          <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-sky-500/50 rounded-xl shadow-2xl text-slate-100 animate-bounce">
            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-sky-500 text-white rounded">F</kbd>
            <span className="text-sm font-medium">
              Drive <strong className="text-sky-400">{canEnterVehicle.def.name}</strong>
            </span>
            <button
              onClick={onInteract}
              className="ml-2 px-3 py-1 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors md:hidden"
            >
              Enter
            </button>
          </div>
        )}

        {/* Enter Shop / Service Prompt */}
        {nearShop && (
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md border border-amber-500/60 rounded-xl shadow-2xl text-slate-100 mt-2">
            <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-300">{nearShop.name}</div>
              <div className="text-[11px] text-slate-300">{nearShop.prompt}</div>
            </div>
            <button
              onClick={() => onOpenShop(nearShop)}
              className="px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors"
            >
              Interact
            </button>
          </div>
        )}

        {/* Active Mission HUD Card */}
        {activeMission && (
          <div className="mt-4 px-4 py-2.5 bg-slate-950/80 backdrop-blur-md border border-sky-500/40 rounded-xl shadow-xl flex items-center gap-4 text-slate-200">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Navigation className="w-4 h-4" />
              <span>{activeMission.title}</span>
            </div>

            {activeMission.timeLimit && (
              <div className="font-mono text-sm font-bold text-rose-400">
                {Math.max(0, Math.ceil(missionTimer))}s
              </div>
            )}

            {activeMission.type === 'drift' && (
              <div className="font-mono text-xs text-sky-300">
                Drift: {Math.round(driftScore)} / {activeMission.targetScore} pts
              </div>
            )}

            <div className="text-xs text-slate-400">
              Checkpoint: {activeMission.currentCheckpointIndex + 1}/{activeMission.checkpoints.length}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Speedometer, Gear, Nitro & Controls */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Controls Helper Tip */}
        <div className="hidden lg:flex flex-col gap-1 p-3 bg-slate-950/70 backdrop-blur-md border border-slate-800/80 rounded-xl text-[11px] text-slate-400 max-w-xs shadow-lg">
          <div className="font-semibold text-slate-200 mb-0.5">Controls Guide</div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300">W A S D / ↑←↓→</kbd>
            <span>Drive / Move</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300">SPACE</kbd>
            <span>Handbrake Drift / Jump</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300">SHIFT</kbd>
            <span>Nitro Boost / Sprint</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300">F</kbd>
            <span>Enter / Exit Vehicle</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300">H</kbd>
            <span>Horn</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300 ml-2">C</kbd>
            <span>Camera</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300 ml-2">R</kbd>
            <span>Reset Car</span>
          </div>
        </div>

        {/* Center / Right: Speedometer & Vehicle Telemetry */}
        {!onFoot && vehicle && (
          <div className="flex items-end gap-4 ml-auto">
            {/* Nitro Gauge */}
            <div className="flex flex-col items-center gap-1.5 px-3 py-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
              <Flame className={`w-4 h-4 ${vehicle.nitroFuel > 20 ? 'text-cyan-400' : 'text-slate-600'}`} />
              <div className="w-3 h-20 bg-slate-900 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-slate-700">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500 to-sky-300 rounded-full transition-all duration-150"
                  style={{ height: `${vehicle.nitroFuel}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400">NITRO</span>
            </div>

            {/* Speed Dial & Digital Readout */}
            <div className="relative flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md border-2 border-slate-800 rounded-2xl shadow-2xl min-w-[170px]">
              {/* Gear Badge */}
              <div className="absolute top-2.5 left-3 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono font-bold text-xs text-amber-400">
                GEAR {gear}
              </div>

              {/* Digital Speed */}
              <div className="text-center mt-2">
                <div className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                  {displaySpeed}
                </div>
                <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                  {speedUnit.toUpperCase()}
                </div>
              </div>

              {/* Speed Bar Meter */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    speedRatio > 0.8
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-sky-400 to-indigo-500'
                  }`}
                  style={{ width: `${Math.round(speedRatio * 100)}%` }}
                />
              </div>

              {/* Vehicle Name */}
              <div className="text-[10px] font-medium text-slate-400 mt-2 truncate max-w-[140px]">
                {vehicle.def.name}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
