import React from 'react';
import { InteractiveShop, PlayerStats, VehicleDefinition } from '../types/game';
import { X, Wrench, Coffee, Fuel, Building2, Car, Sparkles, Check, DollarSign } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface ShopModalProps {
  shop: InteractiveShop | null;
  onClose: () => void;
  playerStats: PlayerStats;
  currentVehicle: VehicleDefinition;
  onStatsUpdate: (stats: PlayerStats) => void;
  onRepairVehicle: () => void;
  onUpgradeSpeed: () => void;
  onWashVehicle: () => void;
  onNotify: (title: string, msg: string) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  shop,
  onClose,
  playerStats,
  currentVehicle,
  onStatsUpdate,
  onRepairVehicle,
  onUpgradeSpeed,
  onWashVehicle,
  onNotify,
}) => {
  if (!shop) return null;

  const handleBuyCoffee = () => {
    if (playerStats.cash < 45) {
      onNotify('Not enough cash', 'You need $45 for cold brew.');
      return;
    }
    playerStats.cash -= 45;
    playerStats.health = 100;
    playerStats.stamina = 100;
    onStatsUpdate({ ...playerStats });
    soundEngine.playCashSound();
    onNotify('Energized!', 'Health and stamina restored to 100%!');
  };

  const handleRepairCar = () => {
    if (playerStats.cash < 150) {
      onNotify('Not enough cash', 'Full repair costs $150.');
      return;
    }
    playerStats.cash -= 150;
    onRepairVehicle();
    onStatsUpdate({ ...playerStats });
    soundEngine.playCashSound();
    onNotify('Vehicle Repaired!', 'Bodywork restored and full tank filled!');
  };

  const handleWashCar = () => {
    if (playerStats.cash < 50) {
      onNotify('Not enough cash', 'Car wash costs $50.');
      return;
    }
    playerStats.cash -= 50;
    onWashVehicle();
    onStatsUpdate({ ...playerStats });
    soundEngine.playCashSound();
    onNotify('Premium Car Wash & Detail!', 'Washed away all dust and mud! Paint is sparkling clean!');
  };

  const handleUpgradeEngine = () => {
    const cost = 2500;
    if (playerStats.cash < cost) {
      onNotify('Not enough cash', `Stage 1 ECU Flash costs $${cost}.`);
      return;
    }
    playerStats.cash -= cost;
    onUpgradeSpeed();
    onStatsUpdate({ ...playerStats });
    soundEngine.playCashSound();
    onNotify('Performance Tuned!', '+15 km/h Top Speed and heightened throttle response!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans">
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {shop.category === 'tuning' && <Wrench className="w-5 h-5" />}
              {shop.category === 'diner' && <Coffee className="w-5 h-5" />}
              {shop.category === 'gas_station' && <Fuel className="w-5 h-5" />}
              {shop.category === 'dealership' && <Car className="w-5 h-5" />}
              {shop.category === 'observation' && <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                {shop.district}
              </span>
              <h2 className="text-lg font-bold text-white">{shop.name}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on shop type */}
        <div className="flex flex-col gap-3">
          {shop.category === 'diner' && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Gourmet Burger & Nitro Brew</div>
                <div className="text-xs text-slate-400">Instantly replenishes player health & stamina</div>
              </div>
              <button
                onClick={handleBuyCoffee}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow"
              >
                <span>Buy $45</span>
              </button>
            </div>
          )}

          {shop.category === 'gas_station' && (
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Express Body Repair & Refuel</div>
                  <div className="text-xs text-slate-400">Fix collision dents & fill fuel tank</div>
                </div>
                <button
                  onClick={handleRepairCar}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow"
                >
                  <span>Repair $150</span>
                </button>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Premium Car Wash & Wax</div>
                  <div className="text-xs text-slate-400">Wash away travel mud & restore glossy paint shine</div>
                </div>
                <button
                  onClick={handleWashCar}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow"
                >
                  <span>Wash $50</span>
                </button>
              </div>
            </div>
          )}

          {shop.category === 'tuning' && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Stage 1 ECU & Turbo Remap</div>
                <div className="text-xs text-slate-400">Boosts {currentVehicle.name} top speed by +15 km/h</div>
              </div>
              <button
                onClick={handleUpgradeEngine}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow"
              >
                <span>Tune $2,500</span>
              </button>
            </div>
          )}

          {shop.category === 'observation' && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              Welcome to the Vertex Observation Sky Lounge. Enjoy a breathtaking panoramic 360-degree viewpoint over the entire Solaria coast, skyline skyscrapers, and ocean marina.
            </div>
          )}

          {shop.category === 'dealership' && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              Welcome to the Solaria Premier Showroom. Open the Fleet Garage in the pause menu to browse all 6 exotic vehicles, test drive, and unlock with your earned race cash.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Balance: ${playerStats.cash.toLocaleString()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
          >
            Leave Shop
          </button>
        </div>
      </div>
    </div>
  );
};
