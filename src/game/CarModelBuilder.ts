import * as THREE from 'three';
import { VehicleDefinition } from '../types/game';

export interface BuiltCarModel {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  frontWheelPivots: THREE.Group[];
  wheels: THREE.Mesh[];
  headlightMeshes: THREE.Mesh[];
  headlights: THREE.SpotLight[];
  taillightMeshes: THREE.Mesh[];
  nitroFlame: THREE.Mesh;
  size: THREE.Vector3;
  hoodMesh?: THREE.Mesh;
  frontBumperMesh?: THREE.Mesh;
}

/**
 * Procedural texture generator for BMW Roundel Emblem (Hood, Trunk & Wheels)
 */
function createBMWRoundelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const cx = 64;
  const cy = 64;
  const r = 58;

  // Outer chrome ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fill();

  // Black outer band
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.fillStyle = '#090d16';
  ctx.fill();

  // Silver inner separator
  ctx.beginPath();
  ctx.arc(cx, cy, r - 18, 0, Math.PI * 2);
  ctx.fillStyle = '#94a3b8';
  ctx.fill();

  const innerR = r - 20;

  // Top-Left: BMW Cyan Blue
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, innerR, -Math.PI, -Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = '#0066b2';
  ctx.fill();

  // Top-Right: Pure White
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, innerR, -Math.PI / 2, 0);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Bottom-Right: BMW Cyan Blue
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, innerR, 0, Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = '#0066b2';
  ctx.fill();

  // Bottom-Left: Pure White
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, innerR, Math.PI / 2, Math.PI);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Fine black quadrant divider lines
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - innerR, cy);
  ctx.lineTo(cx + innerR, cy);
  ctx.moveTo(cx, cy - innerR);
  ctx.lineTo(cx, cy + innerR);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Procedural texture for 2x2 Carbon Fiber Weave
 */
function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 64, 64);

  for (let x = 0; x < 64; x += 8) {
    for (let y = 0; y < 64; y += 8) {
      if ((x / 8 + y / 8) % 2 === 0) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, 8, 4);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 4, y + 4, 4, 4);
      } else {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(x, y, 4, 8);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/**
 * Procedural Cross-Drilled Ventilated Brake Rotor Texture
 */
function createBrakeRotorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Steel base
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fill();

  // Friction circular brush grain
  for (let r = 70; r < 118; r += 4) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = (r % 8 === 0) ? '#94a3b8' : '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Cross-drilled cooling holes
  ctx.fillStyle = '#1e293b';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    for (const dist of [78, 92, 106]) {
      const hx = cx + Math.cos(a + dist * 0.01) * dist;
      const hy = cy + Math.sin(a + dist * 0.01) * dist;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Center hub cutout
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural Realistic Tire Tread & Sidewall Texture
 */
function createTireSidewallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Dark matte rubber base
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 256, 256);

  // Outer tire bead rings
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 122, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 95, 0, Math.PI * 2);
  ctx.stroke();

  // Sport tire lettering: "PILOT SPORT 4S · 265/35 ZR19"
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#71717a';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('M PERFORMANCE · SPORT CUP', 0, -104);
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural Realistic Solaria License Plate Texture
 */
function createLicensePlateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // White reflective background with bevel
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 252, 60);

  // Blue left band (EU/State style)
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(4, 4, 32, 56);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★', 20, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('SOL', 20, 48);

  // Bold license registration text
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('M13 · COMP', 148, 44);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural Curved Digital Cockpit Dashboard Screen
 */
function createDashboardDisplayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, 256, 64);

  // Digital instrument dials
  ctx.strokeStyle = '#0066b2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(60, 32, 24, Math.PI * 0.7, Math.PI * 2.3);
  ctx.stroke();

  ctx.strokeStyle = '#e11d48';
  ctx.beginPath();
  ctx.arc(196, 32, 24, Math.PI * 0.7, Math.PI * 2.1);
  ctx.stroke();

  // Speed & gear readout
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('M13', 60, 36);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('SPORT PLUS', 128, 24);
  ctx.fillStyle = '#22c55e';
  ctx.fillText('TURBO READY', 128, 44);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Procedural Honeycomb Air Intake Grille Texture
 */
function createHoneycombTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 64, 64);

  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1.5;
  const hexSize = 8;
  for (let x = 0; x < 64 + hexSize; x += hexSize * 1.5) {
    for (let y = 0; y < 64 + hexSize; y += hexSize * 1.732) {
      const offsetX = (Math.floor(y / (hexSize * 1.732)) % 2) * (hexSize * 0.75);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + offsetX + Math.cos(angle) * (hexSize * 0.6);
        const py = y + Math.sin(angle) * (hexSize * 0.6);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/**
 * Builds a realistic modern car model with continuous flowing curves,
 * true curved wheel-well cutouts, detailed driver cockpit, authentic
 * BMW M performance engineering, clearcoat automotive paint, and real car styling.
 */
export function buildCarModel(
  def: VehicleDefinition,
  options: { isShowroom?: boolean } = {}
): BuiltCarModel {
  const group = new THREE.Group();
  const frontWheelPivots: THREE.Group[] = [];
  const wheels: THREE.Mesh[] = [];
  const headlightMeshes: THREE.Mesh[] = [];
  const headlights: THREE.SpotLight[] = [];
  const taillightMeshes: THREE.Mesh[] = [];

  let savedHoodMesh: THREE.Mesh | undefined;
  let savedFrontBumperMesh: THREE.Mesh | undefined;

  const isBike = def.category === 'motorcycle';
  const isTruck = def.category === 'truck';
  const isSUV = def.category === 'suv';
  const isSupercar = def.category === 'supercar';
  const isTaxi = def.category === 'taxi';
  const isBMW = def.id === 'bmw_m13' || def.name.toLowerCase().includes('bmw') || def.name.toLowerCase().includes('m13') || (!isBike && !isTruck && !isTaxi && !isSUV);

  const size = isBike
    ? new THREE.Vector3(0.8, 1.2, 2.2)
    : isTruck
    ? new THREE.Vector3(2.3, 2.2, 5.2)
    : isSUV
    ? new THREE.Vector3(2.2, 1.8, 4.6)
    : new THREE.Vector3(2.1, 1.35, 4.5);

  // High-Gloss Clearcoat Automotive Paint Material
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(def.color),
    metalness: isBMW ? 0.72 : 0.6,
    roughness: isBMW ? 0.16 : 0.25, // Deep clearcoat wet reflection
  });

  const glossBlackMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    metalness: 0.85,
    roughness: 0.12,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.96,
    roughness: 0.08,
  });

  const darkInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.75,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0a1120,
    metalness: 0.94,
    roughness: 0.04,
    transparent: true,
    opacity: 0.76,
  });

  let mainBodyMesh: THREE.Mesh;

  if (isBike) {
    // Motorcycle
    const frameGeo = new THREE.BoxGeometry(0.5, 0.6, 1.4);
    const frame = new THREE.Mesh(frameGeo, bodyMat);
    frame.position.y = 0.65;
    frame.castShadow = true;
    group.add(frame);
    mainBodyMesh = frame;

    const barGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
    const bar = new THREE.Mesh(barGeo, glossBlackMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.95, 0.5);
    group.add(bar);

    const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8);
    const exhaust = new THREE.Mesh(exhaustGeo, chromeMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.28, 0.35, -0.4);
    group.add(exhaust);

    const bikeWheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.16, 24);
    const bikeWheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

    const frontPivot = new THREE.Group();
    frontPivot.position.set(0, 0.35, 0.8);
    const frontWheel = new THREE.Mesh(bikeWheelGeo, bikeWheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.castShadow = true;
    frontPivot.add(frontWheel);
    frontWheelPivots.push(frontPivot);
    wheels.push(frontWheel);
    group.add(frontPivot);

    const rearWheel = new THREE.Mesh(bikeWheelGeo, bikeWheelMat);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, 0.35, -0.7);
    rearWheel.castShadow = true;
    wheels.push(rearWheel);
    group.add(rearWheel);
  } else if (isBMW) {
    // ================================================================
    // REAL AERODYNAMIC CAR: AUTHENTIC BMW M13 COMPETITION
    // ================================================================
    const totalLength = 4.5;
    const bodyWidth = 2.06;
    const groundClearance = 0.28;
    const wheelRadius = 0.36;
    const frontWheelZ = 1.35;
    const rearWheelZ = -1.35;

    // Shared Textures
    const roundelTex = createBMWRoundelTexture();
    const roundelMat = new THREE.MeshStandardMaterial({
      map: roundelTex,
      roughness: 0.18,
      metalness: 0.6,
    });
    const carbonTex = createCarbonFiberTexture();
    const carbonMat = new THREE.MeshStandardMaterial({
      map: carbonTex,
      roughness: 0.2,
      metalness: 0.85,
    });
    const honeycombTex = createHoneycombTexture();
    const honeycombMat = new THREE.MeshStandardMaterial({
      map: honeycombTex,
      roughness: 0.3,
      metalness: 0.5,
    });

    // 1. Sleek Central Fuselage & Floorpan with contoured underside
    const floorGeo = new THREE.BoxGeometry(bodyWidth * 0.94, 0.14, totalLength * 0.96);
    const floorMesh = new THREE.Mesh(floorGeo, glossBlackMat);
    floorMesh.position.set(0, groundClearance + 0.07, 0);
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    // Soft Ambient Ground Contact Shadow Decal
    const shadowGeo = new THREE.PlaneGeometry(bodyWidth * 1.12, totalLength * 1.05);
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 128;
    sCanvas.height = 128;
    const sCtx = sCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(64, 64, 16, 64, 64, 62);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    sGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    const sDecalTex = new THREE.CanvasTexture(sCanvas);
    const sDecalMat = new THREE.MeshBasicMaterial({
      map: sDecalTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    const groundShadow = new THREE.Mesh(shadowGeo, sDecalMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.set(0, 0.03, 0);
    group.add(groundShadow);

    // 2. Main Sculpted Body Center (Cabin base & waistline)
    const midBodyGeo = new THREE.BoxGeometry(bodyWidth * 0.96, 0.45, 2.1);
    const midBody = new THREE.Mesh(midBodyGeo, bodyMat);
    midBody.position.set(0, groundClearance + 0.34, -0.05);
    midBody.castShadow = true;
    midBody.receiveShadow = true;
    group.add(midBody);
    mainBodyMesh = midBody;

    // 3. Realistic Wheel Arch Cutouts & Flared Fenders
    // Instead of flat boxes, we build sculpted front and rear quarter fenders with inner dark wheel wells!
    const fenderMat = bodyMat;
    const innerWellMat = new THREE.MeshBasicMaterial({ color: 0x050508 });

    [-1, 1].forEach((side) => {
      const x = side * (bodyWidth / 2 - 0.08);

      // FRONT WHEEL WELL & ARCH
      const fWell = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius + 0.09, wheelRadius + 0.09, 0.32, 16, 1, false, 0, Math.PI), innerWellMat);
      fWell.rotation.z = Math.PI / 2;
      fWell.rotation.y = side === 1 ? Math.PI : 0;
      fWell.position.set(x, groundClearance + wheelRadius - 0.04, frontWheelZ);
      group.add(fWell);

      // Flared Front Fender Top
      const fFenderArch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 1.05), fenderMat);
      fFenderArch.position.set(x, groundClearance + wheelRadius + 0.16, frontWheelZ);
      fFenderArch.castShadow = true;
      group.add(fFenderArch);

      // REAR WHEEL WELL & ARCH
      const rWell = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius + 0.09, wheelRadius + 0.09, 0.32, 16, 1, false, 0, Math.PI), innerWellMat);
      rWell.rotation.z = Math.PI / 2;
      rWell.rotation.y = side === 1 ? Math.PI : 0;
      rWell.position.set(x, groundClearance + wheelRadius - 0.04, rearWheelZ);
      group.add(rWell);

      // Muscular Flared Rear Shoulder / Fender
      const rFenderArch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 1.15), fenderMat);
      rFenderArch.position.set(x + side * 0.02, groundClearance + wheelRadius + 0.18, rearWheelZ);
      rFenderArch.castShadow = true;
      group.add(rFenderArch);

      // M Side Breather / Fender Vent with M badge
      const gillGeo = new THREE.BoxGeometry(0.04, 0.14, 0.28);
      const gill = new THREE.Mesh(gillGeo, glossBlackMat);
      gill.position.set(x + side * 0.08, groundClearance + 0.44, 0.72);
      group.add(gill);

      const gillBadge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.1), chromeMat);
      gillBadge.position.set(x + side * 0.08, groundClearance + 0.44, 0.72);
      group.add(gillBadge);

      // Sculpted Aerodynamic Side Skirts with Carbon Fiber Ground Effect Blades
      const skirtGeo = new THREE.BoxGeometry(0.12, 0.08, 1.95);
      const skirt = new THREE.Mesh(skirtGeo, carbonMat);
      skirt.position.set(x + side * 0.04, groundClearance + 0.08, -0.05);
      group.add(skirt);

      // Realistic Flush Door Handles
      const handleGeo = new THREE.BoxGeometry(0.02, 0.04, 0.16);
      const handle = new THREE.Mesh(handleGeo, glossBlackMat);
      handle.position.set(x + side * 0.085, groundClearance + 0.52, 0.18);
      group.add(handle);

      // Door panel line indent
      const doorLine = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.48, 0.015), glossBlackMat);
      doorLine.position.set(x + side * 0.08, groundClearance + 0.32, -0.65);
      group.add(doorLine);
    });

    // 4. Aerodynamic Front Hood with "Power Dome" & Sloping Nose
    // Real cars have a forward-sloping hood that tapers smoothly into the front bumper
    const hoodLength = 1.35;
    const hoodGeo = new THREE.BoxGeometry(bodyWidth * 0.9, 0.08, hoodLength);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.rotation.x = 0.09; // Downward aerodynamic slope
    hood.position.set(0, groundClearance + 0.55, 1.32);
    hood.castShadow = true;
    group.add(hood);
    savedHoodMesh = hood;

    // Signature BMW Power Dome (central raised bulge)
    const domeGeo = new THREE.BoxGeometry(0.52, 0.06, hoodLength * 0.88);
    const dome = new THREE.Mesh(domeGeo, bodyMat);
    dome.position.set(0, 0.045, -0.05);
    hood.add(dome);

    // Dual hood crease lines
    [-0.32, 0.32].forEach((hx) => {
      const crease = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, hoodLength * 0.9), bodyMat);
      crease.position.set(hx, 0.03, 0);
      hood.add(crease);
    });

    // BMW Hood Roundel Emblem
    const hoodRoundel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.015, 24), roundelMat);
    hoodRoundel.rotation.x = -Math.PI / 2;
    hoodRoundel.position.set(0, 0.05, hoodLength / 2 - 0.1);
    hood.add(hoodRoundel);

    // 5. Authentic BMW Front Bumper & M Twin-Kidney Grille
    const bumperNoseGeo = new THREE.BoxGeometry(bodyWidth * 0.96, 0.38, 0.42);
    const bumperNose = new THREE.Mesh(bumperNoseGeo, bodyMat);
    bumperNose.position.set(0, groundClearance + 0.32, 2.05);
    bumperNose.castShadow = true;
    group.add(bumperNose);
    savedFrontBumperMesh = bumperNose;

    // Front Carbon Fiber Lower Splitter Lip
    const splitterGeo = new THREE.BoxGeometry(bodyWidth * 1.02, 0.05, 0.38);
    const splitter = new THREE.Mesh(splitterGeo, carbonMat);
    splitter.position.set(0, groundClearance + 0.04, 2.14);
    group.add(splitter);

    // Lower Central Air Intake with Honeycomb Mesh
    const lowerIntake = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.18, 0.06), honeycombMat);
    lowerIntake.position.set(0, groundClearance + 0.17, 2.25);
    group.add(lowerIntake);

    // Iconic BMW Twin-Kidney Grille
    const kidneyY = groundClearance + 0.39;
    const kidneyZ = 2.25;
    [-0.22, 0.22].forEach((kx, idx) => {
      // Chrome/Gloss black outer grille bezel
      const kFrame = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.06), glossBlackMat);
      kFrame.position.set(kx, kidneyY, kidneyZ);
      group.add(kFrame);

      // Honeycomb/Black background
      const kBack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.03), honeycombMat);
      kBack.position.set(kx, kidneyY, kidneyZ + 0.01);
      group.add(kBack);

      // Double vertical 3D black slats
      for (let s = -3; s <= 3; s++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.19, 0.03), glossBlackMat);
        slat.position.set(kx + s * 0.038, kidneyY, kidneyZ + 0.025);
        group.add(slat);
      }

      // BMW ///M Tricolor Badge on right grille
      if (idx === 1) {
        const mBadge = new THREE.Group();
        mBadge.position.set(kx + 0.08, kidneyY + 0.05, kidneyZ + 0.04);
        const stripeColors = [0x0099da, 0x003366, 0xe21b24];
        stripeColors.forEach((col, sIdx) => {
          const sMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.012, 0.038, 0.01),
            new THREE.MeshBasicMaterial({ color: col })
          );
          sMesh.rotation.z = -0.3;
          sMesh.position.set(sIdx * 0.015 - 0.02, 0, 0);
          mBadge.add(sMesh);
        });
        const mLetter = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.038, 0.01), chromeMat);
        mLetter.position.set(0.03, 0, 0);
        mBadge.add(mLetter);
        group.add(mBadge);
      }
    });

    // 6. Swept-Back Real Headlights with Glowing "Angel Eyes" DRL Halos
    const hlHousingMat = new THREE.MeshStandardMaterial({
      color: 0x07090e,
      metalness: 0.95,
      roughness: 0.1,
    });
    const angelEyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2.2,
      roughness: 0.05,
    });

    [-0.76, 0.76].forEach((hx, hIdx) => {
      // Swept-back aerodynamic housing
      const hGeo = new THREE.BoxGeometry(0.38, 0.16, 0.18);
      const housing = new THREE.Mesh(hGeo, hlHousingMat);
      housing.position.set(hx, groundClearance + 0.42, 2.12);
      housing.rotation.y = (hIdx === 0 ? 0.18 : -0.18);
      housing.rotation.x = -0.05;
      group.add(housing);

      // Two Hexagonal "Angel Eye" DRL Halo Rings per light (4 total)
      [-0.08, 0.08].forEach((rx) => {
        const ringGeo = new THREE.TorusGeometry(0.045, 0.01, 12, 24);
        const ring = new THREE.Mesh(ringGeo, angelEyeMat);
        ring.position.set(hx + rx, groundClearance + 0.42, 2.2);
        group.add(ring);
      });

      // Sharp LED Eyebrow Light Bar
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.018, 0.02), angelEyeMat);
      brow.position.set(hx, groundClearance + 0.49, 2.2);
      group.add(brow);

      headlightMeshes.push(housing);

      if (!options.isShowroom) {
        const spot = new THREE.SpotLight(0xffffff, 2.4, 48, Math.PI / 5, 0.35, 1.2);
        spot.position.set(hx, groundClearance + 0.42, 2.15);
        spot.target.position.set(hx, 0, 26);
        group.add(spot);
        group.add(spot.target);
        headlights.push(spot);
      }
    });

    // 7. Continuous Aerodynamic Greenhouse, Sloped Windshields & Carbon Roof
    const cabinWidth = bodyWidth * 0.84;
    const cabinRoofY = groundClearance + 1.05;

    // Sloped Front Windshield (Angled ~58 degrees like a real sports coupe)
    const fGlassGeo = new THREE.BoxGeometry(cabinWidth * 0.94, 0.04, 0.95);
    const fGlass = new THREE.Mesh(fGlassGeo, glassMat);
    fGlass.rotation.x = 0.88;
    fGlass.position.set(0, groundClearance + 0.84, 0.62);
    fGlass.castShadow = true;
    group.add(fGlass);

    // Slender A-Pillars framing the windshield
    [-cabinWidth / 2 + 0.04, cabinWidth / 2 - 0.04].forEach((px) => {
      const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.0), glossBlackMat);
      pMesh.rotation.x = 0.88;
      pMesh.position.set(px, groundClearance + 0.84, 0.62);
      group.add(pMesh);
    });

    // Dual-Bubble M Carbon Fiber Roof
    const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.94, 0.04, 1.25);
    const roof = new THREE.Mesh(roofGeo, carbonMat);
    roof.position.set(0, cabinRoofY, -0.32);
    roof.castShadow = true;
    group.add(roof);

    // Aerodynamic Shark Fin Antenna
    const shark = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 4), glossBlackMat);
    shark.rotation.x = -0.4;
    shark.position.set(0, cabinRoofY + 0.06, -0.78);
    group.add(shark);

    // Fastback Sloping Rear Window
    const rGlassGeo = new THREE.BoxGeometry(cabinWidth * 0.92, 0.04, 0.98);
    const rGlass = new THREE.Mesh(rGlassGeo, glassMat);
    rGlass.rotation.x = -0.78; // Sloping fastback rear glass
    rGlass.position.set(0, groundClearance + 0.82, -1.25);
    rGlass.castShadow = true;
    group.add(rGlass);

    // Side Windows with Shadowline trim & classic BMW Hofmeister Kink
    [-cabinWidth / 2, cabinWidth / 2].forEach((sx, sIdx) => {
      const sGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 1.3), glassMat);
      sGlass.position.set(sx, groundClearance + 0.86, -0.3);
      group.add(sGlass);

      // Hofmeister Kink C-Pillar notch
      const kink = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.22), bodyMat);
      kink.position.set(sx + (sIdx === 0 ? -0.02 : 0.02), groundClearance + 0.85, -0.92);
      kink.rotation.x = -0.45;
      group.add(kink);
    });

    // 8. Detailed Interior Driver Cockpit (Visible through glass)
    // BMW Curved Display (Dual Screen)
    const dashTex = createDashboardDisplayTexture();
    const dashMat = new THREE.MeshStandardMaterial({
      map: dashTex,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
    });
    const curvedDash = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.04), dashMat);
    curvedDash.position.set(-0.15, groundClearance + 0.72, 0.42);
    curvedDash.rotation.x = -0.25;
    group.add(curvedDash);

    // Dashboard Cowl
    const cowl = new THREE.Mesh(new THREE.BoxGeometry(cabinWidth * 0.92, 0.16, 0.52), darkInteriorMat);
    cowl.position.set(0, groundClearance + 0.65, 0.4);
    group.add(cowl);

    // 3-Spoke M Steering Wheel with Center Roundel
    const steerGroup = new THREE.Group();
    steerGroup.position.set(-0.38, groundClearance + 0.65, 0.25);
    steerGroup.rotation.x = 0.45;
    const steerRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.018, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 })
    );
    steerGroup.add(steerRim);
    const steerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16), roundelMat);
    steerCap.rotation.x = Math.PI / 2;
    steerGroup.add(steerCap);
    group.add(steerGroup);

    // Center Console & Shifter
    const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.85), darkInteriorMat);
    consoleMesh.position.set(0, groundClearance + 0.45, -0.05);
    group.add(consoleMesh);

    // Two Sport Bucket Seats with M Shoulder Stripes
    [-0.38, 0.38].forEach((seatX) => {
      const seatGroup = new THREE.Group();
      seatGroup.position.set(seatX, groundClearance + 0.38, -0.22);

      // Seat Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.44), darkInteriorMat);
      seatGroup.add(base);

      // Bolstered Seat Back
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.16), darkInteriorMat);
      back.position.set(0, 0.28, -0.16);
      back.rotation.x = -0.12;
      seatGroup.add(back);

      // Headrest
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.12), darkInteriorMat);
      head.position.set(0, 0.54, -0.19);
      seatGroup.add(head);

      // M Tri-color tag on shoulder
      const tag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0x0099da }));
      tag.position.set(0.12, 0.44, -0.07);
      seatGroup.add(tag);

      group.add(seatGroup);
    });

    // 9. Aerodynamic M "Twin-Stalk" Wing Mirrors
    [-bodyWidth / 2 - 0.08, bodyWidth / 2 + 0.08].forEach((mx, mIdx) => {
      const mirrorGroup = new THREE.Group();
      mirrorGroup.position.set(mx, groundClearance + 0.74, 0.52);

      // Lower bridge stalk
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.04), glossBlackMat);
      mirrorGroup.add(s1);

      // Upper aerodynamic bridge winglet
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.03), glossBlackMat);
      s2.position.set(0, 0.075, -0.02);
      mirrorGroup.add(s2);

      // Mirror Housing
      const mHousing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.095, 0.08), carbonMat);
      mHousing.position.set(mIdx === 0 ? -0.06 : 0.06, 0.035, 0);
      mirrorGroup.add(mHousing);

      // Mirror Glass
      const mGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.08), chromeMat);
      mGlass.position.set(mIdx === 0 ? -0.06 : 0.06, 0.035, -0.045);
      mGlass.rotation.y = Math.PI;
      mirrorGroup.add(mGlass);

      group.add(mirrorGroup);
    });

    // 10. Rear Aerodynamic Trunk, Lip Spoiler, L-Shaped LED Taillights & Quad Exhausts
    const trunkDeck = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.9, 0.1, 0.72), bodyMat);
    trunkDeck.position.set(0, groundClearance + 0.62, -1.82);
    trunkDeck.castShadow = true;
    group.add(trunkDeck);

    // Integrated Carbon Lip Spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.88, 0.04, 0.16), carbonMat);
    spoiler.position.set(0, groundClearance + 0.68, -2.14);
    group.add(spoiler);

    // Rear Bumper Fascia
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.96, 0.42, 0.36), bodyMat);
    rearBumper.position.set(0, groundClearance + 0.38, -2.05);
    rearBumper.castShadow = true;
    group.add(rearBumper);

    // 3D L-Shaped Glowing LED Taillights
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });
    const tlSmoke = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.2,
      metalness: 0.8,
    });

    [-0.76, 0.76].forEach((tx, tIdx) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(tx, groundClearance + 0.52, -2.22);

      // Horizontal Bar
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.09, 0.04), tlMat);
      tGroup.add(hBar);

      // Vertical outer winglet hook
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.04), tlMat);
      vBar.position.set(tIdx === 0 ? -0.14 : 0.14, 0.03, 0);
      tGroup.add(vBar);

      // Smoked indicator strip
      const smoke = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.03), tlSmoke);
      smoke.position.set(0, -0.05, 0);
      tGroup.add(smoke);

      group.add(tGroup);
      taillightMeshes.push(hBar);
    });

    // Rear BMW Roundel
    const trunkRoundel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 24), roundelMat);
    trunkRoundel.rotation.x = Math.PI / 2;
    trunkRoundel.position.set(0, groundClearance + 0.55, -2.24);
    group.add(trunkRoundel);

    // Miniature M13 Competition Badge
    const m13Badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.015), chromeMat);
    m13Badge.position.set(0.48, groundClearance + 0.55, -2.24);
    group.add(m13Badge);

    // Real Solaria License Plate
    const plateTex = createLicensePlateTexture();
    const plateMat = new THREE.MeshStandardMaterial({
      map: plateTex,
      roughness: 0.3,
    });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.14), plateMat);
    plate.position.set(0, groundClearance + 0.32, -2.24);
    plate.rotation.y = Math.PI;
    group.add(plate);

    // Aggressive Gloss Black Rear Diffuser with 4 Vertical Aero Fins
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.22, 0.26), glossBlackMat);
    diffuser.position.set(0, groundClearance + 0.11, -2.12);
    group.add(diffuser);

    [-0.48, -0.18, 0.18, 0.48].forEach((fx) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.18, 0.32), glossBlackMat);
      fin.position.set(fx, groundClearance + 0.09, -2.12);
      group.add(fin);
    });

    // SIGNATURE BMW M QUAD EXHAUSTS (Twin dual chrome/stainless pipes)
    const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.26, 20);
    const innerBoreMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    [-0.64, -0.52, 0.52, 0.64].forEach((qx) => {
      const tip = new THREE.Mesh(exhaustGeo, chromeMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(qx, groundClearance + 0.12, -2.24);
      group.add(tip);

      const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), innerBoreMat);
      bore.rotation.x = Math.PI / 2;
      bore.position.set(qx, groundClearance + 0.12, -2.36);
      group.add(bore);
    });

    // 11. High-Performance Wheels & Drilled M Brakes
    const tireTex = createTireSidewallTexture();
    const tireSidewallMat = new THREE.MeshStandardMaterial({
      map: tireTex,
      roughness: 0.85,
    });
    const tireTreadMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });
    const rotorTex = createBrakeRotorTexture();
    const rotorMat = new THREE.MeshStandardMaterial({
      map: rotorTex,
      metalness: 0.92,
      roughness: 0.18,
    });
    const mCaliperMat = new THREE.MeshStandardMaterial({
      color: 0x0066cc, // BMW M Blue Brake Caliper
      metalness: 0.65,
      roughness: 0.2,
    });
    const alloyRimMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.94,
      roughness: 0.12,
    });
    const innerRimMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.85,
      roughness: 0.22,
    });

    const wheelWidth = 0.28;
    const xPositions = [-bodyWidth / 2 - 0.01, bodyWidth / 2 + 0.01];

    // FRONT WHEELS (Steerable)
    xPositions.forEach((wx, wIdx) => {
      const pivot = new THREE.Group();
      pivot.position.set(wx, groundClearance + wheelRadius - 0.04, frontWheelZ);

      const wGroup = new THREE.Group();

      // Tire Tread Outer Cylinder
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24), tireTreadMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      // Outer Tire Sidewall
      const sidewall = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.01, 24), tireSidewallMat);
      sidewall.rotation.z = Math.PI / 2;
      sidewall.position.x = wIdx === 0 ? -wheelWidth / 2 : wheelWidth / 2;
      wGroup.add(sidewall);

      // Deep Concave M Competition 10-Spoke Alloy Rim
      const rimBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius * 0.76, wheelRadius * 0.72, wheelWidth + 0.01, 20),
        alloyRimMat
      );
      rimBarrel.rotation.z = Math.PI / 2;
      wGroup.add(rimBarrel);

      // 5 Double-Spokes (10 total)
      for (let sp = 0; sp < 10; sp++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.026, wheelRadius * 0.74, wheelWidth * 0.8), innerRimMat);
        spoke.rotation.x = (sp * Math.PI) / 5;
        wGroup.add(spoke);
      }

      // BMW Center Cap with Roundel
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, wheelWidth + 0.02, 16), roundelMat);
      cap.rotation.z = Math.PI / 2;
      wGroup.add(cap);

      // Drilled Steel Brake Rotor
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.74, wheelRadius * 0.74, 0.03, 20), rotorMat);
      rotor.rotation.z = Math.PI / 2;
      rotor.position.x = wIdx === 0 ? 0.06 : -0.06;
      wGroup.add(rotor);

      // Electric Blue M Brake Caliper with Logo
      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.08), mCaliperMat);
      caliper.position.set(wIdx === 0 ? 0.06 : -0.06, 0.14, 0);
      wGroup.add(caliper);

      pivot.add(wGroup);
      frontWheelPivots.push(pivot);
      wheels.push(tire);
      group.add(pivot);
    });

    // REAR WHEELS (Fixed Heading, Wider Stance)
    xPositions.forEach((wx, wIdx) => {
      const rearGroup = new THREE.Group();
      rearGroup.position.set(wx, groundClearance + wheelRadius - 0.04, rearWheelZ);

      const wGroup = new THREE.Group();

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth + 0.02, 24), tireTreadMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      const sidewall = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.01, 24), tireSidewallMat);
      sidewall.rotation.z = Math.PI / 2;
      sidewall.position.x = wIdx === 0 ? -wheelWidth / 2 - 0.01 : wheelWidth / 2 + 0.01;
      wGroup.add(sidewall);

      const rimBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius * 0.76, wheelRadius * 0.72, wheelWidth + 0.02, 20),
        alloyRimMat
      );
      rimBarrel.rotation.z = Math.PI / 2;
      wGroup.add(rimBarrel);

      for (let sp = 0; sp < 10; sp++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.026, wheelRadius * 0.74, wheelWidth * 0.8), innerRimMat);
        spoke.rotation.x = (sp * Math.PI) / 5;
        wGroup.add(spoke);
      }

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, wheelWidth + 0.03, 16), roundelMat);
      cap.rotation.z = Math.PI / 2;
      wGroup.add(cap);

      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.74, wheelRadius * 0.74, 0.03, 20), rotorMat);
      rotor.rotation.z = Math.PI / 2;
      rotor.position.x = wIdx === 0 ? 0.06 : -0.06;
      wGroup.add(rotor);

      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.08), mCaliperMat);
      caliper.position.set(wIdx === 0 ? 0.06 : -0.06, 0.14, 0);
      wGroup.add(caliper);

      rearGroup.add(wGroup);
      wheels.push(tire);
      group.add(rearGroup);
    });

    // ================================================================
    // REAL-WORLD CAR CUSTOM BRANDING & STYLING OVERRIDES
    // ================================================================
    if (def.id === 'mustang_gt') {
      // 1. Dual racing stripes
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1 }); // Crisp White Stripes
      const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 2.5), stripeMat);
      stripeL.position.set(-0.16, groundClearance + 0.6, 1.0);
      stripeL.rotation.x = 0.09;
      group.add(stripeL);

      const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 2.5), stripeMat);
      stripeR.position.set(0.16, groundClearance + 0.6, 1.0);
      stripeR.rotation.x = 0.09;
      group.add(stripeR);

      // On roof
      const roofStripeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 1.2), stripeMat);
      roofStripeL.position.set(-0.16, groundClearance + 1.08, -0.32);
      group.add(roofStripeL);
      const roofStripeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 1.2), stripeMat);
      roofStripeR.position.set(0.16, groundClearance + 1.08, -0.32);
      group.add(roofStripeR);

      // Mustang Muscle front grille cover (Covers kidney grille with aggressive black mesh + chrome pony)
      const ponyGrille = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.3, 0.1), glossBlackMat);
      ponyGrille.position.set(0, groundClearance + 0.39, 2.26);
      group.add(ponyGrille);

      const ponyBadge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.02), chromeMat);
      ponyBadge.position.set(0, groundClearance + 0.39, 2.32);
      group.add(ponyBadge);
    }

    if (def.id === 'porsche_911') {
      // 1. Giant Swan-neck GT3 RS Rear Wing Spoiler
      const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.68, 0.12), glossBlackMat);
      strutL.position.set(-0.52, groundClearance + 0.88, -1.95);
      strutL.rotation.x = -0.25;
      group.add(strutL);

      const strutR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.68, 0.12), glossBlackMat);
      strutR.position.set(0.52, groundClearance + 0.88, -1.95);
      strutR.rotation.x = -0.25;
      group.add(strutR);

      const gtWing = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 1.05, 0.03, 0.44), bodyMat);
      gtWing.position.set(0, groundClearance + 1.2, -2.05);
      gtWing.rotation.x = -0.06;
      group.add(gtWing);

      const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.22, 0.48), glossBlackMat);
      endplateL.position.set(-bodyWidth * 1.05 / 2, groundClearance + 1.2, -2.05);
      group.add(endplateL);

      const endplateR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.22, 0.48), glossBlackMat);
      endplateR.position.set(bodyWidth * 1.05 / 2, groundClearance + 1.2, -2.05);
      group.add(endplateR);

      // 2. Oval/Round Headlight rings (typical Porsche look)
      const pLightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.8 });
      [-0.72, 0.72].forEach((px) => {
        const ovalL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), pLightMat);
        ovalL.rotation.x = Math.PI / 2 + 0.1;
        ovalL.position.set(px, groundClearance + 0.48, 2.18);
        group.add(ovalL);
      });
    }

    if (def.id === 'audi_r8') {
      // 1. Signature carbon-fiber Side Blades behind doors
      [-bodyWidth / 2 - 0.005, bodyWidth / 2 + 0.005].forEach((bx) => {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.55, 0.42), carbonMat);
        blade.position.set(bx, groundClearance + 0.42, -0.92);
        group.add(blade);
      });

      // 2. Visible mid-engine V10 cylinder block under the glass rear windshield
      const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.65), chromeMat);
      engineBlock.position.set(0, groundClearance + 0.48, -1.05);
      group.add(engineBlock);

      for (let c = -2; c <= 2; c++) {
        const cylL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8), glossBlackMat);
        cylL.rotation.z = Math.PI / 3;
        cylL.position.set(-0.16, groundClearance + 0.58, -1.05 + c * 0.12);
        group.add(cylL);

        const cylR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8), glossBlackMat);
        cylR.rotation.z = -Math.PI / 3;
        cylR.position.set(0.16, groundClearance + 0.58, -1.05 + c * 0.12);
        group.add(cylR);
      }
    }

    if (def.id === 'lambo_aventador') {
      // 1. High aggressive Aventador SVJ Spoiler
      const svjWing = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 1.08, 0.03, 0.38), carbonMat);
      svjWing.position.set(0, groundClearance + 0.88, -2.05);
      group.add(svjWing);

      const centralStrut = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.38, 0.06), carbonMat);
      centralStrut.position.set(0, groundClearance + 0.72, -1.98);
      centralStrut.rotation.x = -0.3;
      group.add(centralStrut);

      // Y-shaped headlight overlay to look like Lambo laser lights
      const yLightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      [-0.75, 0.75].forEach((lx, lIdx) => {
        const yStripe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.015), yLightMat);
        yStripe.position.set(lx, groundClearance + 0.42, 2.21);
        yStripe.rotation.z = lIdx === 0 ? 0.4 : -0.4;
        group.add(yStripe);
      });
    }

    if (def.id === 'tesla_plaid') {
      // 1. Sleek minimalist bumper cover (covers kidneys for grille-less EV face)
      const evNose = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.32, 0.08), bodyMat);
      evNose.position.set(0, groundClearance + 0.39, 2.26);
      group.add(evNose);

      // 2. Gloss black panoramic glass roof
      if (roof) {
        roof.material = glassMat;
      }
    }
  } else {
    // Other Vehicles (SUV, Truck, Taxi, Hauler)
    const bodyWidth = isTruck ? 2.3 : isSUV ? 2.2 : 2.0;
    const bodyLength = isTruck ? 5.2 : 4.4;
    const bodyHeight = isTruck ? 1.6 : isSUV ? 1.1 : isSupercar ? 0.6 : 0.8;

    const lowerGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
    const lowerBody = new THREE.Mesh(lowerGeo, bodyMat);
    lowerBody.position.y = 0.35 + bodyHeight / 2;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    group.add(lowerBody);
    mainBodyMesh = lowerBody;

    const cabinHeight = isTruck ? 1.1 : isSUV ? 0.9 : 0.65;
    const cabinLength = isTruck ? 2.4 : isSupercar ? 2.0 : 2.4;
    const cabinWidth = bodyWidth * 0.85;

    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, glossBlackMat);
    cabin.position.set(0, lowerBody.position.y + bodyHeight / 2 + cabinHeight / 2 - 0.05, isSupercar ? -0.2 : -0.1);
    cabin.castShadow = true;
    group.add(cabin);

    const windshieldGeo = new THREE.BoxGeometry(cabinWidth + 0.04, cabinHeight * 0.88, cabinLength * 0.92);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.copy(cabin.position);
    group.add(windshield);

    if (isTaxi) {
      const signGeo = new THREE.BoxGeometry(0.8, 0.25, 0.4);
      const signMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfef08a,
        emissiveIntensity: 0.8,
      });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, cabin.position.y + cabinHeight / 2 + 0.15, 0);
      group.add(sign);
    }

    const wheelRadius = isSUV ? 0.42 : isTruck ? 0.44 : 0.36;
    const wheelWidth = 0.26;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 12);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.18 });

    const xOffsets = [-bodyWidth / 2 - 0.02, bodyWidth / 2 + 0.02];
    const zOffsets = [bodyLength * 0.3, -bodyLength * 0.3];

    xOffsets.forEach((x) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, wheelRadius, zOffsets[0]);

      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      pivot.add(wheel);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      pivot.add(rim);

      frontWheelPivots.push(pivot);
      wheels.push(wheel);
      group.add(pivot);
    });

    xOffsets.forEach((x) => {
      const rearWheelGroup = new THREE.Group();
      rearWheelGroup.position.set(x, wheelRadius, zOffsets[1]);

      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      rearWheelGroup.add(wheel);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      rearWheelGroup.add(rim);

      wheels.push(wheel);
      group.add(rearWheelGroup);
    });

    const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });
    [-bodyWidth * 0.35, bodyWidth * 0.35].forEach((hx) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.08), hlMat);
      hl.position.set(hx, 0.65, bodyLength / 2 + 0.02);
      group.add(hl);
      headlightMeshes.push(hl);

      if (!options.isShowroom) {
        const spot = new THREE.SpotLight(0xffedd5, 1.8, 35, Math.PI / 5, 0.4, 1.5);
        spot.position.set(hx, 0.65, bodyLength / 2);
        spot.target.position.set(hx, 0, bodyLength / 2 + 20);
        group.add(spot);
        group.add(spot.target);
        headlights.push(spot);
      }
    });

    const tlMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6 });
    [-bodyWidth * 0.35, bodyWidth * 0.35].forEach((tx) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.08), tlMat);
      tl.position.set(tx, 0.68, -bodyLength / 2 - 0.02);
      group.add(tl);
      taillightMeshes.push(tl);
    });
  }

  // Nitro Exhaust Flame Mesh
  const flameGeo = new THREE.ConeGeometry(0.18, 0.8, 12);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.0,
  });
  const nitroFlame = new THREE.Mesh(flameGeo, flameMat);
  nitroFlame.rotation.x = -Math.PI / 2;
  nitroFlame.position.set(0, 0.38, -size.z / 2 - 0.45);
  group.add(nitroFlame);

  return {
    group,
    bodyMesh: mainBodyMesh!,
    frontWheelPivots,
    wheels,
    headlightMeshes,
    headlights,
    taillightMeshes,
    nitroFlame,
    size,
    hoodMesh: savedHoodMesh,
    frontBumperMesh: savedFrontBumperMesh,
  };
}
