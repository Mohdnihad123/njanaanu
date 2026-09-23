import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VehicleDefinition } from '../types/game';
import { buildCarModel } from '../game/CarModelBuilder';

interface GarageShowroomProps {
  vehicle: VehicleDefinition;
}

export const GarageShowroom: React.FC<GarageShowroomProps> = ({ vehicle }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    carGroup: THREE.Group;
    bodyMesh: THREE.Mesh | null;
    isDragging: boolean;
    prevMouseX: number;
    rotationY: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 2.4, 6.2);
    camera.lookAt(0, 0.65, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.replaceChildren(renderer.domElement);

    // 3. Studio Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    // Key Spotlight from top-front
    const keySpot = new THREE.SpotLight(0xffffff, 3.5, 30, Math.PI / 4, 0.3);
    keySpot.position.set(2, 6, 4);
    keySpot.castShadow = true;
    scene.add(keySpot);

    // Cool blue rim light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // Warm amber fill light
    const fillLight = new THREE.DirectionalLight(0xf59e0b, 1.2);
    fillLight.position.set(4, 2, -2);
    scene.add(fillLight);

    // 4. Showroom Turntable Platform & Floor
    const platformGroup = new THREE.Group();

    // Turntable disk
    const diskGeo = new THREE.CylinderGeometry(3.2, 3.3, 0.25, 48);
    const diskMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.8,
      roughness: 0.25,
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.position.y = 0.125;
    disk.receiveShadow = true;
    platformGroup.add(disk);

    // Neon Glow Ring around turntable
    const ringGeo = new THREE.TorusGeometry(3.25, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.24;
    platformGroup.add(ring);

    // Studio reflective ground grid
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x05070e,
      roughness: 0.35,
      metalness: 0.6,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    scene.add(platformGroup);

    // 5. Build 3D Car inside a rotating turntable group
    const carGroup = new THREE.Group();
    carGroup.position.y = 0.25;
    scene.add(carGroup);

    const built = buildCarModel(vehicle, { isShowroom: true });
    carGroup.add(built.group);
    const mainBodyMesh = built.bodyMesh;

    engineRef.current = {
      renderer,
      scene,
      camera,
      carGroup,
      bodyMesh: mainBodyMesh,
      isDragging: false,
      prevMouseX: 0,
      rotationY: 0.5,
    };

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!engineRef.current) return;
      const eng = engineRef.current;

      if (!eng.isDragging) {
        eng.rotationY += 0.008;
      }
      eng.carGroup.rotation.y = eng.rotationY;
      disk.rotation.y = eng.rotationY;

      eng.renderer.render(eng.scene, eng.camera);
    };
    animId = requestAnimationFrame(animate);

    // Mouse / Touch Drag to Rotate Car
    const onMouseDown = (e: MouseEvent) => {
      if (engineRef.current) {
        engineRef.current.isDragging = true;
        engineRef.current.prevMouseX = e.clientX;
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (engineRef.current && engineRef.current.isDragging) {
        const deltaX = e.clientX - engineRef.current.prevMouseX;
        engineRef.current.rotationY += deltaX * 0.012;
        engineRef.current.prevMouseX = e.clientX;
      }
    };
    const onMouseUp = () => {
      if (engineRef.current) engineRef.current.isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (engineRef.current && e.touches.length > 0) {
        engineRef.current.isDragging = true;
        engineRef.current.prevMouseX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (engineRef.current && engineRef.current.isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - engineRef.current.prevMouseX;
        engineRef.current.rotationY += deltaX * 0.012;
        engineRef.current.prevMouseX = e.touches[0].clientX;
      }
    };
    const onTouchEnd = () => {
      if (engineRef.current) engineRef.current.isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Resize
    const onResize = () => {
      if (!container || !engineRef.current) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 300;
      engineRef.current.camera.aspect = w / h;
      engineRef.current.camera.updateProjectionMatrix();
      engineRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container) container.replaceChildren();
    };
  }, [vehicle]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-slate-400 font-mono pointer-events-none">
        Drag to rotate 360°
      </div>
    </div>
  );
};
