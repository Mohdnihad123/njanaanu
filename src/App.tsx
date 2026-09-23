/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { 
  VehicleDefinition, 
  PlayerStats, 
  WeatherType, 
  GameSettings, 
  InputState, 
  InteractiveShop 
} from './types/game';
import { INITIAL_VEHICLES } from './game/GameData';
import { CityWorld } from './game/CityWorld';
import { VehicleInstance } from './game/VehicleSystem';
import { CharacterController } from './game/CharacterController';
import { TrafficSystem } from './game/TrafficSystem';
import { MissionEngine } from './game/MissionEngine';
import { soundEngine } from './audio/SoundEngine';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { PauseMenu } from './components/PauseMenu';
import { ShopModal } from './components/ShopModal';
import { Play, Sparkles, Navigation, Info, Car, ShieldAlert } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Game UI States
  const [hasStarted, setHasStarted] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseTab, setPauseTab] = useState<string>('resume');
  const [activeShop, setActiveShop] = useState<InteractiveShop | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string } | null>({
    title: 'BMW M13 Competition Ready',
    message: 'Press [W] or [↑] to drive · [F] Walk on foot as realistic human · [ESC] Garage',
  });

  // Player & Vehicle State
  const [vehicles, setVehicles] = useState<VehicleDefinition[]>(INITIAL_VEHICLES);
  const [currentVehicleId, setCurrentVehicleId] = useState<string>('bmw_m13');
  const [onFoot, setOnFoot] = useState<boolean>(false);
  const [canEnterVehicle, setCanEnterVehicle] = useState<VehicleInstance | null>(null);
  const [nearShop, setNearShop] = useState<InteractiveShop | null>(null);

  // Player Stats
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    cash: 3500,
    stamina: 100,
    reputation: 120,
    collectiblesFound: 0,
    totalCollectibles: 10,
    completedMissions: [],
    wantedLevel: 0,
  });

  // World State
  const [timeOfDay, setTimeOfDay] = useState<number>(14.0); // 2:00 PM
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [customWaypoint, setCustomWaypoint] = useState<{ x: number; z: number } | null>(null);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    graphicsQuality: 'high',
    shadows: true,
    ssao: true,
    shadowResolution: '4096',
    trafficDensity: 'medium',
    viewDistance: 500,
    soundVolume: 0.8,
    musicVolume: 0.6,
    radioStation: 'pulse_synthwave',
    cameraView: 'third_person_close',
    speedUnit: 'kmh',
    timeSpeed: 0.05,
  });

  // Refs for Game Engine loop
  const engineRef = useRef<{
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    ssaoPass: SSAOPass;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cityWorld: CityWorld;
    vehicleInstances: VehicleInstance[];
    activeVehicle: VehicleInstance | null;
    character: CharacterController;
    trafficSystem: TrafficSystem;
    missionEngine: MissionEngine;
    input: InputState;
    cameraOrbitAngle: number;
    cameraPitch: number;
    isMouseDown: boolean;
    mousePrevX: number;
    mousePrevY: number;
    onFoot: boolean;
    cameraView: GameSettings['cameraView'];
  } | null>(null);

  // Toast notification trigger
  const showToast = useCallback((title: string, message: string) => {
    setToast({ title, message });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 4000);
  }, []);

  // Initialize Three.js Game World
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.2, 850);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x38bdf8, 1.0);

    // Ensure pristine single-canvas mounting
    mountRef.current.replaceChildren(renderer.domElement);

    // Post-Processing: EffectComposer with SSAO Pass & OutputPass
    const composer = new EffectComposer(renderer);
    composer.setSize(width, height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const ssaoPass = new SSAOPass(scene, camera, width, height);
    ssaoPass.kernelRadius = 14;
    ssaoPass.minDistance = 0.001;
    ssaoPass.maxDistance = 0.07;
    ssaoPass.output = SSAOPass.OUTPUT.Default;
    ssaoPass.enabled = settings.ssao !== false;
    composer.addPass(ssaoPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // 2. City World
    const cityWorld = new CityWorld(scene);

    // 3. Vehicles
    const vehicleInstances: VehicleInstance[] = [];
    const spawnOffsets = [
      { x: -17, z: 0, heading: 0 },
      { x: 43, z: -20, heading: 0 },
      { x: -77, z: 20, heading: Math.PI },
      { x: 103, z: 40, heading: 0 },
      { x: -137, z: -40, heading: Math.PI },
      { x: 157, z: 60, heading: 0 },
    ];

    INITIAL_VEHICLES.forEach((def, idx) => {
      const sp = spawnOffsets[idx % spawnOffsets.length];
      const veh = new VehicleInstance(def, new THREE.Vector3(sp.x, 0.35, sp.z), sp.heading);
      scene.add(veh.group);
      vehicleInstances.push(veh);
    });

    const activeVehicle = vehicleInstances[0];
    activeVehicle.isDriving = true;

    // Immediately position camera right behind active vehicle looking forward
    camera.position.set(-17, 3.8, -8.5);
    camera.lookAt(-17, 1.4, 20);

    // 4. On-Foot Character
    const character = new CharacterController(new THREE.Vector3(-15, 0, -10));
    character.isInVehicle = true; // starts driving
    scene.add(character.group);

    // 5. Traffic System
    const trafficSystem = new TrafficSystem(scene);

    // 6. Mission Engine
    const missionEngine = new MissionEngine(scene);

    // 7. Inputs
    const input: InputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      handbrake: false,
      nitro: false,
      horn: false,
      interact: false,
      headlights: false,
      resetCar: false,
      sprint: false,
      jump: false,
      cameraToggle: false,
    };

    engineRef.current = {
      renderer,
      composer,
      ssaoPass,
      scene,
      camera,
      cityWorld,
      vehicleInstances,
      activeVehicle,
      character,
      trafficSystem,
      missionEngine,
      input,
      cameraOrbitAngle: 0,
      cameraPitch: 0.2,
      isMouseDown: false,
      mousePrevX: 0,
      mousePrevY: 0,
      onFoot: false,
      cameraView: settings.cameraView,
    };

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      // Ensure audio context starts on user interaction
      soundEngine.init();
      if (engineRef.current?.activeVehicle && !engineRef.current.onFoot) {
        soundEngine.startEngine(engineRef.current.activeVehicle.def.soundPitch);
      }

      if (e.key === 'Escape') {
        setIsPaused((p) => !p);
        return;
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp') input.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') input.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = true;
      if (e.code === 'Space') {
        input.handbrake = true;
        input.jump = true;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        input.nitro = true;
        input.sprint = true;
      }
      if (e.code === 'KeyH') input.horn = true;
      if (e.code === 'KeyF') {
        input.interact = true;
        handleEnterExitVehicle();
      }
      if (e.code === 'KeyC') {
        handleCycleCamera();
      }
      if (e.code === 'KeyR') {
        input.resetCar = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') input.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') input.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = false;
      if (e.code === 'Space') {
        input.handbrake = false;
        input.jump = false;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        input.nitro = false;
        input.sprint = false;
      }
      if (e.code === 'KeyH') input.horn = false;
      if (e.code === 'KeyF') input.interact = false;
      if (e.code === 'KeyR') input.resetCar = false;
    };

    // Mouse Drag Camera Look
    const onMouseDown = (e: MouseEvent) => {
      if (engineRef.current) {
        engineRef.current.isMouseDown = true;
        engineRef.current.mousePrevX = e.clientX;
        engineRef.current.mousePrevY = e.clientY;

        // Left Click punch combat on foot!
        const eng = engineRef.current;
        if (eng && eng.onFoot) {
          eng.character.swingPunchArms();
          eng.trafficSystem.handlePlayerPunch(
            eng.character.position,
            eng.character.heading,
            (action) => {
              showToast(action, action === 'KNOCKED OUT' ? 'Target knocked out! Loot dropped on ground!' : 'Target is hostile and striking back!');
            }
          );
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (engineRef.current && engineRef.current.isMouseDown) {
        const dx = e.clientX - engineRef.current.mousePrevX;
        const dy = e.clientY - engineRef.current.mousePrevY;
        engineRef.current.cameraOrbitAngle -= dx * 0.006;
        engineRef.current.cameraPitch = Math.max(
          -0.1,
          Math.min(0.8, engineRef.current.cameraPitch + dy * 0.005)
        );
        engineRef.current.mousePrevX = e.clientX;
        engineRef.current.mousePrevY = e.clientY;
      }
    };

    const onMouseUp = () => {
      if (engineRef.current) {
        engineRef.current.isMouseDown = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize handler
    const onResize = () => {
      if (!mountRef.current || !engineRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      engineRef.current.camera.aspect = w / h;
      engineRef.current.camera.updateProjectionMatrix();
      engineRef.current.renderer.setSize(w, h);
      engineRef.current.composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;

    const gameLoop = (now: number) => {
      animId = requestAnimationFrame(gameLoop);
      const delta = Math.min(0.06, (now - lastTime) / 1000);
      lastTime = now;

      if (!engineRef.current) return;
      const eng = engineRef.current;

      const isPlayerOnFoot = eng.onFoot;
      const playerTargetPos = !isPlayerOnFoot && eng.activeVehicle
        ? eng.activeVehicle.position
        : eng.character.position;

      // Update City Atmosphere & Weather
      eng.cityWorld.update(delta, playerTargetPos);

      // Check proximity to interactive shops
      let closeShop: InteractiveShop | null = null;
      for (const sh of eng.missionEngine.shops) {
        const dist = playerTargetPos.distanceTo(
          new THREE.Vector3(sh.position.x, playerTargetPos.y, sh.position.z)
        );
        if (dist < 8.0) {
          closeShop = sh;
          break;
        }
      }
      setNearShop(closeShop);

      // Update active driving vehicle OR on-foot character
      if (!isPlayerOnFoot && eng.activeVehicle) {
        eng.activeVehicle.update(delta, eng.input, eng.cityWorld.obstacles);

        // Check if player flipped
        if (eng.input.resetCar) {
          eng.activeVehicle.resetVehicle();
        }

        // Camera Follow Car
        const carHeading = eng.activeVehicle.heading;
        const totalAngle = carHeading + eng.cameraOrbitAngle;

        let camDist = eng.cameraView === 'third_person_close' ? 7.5 : 12.0;
        let camHeight = eng.cameraView === 'third_person_close' ? 3.2 : 4.8;

        if (eng.cameraView === 'first_person_hood') {
          // Hood / Cockpit View
          const forwardVec = new THREE.Vector3(Math.sin(carHeading), 0, Math.cos(carHeading));
          const hoodPos = eng.activeVehicle.position.clone().addScaledVector(forwardVec, 1.2);
          hoodPos.y += 1.1;
          eng.camera.position.lerp(hoodPos, 0.4);
          const lookTarget = hoodPos.clone().addScaledVector(forwardVec, 30);
          eng.camera.lookAt(lookTarget);
        } else {
          // Third-Person Chase Cam
          const targetCamX = eng.activeVehicle.position.x - Math.sin(totalAngle) * camDist;
          const targetCamZ = eng.activeVehicle.position.z - Math.cos(totalAngle) * camDist;
          const targetCamY = eng.activeVehicle.position.y + camHeight + eng.cameraPitch * 4;

          eng.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.15);
          const targetLook = eng.activeVehicle.position.clone();
          targetLook.y += 1.4;
          eng.camera.lookAt(targetLook);
        }

        // Speed-based FOV widening
        const speedRatio = Math.min(1.0, Math.abs(eng.activeVehicle.speedKmh) / eng.activeVehicle.def.topSpeed);
        eng.camera.fov = 65 + speedRatio * 15;
        eng.camera.updateProjectionMatrix();

      } else {
        // Character on foot
        eng.character.update(
          delta,
          eng.input,
          eng.cameraOrbitAngle,
          eng.cityWorld.obstacles,
          eng.vehicleInstances,
          (enteredVeh) => {
            eng.activeVehicle = enteredVeh;
            enteredVeh.isDriving = true;
            eng.onFoot = false;
            setOnFoot(false);
            setCurrentVehicleId(enteredVeh.def.id);
            soundEngine.startEngine(enteredVeh.def.soundPitch);
            showToast('Entered Vehicle', enteredVeh.def.name);
          }
        );

        // Check if character is near a vehicle
        let nearestVeh: VehicleInstance | null = null;
        let minDist = 4.0;
        for (const v of eng.vehicleInstances) {
          const d = eng.character.position.distanceTo(v.position);
          if (d < minDist) {
            minDist = d;
            nearestVeh = v;
          }
        }
        setCanEnterVehicle(nearestVeh);

        // Camera Follow Character
        const charPos = eng.character.position;
        const camX = charPos.x - Math.sin(eng.cameraOrbitAngle) * 5.5;
        const camZ = charPos.z - Math.cos(eng.cameraOrbitAngle) * 5.5;
        const camY = charPos.y + 2.8 + eng.cameraPitch * 3;

        eng.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.2);
        eng.camera.lookAt(charPos.x, charPos.y + 1.4, charPos.z);
        eng.camera.fov = 65;
        eng.camera.updateProjectionMatrix();
      }

      // Check if Player is driving in a vehicle
      const isPlayerInCar = !eng.onFoot && eng.activeVehicle;
      const playerCarSpeed = (isPlayerInCar && eng.activeVehicle) ? eng.activeVehicle.speedKmh : 0;

      // 1. Update Traffic Vehicles, Pedestrians, and Police Units
      eng.trafficSystem.update(
        delta,
        playerTargetPos,
        eng.cityWorld,
        playerStats.wantedLevel || 0,
        !eng.onFoot,
        playerCarSpeed,
        (newLevel) => {
          setPlayerStats((prev) => ({ ...prev, wantedLevel: newLevel }));
        },
        (t, msg) => showToast(t, msg)
      );

      // 2. Loot (Money Envelope) pickup checking
      for (let i = eng.trafficSystem.moneyEnvelopes.length - 1; i >= 0; i--) {
        const env = eng.trafficSystem.moneyEnvelopes[i];
        const dist = playerTargetPos.distanceTo(env.group.position);
        if (dist < 3.0) {
          soundEngine.playCashSound();
          const amount = env.amount;
          setPlayerStats((prev) => ({ ...prev, cash: prev.cash + amount }));
          showToast('CASH LOOT COLLECTED!', `Picked up a cash bundle: +$${amount}`);
          eng.scene.remove(env.group);
          eng.trafficSystem.moneyEnvelopes.splice(i, 1);
        }
      }

      // 3. Traffic Rules signal violation check
      for (const tl of eng.cityWorld.trafficLights) {
        if (tl.state === 'red' && tl.timer >= 0) {
          const distToLight = playerTargetPos.distanceTo(tl.mesh.position);
          if (distToLight < 12.0 && isPlayerInCar && playerCarSpeed > 32) {
            // Fined for running a red light!
            setPlayerStats((prev) => {
              const fine = 150;
              const nextCash = Math.max(0, prev.cash - fine);
              showToast('TRAFFIC VIOLATION: Ran Red Light!', `Deducted $${fine} traffic fine. Stop at intersections!`);
              return { ...prev, cash: nextCash };
            });
            tl.timer = -12.0; // Cooldown to avoid repetitive triggers
            break;
          }
        }
      }

      // 4. Busted / Wasted checks
      let triggeredReset = false;
      let resetMsg = '';
      let isBusted = false;

      // Check cop proximity
      if ((playerStats.wantedLevel || 0) > 0) {
        for (const cop of eng.trafficSystem.policeCars) {
          const copDist = playerTargetPos.distanceTo(cop.group.position);
          if (copDist < 4.2) {
            const isLowSpeed = eng.onFoot || (eng.activeVehicle && eng.activeVehicle.speedKmh < 15);
            if (isLowSpeed) {
              isBusted = true;
              triggeredReset = true;
              resetMsg = 'BUSTED! Police apprehended you. Fined $500.';
              break;
            }
          }
        }
      }

      // Check health and car status
      const activeCarHealth = eng.activeVehicle ? eng.activeVehicle.health : 100;
      if (playerStats.health <= 0 || activeCarHealth <= 12) {
        triggeredReset = true;
        resetMsg = playerStats.health <= 0 ? 'WASTED! You were knocked out.' : 'VEHICLE DESTROYED! You wrecked your car.';
      }

      if (triggeredReset) {
        soundEngine.playThunder();
        showToast(isBusted ? 'BUSTED!' : 'WASTED!', resetMsg);
        
        // Deduct penalty
        const penalty = isBusted ? 500 : 300;
        setPlayerStats((prev) => ({
          ...prev,
          health: 100,
          cash: Math.max(0, prev.cash - penalty),
          wantedLevel: 0,
        }));

        // Reset player active car and position
        if (eng.activeVehicle) {
          eng.activeVehicle.resetVehicle();
        }
        if (eng.onFoot) {
          eng.character.position.set(-15, 0, -10);
          eng.character.heading = 0;
          eng.character.speed = 0;
        } else {
          if (eng.activeVehicle) {
            eng.activeVehicle.position.set(-17, 0.5, 0);
            eng.activeVehicle.heading = 0;
            eng.activeVehicle.speedKmh = 0;
          }
        }

        // Clean up cop cars
        eng.trafficSystem.policeCars.forEach((cop) => eng.scene.remove(cop.group));
        eng.trafficSystem.policeCars = [];
      }

      // Update Missions, Checkpoints & Collectibles
      eng.missionEngine.update(
        delta,
        playerTargetPos,
        eng.activeVehicle,
        playerStats,
        (t, msg) => showToast(t, msg),
        (newStats) => setPlayerStats(newStats)
      );

      // Render through Post-Processing Pipeline (SSAO + Scene + ACES Tonemapping)
      eng.composer.render();
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      composer.dispose();
      renderer.dispose();
      soundEngine.stopEngine();
      if (mountRef.current) mountRef.current.replaceChildren();
    };
  }, [showToast]);

  // Action: Enter / Exit Vehicle
  const handleEnterExitVehicle = useCallback(() => {
    if (!engineRef.current) return;
    const eng = engineRef.current;

    if (!eng.onFoot && eng.activeVehicle) {
      // Exit Car
      eng.activeVehicle.isDriving = false;
      soundEngine.stopEngine();

      const exitPos = eng.activeVehicle.position.clone();
      exitPos.x -= 2.2;
      eng.character.exitVehicle(exitPos);
      eng.onFoot = true;
      setOnFoot(true);
      showToast('Exited Vehicle', 'Exploring Solaria Metro on foot');
    } else if (eng.onFoot && canEnterVehicle) {
      // Enter Car
      eng.activeVehicle = canEnterVehicle;
      canEnterVehicle.isDriving = true;
      eng.character.isInVehicle = true;
      eng.onFoot = false;
      setOnFoot(false);
      setCurrentVehicleId(canEnterVehicle.def.id);
      soundEngine.startEngine(canEnterVehicle.def.soundPitch);
      showToast('Entered Vehicle', canEnterVehicle.def.name);
    }
  }, [canEnterVehicle, showToast]);

  // Action: Cycle Camera
  const handleCycleCamera = useCallback(() => {
    setSettings((s) => {
      const views: GameSettings['cameraView'][] = [
        'third_person_close',
        'third_person_far',
        'first_person_hood',
      ];
      const nextIdx = (views.indexOf(s.cameraView) + 1) % views.length;
      const nextView = views[nextIdx];
      if (engineRef.current) {
        engineRef.current.cameraView = nextView;
      }
      showToast('Camera View', nextView.replace(/_/g, ' '));
      return { ...s, cameraView: nextView };
    });
  }, [showToast]);

  // Action: Toggle Radio
  const handleToggleRadio = useCallback(() => {
    const stations: GameSettings['radioStation'][] = [
      'pulse_synthwave',
      'metro_beats',
      'coastal_chill',
      'off',
    ];
    setSettings((s) => {
      const nextIdx = (stations.indexOf(s.radioStation) + 1) % stations.length;
      const nextStation = stations[nextIdx];
      soundEngine.setRadioStation(nextStation);
      showToast('Radio Station', nextStation === 'off' ? 'Radio Turned Off' : nextStation.replace('_', ' '));
      return { ...s, radioStation: nextStation };
    });
  }, [showToast]);

  // Action: Select / Deploy Vehicle from Garage
  const handleSelectGarageVehicle = useCallback((id: string) => {
    if (!engineRef.current) return;
    const eng = engineRef.current;
    const targetVeh = eng.vehicleInstances.find((v) => v.def.id === id);
    if (!targetVeh) return;

    if (eng.activeVehicle) {
      eng.activeVehicle.isDriving = false;
    }

    // Teleport vehicle near current player
    const playerTargetPos = !eng.onFoot && eng.activeVehicle
      ? eng.activeVehicle.position
      : eng.character.position;

    targetVeh.position.copy(playerTargetPos);
    targetVeh.heading = 0;
    targetVeh.resetVehicle();
    targetVeh.isDriving = true;
    eng.activeVehicle = targetVeh;
    eng.character.isInVehicle = true;
    eng.onFoot = false;

    setOnFoot(false);
    setCurrentVehicleId(id);
    soundEngine.startEngine(targetVeh.def.soundPitch);
    showToast('Vehicle Deployed', targetVeh.def.name);
  }, [showToast]);

  // Action: Unlock Vehicle
  const handleUnlockVehicle = useCallback((id: string) => {
    const veh = vehicles.find((v) => v.id === id);
    if (!veh || veh.unlocked) return;

    if (playerStats.cash >= veh.price) {
      setPlayerStats((s) => ({ ...s, cash: s.cash - veh.price }));
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, unlocked: true } : v))
      );
      soundEngine.playMissionComplete();
      showToast('Vehicle Unlocked!', `${veh.name} is now ready to drive in your garage!`);
    } else {
      showToast('Insufficient Cash', `You need $${veh.price.toLocaleString()} to purchase this car.`);
    }
  }, [vehicles, playerStats.cash, showToast]);

  // Action: Change Paint Color
  const handleChangeVehicleColor = useCallback((vehicleId: string, colorHex: string) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, color: colorHex } : v))
    );
    if (engineRef.current) {
      const veh = engineRef.current.vehicleInstances.find((v) => v.def.id === vehicleId);
      if (veh) {
        veh.setPaintColor(colorHex);
      }
    }
    soundEngine.playCashSound();
  }, []);

  // Action: Change Time of Day
  const handleChangeTimeOfDay = useCallback((hour: number) => {
    setTimeOfDay(hour);
    if (engineRef.current) {
      engineRef.current.cityWorld.setTimeOfDay(hour);
    }
  }, []);

  // Action: Change Weather
  const handleChangeWeather = useCallback((w: WeatherType) => {
    setWeather(w);
    if (engineRef.current) {
      engineRef.current.cityWorld.setWeather(w);
      const intensity = w === 'storm' || w === 'heavy_rain' ? 1.0 : w === 'rain' ? 0.5 : 0.0;
      soundEngine.updateRain(intensity);
    }
    showToast('Weather Changed', w.replace('_', ' ').toUpperCase());
  }, [showToast]);

  // Action: Live Settings Update (SSAO, Shadows, Camera, Radio)
  const handleUpdateSettings = useCallback((newS: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newS };
      if (engineRef.current) {
        if (newS.ssao !== undefined && engineRef.current.ssaoPass) {
          engineRef.current.ssaoPass.enabled = newS.ssao;
          showToast('SSAO Ambient Occlusion', newS.ssao ? 'Enabled (Corner & foliage depth)' : 'Disabled');
        }
        if (newS.shadowResolution !== undefined && engineRef.current.cityWorld) {
          const res = parseInt(newS.shadowResolution, 10);
          engineRef.current.cityWorld.sunLight.shadow.mapSize.width = res;
          engineRef.current.cityWorld.sunLight.shadow.mapSize.height = res;
          if (engineRef.current.cityWorld.sunLight.shadow.map) {
            engineRef.current.cityWorld.sunLight.shadow.map.dispose();
            engineRef.current.cityWorld.sunLight.shadow.map = null as any;
          }
          showToast('Shadow Resolution', res === 4096 ? '4096 (Ultra 4K Crisp)' : '2048 (High)');
        }
        if (newS.radioStation !== undefined) {
          soundEngine.setRadioStation(newS.radioStation);
        }
        if (newS.cameraView !== undefined) {
          engineRef.current.cameraView = newS.cameraView;
        }
      }
      return next;
    });
  }, [showToast]);

  // Start game from intro
  const handleStartGame = () => {
    setHasStarted(true);
    soundEngine.init();
    const activeVeh = engineRef.current?.activeVehicle;
    if (activeVeh) {
      soundEngine.startEngine(activeVeh.def.soundPitch);
    }
    soundEngine.setRadioStation(settings.radioStation);
  };

  const currentVehInstance = engineRef.current?.activeVehicle || null;
  const currentVehDef = vehicles.find((v) => v.id === currentVehicleId) || vehicles[0];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none font-sans text-slate-100">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Start Game Splash Screen */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
            <img
              src="/src/assets/images/solaria_metro_cover_1790142499182.jpg"
              alt="Solaria Metro Banner"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            />
            
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 mb-4">
              <Car className="w-8 h-8 text-white" />
            </div>

            <h1 className="relative z-10 text-3xl md:text-4xl font-black tracking-tight text-white">
              SOLARIA METRO
            </h1>
            <p className="relative z-10 text-xs md:text-sm text-sky-400 font-mono tracking-widest uppercase mt-1">
              3D Open World Drive & Explore
            </p>

            <p className="relative z-10 text-xs md:text-sm text-slate-300 max-w-md mt-4 leading-relaxed">
              Explore a living coastal metropolis. Drive exotic cars, drift around hairpin docks, stroll the beachfront promenade on foot, customize vehicles, and experience dynamic time and weather.
            </p>

            <button
              onClick={handleStartGame}
              className="relative z-10 mt-8 px-8 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-sky-500/30 flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Drive Now</span>
            </button>

            <div className="relative z-10 flex items-center gap-4 text-[11px] text-slate-400 mt-6">
              <span>Keyboard & Mouse</span>
              <span>·</span>
              <span>Touch Screen Support</span>
              <span>·</span>
              <span>Procedural Web Audio</span>
            </div>
          </div>
        </div>
      )}

      {/* In-Game HUD */}
      {hasStarted && (
        <HUD
          stats={playerStats}
          vehicle={currentVehInstance}
          onFoot={onFoot}
          canEnterVehicle={canEnterVehicle}
          nearShop={nearShop}
          activeMission={engineRef.current?.missionEngine.activeMission || null}
          missionTimer={engineRef.current?.missionEngine.missionTimer || 0}
          driftScore={engineRef.current?.missionEngine.driftScoreAcc || 0}
          timeOfDay={timeOfDay}
          weather={weather}
          radioStation={settings.radioStation}
          speedUnit={settings.speedUnit}
          onOpenPause={(tab) => {
            setPauseTab(tab || 'resume');
            setIsPaused(true);
          }}
          onOpenShop={(sh) => setActiveShop(sh)}
          onToggleRadio={handleToggleRadio}
          onToggleCamera={handleCycleCamera}
          onInteract={handleEnterExitVehicle}
        />
      )}

      {/* Mobile Touch Overlay */}
      {hasStarted && (
        <MobileControls
          input={engineRef.current?.input || {
            forward: false,
            backward: false,
            left: false,
            right: false,
            handbrake: false,
            nitro: false,
            horn: false,
            interact: false,
            headlights: false,
            resetCar: false,
            sprint: false,
            jump: false,
            cameraToggle: false,
          }}
          onFoot={onFoot}
          canEnter={!!canEnterVehicle}
          onPress={(key, val) => {
            if (engineRef.current) {
              engineRef.current.input[key] = val;
            }
          }}
          onEnterExit={handleEnterExitVehicle}
          onResetCar={() => engineRef.current?.activeVehicle?.resetVehicle()}
          onToggleCamera={handleCycleCamera}
        />
      )}

      {/* Notification Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-950/90 backdrop-blur-md border border-sky-500/60 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-slate-100">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white">{toast.title}</div>
            <div className="text-[11px] text-slate-300">{toast.message}</div>
          </div>
        </div>
      )}

      {/* Pause & Management Menu */}
      <PauseMenu
        initialTab={pauseTab}
        isOpen={isPaused}
        onClose={() => setIsPaused(false)}
        vehicles={vehicles}
        currentVehicleId={currentVehicleId}
        playerStats={playerStats}
        missions={engineRef.current?.missionEngine.missions || []}
        landmarks={engineRef.current?.missionEngine.landmarks || []}
        timeOfDay={timeOfDay}
        weather={weather}
        settings={settings}
        playerPos={{
          x: currentVehInstance?.position.x || 0,
          z: currentVehInstance?.position.z || 0,
        }}
        customWaypoint={customWaypoint}
        onSelectVehicle={handleSelectGarageVehicle}
        onUnlockVehicle={handleUnlockVehicle}
        onChangeVehicleColor={handleChangeVehicleColor}
        onChangeTime={handleChangeTimeOfDay}
        onChangeWeather={handleChangeWeather}
        onStartMission={(mId) => {
          engineRef.current?.missionEngine.startMission(mId);
          showToast('Mission Started', 'Follow the GPS radar beacon on your minimap!');
        }}
        onSetCustomWaypoint={(pos) => {
          setCustomWaypoint(pos);
          if (pos) {
            showToast('GPS Waypoint Set', 'Beacon navigation active on radar');
          }
        }}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Interactive Shop Modal */}
      <ShopModal
        shop={activeShop}
        onClose={() => setActiveShop(null)}
        playerStats={playerStats}
        currentVehicle={currentVehDef}
        onStatsUpdate={(newStats) => setPlayerStats(newStats)}
        onRepairVehicle={() => {
          if (currentVehInstance) {
            currentVehInstance.health = 100;
            currentVehInstance.nitroFuel = 100;
            currentVehInstance.fuel = 100; // Restore fuel too
            // Reset any mesh deformations instantly
            currentVehInstance.resetVehicle();
          }
        }}
        onWashVehicle={() => {
          if (currentVehInstance) {
            currentVehInstance.dirtiness = 0;
          }
        }}
        onUpgradeSpeed={() => {
          setVehicles((prev) =>
            prev.map((v) =>
              v.id === currentVehicleId ? { ...v, topSpeed: v.topSpeed + 15 } : v
            )
          );
        }}
        onNotify={(t, msg) => showToast(t, msg)}
      />
    </div>
  );
}
