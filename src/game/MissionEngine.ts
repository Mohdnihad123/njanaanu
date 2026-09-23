import * as THREE from 'three';
import { Mission, Landmark, InteractiveShop, PlayerStats } from '../types/game';
import { INITIAL_MISSIONS, INITIAL_LANDMARKS, INITIAL_SHOPS, HIDDEN_TOKENS } from './GameData';
import { VehicleInstance } from './VehicleSystem';
import { soundEngine } from '../audio/SoundEngine';

export class MissionEngine {
  public scene: THREE.Scene;
  public missions: Mission[];
  public landmarks: Landmark[];
  public shops: InteractiveShop[];
  public tokens: { id: string; x: number; y: number; z: number; collected: boolean; mesh: THREE.Mesh }[] = [];

  public activeMission: Mission | null = null;
  public missionTimer: number = 0;
  public driftScoreAcc: number = 0;

  // 3D Visual Beacons
  public checkpointBeacon: THREE.Mesh;
  public beaconLight: THREE.PointLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.missions = JSON.parse(JSON.stringify(INITIAL_MISSIONS));
    this.landmarks = JSON.parse(JSON.stringify(INITIAL_LANDMARKS));
    this.shops = JSON.parse(JSON.stringify(INITIAL_SHOPS));

    // Checkpoint Beacon Pillar
    const beaconGeo = new THREE.CylinderGeometry(1.5, 1.5, 30, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    this.checkpointBeacon = new THREE.Mesh(beaconGeo, beaconMat);
    this.checkpointBeacon.visible = false;
    this.scene.add(this.checkpointBeacon);

    this.beaconLight = new THREE.PointLight(0x38bdf8, 2.0, 30);
    this.beaconLight.visible = false;
    this.scene.add(this.beaconLight);

    // Spawn Collectible Gold Coins / Tokens
    const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xca8a04,
      emissiveIntensity: 0.35,
    });

    HIDDEN_TOKENS.forEach((t) => {
      const mesh = new THREE.Mesh(coinGeo, coinMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(t.x, t.y, t.z);
      this.scene.add(mesh);
      this.tokens.push({
        ...t,
        mesh,
      });
    });
  }

  public startMission(missionId: string) {
    const mission = this.missions.find((m) => m.id === missionId);
    if (!mission) return;

    this.activeMission = mission;
    this.activeMission.isActive = true;
    this.activeMission.currentCheckpointIndex = 0;
    this.missionTimer = mission.timeLimit || 0;
    this.driftScoreAcc = 0;

    this.updateBeacon();
    soundEngine.playCashSound();
  }

  public cancelMission() {
    if (this.activeMission) {
      this.activeMission.isActive = false;
      this.activeMission = null;
    }
    this.checkpointBeacon.visible = false;
    this.beaconLight.visible = false;
  }

  private updateBeacon() {
    if (!this.activeMission) {
      this.checkpointBeacon.visible = false;
      this.beaconLight.visible = false;
      return;
    }

    const cp = this.activeMission.checkpoints[this.activeMission.currentCheckpointIndex];
    if (cp) {
      this.checkpointBeacon.position.set(cp.x, 15, cp.z);
      this.beaconLight.position.set(cp.x, 2, cp.z);
      this.checkpointBeacon.visible = true;
      this.beaconLight.visible = true;
    } else {
      this.checkpointBeacon.visible = false;
      this.beaconLight.visible = false;
    }
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    activeVehicle: VehicleInstance | null,
    stats: PlayerStats,
    onNotify: (title: string, message: string) => void,
    onStatsUpdate: (stats: PlayerStats) => void
  ) {
    // Rotate Collectible Gold Coins & check collision
    this.tokens.forEach((tok) => {
      if (!tok.collected) {
        tok.mesh.rotation.z += delta * 3;
        tok.mesh.position.y = tok.y + Math.sin(Date.now() * 0.003) * 0.15;

        const dist = playerPos.distanceTo(tok.mesh.position);
        if (dist < 2.5) {
          tok.collected = true;
          tok.mesh.visible = false;
          soundEngine.playCashSound();
          stats.cash += 500;
          stats.collectiblesFound += 1;
          onStatsUpdate({ ...stats });
          onNotify(
            'Golden Token Found!',
            `+500 Cash! (${stats.collectiblesFound}/${this.tokens.length} Collectibles)`
          );
        }
      }
    });

    // Check Landmark Discoveries
    this.landmarks.forEach((lm) => {
      if (!lm.discovered) {
        const dist = new THREE.Vector2(playerPos.x, playerPos.z).distanceTo(
          new THREE.Vector2(lm.position.x, lm.position.z)
        );
        if (dist < 32.0) {
          lm.discovered = true;
          stats.cash += 350;
          stats.reputation += 25;
          onStatsUpdate({ ...stats });
          soundEngine.playMissionComplete();
          onNotify(`Landmark Discovered: ${lm.name}`, `${lm.district} - ${lm.description}`);
        }
      }
    });

    // Pulse beacon animation
    if (this.checkpointBeacon.visible) {
      this.checkpointBeacon.scale.x = 1.0 + Math.sin(Date.now() * 0.005) * 0.15;
      this.checkpointBeacon.scale.z = this.checkpointBeacon.scale.x;
    }

    // Active Mission Updates
    if (this.activeMission && this.activeMission.isActive) {
      if (this.activeMission.timeLimit) {
        this.missionTimer -= delta;
        if (this.missionTimer <= 0) {
          onNotify('Mission Failed', 'Time limit expired! Try again.');
          this.cancelMission();
          return;
        }
      }

      const cp = this.activeMission.checkpoints[this.activeMission.currentCheckpointIndex];
      if (cp) {
        const distToCheckpoint = new THREE.Vector2(playerPos.x, playerPos.z).distanceTo(
          new THREE.Vector2(cp.x, cp.z)
        );

        if (this.activeMission.type === 'courier' || this.activeMission.type === 'tour') {
          if (distToCheckpoint < 7.0) {
            this.activeMission.currentCheckpointIndex += 1;
            soundEngine.playCashSound();

            if (this.activeMission.currentCheckpointIndex >= this.activeMission.checkpoints.length) {
              // Mission Completed!
              this.completeActiveMission(stats, onNotify, onStatsUpdate);
            } else {
              this.updateBeacon();
              onNotify('Checkpoint Cleared!', `Proceed to next stop: ${this.activeMission.checkpoints[this.activeMission.currentCheckpointIndex].name}`);
            }
          }
        } else if (this.activeMission.type === 'speed_trap') {
          if (distToCheckpoint < 12.0 && activeVehicle) {
            const currentSpeed = Math.abs(activeVehicle.speedKmh);
            const targetSpeed = this.activeMission.targetSpeed || 140;
            if (currentSpeed >= targetSpeed) {
              this.completeActiveMission(stats, onNotify, onStatsUpdate);
            }
          }
        } else if (this.activeMission.type === 'drift') {
          if (activeVehicle && activeVehicle.driftSlip > 0.3 && Math.abs(activeVehicle.speedKmh) > 30) {
            this.driftScoreAcc += delta * activeVehicle.driftSlip * 450;
            if (this.driftScoreAcc >= (this.activeMission.targetScore || 1200)) {
              this.completeActiveMission(stats, onNotify, onStatsUpdate);
            }
          }
        }
      }
    }
  }

  private completeActiveMission(
    stats: PlayerStats,
    onNotify: (title: string, message: string) => void,
    onStatsUpdate: (stats: PlayerStats) => void
  ) {
    if (!this.activeMission) return;
    const mission = this.activeMission;
    mission.isActive = false;
    mission.isCompleted = true;
    this.activeMission = null;
    this.checkpointBeacon.visible = false;
    this.beaconLight.visible = false;

    stats.cash += mission.rewardCash;
    stats.reputation += mission.rewardRep;
    if (!stats.completedMissions.includes(mission.id)) {
      stats.completedMissions.push(mission.id);
    }
    onStatsUpdate({ ...stats });

    soundEngine.playMissionComplete();
    onNotify('Mission Complete!', `+${mission.rewardCash} Cash & +${mission.rewardRep} Rep!`);
  }
}
