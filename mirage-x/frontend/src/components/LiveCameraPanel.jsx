import { getCanvasColor, getCanvasHex } from '../utils/themeColors';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Eye, 
  Crosshair, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Sparkles,
  Flame,
  Radio,
  Scan,
  Maximize2,
  Zap,
  Target,
  Compass,
  Aperture,
  ShieldCheck,
  Disc
} from 'lucide-react';

export default function LiveCameraPanel({
  detections,
  onSelectEquipment,
  selectedEquipment,
  streamSource,
  setStreamSource,
  telemetry = {},
  activeScenario = 'warning'
}) {
  // Optic Filter Modes: 'rgb' | 'flir' | 'edge' | 'night'
  const [filterMode, setFilterMode] = useState('rgb');
  const [showHud, setShowHud] = useState(true);
  const [showScanlines, setShowScanlines] = useState(true);
  const [showLidarSweep, setShowLidarSweep] = useState(true);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [recTime, setRecTime] = useState('00:00:00');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const isAnomalous = activeScenario === 'anomalous';
  const isWarning = activeScenario === 'warning';

  // Live recording time counter
  useEffect(() => {
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      setRecTime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebRTC user media hook when webcam mode is active
  useEffect(() => {
    let stream = null;
    if (streamSource === 'webcam') {
      navigator.mediaDevices?.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.warn("Local webcam access not granted or unavailable:", err);
          setStreamSource('simulated');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [streamSource]);

  // Synthetic industrial machine rendering on Canvas
  useEffect(() => {
    if (streamSource !== 'simulated' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let t = 0;
    let sweepY = 0;
    let sweepDir = 1;

    const render = () => {
      t += 0.035;
      const w = canvas.width;
      const h = canvas.height;

      // Color scheme based on filter mode
      let bgGrad, baseColor, metalDark, metalLight, accentGlow, pipeColor;

      if (filterMode === 'flir') {
        // FLIR Thermal False-Color Palette
        bgGrad = '#08051a';
        baseColor = '#1a0b36';
        metalDark = '#3b1263';
        metalLight = '#7c2282';
        accentGlow = '#ff0055';
        pipeColor = '#4a0e4e';
      } else if (filterMode === 'edge') {
        // Cyber Edge Matrix
        bgGrad = '#03070d';
        baseColor = '#061324';
        metalDark = '#092340';
        metalLight = '#0e3a66';
        accentGlow = '#00f2fe';
        pipeColor = '#0a2b4a';
      } else if (filterMode === 'night') {
        // Phosphor Night Vision
        bgGrad = '#020f06';
        baseColor = '#062610';
        metalDark = '#0d3d1b';
        metalLight = '#18612d';
        accentGlow = '#34d399';
        pipeColor = '#0b3316';
      } else {
        // Standard RGB Industrial Vision
        bgGrad = '#070b14';
        baseColor = '#111927';
        metalDark = '#1e293b';
        metalLight = '#334155';
        accentGlow = '#00f2fe';
        pipeColor = '#1f2e47';
      }

      // 1. Background
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Fine Background Grid
      ctx.strokeStyle = filterMode === 'flir' 
        ? 'rgba(255, 0, 85, 0.06)' 
        : filterMode === 'night' 
        ? 'rgba(52, 211, 153, 0.06)' 
        : 'rgba(var(--accent-rgb), 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Base Plate & Mounting Rails
      ctx.fillStyle = baseColor;
      ctx.fillRect(80, 480, 1120, 170);
      ctx.strokeStyle = metalLight;
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 480, 1120, 170);

      // Mount bolts
      for (let bx = 120; bx <= 1160; bx += 104) {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(bx, 620, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Physical vibration jitter on Motor P01 if Warning or Anomalous
      const vibOffset = isAnomalous 
        ? Math.sin(t * 36) * 4.2 
        : isWarning 
        ? Math.sin(t * 24) * 1.8 
        : 0;

      // 3. MOTOR ASSEMBLY (P01)
      const motorX = 160;
      const motorY = 200 + vibOffset;
      const motorW = 360;
      const motorH = 260;

      // Motor Stator Body
      const motorGrad = ctx.createLinearGradient(motorX, motorY, motorX + motorW, motorY + motorH);
      if (filterMode === 'flir') {
        if (isAnomalous) {
          motorGrad.addColorStop(0, '#ff0033'); // Critical thermal hotspot
          motorGrad.addColorStop(0.5, '#ff7700');
          motorGrad.addColorStop(1, '#ffea00');
        } else if (isWarning) {
          motorGrad.addColorStop(0, '#cc5500');
          motorGrad.addColorStop(0.5, '#ff9900');
          motorGrad.addColorStop(1, '#990066');
        } else {
          motorGrad.addColorStop(0, '#2e1065');
          motorGrad.addColorStop(0.5, '#4c1d95');
          motorGrad.addColorStop(1, '#1e1b4b');
        }
      } else {
        motorGrad.addColorStop(0, metalDark);
        motorGrad.addColorStop(0.5, metalLight);
        motorGrad.addColorStop(1, '#0f172a');
      }

      ctx.fillStyle = motorGrad;
      ctx.roundRect(motorX, motorY, motorW, motorH, 16);
      ctx.fill();
      ctx.strokeStyle = selectedEquipment === 'motor_casing_p01' ? accentGlow : '#475569';
      ctx.lineWidth = selectedEquipment === 'motor_casing_p01' ? 3 : 2;
      ctx.stroke();

      // Motor Cooling Fins (vertical ribs)
      for (let i = motorX + 36; i < motorX + motorW - 20; i += 22) {
        ctx.fillStyle = filterMode === 'flir' && isAnomalous ? '#ff5500' : 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(i, motorY + 12, 6, motorH - 24);
      }

      // Bearing Housing (Drive End)
      const bearingX = motorX + motorW - 30;
      const bearingY = motorY + 80;
      ctx.fillStyle = filterMode === 'flir' && (isAnomalous || isWarning) ? '#ff0033' : '#475569';
      ctx.fillRect(bearingX, bearingY, 50, 100);
      ctx.strokeStyle = filterMode === 'flir' && isAnomalous ? '#ffff00' : '#94a3b8';
      ctx.strokeRect(bearingX, bearingY, 50, 100);

      // Rotating drive shaft
      ctx.fillStyle = '#64748b';
      ctx.fillRect(motorX + motorW + 20, motorY + 90, 120, 80);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(motorX + motorW + 140, motorY + 130, 40, 0, Math.PI * 2);
      ctx.fill();

      // Shaft rotation angle tick
      ctx.strokeStyle = accentGlow;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(motorX + motorW + 140, motorY + 130);
      ctx.lineTo(
        motorX + motorW + 140 + Math.cos(t * 8) * 36,
        motorY + 130 + Math.sin(t * 8) * 36
      );
      ctx.stroke();

      // 4. PRESSURE VALVE ASSEMBLY (V3)
      const valveX = 740;
      const valveY = 220;
      const valveW = 180;
      const valveH = 230;

      const valveGrad = ctx.createLinearGradient(valveX, valveY, valveX + valveW, valveY + valveH);
      if (filterMode === 'flir') {
        valveGrad.addColorStop(0, '#3b1263');
        valveGrad.addColorStop(1, '#1e1b4b');
      } else {
        valveGrad.addColorStop(0, '#273449');
        valveGrad.addColorStop(1, '#151e2e');
      }
      ctx.fillStyle = valveGrad;
      ctx.fillRect(valveX, valveY, valveW, valveH);
      ctx.strokeStyle = selectedEquipment === 'pressure_valve_v3' ? accentGlow : '#475569';
      ctx.lineWidth = selectedEquipment === 'pressure_valve_v3' ? 3 : 2;
      ctx.strokeRect(valveX, valveY, valveW, valveH);

      // Connecting Hydraulic Pipe with animated fluid pulse
      ctx.fillStyle = pipeColor;
      ctx.fillRect(motorX + motorW + 140, motorY + 110, valveX - (motorX + motorW + 140), 40);
      
      // Animated fluid pulses
      for (let px = motorX + motorW + 150; px < valveX; px += 45) {
        const pulseX = px + ((t * 80) % 45);
        if (pulseX < valveX) {
          ctx.fillStyle = filterMode === 'night' ? '#34d399' : filterMode === 'flir' ? '#ffaa00' : 'var(--accent-cyan)';
          ctx.beginPath();
          ctx.arc(pulseX, motorY + 130, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Valve Handwheel on top
      ctx.fillStyle = filterMode === 'flir' ? '#ff3b5c' : '#ef4444';
      ctx.beginPath();
      ctx.arc(valveX + 90, valveY - 50, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Handwheel spokes
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(valveX + 90, valveY - 86);
      ctx.lineTo(valveX + 90, valveY - 14);
      ctx.moveTo(valveX + 54, valveY - 50);
      ctx.lineTo(valveX + 126, valveY - 50);
      ctx.stroke();

      // Digital Pressure Gauge Dial
      ctx.fillStyle = '#060a12';
      ctx.beginPath();
      ctx.arc(valveX + 90, valveY + 70, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isAnomalous ? '#ef4444' : accentGlow;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = isAnomalous ? '#ef4444' : accentGlow;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isAnomalous ? '4.8 BAR' : '3.2 BAR', valveX + 90, valveY + 74);

      // 5. TERMINAL JUNCTION BOX (T2)
      const jboxX = 960;
      const jboxY = 300;
      const jboxW = 160;
      const jboxH = 150;

      ctx.fillStyle = metalDark;
      ctx.fillRect(jboxX, jboxY, jboxW, jboxH);
      ctx.strokeStyle = selectedEquipment === 'junction_box_t2' ? accentGlow : '#475569';
      ctx.lineWidth = selectedEquipment === 'junction_box_t2' ? 3 : 2;
      ctx.strokeRect(jboxX, jboxY, jboxW, jboxH);

      // Danger High Voltage Tag
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(jboxX + 20, jboxY + 20, 44, 22);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('⚡ 480V', jboxX + 42, jboxY + 35);

      // Status Beacon LED
      const ledColor = isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
      ctx.fillStyle = ledColor;
      ctx.beginPath();
      ctx.arc(jboxX + 125, jboxY + 32, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = ledColor;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // 6. Dynamic LiDAR Scanning Laser Sweep
      if (showLidarSweep) {
        sweepY += 3.5 * sweepDir;
        if (sweepY > h - 40) sweepDir = -1;
        if (sweepY < 40) sweepDir = 1;

        const laserGrad = ctx.createLinearGradient(0, sweepY - 15, 0, sweepY + 15);
        laserGrad.addColorStop(0, getCanvasColor(0));
        laserGrad.addColorStop(0.5, filterMode === 'flir' ? 'rgba(255, 0, 85, 0.45)' : getCanvasColor(0.45));
        laserGrad.addColorStop(1, getCanvasColor(0));
        ctx.fillStyle = laserGrad;
        ctx.fillRect(0, sweepY - 15, w, 30);

        ctx.strokeStyle = filterMode === 'flir' ? '#ff0055' : getCanvasHex();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, sweepY);
        ctx.lineTo(w, sweepY);
        ctx.stroke();

        // Small sweep text tag
        ctx.fillStyle = filterMode === 'flir' ? '#ff0055' : getCanvasHex();
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`LiDAR SLAM DEPTH SWEEP: ${Math.round(sweepY)}mm`, 20, sweepY - 4);
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [streamSource, filterMode, detections, selectedEquipment, activeScenario, showLidarSweep, isAnomalous, isWarning]);

  const handleCaptureSnapshot = () => {
    setIsFlashActive(true);
    setSnapshotTaken(true);
    setTimeout(() => setIsFlashActive(false), 250);
    setTimeout(() => setSnapshotTaken(false), 2800);
  };

  return (
    <div className="glass-card camera-card">
      {/* Header with Camera Status & Input Feed Switcher */}
      <div className="card-header">
        <div className="card-title-group">
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            background: 'rgba(var(--accent-rgb), 0.12)',
            border: '1px solid rgba(var(--accent-rgb), 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Camera className="card-title-icon" size={17} />
          </div>
          <div>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Live Camera & NPU Vision Stream</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', color: '#ff3b5c', fontWeight: 700 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3b5c', animation: 'pulse-dot 1.2s infinite' }} />
                REC {recTime}
              </span>
            </span>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              1280x720 RGB | QNN Hexagon Vision Provider | Latency: {telemetry.mean_latency_ms || 12.8}ms
            </div>
          </div>
        </div>

        {/* Camera Source Selector */}
        <div className="cam-source-toggle">
          <button 
            className={`toggle-chip ${streamSource === 'simulated' ? 'active' : ''}`}
            onClick={() => setStreamSource('simulated')}
          >
            <Zap size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Snapdragon Vision Simulator
          </button>
          <button 
            className={`toggle-chip ${streamSource === 'webcam' ? 'active' : ''}`}
            onClick={() => setStreamSource('webcam')}
          >
            <Camera size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Local Webcam
          </button>
          <button 
            className={`toggle-chip ${streamSource === 'backend' ? 'active' : ''}`}
            onClick={() => setStreamSource('backend')}
          >
            <Radio size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Backend QNN Stream
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Optic Filter Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Filter Modes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Optic Sensor:
            </span>
            <button
              className={`toggle-chip ${filterMode === 'rgb' ? 'active' : ''}`}
              onClick={() => setFilterMode('rgb')}
              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
            >
              <Eye size={12} style={{ display: 'inline', marginRight: '3px' }} />
              RGB Optical
            </button>
            <button
              className={`toggle-chip ${filterMode === 'flir' ? 'active' : ''}`}
              onClick={() => setFilterMode('flir')}
              style={{ fontSize: '0.7rem', padding: '3px 8px', color: filterMode === 'flir' ? '#ff3b5c' : 'inherit' }}
            >
              <Flame size={12} style={{ display: 'inline', marginRight: '3px', color: '#ff3b5c' }} />
              Thermal FLIR (IR)
            </button>
            <button
              className={`toggle-chip ${filterMode === 'edge' ? 'active' : ''}`}
              onClick={() => setFilterMode('edge')}
              style={{ fontSize: '0.7rem', padding: '3px 8px', color: filterMode === 'edge' ? 'var(--accent-cyan)' : 'inherit' }}
            >
              <Scan size={12} style={{ display: 'inline', marginRight: '3px', color: 'var(--accent-cyan)' }} />
              Edge Matrix
            </button>
            <button
              className={`toggle-chip ${filterMode === 'night' ? 'active' : ''}`}
              onClick={() => setFilterMode('night')}
              style={{ fontSize: '0.7rem', padding: '3px 8px', color: filterMode === 'night' ? '#34d399' : 'inherit' }}
            >
              <Sparkles size={12} style={{ display: 'inline', marginRight: '3px', color: '#34d399' }} />
              Night Vision
            </button>
          </div>

          {/* Quick Telemetry readout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', flexWrap: 'wrap' }}>
            <span>ISO 400</span>
            <span>•</span>
            <span>1/120s</span>
            <span>•</span>
            <span>WB 5200K</span>
            <span>•</span>
            <span style={{ color: '#10b981' }}>{telemetry.rolling_fps || 30.0} FPS</span>
          </div>
        </div>

        {/* Main Video & Canvas Viewport */}
        <div className="video-container" style={{ position: 'relative', width: '100%', minHeight: '450px', background: '#02050b' }}>
          {streamSource === 'webcam' ? (
            <video ref={videoRef} className="video-element" autoPlay playsInline muted />
          ) : streamSource === 'backend' ? (
            <img 
              src="http://127.0.0.1:8000/api/camera/stream" 
              className="video-element" 
              alt="Live NPU Inspection Feed"
              onError={() => setStreamSource('simulated')}
            />
          ) : (
            <canvas ref={canvasRef} width={1280} height={720} className="video-element" />
          )}

          {/* Camera Shutter Flash Effect */}
          {isFlashActive && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: '#ffffff',
              zIndex: 50,
              animation: 'flash-out 0.25s ease-out forwards'
            }} />
          )}

          {/* Precision Optic HUD Overlays */}
          {showHud && (
            <div className="hud-overlay" style={{ pointerEvents: 'none' }}>
              <div className="hud-grid" />
              <div className="hud-crosshair" />

              {/* 4 Corner Military / Industrial Reticle Brackets */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', width: '28px', height: '28px', borderTop: '2px solid rgba(var(--accent-rgb), 0.7)', borderLeft: '2px solid rgba(var(--accent-rgb), 0.7)' }} />
              <div style={{ position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px', borderTop: '2px solid rgba(var(--accent-rgb), 0.7)', borderRight: '2px solid rgba(var(--accent-rgb), 0.7)' }} />
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '28px', height: '28px', borderBottom: '2px solid rgba(var(--accent-rgb), 0.7)', borderLeft: '2px solid rgba(var(--accent-rgb), 0.7)' }} />
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '28px', height: '28px', borderBottom: '2px solid rgba(var(--accent-rgb), 0.7)', borderRight: '2px solid rgba(var(--accent-rgb), 0.7)' }} />

              {/* Top HUD Telemetry Banner */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '52px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(8, 14, 26, 0.85)',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid rgba(var(--accent-rgb), 0.25)',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)'
              }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>CAM-01 [NPU-RGB]</span>
                <span>FOV: 84°</span>
                <span>EXP: AUTO</span>
                <span style={{ color: '#10b981' }}>AF-LOCK</span>
              </div>

              {/* Bottom Angle & Horizon Level Indicator */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '52px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(8, 14, 26, 0.85)',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid rgba(var(--accent-rgb), 0.25)',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)'
              }}>
                <Compass size={12} color="var(--accent-cyan)" />
                <span>AZ: 042°</span>
                <span>PITCH: +0.2°</span>
                <span>ROLL: 0.0°</span>
                <span style={{ color: isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981' }}>
                  {isAnomalous ? 'TRIP LEVEL CRITICAL' : isWarning ? 'RMS ELEVATED' : 'STEADY'}
                </span>
              </div>
            </div>
          )}

          {/* Scanline CRT overlay */}
          {showScanlines && <div className="scanline-effect" />}

          {/* Interactive Bounding Boxes Layer with High-Tech Targeting Brackets */}
          <div className="bbox-overlay-layer">
            {detections.map((det, index) => {
              const { x1, y1, x2, y2 } = det.bbox;
              const left = `${x1 * 100}%`;
              const top = `${y1 * 100}%`;
              const width = `${(x2 - x1) * 100}%`;
              const height = `${(y2 - y1) * 100}%`;
              const stateClass = `state-${det.state.toLowerCase()}`;
              const isSelected = selectedEquipment === det.label;

              return (
                <div
                  key={index}
                  className={`bbox-box ${stateClass} ${isSelected ? 'selected' : ''}`}
                  style={{ left, top, width, height }}
                  onClick={() => onSelectEquipment(det.label)}
                  title={`Target Acquired: Click to inspect ${det.label}`}
                >
                  {/* Targeting Corner Angle Brackets */}
                  <span className="bbox-corner tl" />
                  <span className="bbox-corner tr" />
                  <span className="bbox-corner bl" />
                  <span className="bbox-corner br" />

                  {/* Centered crosshair targeting lock icon if selected */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      color: det.state === 'ANOMALOUS' ? '#ef4444' : det.state === 'WARNING' ? '#f59e0b' : 'var(--accent-cyan)',
                      animation: 'spin 12s linear infinite'
                    }}>
                      <Target size={26} />
                    </div>
                  )}

                  {/* Upper Tag with State & Confidence */}
                  <div className={`bbox-tag ${stateClass}`}>
                    {det.state === 'ANOMALOUS' ? (
                      <AlertOctagon size={12} />
                    ) : det.state === 'WARNING' ? (
                      <AlertTriangle size={12} />
                    ) : (
                      <CheckCircle2 size={12} />
                    )}
                    <span>{det.label.toUpperCase()}</span>
                    <span>{Math.round(det.confidence * 100)}%</span>
                  </div>

                  {/* Lower Micro-telemetry pill */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '0',
                    background: 'rgba(8, 14, 26, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    fontSize: '0.62rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#fff',
                    whiteSpace: 'nowrap'
                  }}>
                    {det.label === 'motor_casing_p01'
                      ? (isAnomalous ? '78.4°C | 3.4 mm/s' : isWarning ? '54.2°C | 1.9 mm/s' : '44.5°C | 0.8 mm/s')
                      : det.label === 'pressure_valve_v3'
                      ? (isAnomalous ? '4.8 BAR OVERPRESSURE' : '3.2 BAR NOMINAL')
                      : '480V 3-PHASE'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Snapshot Toast Confirmation */}
          {snapshotTaken && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.95), rgba(0, 150, 255, 0.95))',
              color: '#07090e',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.8rem',
              boxShadow: '0 4px 20px rgba(var(--accent-rgb), 0.6)',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>Calibrated Vision Snapshot Saved to Evidence Log</span>
            </div>
          )}
        </div>

        {/* Viewport Control Bar */}
        <div className="camera-controls-bar">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className={`toggle-chip ${showHud ? 'active' : ''}`}
              onClick={() => setShowHud(!showHud)}
            >
              <Crosshair size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Optic HUD
            </button>
            <button 
              className={`toggle-chip ${showScanlines ? 'active' : ''}`}
              onClick={() => setShowScanlines(!showScanlines)}
            >
              <Sliders size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Scanlines
            </button>
            <button 
              className={`toggle-chip ${showLidarSweep ? 'active' : ''}`}
              onClick={() => setShowLidarSweep(!showLidarSweep)}
            >
              <Radio size={13} style={{ display: 'inline', marginRight: '4px' }} />
              LiDAR Sweep
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" style={{ padding: '5px 14px', fontSize: '0.74rem' }} onClick={handleCaptureSnapshot}>
              <Eye size={13} />
              <span>Freeze Frame Snapshot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
