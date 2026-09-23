import React from 'react';
import { InputState } from '../types/game';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Flame, 
  Volume2, 
  LogOut, 
  RotateCcw, 
  Eye, 
  Footprints 
} from 'lucide-react';

interface MobileControlsProps {
  input: InputState;
  onFoot: boolean;
  canEnter: boolean;
  onPress: (key: keyof InputState, active: boolean) => void;
  onEnterExit: () => void;
  onResetCar: () => void;
  onToggleCamera: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  input,
  onFoot,
  canEnter,
  onPress,
  onEnterExit,
  onResetCar,
  onToggleCamera,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 select-none lg:hidden">
      {/* Top Mobile Bar Actions */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-2">
          <button
            onTouchStart={() => onToggleCamera()}
            onClick={() => onToggleCamera()}
            className="p-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl text-slate-300 active:bg-sky-500 active:text-white"
          >
            <Eye className="w-5 h-5" />
          </button>
          {!onFoot && (
            <button
              onTouchStart={() => onResetCar()}
              onClick={() => onResetCar()}
              className="p-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl text-slate-300 active:bg-amber-500 active:text-slate-950"
              title="Reset Car"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Enter / Exit Vehicle Mobile Button */}
        {(canEnter || !onFoot) && (
          <button
            onTouchStart={() => onEnterExit()}
            onClick={() => onEnterExit()}
            className="px-4 py-2 bg-sky-500 active:bg-sky-400 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/30"
          >
            {onFoot ? (
              <>
                <Footprints className="w-4 h-4" />
                <span>Drive Car</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Exit Car</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Bottom Touch Controls */}
      <div className="flex items-end justify-between w-full pointer-events-auto mt-auto pb-2">
        {/* Left Side: Steering / Movement */}
        <div className="flex items-center gap-2">
          <button
            onTouchStart={() => onPress('left', true)}
            onTouchEnd={() => onPress('left', false)}
            onMouseDown={() => onPress('left', true)}
            onMouseUp={() => onPress('left', false)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
              input.left
                ? 'bg-sky-500 border-sky-400 text-white scale-95'
                : 'bg-slate-900/85 backdrop-blur-md border-slate-700 text-slate-200'
            }`}
          >
            <ArrowLeft className="w-7 h-7" />
          </button>

          <button
            onTouchStart={() => onPress('right', true)}
            onTouchEnd={() => onPress('right', false)}
            onMouseDown={() => onPress('right', true)}
            onMouseUp={() => onPress('right', false)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
              input.right
                ? 'bg-sky-500 border-sky-400 text-white scale-95'
                : 'bg-slate-900/85 backdrop-blur-md border-slate-700 text-slate-200'
            }`}
          >
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>

        {/* Right Side: Throttle, Brake, Nitro, Horn / Jump */}
        <div className="flex items-end gap-3">
          {/* Nitro & Horn */}
          <div className="flex flex-col gap-2">
            {!onFoot ? (
              <>
                <button
                  onTouchStart={() => onPress('nitro', true)}
                  onTouchEnd={() => onPress('nitro', false)}
                  onMouseDown={() => onPress('nitro', true)}
                  onMouseUp={() => onPress('nitro', false)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    input.nitro
                      ? 'bg-cyan-500 border-cyan-400 text-white scale-95 shadow-[0_0_12px_#06b6d4]'
                      : 'bg-slate-900/85 border-slate-700 text-cyan-400'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </button>

                <button
                  onTouchStart={() => onPress('horn', true)}
                  onTouchEnd={() => onPress('horn', false)}
                  onMouseDown={() => onPress('horn', true)}
                  onMouseUp={() => onPress('horn', false)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    input.horn
                      ? 'bg-amber-500 border-amber-400 text-slate-950 scale-95'
                      : 'bg-slate-900/85 border-slate-700 text-amber-400'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onTouchStart={() => onPress('sprint', true)}
                onTouchEnd={() => onPress('sprint', false)}
                onMouseDown={() => onPress('sprint', true)}
                onMouseUp={() => onPress('sprint', false)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  input.sprint
                    ? 'bg-emerald-500 border-emerald-400 text-white scale-95'
                    : 'bg-slate-900/85 border-slate-700 text-emerald-400'
                }`}
              >
                <span className="text-xs font-bold font-mono">RUN</span>
              </button>
            )}

            {/* Handbrake / Jump */}
            <button
              onTouchStart={() => onPress(onFoot ? 'jump' : 'handbrake', true)}
              onTouchEnd={() => onPress(onFoot ? 'jump' : 'handbrake', false)}
              onMouseDown={() => onPress(onFoot ? 'jump' : 'handbrake', true)}
              onMouseUp={() => onPress(onFoot ? 'jump' : 'handbrake', false)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                (onFoot ? input.jump : input.handbrake)
                  ? 'bg-rose-500 border-rose-400 text-white scale-95'
                  : 'bg-slate-900/85 border-slate-700 text-rose-400'
              }`}
            >
              <span className="text-[10px] font-bold font-mono">{onFoot ? 'JUMP' : 'DRIFT'}</span>
            </button>
          </div>

          {/* Forward (Throttle) & Backward (Brake/Reverse) */}
          <div className="flex flex-col gap-2">
            <button
              onTouchStart={() => onPress('forward', true)}
              onTouchEnd={() => onPress('forward', false)}
              onMouseDown={() => onPress('forward', true)}
              onMouseUp={() => onPress('forward', false)}
              className={`w-16 h-18 rounded-2xl flex items-center justify-center border transition-all ${
                input.forward
                  ? 'bg-emerald-500 border-emerald-400 text-white scale-95 shadow-[0_0_15px_#10b981]'
                  : 'bg-slate-900/90 backdrop-blur-md border-slate-700 text-slate-100'
              }`}
            >
              <ArrowUp className="w-8 h-8" />
            </button>

            <button
              onTouchStart={() => onPress('backward', true)}
              onTouchEnd={() => onPress('backward', false)}
              onMouseDown={() => onPress('backward', true)}
              onMouseUp={() => onPress('backward', false)}
              className={`w-16 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                input.backward
                  ? 'bg-rose-500 border-rose-400 text-white scale-95 shadow-[0_0_15px_#f43f5e]'
                  : 'bg-slate-900/90 backdrop-blur-md border-slate-700 text-slate-100'
              }`}
            >
              <ArrowDown className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
