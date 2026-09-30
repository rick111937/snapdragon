import { getCanvasColor, getCanvasHex } from '../utils/themeColors';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  Layers, 
  Flame, 
  Eye, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon,
  Gauge,
  Thermometer,
  Radio,
  Sliders,
  ChevronRight,
  Compass
} from 'lucide-react';

export default function DigitalTwin3D({
  selectedEquipment,
  onSelectEquipment,
  activeScenario,
  telemetry = {},
  detections = [],
  isSplitView = false
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animFrameRef = useRef(null);
  const controlsRef = useRef({
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    spherical: { radius: 11, phi: Math.PI / 3.2, theta: Math.PI / 4.2 },
    target: new THREE.Vector3(0, 1.2, 0),
    targetLerp: new THREE.Vector3(0, 1.2, 0),
    sphericalLerp: { radius: 11, phi: Math.PI / 3.2, theta: Math.PI / 4.2 }
  });

  // Visual Display Modes
  const [renderMode, setRenderMode] = useState('pbr'); // 'pbr' | 'thermal' | 'wireframe'
  const [explodedView, setExplodedView] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [showLaserScan, setShowLaserScan] = useState(true);
  const [cameraPreset, setCameraPreset] = useState('iso');
  const [autoRotate, setAutoRotate] = useState(false);

  // Calculate scenario-dependent state
  const isAnomalous = activeScenario === 'anomalous';
  const isWarning = activeScenario === 'warning';

  // Dynamic state ref for animation loop
  const stateRef = useRef({
    renderMode,
    explodedView,
    showParticles,
    showLaserScan,
    autoRotate,
    isAnomalous,
    isWarning
  });
  stateRef.current = {
    renderMode,
    explodedView,
    showParticles,
    showLaserScan,
    autoRotate,
    isAnomalous,
    isWarning
  };

  // References to dynamic 3D elements for animations
  const dynamicMeshes = useRef({
    shaft: null,
    bearingHousing: null,
    valveHandle: null,
    beaconLed: null,
    beaconLight: null,
    thermalLight: null,
    laserPlane: null,
    particleSystem: null,
    explodedParts: [],
    clickableMeshes: []
  });

  // Camera presets coordinates
  const PRESETS = useMemo(() => ({
    iso: { radius: 11.5, phi: Math.PI / 3.2, theta: Math.PI / 4.2, target: new THREE.Vector3(0, 1.2, 0) },
    front: { radius: 10.5, phi: Math.PI / 2.05, theta: 0, target: new THREE.Vector3(0, 1.2, 0) },
    top: { radius: 12.0, phi: 0.05, theta: 0, target: new THREE.Vector3(0, 1.2, 0) },
    motor: { radius: 6.5, phi: Math.PI / 2.5, theta: Math.PI / 3.5, target: new THREE.Vector3(-2.2, 1.4, 0) },
    valve: { radius: 6.0, phi: Math.PI / 2.6, theta: -Math.PI / 4, target: new THREE.Vector3(2.0, 1.4, 0) },
    junction: { radius: 5.5, phi: Math.PI / 2.8, theta: 0.1, target: new THREE.Vector3(3.2, 2.2, -0.6) }
  }), []);

  // Update camera target when selectedEquipment or preset changes
  useEffect(() => {
    if (selectedEquipment === 'motor_casing_p01') {
      applyCameraPreset('motor');
    } else if (selectedEquipment === 'pressure_valve_v3') {
      applyCameraPreset('valve');
    } else if (selectedEquipment === 'junction_box_t2') {
      applyCameraPreset('junction');
    }
  }, [selectedEquipment]);

  const applyCameraPreset = (presetKey) => {
    setCameraPreset(presetKey);
    const p = PRESETS[presetKey];
    if (p) {
      controlsRef.current.sphericalLerp = { ...p };
      controlsRef.current.targetLerp.copy(p.target);
    }
  };

  // Setup Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#060911');
    scene.fog = new THREE.FogExp2('#060911', 0.035);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(7, 6, 8);
    camera.lookAt(0, 1.2, 0);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // LIGHTING SYSTEM
    const ambientLight = new THREE.AmbientLight('#7c90b8', 0.85);
    scene.add(ambientLight);

    // Key Light (warm industrial highlight)
    const keyLight = new THREE.DirectionalLight('#ffffff', 1.8);
    keyLight.position.set(8, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    scene.add(keyLight);

    // Fill Light (Cyber Cyan)
    const cyanFill = new THREE.DirectionalLight('#fed7aa', 1.2);
    cyanFill.position.set(-10, 8, -6);
    scene.add(cyanFill);

    // Rim Light (Snapdragon Crimson)
    const redRim = new THREE.DirectionalLight('#ff3b5c', 1.4);
    redRim.position.set(6, 4, -10);
    scene.add(redRim);

    // Thermal Hotspot point light (at motor bearing)
    const thermalPointLight = new THREE.PointLight('#ff3b5c', 0, 8);
    thermalPointLight.position.set(-1.0, 1.4, 0);
    scene.add(thermalPointLight);
    dynamicMeshes.current.thermalLight = thermalPointLight;

    // Beacon point light on junction box
    const beaconLight = new THREE.PointLight('#10b981', 1.5, 4);
    beaconLight.position.set(3.4, 2.9, -0.6);
    scene.add(beaconLight);
    dynamicMeshes.current.beaconLight = beaconLight;

    // -------------------------------------------------------------
    // BUILD INDUSTRIAL TWIN MACHINERY
    // -------------------------------------------------------------
    const machineGroup = new THREE.Group();
    scene.add(machineGroup);

    // Materials Palette
    const metalDark = new THREE.MeshStandardMaterial({
      color: 0x1b2436,
      metalness: 0.85,
      roughness: 0.35,
    });
    const metalSilver = new THREE.MeshStandardMaterial({
      color: 0x8fa0b8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const motorBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e2c45,
      metalness: 0.7,
      roughness: 0.4,
    });
    const valveBodyMat = new THREE.MeshStandardMaterial({
      color: 0x24344d,
      metalness: 0.75,
      roughness: 0.35,
    });
    const accentCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x006680,
      emissiveIntensity: 0.6,
      metalness: 0.5,
      roughness: 0.3
    });
    const snapdragonRedMat = new THREE.MeshStandardMaterial({
      color: 0xff3b5c,
      emissive: 0x990022,
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.3
    });
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    // 1. Heavy Baseplate & Shock Absorbers
    const basePlateGeo = new THREE.BoxGeometry(8.4, 0.35, 3.8);
    const basePlate = new THREE.Mesh(basePlateGeo, metalDark);
    basePlate.position.set(0, 0.175, 0);
    basePlate.receiveShadow = true;
    basePlate.castShadow = true;
    machineGroup.add(basePlate);

    // 4 Corner Vibration Dampers
    const damperGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.25, 16);
    const damperMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    [[-3.8, -1.5], [-3.8, 1.5], [3.8, -1.5], [3.8, 1.5]].forEach(([x, z]) => {
      const damper = new THREE.Mesh(damperGeo, damperMat);
      damper.position.set(x, 0.4, z);
      damper.castShadow = true;
      machineGroup.add(damper);
      
      // Anchor bolt
      const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 6);
      const bolt = new THREE.Mesh(boltGeo, metalSilver);
      bolt.position.set(x, 0.55, z);
      machineGroup.add(bolt);
    });

    // Holographic Grid Floor
    const grid = new THREE.GridHelper(16, 24, 0x00f2fe, 0x142036);
    grid.position.y = 0;
    scene.add(grid);

    // Circular Range Radar Rings
    const ringGeo = new THREE.RingGeometry(4.2, 4.25, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // 2. MOTOR ASSEMBLY (P01) - Left Hand Side
    const motorGroup = new THREE.Group();
    motorGroup.position.set(-2.2, 1.4, 0);
    machineGroup.add(motorGroup);
    motorGroup.userData = { id: 'motor_casing_p01', basePos: new THREE.Vector3(-2.2, 1.4, 0), explodeOffset: new THREE.Vector3(-1.6, 0, 0) };

    // Motor Stator Cylinder
    const statorGeo = new THREE.CylinderGeometry(1.05, 1.05, 2.4, 32);
    statorGeo.rotateZ(Math.PI / 2);
    const stator = new THREE.Mesh(statorGeo, motorBodyMat);
    stator.castShadow = true;
    stator.receiveShadow = true;
    stator.userData = { id: 'motor_casing_p01' };
    motorGroup.add(stator);

    // Cooling Fins (11 rings along motor cylinder)
    const finGeo = new THREE.TorusGeometry(1.08, 0.035, 8, 32);
    finGeo.rotateY(Math.PI / 2);
    for (let i = -1.0; i <= 1.0; i += 0.2) {
      const fin = new THREE.Mesh(finGeo, metalDark);
      fin.position.x = i;
      fin.castShadow = true;
      motorGroup.add(fin);
    }

    // Rear Fan Shroud & Grille
    const fanShroudGeo = new THREE.CylinderGeometry(1.12, 1.12, 0.45, 32);
    fanShroudGeo.rotateZ(Math.PI / 2);
    const fanShroud = new THREE.Mesh(fanShroudGeo, metalDark);
    fanShroud.position.set(-1.3, 0, 0);
    fanShroud.castShadow = true;
    motorGroup.add(fanShroud);

    // Motor Mount Pedestal Feet
    const footGeo = new THREE.BoxGeometry(2.0, 0.65, 1.8);
    const foot = new THREE.Mesh(footGeo, metalDark);
    foot.position.set(0, -0.75, 0);
    foot.castShadow = true;
    motorGroup.add(foot);

    // Bearing Housing (Front Drive End) - Subject to thermal and vibration effects!
    const bearingGeo = new THREE.CylinderGeometry(0.85, 0.98, 0.55, 32);
    bearingGeo.rotateZ(Math.PI / 2);
    const bearingHousing = new THREE.Mesh(bearingGeo, metalSilver.clone());
    bearingHousing.position.set(1.4, 0, 0);
    bearingHousing.castShadow = true;
    bearingHousing.userData = { id: 'motor_casing_p01', isBearing: true };
    motorGroup.add(bearingHousing);
    dynamicMeshes.current.bearingHousing = bearingHousing;

    // Motor Terminal Box on top
    const motorTermGeo = new THREE.BoxGeometry(0.65, 0.45, 0.75);
    const motorTerm = new THREE.Mesh(motorTermGeo, metalDark);
    motorTerm.position.set(0.2, 1.15, 0);
    motorTerm.castShadow = true;
    motorGroup.add(motorTerm);

    // Drive Output Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.6, 24);
    shaftGeo.rotateZ(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeo, metalSilver);
    shaft.position.set(2.0, 0, 0);
    shaft.castShadow = true;
    motorGroup.add(shaft);
    dynamicMeshes.current.shaft = shaft;

    // Flexible Coupling Collar (between motor & pump/valve)
    const couplingGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 24);
    couplingGeo.rotateZ(Math.PI / 2);
    const coupling = new THREE.Mesh(couplingGeo, metalDark);
    coupling.position.set(2.5, 0, 0);
    coupling.castShadow = true;
    motorGroup.add(coupling);

    // 3. PRESSURE VALVE & PUMP ASSEMBLY (V3) - Center Right
    const valveGroup = new THREE.Group();
    valveGroup.position.set(1.8, 1.4, 0);
    machineGroup.add(valveGroup);
    valveGroup.userData = { id: 'pressure_valve_v3', basePos: new THREE.Vector3(1.8, 1.4, 0), explodeOffset: new THREE.Vector3(1.4, 0, 0) };

    // Valve Main Globe Body
    const valveBodyGeo = new THREE.SphereGeometry(0.9, 24, 24);
    valveBodyGeo.scale(1.2, 1.0, 1.0);
    const valveBody = new THREE.Mesh(valveBodyGeo, valveBodyMat);
    valveBody.castShadow = true;
    valveBody.userData = { id: 'pressure_valve_v3' };
    valveGroup.add(valveBody);

    // Inlet Pipe (Left, connecting from coupling)
    const pipeInletGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.2, 24);
    pipeInletGeo.rotateZ(Math.PI / 2);
    const pipeInlet = new THREE.Mesh(pipeInletGeo, metalDark);
    pipeInlet.position.set(-0.9, 0, 0);
    pipeInlet.castShadow = true;
    valveGroup.add(pipeInlet);

    // Flange In
    const flangeInGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.15, 24);
    flangeInGeo.rotateZ(Math.PI / 2);
    const flangeIn = new THREE.Mesh(flangeInGeo, metalSilver);
    flangeIn.position.set(-1.4, 0, 0);
    valveGroup.add(flangeIn);

    // Outlet Pipe (Right, industrial outflow)
    const pipeOutletGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.6, 24);
    pipeOutletGeo.rotateZ(Math.PI / 2);
    const pipeOutlet = new THREE.Mesh(pipeOutletGeo, metalDark);
    pipeOutlet.position.set(1.1, 0, 0);
    pipeOutlet.castShadow = true;
    valveGroup.add(pipeOutlet);

    // Flange Out
    const flangeOut = new THREE.Mesh(flangeInGeo, metalSilver);
    flangeOut.position.set(1.8, 0, 0);
    valveGroup.add(flangeOut);

    // Valve Bonnet & Spindle Tower
    const bonnetGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 24);
    const bonnet = new THREE.Mesh(bonnetGeo, metalDark);
    bonnet.position.set(0, 0.85, 0);
    bonnet.castShadow = true;
    valveGroup.add(bonnet);

    // Valve Stem Shaft
    const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 16);
    const stem = new THREE.Mesh(stemGeo, metalSilver);
    stem.position.set(0, 1.5, 0);
    valveGroup.add(stem);

    // Valve Handwheel on top
    const handwheelGroup = new THREE.Group();
    handwheelGroup.position.set(0, 1.9, 0);
    valveGroup.add(handwheelGroup);
    handwheelGroup.userData = { id: 'pressure_valve_v3', basePos: new THREE.Vector3(0, 1.9, 0), explodeOffset: new THREE.Vector3(0, 1.2, 0) };
    dynamicMeshes.current.valveHandle = handwheelGroup;

    const rimGeo = new THREE.TorusGeometry(0.58, 0.08, 12, 32);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 });
    const handwheelRim = new THREE.Mesh(rimGeo, rimMat);
    handwheelRim.castShadow = true;
    handwheelGroup.add(handwheelRim);

    // Handwheel Spokes
    for (let a = 0; a < Math.PI; a += Math.PI / 2) {
      const spokeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8);
      spokeGeo.rotateZ(a);
      const spoke = new THREE.Mesh(spokeGeo, metalSilver);
      spoke.rotation.y = Math.PI / 2;
      handwheelGroup.add(spoke);
    }

    // Digital Pressure Gauge Dial (facing front user)
    const gaugeStemGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12);
    const gaugeStem = new THREE.Mesh(gaugeStemGeo, metalSilver);
    gaugeStem.position.set(0.7, 0.5, 0.45);
    gaugeStem.rotation.x = Math.PI / 4;
    valveGroup.add(gaugeStem);

    const gaugeDialGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.12, 24);
    gaugeDialGeo.rotateX(Math.PI / 2);
    const gaugeDial = new THREE.Mesh(gaugeDialGeo, metalDark);
    gaugeDial.position.set(0.7, 0.75, 0.7);
    valveGroup.add(gaugeDial);

    // Glowing Gauge Screen (Canvas Texture)
    const gaugeCanvas = document.createElement('canvas');
    gaugeCanvas.width = 256;
    gaugeCanvas.height = 256;
    const gctx = gaugeCanvas.getContext('2d');
    gctx.fillStyle = '#060f1e';
    gctx.fillRect(0, 0, 256, 256);
    gctx.strokeStyle = 'var(--accent-cyan)';
    gctx.lineWidth = 8;
    gctx.beginPath();
    gctx.arc(128, 128, 110, 0.7 * Math.PI, 2.3 * Math.PI);
    gctx.stroke();
    gctx.fillStyle = 'var(--accent-cyan)';
    gctx.font = 'bold 36px "JetBrains Mono", monospace';
    gctx.textAlign = 'center';
    gctx.fillText('3.2 BAR', 128, 140);
    gctx.font = '20px sans-serif';
    gctx.fillStyle = '#94a3b8';
    gctx.fillText('V3 INLET', 128, 175);

    const gaugeTex = new THREE.CanvasTexture(gaugeCanvas);
    const gaugeScreenGeo = new THREE.CircleGeometry(0.34, 24);
    const gaugeScreenMat = new THREE.MeshBasicMaterial({ map: gaugeTex });
    const gaugeScreen = new THREE.Mesh(gaugeScreenGeo, gaugeScreenMat);
    gaugeScreen.position.set(0.7, 0.75, 0.77);
    valveGroup.add(gaugeScreen);

    // Valve Pedestal Support
    const valveSupportGeo = new THREE.BoxGeometry(1.4, 0.9, 1.2);
    const valveSupport = new THREE.Mesh(valveSupportGeo, metalDark);
    valveSupport.position.set(0, -0.7, 0);
    valveSupport.castShadow = true;
    valveGroup.add(valveSupport);

    // 4. TERMINAL JUNCTION BOX (T2) - Back Right Corner
    const junctionGroup = new THREE.Group();
    junctionGroup.position.set(3.2, 1.8, -0.7);
    machineGroup.add(junctionGroup);
    junctionGroup.userData = { id: 'junction_box_t2', basePos: new THREE.Vector3(3.2, 1.8, -0.7), explodeOffset: new THREE.Vector3(0.8, 0, -0.8) };

    const jBoxGeo = new THREE.BoxGeometry(1.2, 1.6, 0.9);
    const jBox = new THREE.Mesh(jBoxGeo, metalDark);
    jBox.castShadow = true;
    jBox.userData = { id: 'junction_box_t2' };
    junctionGroup.add(jBox);

    // Door front panel
    const doorGeo = new THREE.BoxGeometry(1.15, 1.55, 0.08);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x22314a, metalness: 0.6, roughness: 0.4 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0, 0.48);
    junctionGroup.add(door);

    // Warning Hazard Sign on door
    const signGeo = new THREE.PlaneGeometry(0.45, 0.35);
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 128;
    signCanvas.height = 96;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#f59e0b';
    sctx.fillRect(0, 0, 128, 96);
    sctx.fillStyle = '#000000';
    sctx.font = 'bold 36px sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText('⚡', 64, 45);
    sctx.font = 'bold 16px sans-serif';
    sctx.fillText('480V AC', 64, 75);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 0.15, 0.53);
    junctionGroup.add(signMesh);

    // Status Beacon Stack Light on top of Junction Box
    const beaconStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12);
    const beaconStem = new THREE.Mesh(beaconStemGeo, metalSilver);
    beaconStem.position.set(0.2, 0.95, 0);
    junctionGroup.add(beaconStem);

    const beaconLedGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);
    const beaconLedMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.0,
      roughness: 0.2
    });
    const beaconLed = new THREE.Mesh(beaconLedGeo, beaconLedMat);
    beaconLed.position.set(0.2, 1.2, 0);
    junctionGroup.add(beaconLed);
    dynamicMeshes.current.beaconLed = beaconLed;

    // Flexible conduits connecting Motor terminal box to Junction Box
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.0, 2.5, 0.2),
      new THREE.Vector3(-0.5, 2.8, -0.4),
      new THREE.Vector3(1.5, 2.7, -0.6),
      new THREE.Vector3(3.2, 2.4, -0.7)
    ]);
    const conduitGeo = new THREE.TubeGeometry(curve, 32, 0.07, 12, false);
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const conduit = new THREE.Mesh(conduitGeo, conduitMat);
    conduit.castShadow = true;
    machineGroup.add(conduit);

    // 5. FLUID FLOW PARTICLE SYSTEM (along pipeline inside valve)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 4.0 + 1.8;
      particlePositions[i * 3 + 1] = 1.4 + (Math.random() - 0.5) * 0.35;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.1,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    machineGroup.add(particleSystem);
    dynamicMeshes.current.particleSystem = particleSystem;

    // 6. CYBER LIDAR LASER SCAN PLANE
    const laserPlaneGeo = new THREE.PlaneGeometry(10.0, 5.0);
    const laserCanvas = document.createElement('canvas');
    laserCanvas.width = 512;
    laserCanvas.height = 256;
    const lctx = laserCanvas.getContext('2d');
    const grad = lctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, getCanvasColor(0));
    grad.addColorStop(0.5, getCanvasColor(0.4));
    grad.addColorStop(1, getCanvasColor(0));
    lctx.fillStyle = grad;
    lctx.fillRect(0, 0, 512, 256);
    lctx.strokeStyle = getCanvasHex();
    lctx.lineWidth = 4;
    lctx.beginPath();
    lctx.moveTo(0, 128);
    lctx.lineTo(512, 128);
    lctx.stroke();
    const laserTex = new THREE.CanvasTexture(laserCanvas);
    const laserMat = new THREE.MeshBasicMaterial({
      map: laserTex,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const laserPlane = new THREE.Mesh(laserPlaneGeo, laserMat);
    laserPlane.rotation.y = Math.PI / 2;
    laserPlane.position.set(-4.0, 2.0, 0);
    scene.add(laserPlane);
    dynamicMeshes.current.laserPlane = laserPlane;

    // Save references to exploded parts
    dynamicMeshes.current.explodedParts = [
      { group: motorGroup, basePos: motorGroup.userData.basePos, offset: motorGroup.userData.explodeOffset },
      { group: valveGroup, basePos: valveGroup.userData.basePos, offset: valveGroup.userData.explodeOffset },
      { group: handwheelGroup, basePos: handwheelGroup.userData.basePos, offset: handwheelGroup.userData.explodeOffset },
      { group: junctionGroup, basePos: junctionGroup.userData.basePos, offset: junctionGroup.userData.explodeOffset }
    ];

    // Collect all interactive meshes for raycasting
    dynamicMeshes.current.clickableMeshes = [stator, bearingHousing, valveBody, handwheelRim, jBox];

    // RAYCASTING FOR INTERACTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(dynamicMeshes.current.clickableMeshes, true);
      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        while (hitObj && !hitObj.userData?.id) {
          hitObj = hitObj.parent;
        }
        if (hitObj && hitObj.userData?.id) {
          onSelectEquipment(hitObj.userData.id);
        }
      }
    };
    renderer.domElement.addEventListener('click', handleCanvasClick);

    // ORBIT DRAG CONTROLS
    const onMouseDown = (e) => {
      if (e.button === 0) { // left button
        controlsRef.current.isDragging = true;
        controlsRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e) => {
      if (!controlsRef.current.isDragging) return;
      const deltaX = e.clientX - controlsRef.current.prevMousePos.x;
      const deltaY = e.clientY - controlsRef.current.prevMousePos.y;
      controlsRef.current.prevMousePos = { x: e.clientX, y: e.clientY };

      const ctrl = controlsRef.current;
      ctrl.sphericalLerp.theta -= deltaX * 0.008;
      ctrl.sphericalLerp.phi = Math.max(0.1, Math.min(Math.PI / 2.05, ctrl.sphericalLerp.phi - deltaY * 0.008));
    };

    const onMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const ctrl = controlsRef.current;
      ctrl.sphericalLerp.radius = Math.max(4.0, Math.min(22.0, ctrl.sphericalLerp.radius + e.deltaY * 0.008));
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // -------------------------------------------------------------
    // MAIN RENDER ANIMATION LOOP
    // -------------------------------------------------------------
    let clock = new THREE.Clock();
    let laserPos = -4.0;
    let laserDir = 1;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const { 
        autoRotate: curAutoRotate, 
        renderMode: curRenderMode, 
        explodedView: curExploded, 
        showParticles: curShowParticles, 
        showLaserScan: curShowLaserScan,
        isAnomalous: curAnomalous, 
        isWarning: curWarning 
      } = stateRef.current;

      // Auto rotation if enabled
      if (curAutoRotate && !controlsRef.current.isDragging) {
        controlsRef.current.sphericalLerp.theta += 0.004;
      }

      // Smooth camera interpolation
      const ctrl = controlsRef.current;
      ctrl.spherical.radius += (ctrl.sphericalLerp.radius - ctrl.spherical.radius) * 0.1;
      ctrl.spherical.phi += (ctrl.sphericalLerp.phi - ctrl.spherical.phi) * 0.1;
      ctrl.spherical.theta += (ctrl.sphericalLerp.theta - ctrl.spherical.theta) * 0.1;
      ctrl.target.lerp(ctrl.targetLerp, 0.1);

      // Convert spherical coordinates to cartesian position
      const x = ctrl.target.x + ctrl.spherical.radius * Math.sin(ctrl.spherical.phi) * Math.sin(ctrl.spherical.theta);
      const y = ctrl.target.y + ctrl.spherical.radius * Math.cos(ctrl.spherical.phi);
      const z = ctrl.target.z + ctrl.spherical.radius * Math.sin(ctrl.spherical.phi) * Math.cos(ctrl.spherical.theta);
      camera.position.set(x, y, z);
      camera.lookAt(ctrl.target);

      // Rotating drive shaft
      if (dynamicMeshes.current.shaft) {
        dynamicMeshes.current.shaft.rotation.x += delta * 12.0; // ~ 115 RPM visual rotation
      }

      // Vibration simulation on Motor Casing in Warning or Anomaly
      if (dynamicMeshes.current.bearingHousing) {
        const vibIntensity = curAnomalous ? 0.024 : curWarning ? 0.009 : 0.001;
        const vibFrequency = curAnomalous ? 48.0 : 24.0;
        const jitterY = Math.sin(time * vibFrequency) * vibIntensity;
        const jitterZ = Math.cos(time * (vibFrequency * 1.3)) * vibIntensity;
        motorGroup.position.y = motorGroup.userData.basePos.y + jitterY;
        motorGroup.position.z = motorGroup.userData.basePos.z + jitterZ;
      }

      // Beacon LED pulse
      if (dynamicMeshes.current.beaconLed && dynamicMeshes.current.beaconLight) {
        if (curAnomalous) {
          const strobe = Math.sin(time * 12) > 0 ? 1 : 0;
          dynamicMeshes.current.beaconLed.material.color.setHex(0xef4444);
          dynamicMeshes.current.beaconLed.material.emissive.setHex(0xef4444);
          dynamicMeshes.current.beaconLed.material.emissiveIntensity = strobe * 2.0;
          dynamicMeshes.current.beaconLight.color.setHex(0xef4444);
          dynamicMeshes.current.beaconLight.intensity = strobe * 3.0;
        } else if (curWarning) {
          const pulse = (Math.sin(time * 4) + 1) * 0.5;
          dynamicMeshes.current.beaconLed.material.color.setHex(0xf59e0b);
          dynamicMeshes.current.beaconLed.material.emissive.setHex(0xf59e0b);
          dynamicMeshes.current.beaconLed.material.emissiveIntensity = 0.5 + pulse * 1.0;
          dynamicMeshes.current.beaconLight.color.setHex(0xf59e0b);
          dynamicMeshes.current.beaconLight.intensity = 1.0 + pulse * 1.5;
        } else {
          dynamicMeshes.current.beaconLed.material.color.setHex(0x10b981);
          dynamicMeshes.current.beaconLed.material.emissive.setHex(0x10b981);
          dynamicMeshes.current.beaconLed.material.emissiveIntensity = 0.8;
          dynamicMeshes.current.beaconLight.color.setHex(0x10b981);
          dynamicMeshes.current.beaconLight.intensity = 1.2;
        }
      }

      // Thermal Point Light intensity at motor bearing
      if (dynamicMeshes.current.thermalLight) {
        if (curRenderMode === 'thermal' || curAnomalous) {
          const targetIntensity = curAnomalous ? 4.5 : curWarning ? 2.5 : 0.8;
          dynamicMeshes.current.thermalLight.intensity = targetIntensity;
        } else {
          dynamicMeshes.current.thermalLight.intensity = 0;
        }
      }

      // Exploded View transition
      const targetExplode = curExploded ? 1.0 : 0.0;
      dynamicMeshes.current.explodedParts.forEach(({ group, basePos, offset }) => {
        const dest = new THREE.Vector3().copy(basePos).addScaledVector(offset, targetExplode);
        group.position.lerp(dest, 0.08);
      });

      // Flow particle animation
      if (dynamicMeshes.current.particleSystem && curShowParticles) {
        const positions = dynamicMeshes.current.particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 0] += delta * 2.2;
          if (positions[i * 3 + 0] > 3.6) {
            positions[i * 3 + 0] = 0.2;
          }
        }
        dynamicMeshes.current.particleSystem.geometry.attributes.position.needsUpdate = true;
      }

      // Laser radar scanning sweep
      if (dynamicMeshes.current.laserPlane && curShowLaserScan) {
        laserPos += delta * 2.4 * laserDir;
        if (laserPos > 4.5) laserDir = -1;
        if (laserPos < -4.5) laserDir = 1;
        dynamicMeshes.current.laserPlane.position.x = laserPos;
        dynamicMeshes.current.laserPlane.visible = true;
        dynamicMeshes.current.laserPlane.visible = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      domElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElem.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, []);

  // Update Material Shading Mode (PBR vs Thermal vs Wireframe)
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    scene.traverse((obj) => {
      if (obj.isMesh && obj.userData?.id) {
        if (renderMode === 'wireframe') {
          obj.material.wireframe = true;
          if (obj.material.color) obj.material.color.setHex(0x00f2fe);
          obj.material.transparent = true;
          obj.material.opacity = 0.65;
        } else if (renderMode === 'thermal') {
          obj.material.wireframe = false;
          obj.material.transparent = false;
          if (obj.userData.id === 'motor_casing_p01') {
            if (isAnomalous) {
              obj.material.color.setHex(0xff0044); // Infrared thermal hotspot
              obj.material.emissive?.setHex(0xcc0033);
              obj.material.emissiveIntensity = 0.8;
            } else if (isWarning) {
              obj.material.color.setHex(0xf59e0b); // Amber heat elevation
              obj.material.emissive?.setHex(0x884400);
              obj.material.emissiveIntensity = 0.5;
            } else {
              obj.material.color.setHex(0x0088cc); // Cool thermal nominal
              obj.material.emissive?.setHex(0x002244);
              obj.material.emissiveIntensity = 0.2;
            }
          } else {
            obj.material.color.setHex(0x003366);
            obj.material.emissive?.setHex(0x001122);
            obj.material.emissiveIntensity = 0.1;
          }
        } else {
          // Normal PBR
          obj.material.wireframe = false;
          obj.material.transparent = false;
          if (obj.userData.id === 'motor_casing_p01') {
            obj.material.color.setHex(0x1e2c45);
            obj.material.emissive?.setHex(0x000000);
          } else if (obj.userData.id === 'pressure_valve_v3') {
            obj.material.color.setHex(0x24344d);
            obj.material.emissive?.setHex(0x000000);
          } else {
            obj.material.color.setHex(0x1b2436);
            obj.material.emissive?.setHex(0x000000);
          }
        }
      }
    });
  }, [renderMode, isAnomalous, isWarning]);

  return (
    <div className="digital-twin-container" style={{ position: 'relative', width: '100%', height: '100%', minHeight: isSplitView ? '320px' : '480px', overflow: 'hidden', background: '#060911', borderRadius: '12px' }}>
      {/* 3D Canvas Mount */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Floating 3D HUD Header Controls */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        pointerEvents: 'none',
        zIndex: 10
      }}>
        {/* Left: Mode Title & Real-time Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(8, 14, 28, 0.85)',
            border: '1px solid rgba(var(--accent-rgb), 0.3)',
            padding: '6px 12px',
            borderRadius: '8px',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}>
            <Box size={16} color="var(--accent-cyan)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.5px', color: '#fff' }}>
              3D DIGITAL TWIN TELEMETRY
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              background: isAnomalous ? 'rgba(239, 68, 68, 0.2)' : isWarning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#34d399',
              border: `1px solid ${isAnomalous ? 'rgba(239, 68, 68, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
            }}>
              {isAnomalous ? '● ANOMALY DETECTED' : isWarning ? '▲ BEARING WARNING' : '✓ SYNCHRONIZED'}
            </span>
          </div>
        </div>

        {/* Right: Render Shader Modes (PBR, Thermal, Hologram) */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto', flexWrap: 'wrap' }}>
          <button
            className={`toggle-chip ${renderMode === 'pbr' ? 'active' : ''}`}
            onClick={() => setRenderMode('pbr')}
            title="Photorealistic Industrial PBR Shading"
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            <Layers size={13} style={{ display: 'inline', marginRight: '4px' }} />
            PBR CAD
          </button>
          <button
            className={`toggle-chip ${renderMode === 'thermal' ? 'active' : ''}`}
            onClick={() => setRenderMode('thermal')}
            title="Infrared Thermal Gradient Visualization"
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            <Flame size={13} style={{ display: 'inline', marginRight: '4px', color: '#f59e0b' }} />
            IR Thermal
          </button>
          <button
            className={`toggle-chip ${renderMode === 'wireframe' ? 'active' : ''}`}
            onClick={() => setRenderMode('wireframe')}
            title="AR Matrix Holographic Wireframe"
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            <Sparkles size={13} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-cyan)' }} />
            Hologram
          </button>
        </div>
      </div>

      {/* Floating 3D Interactive Hotspot Overlays */}
      <div style={{ position: 'absolute', bottom: '56px', left: '12px', right: '12px', pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        {/* Component Focus Selector Pills */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto', flexWrap: 'wrap' }}>
          <button
            onClick={() => onSelectEquipment('motor_casing_p01')}
            style={{
              background: selectedEquipment === 'motor_casing_p01' ? 'rgba(var(--accent-rgb), 0.25)' : 'rgba(10, 16, 30, 0.8)',
              border: `1px solid ${selectedEquipment === 'motor_casing_p01' ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
              boxShadow: `0 0 6px ${isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}`
            }} />
            <strong>[P01] Motor Casing</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
              {isAnomalous ? '78.4°C' : isWarning ? '54.2°C' : '44.5°C'}
            </span>
          </button>

          <button
            onClick={() => onSelectEquipment('pressure_valve_v3')}
            style={{
              background: selectedEquipment === 'pressure_valve_v3' ? 'rgba(var(--accent-rgb), 0.25)' : 'rgba(10, 16, 30, 0.8)',
              border: `1px solid ${selectedEquipment === 'pressure_valve_v3' ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <strong>[V3] Pressure Valve</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>3.2 BAR</span>
          </button>

          <button
            onClick={() => onSelectEquipment('junction_box_t2')}
            style={{
              background: selectedEquipment === 'junction_box_t2' ? 'rgba(var(--accent-rgb), 0.25)' : 'rgba(10, 16, 30, 0.8)',
              border: `1px solid ${selectedEquipment === 'junction_box_t2' ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <strong>[T2] Terminal Junction</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>480V NOMINAL</span>
          </button>
        </div>

        {/* Right: Exploded Schematic & LiDAR Toggles */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
          <button
            className={`toggle-chip ${explodedView ? 'active' : ''}`}
            onClick={() => setExplodedView(!explodedView)}
            title="Exploded Assembly View (CAD Isolation)"
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            <Sliders size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Exploded View
          </button>
          <button
            className={`toggle-chip ${showLaserScan ? 'active' : ''}`}
            onClick={() => setShowLaserScan(!showLaserScan)}
            title="LiDAR 3D Laser Plane Sweep"
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            <Radio size={13} style={{ display: 'inline', marginRight: '4px' }} />
            LiDAR Sweep
          </button>
        </div>
      </div>

      {/* Bottom Floating Viewport Navigation Toolbar */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(8, 14, 28, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '6px 14px',
        backdropFilter: 'blur(12px)',
        zIndex: 10
      }}>
        {/* Camera Angles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <Compass size={14} color="var(--accent-cyan)" />
          <span>Camera:</span>
          <button
            className={`toggle-chip ${cameraPreset === 'iso' ? 'active' : ''}`}
            onClick={() => applyCameraPreset('iso')}
            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
          >
            Isometric
          </button>
          <button
            className={`toggle-chip ${cameraPreset === 'front' ? 'active' : ''}`}
            onClick={() => applyCameraPreset('front')}
            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
          >
            Front
          </button>
          <button
            className={`toggle-chip ${cameraPreset === 'top' ? 'active' : ''}`}
            onClick={() => applyCameraPreset('top')}
            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
          >
            Top-Down
          </button>
        </div>

        {/* Orbit / Auto-rotate controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`toggle-chip ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
          >
            <RotateCw size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Auto-Rotate
          </button>

          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Left-Click: Orbit | Wheel: Zoom | Click Asset to Inspect
          </div>
        </div>
      </div>
    </div>
  );
}
