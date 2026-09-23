import * as THREE from 'three';
import { WeatherType } from '../types/game';

export interface CityObstacle {
  box: THREE.Box3;
  type: 'building' | 'prop' | 'barrier';
}

/**
 * Procedural Realistic Skyscraper Facade Texture
 * Generates an architectural glass curtain-wall grid with reflective mullions,
 * floor spandrels, and illuminated office suites.
 */
function createSkyscraperFacadeTexture(baseColorHex: string, accentGlow: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Background tint
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, 512, 512);

  const cols = 16;
  const rows = 32;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    // Floor slab dividing band
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, r * cellH, 512, 2.5);

    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH + 2.5;
      const w = cellW - 2;
      const h = cellH - 3.5;

      // Window mullion border
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y, cellW, cellH);

      // Random office illumination (warm 3000K, cool daylight 5000K, or darkened/reflective glass)
      const rand = Math.sin(c * 17.3 + r * 31.7) * 10000;
      const state = rand - Math.floor(rand);

      if (state > 0.65) {
        // Illuminated Office Window
        ctx.fillStyle = state > 0.85 ? accentGlow : '#fef08a';
      } else if (state > 0.45) {
        // Soft white ambient
        ctx.fillStyle = '#e2e8f0';
      } else {
        // Dark reflective glass
        ctx.fillStyle = '#0a1120';
      }
      ctx.fillRect(x + 1, y + 1, w - 1, h - 1);

      // Subtle horizontal window blind/louver
      if (state > 0.75) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.fillRect(x + 1, y + 1, w - 1, 2);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Procedural Residential / Masonry Facade Texture
 */
function createResidentialFacadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm sandstone / limestone base
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 12;
  const rows = 16;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    // Cornice line
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, r * cellH, 512, 3);

    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;

      // Stone window frame surround
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 6, y + 6, cellW - 12, cellH - 10);

      // Window Glass
      const rand = Math.sin(c * 23.1 + r * 47.9) * 1000;
      const lit = rand - Math.floor(rand) > 0.55;
      ctx.fillStyle = lit ? '#fef08a' : '#0f172a';
      ctx.fillRect(x + 8, y + 8, cellW - 16, cellH - 14);

      // Window frame crossbar
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cellW / 2 - 1, y + 8, 2, cellH - 14);
      ctx.fillRect(x + 8, y + cellH / 2 - 1, cellW - 16, 2);

      // Stone sill ledge
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 4, y + cellH - 6, cellW - 8, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Procedural Ground-Floor Commercial Storefront Texture
 */
function createStorefrontTexture(storeName: string, brandColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Exterior dark granite surround
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);

  // Fascia Signboard
  ctx.fillStyle = brandColor;
  ctx.fillRect(16, 12, 480, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(storeName.toUpperCase(), 256, 30);

  // Large floor-to-ceiling glass display windows
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(20, 54, 210, 68);
  ctx.fillRect(282, 54, 210, 68);

  // Warm interior boutique light & mannequins
  ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
  ctx.fillRect(24, 58, 202, 60);
  ctx.fillRect(286, 58, 202, 60);

  // Double glass entrance door with push bars
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(234, 54, 44, 68);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(254, 54, 4, 68);
  ctx.fillRect(246, 85, 20, 4);

  return new THREE.CanvasTexture(canvas);
}

export class CityWorld {
  public scene: THREE.Scene;
  public obstacles: CityObstacle[] = [];
  public streetLights: THREE.PointLight[] = [];
  public trafficLights: { mesh: THREE.Mesh; state: 'green' | 'yellow' | 'red'; timer: number }[] = [];
  public windowMaterials: THREE.MeshStandardMaterial[] = [];
  public roadMaterial: THREE.MeshStandardMaterial | null = null;
  public waterMesh: THREE.Mesh | null = null;
  public rainParticles: THREE.Points | null = null;

  // Sky & Lighting
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;
  public skyMesh: THREE.Mesh;

  // Shared Architectural Materials
  private glassFacadeMat: THREE.MeshStandardMaterial;
  private blueFacadeMat: THREE.MeshStandardMaterial;
  private goldFacadeMat: THREE.MeshStandardMaterial;
  private residentialFacadeMat: THREE.MeshStandardMaterial;
  private concretePodiumMat: THREE.MeshStandardMaterial;
  private roofMechMat: THREE.MeshStandardMaterial;
  private metalTrimMat: THREE.MeshStandardMaterial;

  // Time & Weather state
  private timeOfDay: number = 14.0; // 14:00 (2:00 PM)
  private currentWeather: WeatherType = 'sunny';
  private lightningTimer: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Realistic Daylight Lighting Setup with Crisp Sunlight & Soft Ambient Skylight
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.48);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.52);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.85);
    this.sunLight.position.set(110, 160, 90);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 420;
    const d = 120;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.00012;
    this.sunLight.shadow.normalBias = 0.05;
    this.scene.add(this.sunLight.target);
    this.scene.add(this.sunLight);

    // Vibrant Atmospheric Sky Dome
    const skyGeo = new THREE.SphereGeometry(650, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    // Atmospheric distance fog
    this.scene.fog = new THREE.FogExp2(0xcfe8ff, 0.0013);

    // Initialize Shared Procedural Materials
    const darkGlassTex = createSkyscraperFacadeTexture('#0f172a', '#38bdf8');
    this.glassFacadeMat = new THREE.MeshStandardMaterial({
      map: darkGlassTex,
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.2,
    });
    this.windowMaterials.push(this.glassFacadeMat);

    const blueGlassTex = createSkyscraperFacadeTexture('#0369a1', '#67e8f9');
    this.blueFacadeMat = new THREE.MeshStandardMaterial({
      map: blueGlassTex,
      metalness: 0.9,
      roughness: 0.12,
      emissive: 0x67e8f9,
      emissiveIntensity: 0.25,
    });
    this.windowMaterials.push(this.blueFacadeMat);

    const goldGlassTex = createSkyscraperFacadeTexture('#78350f', '#fde047');
    this.goldFacadeMat = new THREE.MeshStandardMaterial({
      map: goldGlassTex,
      metalness: 0.88,
      roughness: 0.18,
      emissive: 0xfde047,
      emissiveIntensity: 0.22,
    });
    this.windowMaterials.push(this.goldFacadeMat);

    const resTex = createResidentialFacadeTexture();
    this.residentialFacadeMat = new THREE.MeshStandardMaterial({
      map: resTex,
      metalness: 0.2,
      roughness: 0.7,
      emissive: 0xfef08a,
      emissiveIntensity: 0.15,
    });
    this.windowMaterials.push(this.residentialFacadeMat);

    this.concretePodiumMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Clean architectural stone / concrete
      roughness: 0.55,
      metalness: 0.2,
    });

    this.roofMechMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Galvanized metal & industrial grey
      roughness: 0.5,
      metalness: 0.6,
    });

    this.metalTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.85,
    });

    this.buildCity();
    this.buildRainSystem();
  }

  private buildCity() {
    this.buildTerrainAndWater();
    this.buildRoadNetwork();
    this.buildDowntownSkyscrapers();
    this.buildCommercialDistrict();
    this.buildWaterfrontAndMarina();
    this.buildIndustrialDocks();
    this.buildCentralPark();
    this.buildBridgeAndHighways();
    this.buildUrbanProps();
    this.buildInteractiveLandmarks();
  }

  private buildTerrainAndWater() {
    const groundGeo = new THREE.PlaneGeometry(700, 700);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x14532d, // Lush green turf
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Ocean Water plane along west and south coast
    const waterGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.85,
      roughness: 0.12,
      transparent: true,
      opacity: 0.88,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(-180, -0.6, 0);
    this.scene.add(this.waterMesh);
  }

  private buildRoadNetwork() {
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 512;
    roadCanvas.height = 512;
    const ctx = roadCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#181b20';
      ctx.fillRect(0, 0, 512, 512);

      // Fine aggregate texture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 4000; i++) {
        const rx = Math.random() * 512;
        const ry = Math.random() * 512;
        ctx.fillRect(rx, ry, 1.5, 1.5);
      }

      // Yellow double center line
      ctx.fillStyle = '#eab308';
      ctx.fillRect(250, 0, 4, 512);
      ctx.fillRect(258, 0, 4, 512);

      // Outer white lane boundary stripes
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(35, 0, 6, 512);
      ctx.fillRect(471, 0, 6, 512);

      // Dashed lane divider markers
      ctx.fillStyle = '#f8fafc';
      for (let y = 15; y < 512; y += 48) {
        ctx.fillRect(142, y, 4, 28);
        ctx.fillRect(366, y, 4, 28);
      }
    }

    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 12);

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.68,
      metalness: 0.15,
    });

    const avenues = [-130, -70, -10, 50, 110];
    const streets = [-130, -70, -10, 50, 110];

    // North-South Avenues
    avenues.forEach((x) => {
      const roadGeo = new THREE.PlaneGeometry(16, 280);
      const road = new THREE.Mesh(roadGeo, this.roadMaterial!);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.02, 0);
      road.receiveShadow = true;
      this.scene.add(road);
    });

    // East-West Streets
    streets.forEach((z) => {
      const roadGeo = new THREE.PlaneGeometry(16, 280);
      const road = new THREE.Mesh(roadGeo, this.roadMaterial!);
      road.rotation.x = -Math.PI / 2;
      road.rotation.z = Math.PI / 2;
      road.position.set(0, 0.02, z);
      road.receiveShadow = true;
      this.scene.add(road);
    });

    // Intersections with Zebra Crosswalks
    const crosswalkCanvas = document.createElement('canvas');
    crosswalkCanvas.width = 512;
    crosswalkCanvas.height = 512;
    const cctx = crosswalkCanvas.getContext('2d');
    if (cctx) {
      cctx.fillStyle = '#181b20';
      cctx.fillRect(0, 0, 512, 512);
      cctx.fillStyle = '#ffffff';

      // 4 border crosswalks
      for (let x = 60; x <= 450; x += 36) {
        cctx.fillRect(x, 15, 20, 50);
        cctx.fillRect(x, 447, 20, 50);
      }
      for (let y = 60; y <= 450; y += 36) {
        cctx.fillRect(15, y, 50, 20);
        cctx.fillRect(447, y, 50, 20);
      }

      // Stop lines
      cctx.fillStyle = '#f8fafc';
      cctx.fillRect(60, 72, 392, 6);
      cctx.fillRect(60, 434, 392, 6);
      cctx.fillRect(72, 60, 6, 392);
      cctx.fillRect(434, 60, 6, 392);

      const crosswalkTex = new THREE.CanvasTexture(crosswalkCanvas);
      const crosswalkMat = new THREE.MeshStandardMaterial({
        map: crosswalkTex,
        roughness: 0.7,
        metalness: 0.15,
      });

      const intGeo = new THREE.PlaneGeometry(16.2, 16.2);
      avenues.forEach((ax) => {
        streets.forEach((sz) => {
          const intMesh = new THREE.Mesh(intGeo, crosswalkMat);
          intMesh.rotation.x = -Math.PI / 2;
          intMesh.position.set(ax, 0.03, sz);
          intMesh.receiveShadow = true;
          this.scene.add(intMesh);
        });
      });
    }

    // Concrete Sidewalks & Curbs
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.6,
      metalness: 0.1,
    });
    const innerLawnMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.9,
    });

    for (let i = 0; i < avenues.length - 1; i++) {
      for (let j = 0; j < streets.length - 1; j++) {
        const x1 = avenues[i] + 8;
        const x2 = avenues[i + 1] - 8;
        const z1 = streets[j] + 8;
        const z2 = streets[j + 1] - 8;
        const width = x2 - x1;
        const depth = z2 - z1;
        const cx = (x1 + x2) / 2;
        const cz = (z1 + z2) / 2;

        const block = new THREE.Mesh(new THREE.BoxGeometry(width, 0.28, depth), sidewalkMat);
        block.position.set(cx, 0.14, cz);
        block.castShadow = true;
        block.receiveShadow = true;
        this.scene.add(block);

        // Plant realistic sidewalk street trees along outer sidewalk perimeter!
        if (width > 16 && depth > 16) {
          // Inner courtyard lawn
          const lawn = new THREE.Mesh(new THREE.BoxGeometry(width - 6, 0.06, depth - 6), innerLawnMat);
          lawn.position.set(cx, 0.29, cz);
          lawn.receiveShadow = true;
          this.scene.add(lawn);

          // Place 2-4 realistic broadleaf street trees along sidewalk edges
          const treeOffsets = [
            [cx - width / 2 + 3, cz - depth / 2 + 4],
            [cx + width / 2 - 3, cz + depth / 2 - 4],
          ];
          treeOffsets.forEach(([tx, tz]) => {
            // Don't plant inside buildings
            if (Math.abs(tx) > 5 || Math.abs(tz) > 5) {
              const tree = this.createRealisticBroadleafTree(6.5, 3.2, tx + tz);
              tree.position.set(tx, 0.28, tz);
              this.scene.add(tree);
            }
          });
        }
      }
    }
  }

  /**
   * Builds an architecturally realistic 3D building complete with:
   * - Ground-floor double-height glass lobby with structural columns & entrance canopy
   * - Tiered setbacks and balconies
   * - Realistic facade window textures
   * - Rooftop mechanical penthouse, AC chiller fans, water tower & aviation beacon
   */
  public addRealisticBuilding(config: {
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    style: 'glass_blue' | 'glass_dark' | 'glass_gold' | 'residential';
    name?: string;
    hasWaterTower?: boolean;
    hasSpire?: boolean;
  }) {
    const { x, z, width, depth, height, style, name, hasWaterTower = true, hasSpire = false } = config;
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    let facadeMat = this.blueFacadeMat;
    if (style === 'glass_dark') facadeMat = this.glassFacadeMat;
    if (style === 'glass_gold') facadeMat = this.goldFacadeMat;
    if (style === 'residential') facadeMat = this.residentialFacadeMat;

    // 1. Street-Level Podium / Grand Glass Lobby (Height: 5.5m)
    const podiumHeight = 5.5;
    const podiumGeo = new THREE.BoxGeometry(width, podiumHeight, depth);
    const podium = new THREE.Mesh(podiumGeo, this.concretePodiumMat);
    podium.position.y = podiumHeight / 2;
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);

    // Front Glass Lobby Wall & Entrance
    const lobbyGlassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, podiumHeight * 0.8, 0.1), lobbyGlassMat);
    lobbyGlass.position.set(0, podiumHeight / 2, depth / 2 + 0.05);
    group.add(lobbyGlass);

    // Cantilevered Stainless Entrance Canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.35, 3.2), this.metalTrimMat);
    canopy.position.set(0, 4.2, depth / 2 + 1.6);
    canopy.castShadow = true;
    group.add(canopy);

    // Revolving Door Entrance
    const doorCylinder = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.8, 16), this.metalTrimMat);
    doorCylinder.position.set(0, 1.4, depth / 2 + 0.1);
    group.add(doorCylinder);

    // 2. Main Tower Shaft with Architectural Setback
    const shaftHeight = height - podiumHeight - 3;
    const setback = height > 50 ? 1.5 : 0.5;
    const towerWidth = width - setback;
    const towerDepth = depth - setback;

    const towerGeo = new THREE.BoxGeometry(towerWidth, shaftHeight, towerDepth);
    const tower = new THREE.Mesh(towerGeo, facadeMat);
    tower.position.y = podiumHeight + shaftHeight / 2;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Architectural Corner Buttress Pilasters with 3D relief depth
    [-towerWidth / 2, towerWidth / 2].forEach((cx) => {
      [-towerDepth / 2, towerDepth / 2].forEach((cz) => {
        // Deep corner concrete column
        const cornerPillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, shaftHeight + 0.4, 0.85),
          this.concretePodiumMat
        );
        cornerPillar.position.set(cx, podiumHeight + shaftHeight / 2, cz);
        cornerPillar.castShadow = true;
        cornerPillar.receiveShadow = true;
        group.add(cornerPillar);

        // Architectural Vertical Mullion Fin
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.45, shaftHeight, 0.45), this.metalTrimMat);
        fin.position.set(cx, podiumHeight + shaftHeight / 2, cz);
        fin.castShadow = true;
        fin.receiveShadow = true;
        group.add(fin);
      });
    });

    // Horizontal Architectural Cornices Wrapping Building Corners (Floor Slabs)
    const floorSlabCount = Math.floor(shaftHeight / 7);
    for (let f = 1; f < floorSlabCount; f++) {
      const fy = podiumHeight + f * 7;
      const cornice = new THREE.Mesh(
        new THREE.BoxGeometry(towerWidth + 0.5, 0.35, towerDepth + 0.5),
        this.metalTrimMat
      );
      cornice.position.y = fy;
      cornice.castShadow = true;
      cornice.receiveShadow = true;
      group.add(cornice);
    }

    // 3. Realistic Rooftop Mechanical Penthouse & Detailing
    const roofY = podiumHeight + shaftHeight;

    // Perimeter Roof Safety Parapet Wall (0.9m) with Coping Stones
    const parapetGeo = new THREE.BoxGeometry(towerWidth + 0.2, 0.9, towerDepth + 0.2);
    const parapet = new THREE.Mesh(parapetGeo, this.concretePodiumMat);
    parapet.position.set(0, roofY + 0.45, 0);
    parapet.castShadow = true;
    parapet.receiveShadow = true;
    group.add(parapet);

    // Central Elevator Overrun & Mechanical Penthouse
    const penthouseW = towerWidth * 0.45;
    const penthouseD = towerDepth * 0.45;
    const penthouseH = 4.2;
    const penthouse = new THREE.Mesh(new THREE.BoxGeometry(penthouseW, penthouseH, penthouseD), this.roofMechMat);
    penthouse.position.set(0, roofY + penthouseH / 2, 0);
    penthouse.castShadow = true;
    penthouse.receiveShadow = true;
    group.add(penthouse);

    // Industrial AC Chiller Units with Circular Fans
    [-penthouseW / 2 - 2, penthouseW / 2 + 2].forEach((chillerX) => {
      const chiller = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 3.2), this.roofMechMat);
      chiller.position.set(chillerX, roofY + 0.9, 0);
      chiller.castShadow = true;
      chiller.receiveShadow = true;
      group.add(chiller);

      // Fan Guard Grate on top
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
      );
      fan.position.set(chillerX, roofY + 1.85, 0);
      fan.castShadow = true;
      fan.receiveShadow = true;
      group.add(fan);
    });

    // Cylindrical Rooftop Water Storage Tank on Steel Truss
    if (hasWaterTower) {
      const tankGroup = new THREE.Group();
      tankGroup.position.set(0, roofY, -towerDepth * 0.25);

      // Wooden/Galvanized cylindrical tank
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 3.2, 16), tankMat);
      tank.position.y = 3.6;
      tank.castShadow = true;
      tank.receiveShadow = true;
      tankGroup.add(tank);

      // Conical roof cap
      const cap = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.2, 16), this.metalTrimMat);
      cap.position.y = 5.8;
      cap.castShadow = true;
      cap.receiveShadow = true;
      tankGroup.add(cap);

      // Steel support legs
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 6), this.roofMechMat);
        leg.position.set(Math.cos(a) * 1.4, 1.0, Math.sin(a) * 1.4);
        leg.castShadow = true;
        leg.receiveShadow = true;
        tankGroup.add(leg);
      }
      group.add(tankGroup);
    }

    // High Spire & Red Aviation Obstruction Warning Light
    if (hasSpire || height > 65) {
      const spireH = 16;
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1.0, spireH, 8), this.roofMechMat);
      spire.position.set(0, roofY + penthouseH + spireH / 2, 0);
      group.add(spire);

      // Blinking red aviation hazard beacon
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beacon.position.set(0, roofY + penthouseH + spireH, 0);
      group.add(beacon);

      const beaconLight = new THREE.PointLight(0xef4444, 2.0, 50);
      beaconLight.position.set(0, roofY + penthouseH + spireH, 0);
      group.add(beaconLight);
    }

    // Illuminated Architectural Signboard (if named)
    if (name) {
      const signTex = createStorefrontTexture(name, '#0284c7');
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.7, 3.2), signMat);
      signMesh.position.set(0, 4.8, depth / 2 + 0.1);
      group.add(signMesh);
    }

    this.scene.add(group);

    // Collision Box
    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, height / 2, z), new THREE.Vector3(width, height, depth));
    this.obstacles.push({ box, type: 'building' });

    return group;
  }

  /**
   * Generates a realistic 3D broadleaf tree (Oak/Maple)
   * with organic tapering trunk, branching scaffold boughs,
   * multi-layered volumetric foliage canopy, and cast-iron sidewalk grate.
   */
  public createRealisticBroadleafTree(height: number = 6.5, canopyRadius: number = 3.2, seed: number = 0): THREE.Group {
    const tree = new THREE.Group();

    // Organic Bark Material with natural vertical roughness
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x422006, // Deep rich earth bark
      roughness: 0.92,
      metalness: 0.08,
    });

    // Lush Foliage Materials with realistic chlorophyll gradations
    const foliageMat1 = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Deep Emerald Leaf
      roughness: 0.85,
    });
    const foliageMat2 = new THREE.MeshStandardMaterial({
      color: 0x166534, // Forest Canopy
      roughness: 0.9,
    });
    const foliageMat3 = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Sunlit Foliage Tip
      roughness: 0.8,
    });

    // 1. Tapering Gnarled Trunk with Natural Root Flare
    const trunkHeight = height * 0.55;
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.44, trunkHeight, 10);
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Root flares spreading into the ground
    for (let r = 0; r < 4; r++) {
      const angle = (r * Math.PI) / 2 + 0.3;
      const root = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 6), barkMat);
      root.position.set(Math.cos(angle) * 0.32, 0.35, Math.sin(angle) * 0.32);
      root.rotation.z = Math.cos(angle) * -0.3;
      root.rotation.x = Math.sin(angle) * 0.3;
      root.castShadow = true;
      root.receiveShadow = true;
      tree.add(root);
    }

    // 2. Primary & Secondary Branching Boughs
    const branchAngles = [
      { az: 0.2, el: 0.75, len: 1.8, thick: 0.16 },
      { az: 2.1, el: 0.65, len: 1.9, thick: 0.15 },
      { az: 4.2, el: 0.8, len: 1.7, thick: 0.14 },
    ];

    branchAngles.forEach((b) => {
      const branchGeo = new THREE.CylinderGeometry(0.08, b.thick, b.len, 8);
      const branch = new THREE.Mesh(branchGeo, barkMat);
      const bx = Math.cos(b.az) * 0.5;
      const bz = Math.sin(b.az) * 0.5;
      branch.position.set(bx, trunkHeight - 0.2, bz);
      branch.rotation.y = b.az;
      branch.rotation.z = Math.cos(b.az) * b.el;
      branch.rotation.x = Math.sin(b.az) * -b.el;
      branch.castShadow = true;
      branch.receiveShadow = true;
      tree.add(branch);
    });

    // 3. Volumetric Multi-Clustered Canopy (9 organic foliage masses with inter-canopy shadowing)
    const clusterPositions = [
      { x: 0, y: height * 0.88, z: 0, rad: canopyRadius * 0.85, mat: foliageMat1, sx: 1.0, sy: 0.9, sz: 1.0 },
      { x: canopyRadius * 0.52, y: height * 0.72, z: canopyRadius * 0.3, rad: canopyRadius * 0.65, mat: foliageMat2, sx: 1.05, sy: 0.85, sz: 0.95 },
      { x: -canopyRadius * 0.48, y: height * 0.74, z: canopyRadius * 0.25, rad: canopyRadius * 0.68, mat: foliageMat1, sx: 0.95, sy: 0.9, sz: 1.05 },
      { x: canopyRadius * 0.2, y: height * 0.78, z: -canopyRadius * 0.52, rad: canopyRadius * 0.72, mat: foliageMat3, sx: 1.0, sy: 0.88, sz: 1.0 },
      { x: -canopyRadius * 0.35, y: height * 0.82, z: -canopyRadius * 0.35, rad: canopyRadius * 0.62, mat: foliageMat2, sx: 1.1, sy: 0.9, sz: 0.9 },
      { x: 0, y: height * 1.06, z: 0, rad: canopyRadius * 0.55, mat: foliageMat3, sx: 0.95, sy: 0.85, sz: 0.95 },
      { x: canopyRadius * 0.38, y: height * 0.92, z: -canopyRadius * 0.15, rad: canopyRadius * 0.58, mat: foliageMat1, sx: 1.0, sy: 0.92, sz: 1.0 },
      { x: -canopyRadius * 0.22, y: height * 0.96, z: canopyRadius * 0.32, rad: canopyRadius * 0.52, mat: foliageMat2, sx: 1.02, sy: 0.88, sz: 1.02 },
      { x: 0, y: height * 0.68, z: 0, rad: canopyRadius * 0.7, mat: foliageMat1, sx: 1.1, sy: 0.75, sz: 1.1 },
    ];

    clusterPositions.forEach((cp) => {
      const folGeo = new THREE.DodecahedronGeometry(cp.rad, 1);
      const folMesh = new THREE.Mesh(folGeo, cp.mat);
      folMesh.position.set(cp.x, cp.y, cp.z);
      folMesh.scale.set(cp.sx, cp.sy, cp.sz);
      folMesh.castShadow = true;
      folMesh.receiveShadow = true;
      tree.add(folMesh);
    });

    // 4. Cast-Iron Sidewalk Tree Grate with Radial Slots
    const grateGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.04, 16);
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    const grate = new THREE.Mesh(grateGeo, grateMat);
    grate.position.y = 0.02;
    grate.receiveShadow = true;
    tree.add(grate);

    return tree;
  }

  /**
   * Generates a realistic Coastal Date Palm
   * with curved segmented trunk, crown shaft, arching 3D fan fronds, and coconuts.
   */
  public createRealisticPalmTree(height: number = 8.5, leanAngle: number = 0.09, seed: number = 0): THREE.Group {
    const palm = new THREE.Group();

    const palmTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Fibrous palm bark
      roughness: 0.9,
    });
    const palmFrondMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Vibrant palm green
      roughness: 0.65,
    });
    const coconutMat = new THREE.MeshStandardMaterial({
      color: 0x582f0e,
      roughness: 0.8,
    });

    // 1. Organic Segmented Curving Trunk
    const segments = 6;
    const segH = height / segments;
    let currX = 0;
    let currY = 0;
    let currZ = 0;

    for (let s = 0; s < segments; s++) {
      const bottomR = 0.42 - s * 0.035;
      const topR = 0.42 - (s + 1) * 0.035;
      const segGeo = new THREE.CylinderGeometry(topR, bottomR, segH, 8);
      const seg = new THREE.Mesh(segGeo, palmTrunkMat);

      seg.position.set(currX, currY + segH / 2, currZ);
      seg.rotation.z = leanAngle * (s + 1) * 0.4;
      seg.castShadow = true;
      seg.receiveShadow = true;
      palm.add(seg);

      currX += Math.sin(leanAngle * (s + 1) * 0.4) * (segH * 0.4);
      currY += segH;
    }

    // 2. Crown Shaft
    const crownY = currY;
    const crownX = currX;
    const crownZ = currZ;

    // 3. Arching 3D Feather-Frond Leaves (12 fronds arranged radially)
    const frondCount = 12;
    for (let f = 0; f < frondCount; f++) {
      const az = (f * Math.PI * 2) / frondCount;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(crownX, crownY, crownZ);
      frondGroup.rotation.y = az;

      // Central arched leaf rib
      const leafRib = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.06, 4.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x65a30d })
      );
      leafRib.position.set(0, 1.8, 1.6);
      leafRib.rotation.x = 0.95;
      leafRib.castShadow = true;
      leafRib.receiveShadow = true;
      frondGroup.add(leafRib);

      // Drooping fan leaves
      const fanLeaf = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.2, 4), palmFrondMat);
      fanLeaf.position.set(0, 1.6, 2.0);
      fanLeaf.rotation.x = 1.05;
      fanLeaf.castShadow = true;
      fanLeaf.receiveShadow = true;
      frondGroup.add(fanLeaf);

      palm.add(frondGroup);
    }

    // 4. Clustered Coconuts under the crown
    for (let c = 0; c < 4; c++) {
      const cAz = (c * Math.PI) / 2;
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), coconutMat);
      nut.position.set(crownX + Math.cos(cAz) * 0.35, crownY - 0.25, crownZ + Math.sin(cAz) * 0.35);
      nut.castShadow = true;
      nut.receiveShadow = true;
      palm.add(nut);
    }

    return palm;
  }

  private buildDowntownSkyscrapers() {
    // 1. SOLARIA APEX (Landmark Supertall Glass Skyscraper, 98m)
    this.addRealisticBuilding({
      x: 0,
      z: 0,
      width: 26,
      depth: 26,
      height: 98,
      style: 'glass_blue',
      name: 'SOLARIA APEX',
      hasSpire: true,
      hasWaterTower: false,
    });

    // 2. VERTEX TOWER (Contemporary Tiered Corporate High-Rise, 74m)
    this.addRealisticBuilding({
      x: -50,
      z: 10,
      width: 24,
      depth: 22,
      height: 74,
      style: 'glass_dark',
      name: 'VERTEX TOWER',
      hasSpire: true,
      hasWaterTower: true,
    });

    // 3. GLOBAL CAPITAL (Grand Gold Reflective Financial Tower, 64m)
    this.addRealisticBuilding({
      x: 50,
      z: 10,
      width: 22,
      depth: 24,
      height: 64,
      style: 'glass_gold',
      name: 'GLOBAL CAPITAL',
      hasSpire: false,
      hasWaterTower: true,
    });

    // 4. NOVA FINANCIAL (Twin-Core Glass High-Rise, 80m)
    this.addRealisticBuilding({
      x: 10,
      z: 70,
      width: 24,
      depth: 22,
      height: 80,
      style: 'glass_blue',
      name: 'NOVA FINANCIAL',
      hasSpire: true,
      hasWaterTower: false,
    });

    // 5. METROPOLIS TOWER (56m)
    this.addRealisticBuilding({
      x: -50,
      z: 70,
      width: 22,
      depth: 22,
      height: 56,
      style: 'glass_dark',
      name: 'METROPOLIS',
      hasWaterTower: true,
    });

    // 6. PACIFIC HEIGHTS (60m)
    this.addRealisticBuilding({
      x: 50,
      z: 70,
      width: 22,
      depth: 22,
      height: 60,
      style: 'residential',
      name: 'PACIFIC HEIGHTS',
      hasWaterTower: true,
    });
  }

  private buildCommercialDistrict() {
    // Shopping, Dining & Tuning Pavilions with Realistic Storefronts
    this.addRealisticBuilding({
      x: -60,
      z: -40,
      width: 24,
      depth: 20,
      height: 18,
      style: 'residential',
      name: 'NITRO PERFORMANCE TUNING',
      hasWaterTower: true,
    });

    this.addRealisticBuilding({
      x: -120,
      z: -80,
      width: 24,
      depth: 20,
      height: 16,
      style: 'glass_gold',
      name: 'HORIZON GRAND DINER',
      hasWaterTower: false,
    });

    this.addRealisticBuilding({
      x: 80,
      z: -40,
      width: 26,
      depth: 22,
      height: 20,
      style: 'glass_blue',
      name: 'APEX AUTOHAUS SERVICE',
      hasWaterTower: true,
    });

    this.addRealisticBuilding({
      x: 40,
      z: 60,
      width: 24,
      depth: 24,
      height: 28,
      style: 'glass_dark',
      name: 'PREMIER BAVARIAN MOTORS',
      hasWaterTower: true,
    });

    // Mid-Rise Commercial Retail & Luxury Apartments
    this.addRealisticBuilding({
      x: 110,
      z: 10,
      width: 22,
      depth: 22,
      height: 38,
      style: 'residential',
      name: 'BOULEVARD RESIDENCES',
      hasWaterTower: true,
    });

    this.addRealisticBuilding({
      x: 110,
      z: 70,
      width: 22,
      depth: 22,
      height: 36,
      style: 'glass_dark',
      name: 'SOLARIA PLAZA',
      hasWaterTower: true,
    });

    this.addRealisticBuilding({
      x: -110,
      z: 10,
      width: 22,
      depth: 22,
      height: 34,
      style: 'glass_blue',
      name: 'WESTGATE SUITES',
      hasWaterTower: true,
    });

    this.addRealisticBuilding({
      x: -110,
      z: 70,
      width: 22,
      depth: 22,
      height: 36,
      style: 'residential',
      name: 'MIDTOWN LOFTS',
      hasWaterTower: true,
    });
  }

  private buildWaterfrontAndMarina() {
    // Ocean promenade hotels and residential terraces
    this.addRealisticBuilding({
      x: -140,
      z: -40,
      width: 20,
      depth: 24,
      height: 30,
      style: 'residential',
      name: 'MARINA BAY SUITES',
      hasWaterTower: true,
    });

    this.addRealisticBuilding({
      x: -140,
      z: 20,
      width: 20,
      depth: 24,
      height: 36,
      style: 'glass_blue',
      name: 'OCEAN DRIVE RESORT',
      hasWaterTower: true,
    });

    this.addRealisticBuilding({
      x: -140,
      z: 80,
      width: 20,
      depth: 24,
      height: 28,
      style: 'residential',
      name: 'COASTAL TERRACES',
      hasWaterTower: true,
    });

    // Realistic Coastal Fan Palms along Ocean Drive Promenade!
    for (let z = -145; z <= 125; z += 16) {
      const palm = this.createRealisticPalmTree(8.5, 0.08, z);
      palm.position.set(-152, 0, z);
      this.scene.add(palm);
    }
  }

  private buildIndustrialDocks() {
    const containerColors = [0xb91c1c, 0x1d4ed8, 0x047857, 0xd97706, 0x475569];
    const dockGroup = new THREE.Group();
    dockGroup.position.set(150, 0, 140);

    for (let i = 0; i < 12; i++) {
      const col = containerColors[i % containerColors.length];
      const contMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.4 });
      const contGeo = new THREE.BoxGeometry(6, 3, 14);
      const cont = new THREE.Mesh(contGeo, contMat);
      const row = Math.floor(i / 4);
      const stack = i % 2;
      cont.position.set((i % 4) * 7 - 10, stack * 3.1 + 1.5, row * 16 - 15);
      cont.castShadow = true;
      cont.receiveShadow = true;
      dockGroup.add(cont);

      const box = new THREE.Box3();
      box.setFromObject(cont);
      this.obstacles.push({ box, type: 'barrier' });
    }

    // Heavy Stunt Ramp for high jumps
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.4, metalness: 0.6 });
    const rampGeo = new THREE.BoxGeometry(10, 4, 18);
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(130, 1.2, 80);
    ramp.rotation.x = -0.22;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    this.scene.add(ramp);

    // Gantry Crane structure
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.7 });
    const legGeo = new THREE.BoxGeometry(1.5, 35, 1.5);
    const craneLeg1 = new THREE.Mesh(legGeo, craneMat);
    craneLeg1.position.set(175, 17.5, 120);
    const craneLeg2 = new THREE.Mesh(legGeo, craneMat);
    craneLeg2.position.set(175, 17.5, 160);
    const beamGeo = new THREE.BoxGeometry(45, 3, 4);
    const craneBeam = new THREE.Mesh(beamGeo, craneMat);
    craneBeam.position.set(165, 35, 140);

    this.scene.add(craneLeg1, craneLeg2, craneBeam);
    this.scene.add(dockGroup);
  }

  private buildCentralPark() {
    // Lush green park with footpaths, trees and fountain
    const parkGeo = new THREE.PlaneGeometry(44, 44);
    const parkMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const park = new THREE.Mesh(parkGeo, parkMat);
    park.rotation.x = -Math.PI / 2;
    park.position.set(-80, 0.28, 80);
    park.receiveShadow = true;
    this.scene.add(park);

    // Decorative Tiered Fountain
    const fountainMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.5 });
    const basinGeo = new THREE.CylinderGeometry(5, 5, 1.2, 16);
    const basin = new THREE.Mesh(basinGeo, fountainMat);
    basin.position.set(-80, 0.7, 80);
    this.scene.add(basin);

    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 });
    const fWater = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.2, 16), waterMat);
    fWater.position.set(-80, 1.15, 80);
    this.scene.add(fWater);

    // Realistic Broadleaf Canopy Trees in Central Park!
    const treePositions = [
      [-95, 65], [-65, 65], [-95, 95], [-65, 95],
      [-80, 62], [-80, 98], [-98, 80], [-62, 80],
      [-90, 72], [-70, 88]
    ];

    treePositions.forEach(([tx, tz], i) => {
      const tree = this.createRealisticBroadleafTree(7.5 + (i % 3) * 0.6, 3.6 + (i % 2) * 0.4, tx * tz);
      tree.position.set(tx, 0.28, tz);
      this.scene.add(tree);
    });
  }

  private buildBridgeAndHighways() {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(180, 0, -80);

    const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const deckGeo = new THREE.BoxGeometry(16, 2.5, 120);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 8;
    bridgeGroup.add(deck);

    const towerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });
    const towerGeo = new THREE.BoxGeometry(3, 48, 4);

    const tower1 = new THREE.Mesh(towerGeo, towerMat);
    tower1.position.set(-9, 24, -30);
    const tower2 = new THREE.Mesh(towerGeo, towerMat);
    tower2.position.set(9, 24, -30);
    const tower3 = new THREE.Mesh(towerGeo, towerMat);
    tower3.position.set(-9, 24, 30);
    const tower4 = new THREE.Mesh(towerGeo, towerMat);
    tower4.position.set(9, 24, 30);

    bridgeGroup.add(tower1, tower2, tower3, tower4);
    this.scene.add(bridgeGroup);

    const rampGeo = new THREE.BoxGeometry(16, 1.5, 60);
    const ramp = new THREE.Mesh(rampGeo, deckMat);
    ramp.position.set(180, 4, -10);
    ramp.rotation.x = 0.13;
    this.scene.add(ramp);
  }

  private buildUrbanProps() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const lightCoords = [
      [-72, -72], [-72, -12], [-72, 48],
      [-12, -72], [-12, -12], [-12, 48],
      [48, -72], [48, -12], [48, 48],
      [108, -72], [108, -12], [108, 48],
    ];

    lightCoords.forEach(([lx, lz]) => {
      const pole = new THREE.Group();
      pole.position.set(lx, 0, lz);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 6), poleMat);
      mast.position.y = 3.75;
      mast.castShadow = true;
      mast.receiveShadow = true;
      pole.add(mast);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.15), poleMat);
      arm.position.set(0.7, 7.3, 0);
      arm.castShadow = true;
      arm.receiveShadow = true;
      pole.add(arm);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), bulbMat);
      bulb.position.set(1.4, 7.1, 0);
      pole.add(bulb);

      const streetLight = new THREE.PointLight(0xffedd5, 1.2, 28);
      streetLight.position.set(1.4, 7.0, 0);
      pole.add(streetLight);
      this.streetLights.push(streetLight);

      this.scene.add(pole);

      const tl = this.buildTrafficLight(lx + 2, lz + 2);
      this.trafficLights.push(tl);
    });
  }

  private buildTrafficLight(x: number, z: number) {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5.5, 6), postMat);
    post.position.set(x, 2.75, z);
    post.castShadow = true;
    post.receiveShadow = true;
    this.scene.add(post);

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), boxMat);
    box.position.set(x, 5.0, z);
    box.castShadow = true;
    box.receiveShadow = true;
    this.scene.add(box);

    const signalMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 1.0,
    });
    const signal = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), signalMat);
    signal.position.set(x, 5.0, z + 0.32);
    this.scene.add(signal);

    return {
      mesh: signal,
      state: 'green' as const,
      timer: Math.random() * 8,
    };
  }

  private buildRainSystem() {
    const count = 1600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 160;
      positions[i + 1] = Math.random() * 80;
      positions[i + 2] = (Math.random() - 0.5) * 160;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.35,
      transparent: true,
      opacity: 0.0,
    });
    this.rainParticles = new THREE.Points(geometry, material);
    this.scene.add(this.rainParticles);
  }

  public setTimeOfDay(hour: number) {
    this.timeOfDay = (hour % 24 + 24) % 24;
    this.updateAtmosphere();
  }

  public setWeather(weather: WeatherType) {
    this.currentWeather = weather;
    this.updateAtmosphere();
  }

  private updateAtmosphere() {
    const isNight = this.timeOfDay < 5.5 || this.timeOfDay > 20.5;
    const isTwilight = (this.timeOfDay >= 5.5 && this.timeOfDay < 7.0) || (this.timeOfDay >= 18.5 && this.timeOfDay <= 20.5);

    // Sun angle calculation
    const sunAngle = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
    const sunDist = 200;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunX = Math.cos(sunAngle) * sunDist;
    this.sunLight.position.set(sunX, Math.max(10, sunY), 100);

    let skyColor = 0x38bdf8;
    let sunIntensity = 1.6;
    let sunColor = 0xfffbeb;
    let ambientIntensity = 0.7;

    if (isNight) {
      skyColor = 0x050814;
      sunIntensity = 0.05;
      sunColor = 0x60a5fa;
      ambientIntensity = 0.18;
    } else if (isTwilight) {
      skyColor = 0xf97316;
      sunIntensity = 0.85;
      sunColor = 0xfb923c;
    }

    let rainOpacity = 0.0;
    let fogDensity = 0.0022;

    if (this.currentWeather === 'cloudy') {
      skyColor = 0x64748b;
      sunIntensity *= 0.55;
      fogDensity = 0.0035;
    } else if (this.currentWeather === 'rain') {
      skyColor = 0x334155;
      sunIntensity *= 0.35;
      rainOpacity = 0.65;
      fogDensity = 0.0055;
    } else if (this.currentWeather === 'heavy_rain' || this.currentWeather === 'storm') {
      skyColor = 0x1e293b;
      sunIntensity *= 0.2;
      rainOpacity = 0.9;
      fogDensity = 0.0075;
    } else if (this.currentWeather === 'fog') {
      skyColor = 0x94a3b8;
      sunIntensity *= 0.25;
      fogDensity = 0.014;
    }

    (this.skyMesh.material as THREE.MeshBasicMaterial).color.setHex(skyColor);
    this.sunLight.intensity = sunIntensity;
    this.sunLight.color.setHex(sunColor);
    this.ambientLight.intensity = ambientIntensity;

    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(skyColor);
      this.scene.fog.density = fogDensity;
    }

    const streetLightIntensity = isNight || isTwilight || this.currentWeather === 'storm' ? 1.6 : 0.0;
    this.streetLights.forEach((sl) => {
      sl.intensity = streetLightIntensity;
    });

    const windowEmissiveIntensity = isNight || isTwilight ? 0.75 : 0.18;
    this.windowMaterials.forEach((wm) => {
      wm.emissiveIntensity = windowEmissiveIntensity;
    });

    if (this.rainParticles) {
      (this.rainParticles.material as THREE.PointsMaterial).opacity = rainOpacity;
    }

    if (this.roadMaterial) {
      this.roadMaterial.roughness = rainOpacity > 0 ? 0.25 : 0.68;
      this.roadMaterial.metalness = rainOpacity > 0 ? 0.5 : 0.15;
    }
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    if (playerPos) {
      // Keep the 4096 high-resolution shadow map focused tightly around player
      const px = Math.round(playerPos.x * 2) / 2;
      const pz = Math.round(playerPos.z * 2) / 2;
      this.sunLight.target.position.set(px, 0, pz);
      this.sunLight.target.updateMatrixWorld();
      this.sunLight.position.set(px + 110, 160, pz + 90);
    }

    if (this.waterMesh) {
      this.waterMesh.position.y = -0.6 + Math.sin(Date.now() * 0.002) * 0.06;
    }

    if (this.rainParticles && (this.rainParticles.material as THREE.PointsMaterial).opacity > 0) {
      const geo = this.rainParticles.geometry;
      const positions = geo.attributes.position.array as Float32Array;
      const pCount = positions.length / 3;

      for (let i = 0; i < pCount; i++) {
        const idx = i * 3;
        positions[idx + 1] -= 90 * delta;
        if (positions[idx + 1] < 0) {
          positions[idx + 1] = 65;
          positions[idx] = playerPos.x + (Math.random() - 0.5) * 140;
          positions[idx + 2] = playerPos.z + (Math.random() - 0.5) * 140;
        }
      }
      geo.attributes.position.needsUpdate = true;
    }

    this.trafficLights.forEach((tl) => {
      tl.timer += delta;
      if (tl.state === 'green' && tl.timer > 10) {
        tl.state = 'yellow';
        tl.timer = 0;
        const mat = tl.mesh.material as THREE.MeshStandardMaterial;
        mat.color.setHex(0xeab308);
        mat.emissive.setHex(0xeab308);
      } else if (tl.state === 'yellow' && tl.timer > 2.5) {
        tl.state = 'red';
        tl.timer = 0;
        const mat = tl.mesh.material as THREE.MeshStandardMaterial;
        mat.color.setHex(0xef4444);
        mat.emissive.setHex(0xef4444);
      } else if (tl.state === 'red' && tl.timer > 8) {
        tl.state = 'green';
        tl.timer = 0;
        const mat = tl.mesh.material as THREE.MeshStandardMaterial;
        mat.color.setHex(0x22c55e);
        mat.emissive.setHex(0x22c55e);
      }
    });

    if (this.currentWeather === 'storm') {
      this.lightningTimer += delta;
      if (this.lightningTimer > 8 + Math.random() * 8) {
        this.lightningTimer = 0;
        this.sunLight.intensity = 2.8;
        this.sunLight.color.setHex(0xffffff);
        setTimeout(() => {
          this.updateAtmosphere();
        }, 80);
      }
    }
  }

  // -----------------------------------------------------------------
  // 3D MODEL BUILDERS FOR WORKSHOPS, FUEL PUMPS, AND CAR WASH
  // -----------------------------------------------------------------
  private buildInteractiveLandmarks() {
    // 1. GAS STATION (Apex Supercharge & Pitstop) -> Position: { x: 80, y: 0, z: -40 }
    const gasGroup = new THREE.Group();
    gasGroup.position.set(80, 0, -40);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.8, roughness: 0.2 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.25 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, roughness: 0.1 });
    const glowingYellow = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const glowingBlue = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });

    // Concrete pad
    const pad = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 10), darkSteelMat);
    pad.position.y = 0.06;
    pad.receiveShadow = true;
    gasGroup.add(pad);

    // 4 Canopy support pillars
    [[-7, -4], [7, -4], [-7, 4], [7, 4]].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 8), metalMat);
      pillar.position.set(px, 2.1, pz);
      pillar.castShadow = true;
      gasGroup.add(pillar);
    });

    // Huge overhead Canopy Roof
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.6, 11), metalMat);
    canopy.position.y = 4.4;
    canopy.castShadow = true;
    gasGroup.add(canopy);

    // Glowing Neon Yellow fascia stripes on canopy
    const fasciaL = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.1, 0.1), glowingYellow);
    fasciaL.position.set(0, 4.4, 5.52);
    gasGroup.add(fasciaL);

    const fasciaR = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.1, 0.1), glowingYellow);
    fasciaR.position.set(0, 4.4, -5.52);
    gasGroup.add(fasciaR);

    // 2 Fuel Pumps
    [-3.2, 3.2].forEach((px) => {
      // Pump island concrete bump
      const island = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 1.2), metalMat);
      island.position.set(px, 0.125, 0);
      gasGroup.add(island);

      // Main Pump Body
      const pump = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.8), darkSteelMat);
      pump.position.set(px, 1.15, 0);
      pump.castShadow = true;
      gasGroup.add(pump);

      // Glowing display panel
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.02), glassMat);
      screen.position.set(px, 1.45, 0.41);
      gasGroup.add(screen);

      // Yellow hose cylinders
      const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6), glowingYellow);
      hose.position.set(px - 0.52, 1.0, 0);
      gasGroup.add(hose);
    });

    this.scene.add(gasGroup);

    // 2. CAR WASH TUNNEL -> Position: { x: 104, y: 0, z: -40 }
    const washGroup = new THREE.Group();
    washGroup.position.set(104, 0, -40);

    // Tunnel Main concrete arches
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.5, 13), metalMat);
    wallL.position.set(-4.2, 1.75, 0);
    wallL.castShadow = true;
    washGroup.add(wallL);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.5, 13), metalMat);
    wallR.position.set(4.2, 1.75, 0);
    wallR.castShadow = true;
    washGroup.add(wallR);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.5, 13), metalMat);
    roof.position.set(0, 3.75, 0);
    roof.castShadow = true;
    washGroup.add(roof);

    // CAR WASH giant sign
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.0, 0.4), darkSteelMat);
    signBox.position.set(0, 4.6, 5.8);
    washGroup.add(signBox);

    const neonBlueSign = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.15, 0.1), glowingBlue);
    neonBlueSign.position.set(0, 4.6, 6.02);
    washGroup.add(neonBlueSign);

    // Spinners inside (Translucent giant blue cylinder foam rollers)
    const foamMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.9, transparent: true, opacity: 0.75 });
    const brushL = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.8, 10), foamMat);
    brushL.position.set(-2.5, 1.4, 0);
    washGroup.add(brushL);

    const brushR = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.8, 10), foamMat);
    brushR.position.set(2.5, 1.4, 0);
    washGroup.add(brushR);

    // Top horizontal brush
    const brushT = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 4.5, 10), foamMat);
    brushT.rotation.z = Math.PI / 2;
    brushT.position.set(0, 2.8, -1.8);
    washGroup.add(brushT);

    this.scene.add(washGroup);

    // 3. REPAIR WORKSHOP (Customs Garage) -> Position: { x: -60, y: 0, z: -40 }
    const shopGroup = new THREE.Group();
    shopGroup.position.set(-60, 0, -40);

    const neonOrange = new THREE.MeshBasicMaterial({ color: 0xea580c }); // Neon custom orange
    const orangePaint = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.5 });

    // Raised workshop lift pad
    const liftBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 7.5), darkSteelMat);
    liftBase.position.y = 0.075;
    liftBase.receiveShadow = true;
    shopGroup.add(liftBase);

    // Alternating yellow/black safety stripes around lift base (Warning tape)
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    for (let s = -3; s <= 3; s++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.12), stripeMat);
      stripe.position.set(-2.42, 0.08, s * 1.1);
      shopGroup.add(stripe);

      const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.12), stripeMat);
      stripeR.position.set(2.42, 0.08, s * 1.1);
      shopGroup.add(stripeR);
    }

    // 4 Hydraulic posts rising up
    [[-2.2, -3.2], [2.2, -3.2], [-2.2, 3.2], [2.2, 3.2]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8), metalMat);
      post.position.set(px, 1.75, pz);
      post.castShadow = true;
      shopGroup.add(post);

      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 8), orangePaint);
      collar.position.set(px, 0.4, pz);
      shopGroup.add(collar);
    });

    // Overhead neon orange halo ring framework
    const ringT = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.15, 0.15), neonOrange);
    ringT.position.set(0, 3.5, 3.2);
    shopGroup.add(ringT);

    const ringB = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.15, 0.15), neonOrange);
    ringB.position.set(0, 3.5, -3.2);
    shopGroup.add(ringB);

    const ringL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 6.4), neonOrange);
    ringL.position.set(-2.2, 3.5, 0);
    shopGroup.add(ringL);

    const ringR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 6.4), neonOrange);
    ringR.position.set(2.2, 3.5, 0);
    shopGroup.add(ringR);

    this.scene.add(shopGroup);
  }
}
