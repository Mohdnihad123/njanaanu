import * as THREE from 'three';
import { CityWorld } from './CityWorld';
import { soundEngine } from '../audio/SoundEngine';

export interface TrafficCar {
  group: THREE.Group;
  speed: number;
  maxSpeed: number;
  direction: 'north' | 'south' | 'east' | 'west';
  roadCoord: number; // The fixed x or z of the lane
  braking: boolean;
  taillightMesh: THREE.Mesh;
}

export interface Pedestrian {
  id: string;
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  speed: number;
  direction: 'north' | 'south' | 'east' | 'west';
  animTimer: number;
  health: number;
  state: 'walking' | 'scared' | 'fighting' | 'knocked_out';
  lootDropped: boolean;
  vipType?: 'modiji' | 'pinarayi' | 'messi' | 'rasheed';
}

export interface MoneyEnvelope {
  group: THREE.Group;
  amount: number;
}

export interface PoliceCar {
  group: THREE.Group;
  lightL: THREE.PointLight;
  lightR: THREE.PointLight;
  lightBarMeshL: THREE.Mesh;
  lightBarMeshR: THREE.Mesh;
  speed: number;
  heading: number;
}

export class TrafficSystem {
  public scene: THREE.Scene;
  public cars: TrafficCar[] = [];
  public pedestrians: Pedestrian[] = [];
  public policeCars: PoliceCar[] = [];
  public moneyEnvelopes: MoneyEnvelope[] = [];

  private flasherTimer: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnTrafficCars(14);
    this.spawnPedestrians(24);
    this.spawnVIPs();
  }

  private spawnTrafficCars(count: number) {
    const lanesNS = [-137, -77, -17, 43, 103, 157]; // Northbound / Southbound lane offsets
    const lanesEW = [-137, -77, -17, 43, 103, 157]; // Eastbound / Westbound lane offsets
    const colors = [0x0284c7, 0xd97706, 0x475569, 0xdc2626, 0x16a34a, 0x64748b, 0xeab308];

    const carGeo = new THREE.BoxGeometry(1.9, 0.75, 4.0);
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.6, 2.2);
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 10);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b });

    for (let i = 0; i < count; i++) {
      const isNS = i % 2 === 0;
      const group = new THREE.Group();
      const col = colors[i % colors.length];

      // Lower body
      const bodyMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.4 });
      const body = new THREE.Mesh(carGeo, bodyMat);
      body.position.y = 0.65;
      body.castShadow = true;
      group.add(body);

      // Cabin
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 1.3, -0.2);
      group.add(cabin);

      // 4 Wheels
      [[-0.95, 0.35, 1.2], [0.95, 0.35, 1.2], [-0.95, 0.35, -1.2], [0.95, 0.35, -1.2]].forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, wy, wz);
        group.add(w);
      });

      // Taillight
      const tlMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.4 });
      const tlMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.05), tlMat);
      tlMesh.position.set(0, 0.7, -2.02);
      group.add(tlMesh);

      // Headlights
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const hlMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.05), hlMat);
      hlMesh.position.set(0, 0.7, 2.02);
      group.add(hlMesh);

      let direction: 'north' | 'south' | 'east' | 'west';
      let roadCoord = 0;
      const progress = (Math.random() - 0.5) * 320;

      if (isNS) {
        roadCoord = lanesNS[i % lanesNS.length];
        const headingNorth = i % 4 === 0;
        direction = headingNorth ? 'north' : 'south';
        group.position.set(roadCoord, 0, progress);
        group.rotation.y = headingNorth ? 0 : Math.PI;
      } else {
        roadCoord = lanesEW[i % lanesEW.length];
        const headingEast = i % 4 === 1;
        direction = headingEast ? 'east' : 'west';
        group.position.set(progress, 0, roadCoord);
        group.rotation.y = headingEast ? Math.PI / 2 : -Math.PI / 2;
      }

      this.scene.add(group);
      this.cars.push({
        group,
        speed: 12 + Math.random() * 8, // ~40-70 km/h
        maxSpeed: 12 + Math.random() * 8,
        direction,
        roadCoord,
        braking: false,
        taillightMesh: tlMesh,
      });
    }
  }

  private spawnPedestrians(count: number) {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 });
    const clothesColors = [0x0284c7, 0xef4444, 0x10b981, 0x8b5cf6, 0xf59e0b, 0x64748b];
    const sidewalkLines = [-146, -74, -14, 46, 106, 166];

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const col = clothesColors[i % clothesColors.length];
      const clothesMat = new THREE.MeshStandardMaterial({ color: col });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.25), clothesMat);
      torso.position.y = 0.9;
      group.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), skinMat);
      head.position.y = 1.35;
      group.add(head);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.16, 0.5, 0.16);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.set(-0.13, 0.35, 0);
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.set(0.13, 0.35, 0);
      group.add(rightLeg);

      // Arms
      const armGeo = new THREE.BoxGeometry(0.12, 0.48, 0.12);
      const leftArm = new THREE.Mesh(armGeo, skinMat);
      leftArm.position.set(-0.3, 0.85, 0);
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, skinMat);
      rightArm.position.set(0.3, 0.85, 0);
      group.add(rightArm);

      const isNS = i % 2 === 0;
      const walkCoord = sidewalkLines[i % sidewalkLines.length];
      const progress = (Math.random() - 0.5) * 300;

      if (isNS) {
        group.position.set(walkCoord, 0.25, progress);
        group.rotation.y = i % 4 === 0 ? 0 : Math.PI;
      } else {
        group.position.set(progress, 0.25, walkCoord);
        group.rotation.y = i % 4 === 1 ? Math.PI / 2 : -Math.PI / 2;
      }

      this.scene.add(group);
      this.pedestrians.push({
        id: 'ped_' + Math.random().toString(36).substr(2, 9),
        group,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        speed: 1.8 + Math.random() * 1.2,
        direction: isNS ? (i % 4 === 0 ? 'north' : 'south') : (i % 4 === 1 ? 'east' : 'west'),
        animTimer: Math.random() * Math.PI * 2,
        health: 100,
        state: 'walking',
        lootDropped: false,
      });
    }
  }

  private spawnVIPs() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 });

    // 1. Modiji
    {
      const group = new THREE.Group();
      // Saffron/Orange Kurta Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.62, 0.26), new THREE.MeshStandardMaterial({ color: 0xea580c }));
      torso.position.y = 0.9;
      group.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), skinMat);
      head.position.y = 1.35;
      group.add(head);

      // White Beard Mesh
      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      beard.position.set(0, 1.25, 0.13);
      group.add(beard);

      // White hair cap
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.08, 0.19), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      hair.position.set(0, 1.48, 0);
      group.add(hair);

      // White legs
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      leftLeg.position.set(-0.13, 0.35, 0);
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      rightLeg.position.set(0.13, 0.35, 0);
      group.add(rightLeg);

      // Orange sleeves / skin arms
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), skinMat);
      leftArm.position.set(-0.3, 0.85, 0);
      group.add(leftArm);

      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), skinMat);
      rightArm.position.set(0.3, 0.85, 0);
      group.add(rightArm);

      // Position in Central Plaza near Commercial area
      group.position.set(10, 0.25, -20);
      this.scene.add(group);

      this.pedestrians.push({
        id: 'vip_modiji',
        group,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        speed: 1.2, // majestic slow walk
        direction: 'east',
        animTimer: 0,
        health: 100,
        state: 'walking',
        lootDropped: false,
        vipType: 'modiji',
      });
    }

    // 2. Pinarayi
    {
      const group = new THREE.Group();
      // White shirt Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.25), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      torso.position.y = 0.9;
      group.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), skinMat);
      head.position.y = 1.35;
      group.add(head);

      // White hair
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.18), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
      hair.position.set(0, 1.48, 0);
      group.add(hair);

      // Black glasses spectacles bar
      const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.05), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      glasses.position.set(0, 1.38, 0.15);
      group.add(glasses);

      // White legs (representing mundu / dhoti)
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      leftLeg.position.set(-0.13, 0.35, 0);
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      rightLeg.position.set(0.13, 0.35, 0);
      group.add(rightLeg);

      // Sleeves / skin arms
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), skinMat);
      leftArm.position.set(-0.3, 0.85, 0);
      group.add(leftArm);

      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), skinMat);
      rightArm.position.set(0.3, 0.85, 0);
      group.add(rightArm);

      // Position near Waterfront Promenade / coastal area
      group.position.set(-30, 0.25, -20);
      this.scene.add(group);

      this.pedestrians.push({
        id: 'vip_pinarayi',
        group,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        speed: 1.3,
        direction: 'west',
        animTimer: 1.0,
        health: 100,
        state: 'walking',
        lootDropped: false,
        vipType: 'pinarayi',
      });
    }

    // 3. Messi
    {
      const group = new THREE.Group();
      // Neon Pink kit Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.25), new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 }));
      torso.position.y = 0.9;
      group.add(torso);

      // Back Number 10
      const numMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const num10 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.02), numMat);
      num10.position.set(0, 0.92, -0.14);
      group.add(num10);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), skinMat);
      head.position.y = 1.35;
      group.add(head);

      // Brown hair and beard
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.18), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
      hair.position.set(0, 1.48, 0);
      group.add(hair);

      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.06), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
      beard.position.set(0, 1.25, 0.14);
      group.add(beard);

      // Black shorts legs
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), new THREE.MeshStandardMaterial({ color: 0x09090b }));
      leftLeg.position.set(-0.13, 0.35, 0);
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), new THREE.MeshStandardMaterial({ color: 0x09090b }));
      rightLeg.position.set(0.13, 0.35, 0);
      group.add(rightLeg);

      // Pink arms
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), skinMat);
      leftArm.position.set(-0.3, 0.85, 0);
      group.add(leftArm);

      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), skinMat);
      rightArm.position.set(0.3, 0.85, 0);
      group.add(rightArm);

      // Position near Central Park
      group.position.set(50, 0.25, 10);
      this.scene.add(group);

      this.pedestrians.push({
        id: 'vip_messi',
        group,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        speed: 2.5, // fast jog athletic
        direction: 'north',
        animTimer: 2.0,
        health: 100,
        state: 'walking',
        lootDropped: false,
        vipType: 'messi',
      });
    }

    // 4. Rasheed
    {
      const group = new THREE.Group();
      // Green robe Kurta Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.25), new THREE.MeshStandardMaterial({ color: 0x15803d }));
      torso.position.y = 0.9;
      group.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), skinMat);
      head.position.y = 1.35;
      group.add(head);

      // White Kufi/Topi cap on top of head
      const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8), capMat);
      cap.position.set(0, 1.54, 0);
      group.add(cap);

      // White legs (pants)
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      leftLeg.position.set(-0.13, 0.35, 0);
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      rightLeg.position.set(0.13, 0.35, 0);
      group.add(rightLeg);

      // Sleeves
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), skinMat);
      leftArm.position.set(-0.3, 0.85, 0);
      group.add(leftArm);

      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), skinMat);
      rightArm.position.set(0.3, 0.85, 0);
      group.add(rightArm);

      // Position near docks / industrial docks or workshop
      group.position.set(-60, 0.25, -20);
      this.scene.add(group);

      this.pedestrians.push({
        id: 'vip_rasheed',
        group,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        speed: 1.6,
        direction: 'south',
        animTimer: 3.0,
        health: 100,
        state: 'walking',
        lootDropped: false,
        vipType: 'rasheed',
      });
    }
  }

  // -------------------------------------------------------------
  // Spawn Police Interceptor dynamically near the player
  // -------------------------------------------------------------
  public spawnPoliceCarNearPlayer(playerPos: THREE.Vector3) {
    const group = new THREE.Group();

    // Cop car color (Black and white styling)
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.8, 4.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3 }); // Black body
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.65;
    body.castShadow = true;
    group.add(body);

    // White doors plates on left & right sides
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.55, 1.8), doorMat);
    leftDoor.position.set(-1.06, 0.7, 0);
    group.add(leftDoor);

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.55, 1.8), doorMat);
    rightDoor.position.set(1.06, 0.7, 0);
    group.add(rightDoor);

    // White roof / cabin
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.65, 2.2);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.35, -0.2);
    group.add(cabin);

    // Flashing light bar on roof
    const barGeo = new THREE.BoxGeometry(1.2, 0.12, 0.22);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 1.74, -0.2);
    group.add(bar);

    const lightBarMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.2), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    lightBarMeshL.position.set(-0.3, 1.74, -0.2);
    group.add(lightBarMeshL);

    const lightBarMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.2), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    lightBarMeshR.position.set(0.3, 1.74, -0.2);
    group.add(lightBarMeshR);

    // Add glowing siren point lights
    const lightL = new THREE.PointLight(0xef4444, 2.5, 16);
    lightL.position.set(-0.3, 1.8, -0.2);
    group.add(lightL);

    const lightR = new THREE.PointLight(0x3b82f6, 2.5, 16);
    lightR.position.set(0.3, 1.8, -0.2);
    group.add(lightR);

    // 4 Cop wheels
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.25, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
    [[-1.02, 0.38, 1.22], [1.02, 0.38, 1.22], [-1.02, 0.38, -1.22], [1.02, 0.38, -1.22]].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, wy, wz);
      group.add(w);
    });

    // Spawn 60 to 95 units away on the road in a random direction
    const angle = Math.random() * Math.PI * 2;
    const dist = 65 + Math.random() * 30;
    const spawnX = Math.max(-250, Math.min(250, playerPos.x + Math.sin(angle) * dist));
    const spawnZ = Math.max(-250, Math.min(250, playerPos.z + Math.cos(angle) * dist));

    group.position.set(spawnX, 0, spawnZ);
    this.scene.add(group);

    this.policeCars.push({
      group,
      lightL,
      lightR,
      lightBarMeshL,
      lightBarMeshR,
      speed: 30, // Chasing Speed (Fast)
      heading: angle + Math.PI,
    });
  }

  // -------------------------------------------------------------
  // Spawn Money envelope loot at knocked out pedestrian
  // -------------------------------------------------------------
  public spawnMoneyLoot(pos: THREE.Vector3, amount?: number) {
    const envelopeGroup = new THREE.Group();

    // Visual envelope: green box with a smaller white stripe represent dollar bills bundle
    const bundleMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
    const bundle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.32), bundleMat);
    bundle.castShadow = true;
    envelopeGroup.add(bundle);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.17, 0.34), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    envelopeGroup.add(stripe);

    envelopeGroup.position.set(pos.x, 0.1, pos.z);
    this.scene.add(envelopeGroup);

    this.moneyEnvelopes.push({
      group: envelopeGroup,
      amount: amount !== undefined ? amount : (50 + Math.floor(Math.random() * 101)), // $50 - $150
    });
  }

  // -------------------------------------------------------------
  // Check combat punches from player
  // -------------------------------------------------------------
  public handlePlayerPunch(playerPos: THREE.Vector3, playerHeading: number, onHitPedestrian: (pedName: string) => void) {
    const punchRange = 2.4;
    // Compute punch forward sector
    const punchDir = new THREE.Vector3(Math.sin(playerHeading), 0, Math.cos(playerHeading));

    for (const ped of this.pedestrians) {
      if (ped.state === 'knocked_out') continue;

      const toPed = ped.group.position.clone().sub(playerPos);
      const dist = toPed.length();

      if (dist < punchRange) {
        toPed.normalize();
        const angleBetween = toPed.dot(punchDir);

        if (angleBetween > 0.45) {
          // Punch HIT!
          ped.health = Math.max(0, ped.health - 34); // 3 punches to KO
          soundEngine.playThunder(); // punch sound trigger!

          // Repel pedestrian slightly
          ped.group.position.addScaledVector(punchDir, 0.85);

          if (ped.health <= 0) {
            ped.state = 'knocked_out';
            onHitPedestrian('KNOCKED OUT');
          } else {
            ped.state = Math.random() < 0.5 ? 'fighting' : 'scared';
            onHitPedestrian('PUNCHED');
          }
          break;
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Primary update loop
  // -------------------------------------------------------------
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    cityWorld: CityWorld,
    wantedLevel: number = 0,
    isPlayerInCar: boolean = false,
    playerCarSpeed: number = 0,
    onWantedChange?: (newLevel: number) => void,
    onToastMessage?: (title: string, msg: string) => void
  ) {
    this.flasherTimer += delta * 15;

    // -------------------------------------------------------------
    // 1. Spawning / Despawning Cop Cars based on Wanted Levels
    // -------------------------------------------------------------
    const maxCopCars = Math.min(3, wantedLevel);
    if (wantedLevel > 0 && this.policeCars.length < maxCopCars) {
      if (Math.random() < delta * 0.4) {
        this.spawnPoliceCarNearPlayer(playerPos);
        if (onToastMessage) {
          onToastMessage('POLICE SIREN ALERT', 'Police units are pursuing you! Evade!');
        }
      }
    }

    // Clean police cars if wanted level is cleared
    if (wantedLevel === 0 && this.policeCars.length > 0) {
      this.policeCars.forEach((cop) => this.scene.remove(cop.group));
      this.policeCars = [];
    }

    // -------------------------------------------------------------
    // 2. Updating Police Chasers
    // -------------------------------------------------------------
    for (let i = this.policeCars.length - 1; i >= 0; i--) {
      const cop = this.policeCars[i];

      // Flashing Lightbars alternating red / blue
      const flashL = Math.sin(this.flasherTimer) > 0;
      cop.lightL.intensity = flashL ? 5 : 0.05;
      cop.lightR.intensity = !flashL ? 5 : 0.05;
      (cop.lightBarMeshL.material as THREE.MeshBasicMaterial).color.setHex(flashL ? 0xef4444 : 0x1e293b);
      (cop.lightBarMeshR.material as THREE.MeshBasicMaterial).color.setHex(!flashL ? 0x3b82f6 : 0x1e293b);

      // Track direction to player
      const dirToPlayer = playerPos.clone().sub(cop.group.position);
      const dist = dirToPlayer.length();

      // Despawn cop if too far away from player
      if (dist > 250) {
        this.scene.remove(cop.group);
        this.policeCars.splice(i, 1);
        continue;
      }

      dirToPlayer.normalize();
      cop.heading = Math.atan2(dirToPlayer.x, dirToPlayer.z);
      cop.group.rotation.y = cop.heading;

      // Accelerate towards player
      const currentSpeed = dist < 22 ? cop.speed * 0.72 : cop.speed;
      cop.group.position.addScaledVector(dirToPlayer, currentSpeed * delta);
    }

    // -------------------------------------------------------------
    // 3. Animating Money Envelopes Loop
    // -------------------------------------------------------------
    this.moneyEnvelopes.forEach((env) => {
      env.group.rotation.y += delta * 2.2;
      env.group.position.y = 0.2 + Math.sin(this.flasherTimer * 0.25) * 0.08;
    });

    // -------------------------------------------------------------
    // 4. Updating Traffic Cars (Signal violation tracking)
    // -------------------------------------------------------------
    for (const car of this.cars) {
      let shouldBrake = false;

      // Check distance to player
      const distToPlayer = car.group.position.distanceTo(playerPos);
      if (distToPlayer < 7.5) {
        shouldBrake = true;
      }

      // Check traffic lights at intersections
      for (const tl of cityWorld.trafficLights) {
        if (tl.state === 'red') {
          const distToLight = car.group.position.distanceTo(tl.mesh.position);
          if (distToLight < 15.0) {
            // Check if car heading is pointing towards the light to avoid stopping in the intersection
            shouldBrake = true;
            break;
          }
        }
      }

      // Check distance to car ahead
      for (const other of this.cars) {
        if (other !== car && other.direction === car.direction) {
          const dist = car.group.position.distanceTo(other.group.position);
          if (dist < 8.5) {
            shouldBrake = true;
            break;
          }
        }
      }

      if (shouldBrake) {
        car.speed = Math.max(0, car.speed - 35 * delta);
        car.braking = true;
      } else {
        car.speed = Math.min(car.maxSpeed, car.speed + 15 * delta);
        car.braking = false;
      }

      // Taillight glow
      const mat = car.taillightMesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = car.braking ? 1.6 : 0.4;

      // Movement
      const move = car.speed * delta;
      if (car.direction === 'north') {
        car.group.position.z += move;
        if (car.group.position.z > 220) car.group.position.z = -220;
      } else if (car.direction === 'south') {
        car.group.position.z -= move;
        if (car.group.position.z < -220) car.group.position.z = 220;
      } else if (car.direction === 'east') {
        car.group.position.x += move;
        if (car.group.position.x > 220) car.group.position.x = -220;
      } else if (car.direction === 'west') {
        car.group.position.x -= move;
        if (car.group.position.x < -220) car.group.position.x = 220;
      }
    }

    // -------------------------------------------------------------
    // 5. Updating Pedestrians (Walk, Fight, Flee, KO states)
    // -------------------------------------------------------------
    for (const ped of this.pedestrians) {
      if (ped.state === 'knocked_out') {
        // Drop money bundle loot once
        if (!ped.lootDropped) {
          let lootAmount = 50 + Math.floor(Math.random() * 101);
          if (ped.vipType === 'modiji') lootAmount = 1000;
          else if (ped.vipType === 'pinarayi') lootAmount = 1000;
          else if (ped.vipType === 'messi') lootAmount = 1500;
          else if (ped.vipType === 'rasheed') lootAmount = 800;

          this.spawnMoneyLoot(ped.group.position, lootAmount);
          ped.lootDropped = true;

          // Lay pedestrian flat on ground
          ped.group.rotation.x = Math.PI / 2;
          ped.group.position.y = 0.12;
          ped.leftLeg.rotation.set(0, 0, 0);
          ped.rightLeg.rotation.set(0, 0, 0);
          ped.leftArm.rotation.set(0, 0, 0);
          ped.rightArm.rotation.set(0, 0, 0);

          // Knocking out people increases Wanted Levels!
          if (onWantedChange && wantedLevel < 5) {
            onWantedChange(Math.min(5, wantedLevel + 1));
          }

          if (onToastMessage) {
            if (ped.vipType === 'modiji') {
              onToastMessage('MODIJI SPEAKS:', '"Mitron! Violence achieves nothing. Let us build a clean, unified world together! Sabka Saath, Sabka Vikas!"');
            } else if (ped.vipType === 'pinarayi') {
              onToastMessage('PINARAYI SPEAKS:', '"Lal Salaam comrade! Ensure absolute discipline and road traffic compliance in this region!"');
            } else if (ped.vipType === 'messi') {
              onToastMessage('LIONEL MESSI SPEAKS:', '"Qué mirás, bobo? Anda pa allá! We win the match together. Ankara Messi!"');
            } else if (ped.vipType === 'rasheed') {
              onToastMessage('RASHEED SPEAKS:', '"Sanam, everything is controlled under our master blueprint! Habibi, keep driving!"');
            } else {
              onToastMessage('CRIME COMMIT: Assault!', 'Assaulting pedestrians has raised your Wanted Level!');
            }
          }
        }
        continue;
      }

      ped.animTimer += delta * 8;
      const legSwing = Math.sin(ped.animTimer) * 0.45;

      ped.leftLeg.rotation.x = legSwing;
      ped.rightLeg.rotation.x = -legSwing;
      ped.leftArm.rotation.x = -legSwing;
      ped.rightArm.rotation.x = legSwing;

      // React to player distance / states
      const distToPlayer = ped.group.position.distanceTo(playerPos);

      // Running over pedestrians with car!
      if (isPlayerInCar && playerCarSpeed > 30 && distToPlayer < 2.6) {
        ped.health = 0;
        ped.state = 'knocked_out';
        soundEngine.playThunder(); // punch/collision sound

        // Push knocked out pedestrian forward
        const hitPush = new THREE.Vector3(
          Math.sin(ped.group.rotation.y),
          0,
          Math.cos(ped.group.rotation.y)
        ).multiplyScalar(-2.5);
        ped.group.position.add(hitPush);

        if (onWantedChange && wantedLevel < 5) {
          onWantedChange(Math.min(5, wantedLevel + 2));
          if (onToastMessage) {
            onToastMessage('CRIME: Vehicular Assault!', 'Running over pedestrians raised your Wanted Level!');
          }
        }
        continue;
      }

      if (ped.state === 'fighting') {
        // Rotate towards player and chase to punch!
        const toPlayer = playerPos.clone().sub(ped.group.position);
        toPlayer.y = 0;
        const chaseDist = toPlayer.length();

        if (chaseDist > 0.1) {
          toPlayer.normalize();
          ped.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
        }

        const fightSpeed = ped.speed * 1.5;
        ped.group.position.addScaledVector(toPlayer, fightSpeed * delta);

        // Punch player if extremely close
        if (chaseDist < 1.6) {
          // swing arm forward
          ped.rightArm.rotation.x = -1.2;
          if (Math.random() < delta * 2) {
            soundEngine.playThunder();
            if (onToastMessage) {
              onToastMessage('ATTACKED', 'An angry pedestrian hit you back!');
            }
            // Signal a health decrease to parent through some callbacks later
          }
        }
      } else if (ped.state === 'scared') {
        // Flee away from player
        const awayFromPlayer = ped.group.position.clone().sub(playerPos);
        awayFromPlayer.y = 0;
        awayFromPlayer.normalize();
        ped.group.rotation.y = Math.atan2(awayFromPlayer.x, awayFromPlayer.z);

        const fleeSpeed = ped.speed * 2.2;
        ped.group.position.addScaledVector(awayFromPlayer, fleeSpeed * delta);

        // Stop fleeing if player is far
        if (distToPlayer > 28) {
          ped.state = 'walking';
        }
      } else {
        // Standard walking movement
        const moveSpeed = distToPlayer < 6.0 ? ped.speed * 1.6 : ped.speed;
        const move = moveSpeed * delta;

        if (ped.direction === 'north') {
          ped.group.position.z += move;
          if (ped.group.position.z > 180) ped.group.position.z = -180;
        } else if (ped.direction === 'south') {
          ped.group.position.z -= move;
          if (ped.group.position.z < -180) ped.group.position.z = 180;
        } else if (ped.direction === 'east') {
          ped.group.position.x += move;
          if (ped.group.position.x > 180) ped.group.position.x = -180;
        } else if (ped.direction === 'west') {
          ped.group.position.x -= move;
          if (ped.group.position.x < -180) ped.group.position.x = 180;
        }
      }
    }
  }

  // Helper to remove all visual objects on clean up
  public dispose() {
    this.cars.forEach((car) => this.scene.remove(car.group));
    this.pedestrians.forEach((ped) => this.scene.remove(ped.group));
    this.policeCars.forEach((cop) => this.scene.remove(cop.group));
    this.moneyEnvelopes.forEach((env) => this.scene.remove(env.group));
    this.cars = [];
    this.pedestrians = [];
    this.policeCars = [];
    this.moneyEnvelopes = [];
  }
}
