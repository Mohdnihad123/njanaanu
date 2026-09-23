import * as THREE from 'three';
import { InputState } from '../types/game';
import { CityObstacle } from './CityWorld';
import { VehicleInstance } from './VehicleSystem';
import { soundEngine } from '../audio/SoundEngine';

export class CharacterController {
  public group: THREE.Group;
  public position: THREE.Vector3;
  public heading: number = 0;
  public speed: number = 0;
  public isGrounded: boolean = true;
  public verticalVelocity: number = 0;
  public isInVehicle: boolean = false;

  // Realistic Articulated Human Skeletal Groups
  private bodyRoot: THREE.Group;
  private torsoGroup: THREE.Group;
  private headGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftForearmGroup: THREE.Group;
  private rightForearmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftLowerLegGroup: THREE.Group;
  private rightLowerLegGroup: THREE.Group;

  // Animation timers
  private animTimer: number = 0;
  private idleTimer: number = 0;
  private stepTimer: number = 0;
  private punchAnimTimer: number = 0;

  constructor(startPos: THREE.Vector3) {
    this.position = startPos.clone();
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Root node for character mesh
    this.bodyRoot = new THREE.Group();
    this.group.add(this.bodyRoot);

    // ==========================================
    // REALISTIC HUMAN MATERIALS
    // ==========================================
    // Natural human skin tone with subtle subsurface warmth
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdfa688,
      roughness: 0.58,
      metalness: 0.05,
    });

    const lipsMat = new THREE.MeshStandardMaterial({
      color: 0xba6f60,
      roughness: 0.65,
    });

    const eyesMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.1,
    });

    const irisMat = new THREE.MeshBasicMaterial({
      color: 0x271e1b, // Dark Espresso / Brown eyes
    });

    const eyebrowMat = new THREE.MeshBasicMaterial({
      color: 0x1f1917,
    });

    // Hair: textured styled dark hair
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1f1917,
      roughness: 0.75,
      metalness: 0.15,
    });

    // Streetwear / Motorsport Bomber Jacket
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Deep Charcoal Leather / Nylon
      roughness: 0.45,
      metalness: 0.15,
    });

    const jacketTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sapphire Sport Accent
      roughness: 0.4,
    });

    const innerShirtMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Crisp White Crewneck
      roughness: 0.7,
    });

    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.3,
    });

    const buckleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
    });

    // Jeans / Trousers
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f, // Indigo Denim
      roughness: 0.8,
    });

    // Designer Athletic Sneakers
    const sneakerWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
    });
    const sneakerSoleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
    });
    const sneakerBlackMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
    });

    // Luxury Steel Watch
    const watchMetalMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.95,
      roughness: 0.15,
    });
    const watchFaceMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.8,
      roughness: 0.2,
    });

    // ==========================================
    // 1. PELVIS & WAIST (Center of Mass)
    // ==========================================
    const pelvisY = 0.92;
    const pelvisGeo = new THREE.BoxGeometry(0.36, 0.18, 0.22);
    const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvis.position.y = pelvisY;
    pelvis.castShadow = true;
    this.bodyRoot.add(pelvis);

    // Belt & Buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.05, 0.23), beltMat);
    belt.position.set(0, 0.06, 0);
    pelvis.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), buckleMat);
    buckle.position.set(0, 0.06, 0.12);
    pelvis.add(buckle);

    // ==========================================
    // 2. TORSO & JACKET
    // ==========================================
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, pelvisY + 0.09, 0);
    this.bodyRoot.add(this.torsoGroup);

    // Upper Torso / Athletic Chest tapering to waist
    const chestGeo = new THREE.BoxGeometry(0.44, 0.46, 0.25);
    const chest = new THREE.Mesh(chestGeo, jacketMat);
    chest.position.y = 0.23;
    chest.castShadow = true;
    this.torsoGroup.add(chest);

    // Inner Shirt Collar (V-Neck / Crewneck peak)
    const shirtCollar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), innerShirtMat);
    shirtCollar.position.set(0, 0.4, 0.1);
    this.torsoGroup.add(shirtCollar);

    // Front Metallic Zipper Track
    const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.44, 0.02), buckleMat);
    zipper.position.set(0, 0.22, 0.13);
    this.torsoGroup.add(zipper);

    // Jacket racing stripe accents
    [-0.15, 0.15].forEach((sx) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.01), jacketTrimMat);
      stripe.position.set(sx, 0.22, 0.13);
      this.torsoGroup.add(stripe);
    });

    // Raised Jacket Collar
    const collarGeo = new THREE.BoxGeometry(0.24, 0.08, 0.22);
    const collar = new THREE.Mesh(collarGeo, jacketMat);
    collar.position.set(0, 0.47, -0.01);
    this.torsoGroup.add(collar);

    // ==========================================
    // 3. REALISTIC HUMAN HEAD & FACIAL ANATOMY
    // ==========================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.46, 0);
    this.torsoGroup.add(this.headGroup);

    // Anatomical Neck
    const neckGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.12, 16);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 0.06;
    neck.castShadow = true;
    this.headGroup.add(neck);

    // Realistic Cranium & Head
    const headGeo = new THREE.SphereGeometry(0.135, 24, 20);
    headGeo.scale(1, 1.25, 1.1); // Proportional human head oval
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.23, 0.01);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Defined Jaw and Chin
    const chinGeo = new THREE.BoxGeometry(0.12, 0.1, 0.12);
    const chin = new THREE.Mesh(chinGeo, skinMat);
    chin.position.set(0, 0.11, 0.07);
    this.headGroup.add(chin);

    // Realistic Modern Styled Hair (Textured Quiff / Modern Taper)
    const hairTopGeo = new THREE.BoxGeometry(0.26, 0.14, 0.28);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.set(0, 0.34, 0.01);
    this.headGroup.add(hairTop);

    // Hair volume / bangs over forehead
    const bangsGeo = new THREE.BoxGeometry(0.24, 0.08, 0.12);
    const bangs = new THREE.Mesh(bangsGeo, hairMat);
    bangs.position.set(0, 0.32, 0.12);
    bangs.rotation.x = -0.2;
    this.headGroup.add(bangs);

    // Hair sides and back
    const hairBackGeo = new THREE.BoxGeometry(0.25, 0.22, 0.12);
    const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
    hairBack.position.set(0, 0.24, -0.11);
    this.headGroup.add(hairBack);

    // Anatomical Ears (Left & Right)
    [-0.14, 0.14].forEach((ex) => {
      const earGeo = new THREE.BoxGeometry(0.03, 0.08, 0.05);
      const ear = new THREE.Mesh(earGeo, skinMat);
      ear.position.set(ex, 0.22, 0);
      this.headGroup.add(ear);
    });

    // Realistic Human Eyes (Sclera + Iris + Pupil)
    [-0.055, 0.055].forEach((ex) => {
      // Eye socket white
      const eyeGeo = new THREE.BoxGeometry(0.045, 0.022, 0.02);
      const eye = new THREE.Mesh(eyeGeo, eyesMat);
      eye.position.set(ex, 0.24, 0.14);
      this.headGroup.add(eye);

      // Iris / Dark pupil
      const irisGeo = new THREE.BoxGeometry(0.02, 0.02, 0.01);
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(ex, 0.24, 0.15);
      this.headGroup.add(iris);

      // Natural Eyebrow
      const browGeo = new THREE.BoxGeometry(0.055, 0.015, 0.02);
      const brow = new THREE.Mesh(browGeo, eyebrowMat);
      brow.position.set(ex, 0.265, 0.142);
      brow.rotation.z = ex > 0 ? -0.1 : 0.1;
      this.headGroup.add(brow);
    });

    // Realistic Sculpted Nose
    const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.065, 0.04), skinMat);
    noseBridge.position.set(0, 0.21, 0.155);
    noseBridge.rotation.x = -0.15;
    this.headGroup.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.024, 0.035), skinMat);
    noseTip.position.set(0, 0.18, 0.165);
    this.headGroup.add(noseTip);

    // Realistic Lips / Mouth
    const lipsGeo = new THREE.BoxGeometry(0.06, 0.022, 0.02);
    const lips = new THREE.Mesh(lipsGeo, lipsMat);
    lips.position.set(0, 0.145, 0.145);
    this.headGroup.add(lips);

    // ==========================================
    // 4. ARTICULATED ARMS, WATCH & DETAILED HANDS
    // ==========================================
    const shoulderY = 0.38;

    // LEFT ARM (with Chronograph Watch)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.27, shoulderY, 0);
    this.torsoGroup.add(this.leftArmGroup);

    // Shoulder Deltoid & Upper Arm
    const bicepGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.28, 12);
    const leftBicep = new THREE.Mesh(bicepGeo, jacketMat);
    leftBicep.position.y = -0.14;
    leftBicep.castShadow = true;
    this.leftArmGroup.add(leftBicep);

    // Left Forearm
    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.28, 0);
    this.leftArmGroup.add(this.leftForearmGroup);

    const forearmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.26, 12);
    const leftForearm = new THREE.Mesh(forearmGeo, jacketMat);
    leftForearm.position.y = -0.13;
    leftForearm.castShadow = true;
    this.leftForearmGroup.add(leftForearm);

    // Chronograph Watch on Left Wrist
    const watchBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), watchMetalMat);
    watchBezel.rotation.z = Math.PI / 2;
    watchBezel.position.set(0, -0.24, 0);
    this.leftForearmGroup.add(watchBezel);

    const watchFace = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.035, 12), watchFaceMat);
    watchFace.rotation.z = Math.PI / 2;
    watchFace.position.set(-0.02, -0.24, 0);
    this.leftForearmGroup.add(watchFace);

    // Left Hand (Palm, Thumb, Curved Fingers)
    const handGeo = new THREE.BoxGeometry(0.045, 0.1, 0.07);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(0, -0.32, 0);
    leftHand.castShadow = true;
    this.leftForearmGroup.add(leftHand);

    const thumbGeo = new THREE.BoxGeometry(0.025, 0.05, 0.03);
    const leftThumb = new THREE.Mesh(thumbGeo, skinMat);
    leftThumb.position.set(0.02, -0.3, 0.03);
    leftThumb.rotation.z = -0.3;
    this.leftForearmGroup.add(leftThumb);

    // RIGHT ARM
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.27, shoulderY, 0);
    this.torsoGroup.add(this.rightArmGroup);

    const rightBicep = new THREE.Mesh(bicepGeo, jacketMat);
    rightBicep.position.y = -0.14;
    rightBicep.castShadow = true;
    this.rightArmGroup.add(rightBicep);

    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.28, 0);
    this.rightArmGroup.add(this.rightForearmGroup);

    const rightForearm = new THREE.Mesh(forearmGeo, jacketMat);
    rightForearm.position.y = -0.13;
    rightForearm.castShadow = true;
    this.rightForearmGroup.add(rightForearm);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0, -0.32, 0);
    rightHand.castShadow = true;
    this.rightForearmGroup.add(rightHand);

    const rightThumb = new THREE.Mesh(thumbGeo, skinMat);
    rightThumb.position.set(-0.02, -0.3, 0.03);
    rightThumb.rotation.z = 0.3;
    this.rightForearmGroup.add(rightThumb);

    // ==========================================
    // 5. ARTICULATED LEGS, KNEES & SNEAKERS
    // ==========================================
    const legSpacing = 0.12;

    // Helper for Designer Athletic Sneakers
    const createSneaker = () => {
      const sneakerGroup = new THREE.Group();

      // Thick white sculpted midsole
      const soleGeo = new THREE.BoxGeometry(0.14, 0.05, 0.28);
      const sole = new THREE.Mesh(soleGeo, sneakerWhiteMat);
      sole.position.set(0, 0.025, 0.04);
      sole.castShadow = true;
      sneakerGroup.add(sole);

      // Black rubber outsole tread
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.015, 0.282), sneakerSoleMat);
      tread.position.set(0, 0.007, 0.04);
      sneakerGroup.add(tread);

      // Sneaker Upper (Navy / Leather)
      const upperGeo = new THREE.BoxGeometry(0.13, 0.09, 0.26);
      const upper = new THREE.Mesh(upperGeo, sneakerBlackMat);
      upper.position.set(0, 0.07, 0.03);
      upper.castShadow = true;
      sneakerGroup.add(upper);

      // White toe cap & eyelet laces
      const toeCap = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.05, 0.08), sneakerWhiteMat);
      toeCap.position.set(0, 0.065, 0.12);
      sneakerGroup.add(toeCap);

      const laces = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.12), sneakerWhiteMat);
      laces.position.set(0, 0.11, 0.03);
      laces.rotation.x = -0.3;
      sneakerGroup.add(laces);

      return sneakerGroup;
    };

    // LEFT LEG
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-legSpacing, pelvisY, 0);
    this.bodyRoot.add(this.leftLegGroup);

    // Thigh (Quadricep taper)
    const thighGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.44, 14);
    const leftThigh = new THREE.Mesh(thighGeo, pantsMat);
    leftThigh.position.y = -0.22;
    leftThigh.castShadow = true;
    this.leftLegGroup.add(leftThigh);

    // Left Knee & Lower Leg / Calf
    this.leftLowerLegGroup = new THREE.Group();
    this.leftLowerLegGroup.position.set(0, -0.44, 0);
    this.leftLegGroup.add(this.leftLowerLegGroup);

    // Knee cap
    const kneeCap = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.06), pantsMat);
    kneeCap.position.set(0, 0, 0.05);
    this.leftLowerLegGroup.add(kneeCap);

    // Calf & Shin
    const calfGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.42, 14);
    const leftCalf = new THREE.Mesh(calfGeo, pantsMat);
    leftCalf.position.y = -0.21;
    leftCalf.castShadow = true;
    this.leftLowerLegGroup.add(leftCalf);

    const leftSneaker = createSneaker();
    leftSneaker.position.set(0, -0.44, 0);
    this.leftLowerLegGroup.add(leftSneaker);

    // RIGHT LEG
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(legSpacing, pelvisY, 0);
    this.bodyRoot.add(this.rightLegGroup);

    const rightThigh = new THREE.Mesh(thighGeo, pantsMat);
    rightThigh.position.y = -0.22;
    rightThigh.castShadow = true;
    this.rightLegGroup.add(rightThigh);

    this.rightLowerLegGroup = new THREE.Group();
    this.rightLowerLegGroup.position.set(0, -0.44, 0);
    this.rightLegGroup.add(this.rightLowerLegGroup);

    const rightKneeCap = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.06), pantsMat);
    rightKneeCap.position.set(0, 0, 0.05);
    this.rightLowerLegGroup.add(rightKneeCap);

    const rightCalf = new THREE.Mesh(calfGeo, pantsMat);
    rightCalf.position.y = -0.21;
    rightCalf.castShadow = true;
    this.rightLowerLegGroup.add(rightCalf);

    const rightSneaker = createSneaker();
    rightSneaker.position.set(0, -0.44, 0);
    this.rightLowerLegGroup.add(rightSneaker);
  }

  public update(
    delta: number,
    input: InputState,
    cameraAngle: number,
    obstacles: CityObstacle[],
    vehicles: VehicleInstance[],
    onEnterVehicle: (vehicle: VehicleInstance) => void
  ) {
    if (this.isInVehicle) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    // Check vehicle interaction
    if (input.interact) {
      let nearestDist = 4.0;
      let nearestVeh: VehicleInstance | null = null;
      for (const veh of vehicles) {
        const dist = this.position.distanceTo(veh.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestVeh = veh;
        }
      }
      if (nearestVeh) {
        this.isInVehicle = true;
        onEnterVehicle(nearestVeh);
        return;
      }
    }

    // Direction vector from input relative to camera
    let moveX = 0;
    let moveZ = 0;
    if (input.forward) moveZ += 1;
    if (input.backward) moveZ -= 1;
    if (input.left) moveX += 1;
    if (input.right) moveX -= 1;

    const hasInput = moveX !== 0 || moveZ !== 0;
    const isSprinting = input.sprint;
    const targetSpeed = hasInput ? (isSprinting ? 9.2 : 4.8) : 0;

    this.speed += (targetSpeed - this.speed) * 12 * delta;

    if (hasInput) {
      const inputAngle = Math.atan2(moveX, moveZ);
      this.heading = cameraAngle + inputAngle;
    }

    // Jumping & Gravity
    if (input.jump && this.isGrounded) {
      this.verticalVelocity = 6.5;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= 18 * delta;
      this.position.y += this.verticalVelocity * delta;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Translation & Collision checks
    if (this.speed > 0.1) {
      const forwardVec = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
      const nextPos = this.position.clone().addScaledVector(forwardVec, this.speed * delta);

      const charBox = new THREE.Box3();
      charBox.setFromCenterAndSize(
        new THREE.Vector3(nextPos.x, nextPos.y + 0.9, nextPos.z),
        new THREE.Vector3(0.7, 1.8, 0.7)
      );

      let collided = false;
      for (const obs of obstacles) {
        if (charBox.intersectsBox(obs.box)) {
          collided = true;
          break;
        }
      }

      if (Math.abs(nextPos.x) > 280 || Math.abs(nextPos.z) > 280) {
        collided = true;
      }

      if (!collided) {
        this.position.copy(nextPos);
      }
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    // ==========================================
    // REALISTIC HUMAN SKELETAL GAIT ANIMATION
    // ==========================================
    if (this.speed > 0.4 && this.isGrounded) {
      const animFreq = isSprinting ? 13 : 8.5;
      this.animTimer += delta * animFreq;

      const swing = Math.sin(this.animTimer);
      const strideAngle = swing * (isSprinting ? 0.75 : 0.48);

      // Thigh Swings
      this.leftLegGroup.rotation.x = strideAngle;
      this.rightLegGroup.rotation.x = -strideAngle;

      // Realistic Knee Flexion: Knees only bend backward on the backswing!
      this.leftLowerLegGroup.rotation.x = Math.max(0, -swing) * (isSprinting ? 1.25 : 0.7);
      this.rightLowerLegGroup.rotation.x = Math.max(0, swing) * (isSprinting ? 1.25 : 0.7);

      // Arms Counter-Swing with natural elbow bend
      const armSwing = -strideAngle * 0.9;
      this.leftArmGroup.rotation.x = armSwing;
      this.rightArmGroup.rotation.x = -armSwing;

      this.leftForearmGroup.rotation.x = -0.2 - Math.abs(armSwing) * 0.35;
      this.rightForearmGroup.rotation.x = -0.2 - Math.abs(armSwing) * 0.35;

      // Torso & Pelvis natural stride bounce & sway
      const bounce = Math.abs(Math.sin(this.animTimer)) * (isSprinting ? 0.06 : 0.035);
      this.bodyRoot.position.y = bounce;
      this.torsoGroup.rotation.y = -swing * 0.1;
      this.torsoGroup.rotation.z = Math.sin(this.animTimer) * 0.04;

      // Footstep Sound Synchronization
      this.stepTimer += delta * animFreq;
      if (this.stepTimer > Math.PI) {
        this.stepTimer = 0;
        soundEngine.playFootstep();
      }
    } else {
      // Natural Idle Breathing & Weight Shift
      this.idleTimer += delta;
      const breath = Math.sin(this.idleTimer * 2.2) * 0.015;

      // Subtle chest rise & fall
      this.torsoGroup.scale.set(1 + breath * 0.5, 1 + breath, 1 + breath * 0.5);
      this.bodyRoot.position.y = breath * 0.5;

      // Reset limb rotations smoothly toward relaxed standing pose
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, 0.15);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, 0.15);
      this.leftLowerLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLowerLegGroup.rotation.x, 0, 0.15);
      this.rightLowerLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLowerLegGroup.rotation.x, 0, 0.15);

      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0.05, 0.15);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0.05, 0.15);
      this.leftForearmGroup.rotation.x = THREE.MathUtils.lerp(this.leftForearmGroup.rotation.x, -0.15, 0.15);
      this.rightForearmGroup.rotation.x = THREE.MathUtils.lerp(this.rightForearmGroup.rotation.x, -0.15, 0.15);

      this.torsoGroup.rotation.y = THREE.MathUtils.lerp(this.torsoGroup.rotation.y, 0, 0.15);
      this.torsoGroup.rotation.z = THREE.MathUtils.lerp(this.torsoGroup.rotation.z, 0, 0.15);
    }

    // -------------------------------------------------------------
    // Punch Animation override
    // -------------------------------------------------------------
    if (this.punchAnimTimer > 0) {
      this.punchAnimTimer -= delta;
      // Throw right arm aggressively forward
      this.rightArmGroup.rotation.x = -1.6;
      this.rightArmGroup.rotation.y = -0.3;
      this.rightForearmGroup.rotation.x = -0.05;
      // Recoil torso slightly
      this.torsoGroup.rotation.y = -0.15;
    }
  }

  public swingPunchArms() {
    this.punchAnimTimer = 0.32; // duration of punch
  }

  public exitVehicle(exitPosition: THREE.Vector3) {
    this.isInVehicle = false;
    this.position.copy(exitPosition);
    this.position.y = 0;
    this.group.position.copy(this.position);
    this.group.visible = true;
  }
}
