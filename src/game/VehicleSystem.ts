import * as THREE from 'three';
import { VehicleDefinition, InputState } from '../types/game';
import { CityObstacle } from './CityWorld';
import { soundEngine } from '../audio/SoundEngine';
import { buildCarModel } from './CarModelBuilder';

export class VehicleInstance {
  public def: VehicleDefinition;
  public group: THREE.Group;
  public bodyMesh: THREE.Mesh | null = null;
  public wheels: THREE.Mesh[] = [];
  public frontWheelPivots: THREE.Group[] = [];
  public headlights: THREE.SpotLight[] = [];
  public headlightMeshes: THREE.Mesh[] = [];
  public taillightMeshes: THREE.Mesh[] = [];
  public nitroFlame: THREE.Mesh | null = null;

  // Custom visual damage meshes
  public hoodMesh: THREE.Mesh | null = null;
  public frontBumperMesh: THREE.Mesh | null = null;

  // Fuel & Dirtiness
  public fuel: number = 100;
  public dirtiness: number = 0;

  // Particle list
  private smokeParticles: { mesh: THREE.Mesh; age: number; maxAge: number; velocity: THREE.Vector3 }[] = [];

  // Physics state
  public position: THREE.Vector3;
  public speedKmh: number = 0;
  public heading: number = 0; // Yaw radians
  public steeringAngle: number = 0;
  public driftSlip: number = 0;
  public health: number = 100;
  public nitroFuel: number = 100;
  public isDriving: boolean = false;
  public suspensionRoll: number = 0;
  public suspensionPitch: number = 0;

  // Collision box
  public box: THREE.Box3 = new THREE.Box3();
  public size: THREE.Vector3 = new THREE.Vector3(2.2, 1.4, 4.4);

  constructor(def: VehicleDefinition, startPos: THREE.Vector3, startHeading: number = 0) {
    this.def = def;
    this.position = startPos.clone();
    this.heading = startHeading;
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    this.buildModel();
  }

  private buildModel() {
    const built = buildCarModel(this.def, { isShowroom: false });
    this.group.add(built.group);
    this.bodyMesh = built.bodyMesh;
    this.wheels = built.wheels;
    this.frontWheelPivots = built.frontWheelPivots;
    this.headlights = built.headlights;
    this.headlightMeshes = built.headlightMeshes;
    this.taillightMeshes = built.taillightMeshes;
    this.nitroFlame = built.nitroFlame;
    this.size.copy(built.size);

    // Save custom damageable meshes
    this.hoodMesh = built.hoodMesh || null;
    this.frontBumperMesh = built.frontBumperMesh || null;
  }

  public setPaintColor(hex: string) {
    this.def.color = hex;
    if (this.bodyMesh) {
      (this.bodyMesh.material as THREE.MeshStandardMaterial).color.set(hex);
    }
  }

  public resetVehicle() {
    this.position.y = 0.5;
    this.speedKmh = 0;
    this.driftSlip = 0;
    this.group.rotation.x = 0;
    this.group.rotation.z = 0;
    this.group.position.copy(this.position);
    this.health = 100;
    this.fuel = 100;
    this.dirtiness = 0;

    // Reset visual damage deformation
    if (this.hoodMesh) {
      this.hoodMesh.position.set(0, 0.55 + 0.04, 1.32); // original position
      this.hoodMesh.rotation.set(0.09, 0, 0); // original rotation
    }
    if (this.frontBumperMesh) {
      this.frontBumperMesh.position.set(0, 0.32 + 0.04, 2.05); // original position
      this.frontBumperMesh.rotation.set(0, 0, 0); // original rotation
    }

    // Clean particles
    this.smokeParticles.forEach((p) => this.group.remove(p.mesh));
    this.smokeParticles = [];
  }

  public update(delta: number, input: InputState, obstacles: CityObstacle[]) {
    // -------------------------------------------------------------
    // Smoke/Fire Damage Particles Animation Loop
    // -------------------------------------------------------------
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.age += delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
      // float upward and expand
      p.mesh.scale.multiplyScalar(1 + delta * 0.8);
      // fade out
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - p.age / p.maxAge) * 0.45;

      if (p.age >= p.maxAge) {
        this.group.remove(p.mesh);
        this.smokeParticles.splice(i, 1);
      }
    }

    if (!this.isDriving) {
      // Idle physics deceleration
      this.speedKmh *= 0.92;
      if (Math.abs(this.speedKmh) < 0.5) this.speedKmh = 0;
      this.group.position.copy(this.position);
      return;
    }

    const maxSpeed = this.def.topSpeed;
    const accelPower = (this.def.acceleration / 100) * 45;
    const brakePower = (this.def.braking / 100) * 55;
    const turnResponsiveness = (this.def.handling / 100) * 2.2;

    // -------------------------------------------------------------
    // Fuel Consumption & Active Drive Logic
    // -------------------------------------------------------------
    const hasFuel = this.fuel > 0;
    if (hasFuel) {
      // Consume fuel more when driving fast / boosting
      const isPressingKey = input.forward || input.backward || input.left || input.right;
      const rate = input.nitro && input.forward ? 2.5 : isPressingKey ? 1.0 : 0.3;
      this.fuel = Math.max(0, this.fuel - rate * delta * 0.35);
    } else {
      this.speedKmh *= 0.95; // Roll to stop if out of gas
    }

    // -------------------------------------------------------------
    // Travel Dirtiness Build-up
    // -------------------------------------------------------------
    if (Math.abs(this.speedKmh) > 2.0) {
      this.dirtiness = Math.min(100, this.dirtiness + Math.abs(this.speedKmh) * 0.0012 * delta);
    }

    // Dynamically dirty up the car paint material
    if (this.bodyMesh && this.bodyMesh.material) {
      const mat = this.bodyMesh.material as THREE.MeshStandardMaterial;
      const baseColor = new THREE.Color(this.def.color);
      // Blend towards a dusty greyish brown color
      const dirtColor = new THREE.Color('#4a3c31');
      const blendFactor = this.dirtiness / 100;
      mat.color.copy(baseColor).lerp(dirtColor, blendFactor * 0.75);
      mat.roughness = 0.16 + blendFactor * 0.65; // Make paint dull
      mat.metalness = 0.72 * (1 - blendFactor * 0.75); // Make paint less metallic
    }

    // Nitro boost
    let isBoosting = false;
    let currentMaxSpeed = maxSpeed;
    if (input.nitro && this.nitroFuel > 0 && input.forward && hasFuel) {
      isBoosting = true;
      this.nitroFuel = Math.max(0, this.nitroFuel - 28 * delta);
      currentMaxSpeed = maxSpeed * 1.25;
    } else {
      this.nitroFuel = Math.min(100, this.nitroFuel + 8 * delta);
    }

    // Nitro flame visibility
    if (this.nitroFlame) {
      const mat = this.nitroFlame.material as THREE.MeshBasicMaterial;
      mat.opacity = isBoosting ? 0.9 : 0.0;
      if (isBoosting) {
        this.nitroFlame.scale.setScalar(0.8 + Math.random() * 0.4);
      }
    }

    // Acceleration & Braking (Disabled if no fuel)
    if (input.forward && hasFuel) {
      if (this.speedKmh < 0) {
        this.speedKmh += brakePower * delta;
      } else {
        const boostMultiplier = isBoosting ? 1.7 : 1.0;
        this.speedKmh += accelPower * boostMultiplier * delta;
        if (this.speedKmh > currentMaxSpeed) {
          this.speedKmh = currentMaxSpeed;
        }
      }
    } else if (input.backward && hasFuel) {
      if (this.speedKmh > 0) {
        this.speedKmh -= brakePower * delta;
      } else {
        // Reverse
        this.speedKmh -= accelPower * 0.6 * delta;
        if (this.speedKmh < -45) this.speedKmh = -45;
      }
    } else {
      // Natural rolling friction
      this.speedKmh *= Math.pow(0.97, delta * 60);
      if (Math.abs(this.speedKmh) < 0.2) this.speedKmh = 0;
    }

    // Handbrake
    const isHandbraking = input.handbrake;
    if (isHandbraking) {
      this.speedKmh *= Math.pow(0.92, delta * 60);
      this.driftSlip = Math.min(1.0, this.driftSlip + 2.5 * delta);
    } else {
      this.driftSlip = Math.max(0, this.driftSlip - 1.8 * delta);
    }

    // Steering with speed sensitivity
    const speedRatio = Math.abs(this.speedKmh) / maxSpeed;
    const speedDamping = 1.0 - Math.min(0.65, speedRatio * 0.7);
    const targetSteerAngle = (input.left ? 1 : 0) - (input.right ? 1 : 0);

    const steerSpeed = 6.0;
    this.steeringAngle += (targetSteerAngle * 0.5 - this.steeringAngle) * steerSpeed * delta;

    // Front wheels visual steer
    this.frontWheelPivots.forEach((pivot) => {
      pivot.rotation.y = this.steeringAngle;
    });

    // Wheels rolling rotation
    const rollSpeed = (this.speedKmh / 3.6) * delta * 3.0;
    this.wheels.forEach((w) => {
      w.rotation.x += rollSpeed;
    });

    // Heading yaw update
    if (Math.abs(this.speedKmh) > 0.5) {
      const direction = this.speedKmh > 0 ? 1 : -1;
      const driftMultiplier = isHandbraking ? 1.8 * this.def.driftFactor : 1.0;
      const turnDelta = this.steeringAngle * turnResponsiveness * speedDamping * driftMultiplier * direction * delta;
      this.heading += turnDelta;
    }

    // Forward translation with drift slip offset
    const forwardVec = new THREE.Vector3(
      Math.sin(this.heading),
      0,
      Math.cos(this.heading)
    );

    const rightVec = new THREE.Vector3(
      Math.cos(this.heading),
      0,
      -Math.sin(this.heading)
    );

    const moveDistance = (this.speedKmh / 3.6) * delta;
    const lateralDistance = this.driftSlip * this.steeringAngle * (this.speedKmh / 3.6) * 0.45 * delta;

    const nextPos = this.position.clone();
    nextPos.addScaledVector(forwardVec, moveDistance);
    nextPos.addScaledVector(rightVec, lateralDistance);

    // Collision detection against obstacles
    const nextBox = new THREE.Box3();
    nextBox.setFromCenterAndSize(nextPos, this.size);

    let hasCollision = false;
    for (const obs of obstacles) {
      if (nextBox.intersectsBox(obs.box)) {
        hasCollision = true;
        break;
      }
    }

    // World boundaries
    if (Math.abs(nextPos.x) > 280 || Math.abs(nextPos.z) > 280) {
      hasCollision = true;
    }

    if (hasCollision) {
      // Rebound with damage
      soundEngine.playCollision(this.speedKmh);
      this.health = Math.max(10, this.health - Math.abs(this.speedKmh) * 0.16);
      this.speedKmh = -this.speedKmh * 0.35;
      this.driftSlip = 0;
    } else {
      this.position.copy(nextPos);
    }

    // -------------------------------------------------------------
    // Real-Time Visual Damage Deformations & Particle Emitters
    // -------------------------------------------------------------
    const damageFactor = (100 - this.health) / 100;

    if (this.hoodMesh) {
      // Bent hood pops up and tilts to show crash damage
      this.hoodMesh.position.y = (0.55 + 0.04) + damageFactor * 0.28;
      this.hoodMesh.rotation.x = 0.09 - damageFactor * 0.18;
      this.hoodMesh.rotation.z = damageFactor * 0.08;
    }

    if (this.frontBumperMesh) {
      // Front bumper hangs loose and tilts down
      this.frontBumperMesh.position.y = (0.32 + 0.04) - damageFactor * 0.14;
      this.frontBumperMesh.position.z = 2.05 - damageFactor * 0.08;
      this.frontBumperMesh.rotation.x = -damageFactor * 0.15;
      this.frontBumperMesh.rotation.y = damageFactor * 0.08;
    }

    // Emit damage smoke/fire depending on health levels
    if (this.health < 80) {
      // Periodically spawn visual smoke blocks
      if (Math.random() < delta * (this.health < 35 ? 24 : 12)) {
        const isFire = this.health < 30 && Math.random() < 0.42;
        const sColor = isFire ? 0xff4500 : (this.health < 50 ? 0x222222 : 0xaaaaaa);
        const sGeo = new THREE.BoxGeometry(0.12 + Math.random() * 0.15, 0.12 + Math.random() * 0.15, 0.12 + Math.random() * 0.15);
        const sMat = new THREE.MeshBasicMaterial({
          color: sColor,
          transparent: true,
          opacity: 0.4,
        });
        const sMesh = new THREE.Mesh(sGeo, sMat);
        // position at engine hood area
        sMesh.position.set(
          -0.4 + Math.random() * 0.8,
          0.7 + damageFactor * 0.3,
          1.1 + Math.random() * 0.5
        );
        this.group.add(sMesh);

        this.smokeParticles.push({
          mesh: sMesh,
          age: 0,
          maxAge: 0.8 + Math.random() * 0.6,
          velocity: new THREE.Vector3(
            -0.2 + Math.random() * 0.4,
            1.8 + Math.random() * 1.2,
            -0.5 + Math.random() * 1.0
          ),
        });
      }
    }

    // Taillight glow on braking
    const isBraking = input.backward || input.handbrake;
    this.taillightMeshes.forEach((tl) => {
      const mat = tl.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isBraking ? 1.8 : 0.4;
    });

    // Suspension roll and pitch visual
    const targetRoll = -this.steeringAngle * (this.speedKmh / maxSpeed) * 0.14;
    const targetPitch = (input.forward ? 0.04 : input.backward ? -0.05 : 0) * (this.speedKmh / maxSpeed);
    this.suspensionRoll += (targetRoll - this.suspensionRoll) * 8 * delta;
    this.suspensionPitch += (targetPitch - this.suspensionPitch) * 8 * delta;

    // Apply to Three.js group
    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;
    this.group.rotation.z = this.suspensionRoll;
    this.group.rotation.x = this.suspensionPitch;

    // Sound updates
    soundEngine.updateEngine(this.speedKmh, maxSpeed, input.forward, isBoosting, this.def.soundPitch);
    soundEngine.updateSkid(this.driftSlip);

    // Horn
    if (input.horn) {
      soundEngine.startHorn();
    } else {
      soundEngine.stopHorn();
    }

    // Reset car if flipped or pressed [R]
    if (input.resetCar) {
      this.resetVehicle();
    }
  }
}
