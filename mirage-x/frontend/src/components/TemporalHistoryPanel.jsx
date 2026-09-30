import { getCanvasColor, getCanvasHex } from '../utils/themeColors';
import React, { useState, useEffect, useRef } from 'react';
import { 
  History, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sliders,
  Layers,
  Activity,
  Zap,
  Filter,
  Check,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Crosshair,
  Eye,
  Thermometer,
  Gauge,
  Search,
  ChevronRight,
  ShieldAlert,
  Cpu
} from 'lucide-react';

export default function TemporalHistoryPanel({
  temporalEvents = [],
  currentRiskLevel = 'MEDIUM',
  activeScenario = 'warning',
  isDedicatedView = false
}) {
  const [activeTab, setActiveTab] = useState('waveform'); // 'waveform' | 'visual_delta' | 'differential' | 'timeline'
  const [eventFilter, setEventFilter] = useState('all'); // 'all' | 'warning' | 'anomalous' | 'calibration'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Re-Zero Golden Baseline State
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationSuccess, setCalibrationSuccess] = useState(false);

  // Time-Travel Scrubber state
  const [scrubberTime, setScrubberTime] = useState(0); // 0 = Live (T-0s), -60 = 60s ago
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hoveredWaveformPoint, setHoveredWaveformPoint] = useState(null);
  const [selectedFrameCell, setSelectedFrameCell] = useState(14); // default inspect frame 14
  const [splitWipePos, setSplitWipePos] = useState(50); // percentage for visual delta wipe slider
  const [visualDeltaMode, setVisualDeltaMode] = useState('split'); // 'split' | 'overlay' | 'vectors' | 'thermal'

  const canvasRef = useRef(null);
  const isAnomalous = activeScenario === 'anomalous';
  const isWarning = activeScenario === 'warning';

  // Persistence calculation (FR-06)
  const trippedFrames = isAnomalous ? 32 : isWarning ? 14 : 0;
  const maxFrames = 30;
  const isPersistenceSaturated = trippedFrames >= maxFrames;

  // Calibration stages text
  const calibrationSteps = [
    'Sampling 60 optical & acoustic frames on Snapdragon NPU...',
    'Computing multi-dimensional tensor covariance matrix...',
    'Extracting 2.4 kHz eigenfrequency baseline signature...',
    'Locking ±5.0% golden tolerance envelope in SRAM...',
    'Baseline locked. Zero deviation reference synchronized!'
  ];

  // Handle Golden Baseline Re-Calibration Simulation
  const handleRecalibrate = () => {
    setIsCalibrating(true);
    setCalibrationProgress(0);
    setCalibrationStep(0);
    setCalibrationSuccess(false);

    let progress = 0;
    let step = 0;
    const interval = setInterval(() => {
      progress += 4;
      if (progress % 20 === 0 && step < 4) {
        step += 1;
        setCalibrationStep(step);
      }
      if (progress >= 100) {
        clearInterval(interval);
        setCalibrationProgress(100);
        setIsCalibrating(false);
        setCalibrationSuccess(true);
        setTimeout(() => setCalibrationSuccess(false), 3500);
      } else {
        setCalibrationProgress(progress);
      }
    }, 70);
  };

  // Time-travel scrubber play/pause auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setScrubberTime(prev => {
        if (prev >= 0) {
          return -60; // loop back to 60s ago
        }
        return Math.min(0, prev + 0.5 * playbackSpeed);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Real-time Canvas Waveform for Temporal Deviation Drift (FR-05)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const render = () => {
      t += 0.025;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const midY = h / 2 + 6;

      // 1. Cyber Industrial Grid
      ctx.strokeStyle = getCanvasColor(0.06);
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Tolerance Threshold Bands
      // Golden Reference Baseline Envelope Band (±5% nominal tolerance)
      const envHalf = 14;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fillRect(0, midY - envHalf, w, envHalf * 2);

      // Warning Threshold (+15%)
      const warnY = midY - 32;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, warnY);
      ctx.lineTo(w, warnY);
      ctx.stroke();

      // Critical Emergency Trip Threshold (+25%)
      const critY = midY - 54;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, critY);
      ctx.lineTo(w, critY);
      ctx.stroke();

      // Zero Centerline (Golden Baseline Reference)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      // Threshold Labels
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.fillText('+25% TRIP THRESHOLD', 6, critY - 3);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.fillText('+15% WARNING ENVELOPE', 6, warnY - 3);
      ctx.fillStyle = '#34d399';
      ctx.fillText('0.0% GOLDEN BASELINE (±5% TOLERANCE)', 6, midY + 10);

      // 3. Dual Rolling Waveforms:
      // Waveform A: Vibration RMS Drift (Cyan Phosphor)
      ctx.beginPath();
      ctx.lineWidth = 2.2;
      const waveColor = isAnomalous ? '#ef4444' : isWarning ? '#00f2fe' : '#00f2fe';
      ctx.strokeStyle = waveColor;

      const driftOffset = isAnomalous ? -56 : isWarning ? -30 : 0;
      const waveAmp = isAnomalous ? 14 : isWarning ? 9 : 4;

      for (let x = 0; x < w; x++) {
        const progressRatio = x / w;
        // Factor in scrubber time if scrubbing historical playback
        const scrubOffset = (scrubberTime / 60) * 8;
        const rollingT = t * 2.2 - progressRatio * 4 + scrubOffset;
        const noise = isAnomalous ? (Math.sin(rollingT * 6.8) * 3) : 0;
        const y = midY + driftOffset + Math.sin(rollingT) * waveAmp + Math.cos(rollingT * 0.45) * (waveAmp * 0.35) + noise;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Glowing gradient under Vibration wave
      ctx.lineTo(w, midY);
      ctx.lineTo(0, midY);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, midY + driftOffset - waveAmp, 0, midY);
      if (isAnomalous) {
        fillGrad.addColorStop(0, 'rgba(239, 68, 68, 0.28)');
        fillGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
      } else if (isWarning) {
        fillGrad.addColorStop(0, getCanvasColor(0.22));
        fillGrad.addColorStop(1, getCanvasColor(0.0));
      } else {
        fillGrad.addColorStop(0, 'rgba(16, 185, 129, 0.16)');
        fillGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      }
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Waveform B: Thermal Gradient Excursion (Orange / Amber Trace)
      ctx.beginPath();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([3, 2]);

      const thermOffset = isAnomalous ? -42 : isWarning ? -18 : 0;
      const thermAmp = isAnomalous ? 8 : isWarning ? 5 : 2;

      for (let x = 0; x < w; x++) {
        const progressRatio = x / w;
        const scrubOffset = (scrubberTime / 60) * 8;
        const rollingT = t * 1.8 - progressRatio * 3 + scrubOffset;
        const y = midY + thermOffset + Math.sin(rollingT) * thermAmp;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Lead Head Pip
      const currentY = midY + driftOffset + Math.sin(t * 2.2 + (scrubberTime / 60) * 8) * waveAmp;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w - 6, currentY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Scrubber Cursor Line if not live
      if (scrubberTime < -0.5) {
        const scrubX = w + (scrubberTime / 60) * w;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(scrubX, 0);
        ctx.lineTo(scrubX, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Scrubber tag
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(scrubX - 25, 4, 50, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`T ${scrubberTime.toFixed(1)}s`, scrubX, 14);
      }

      // Interactive Hover Crosshair
      if (hoveredWaveformPoint) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hoveredWaveformPoint.x, 0);
        ctx.lineTo(hoveredWaveformPoint.x, h);
        ctx.moveTo(0, hoveredWaveformPoint.y);
        ctx.lineTo(w, hoveredWaveformPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshair HUD
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'var(--accent-cyan)';
        ctx.lineWidth = 1;
        const hudX = Math.min(w - 110, Math.max(10, hoveredWaveformPoint.x + 8));
        const hudY = Math.min(h - 30, Math.max(20, hoveredWaveformPoint.y - 20));
        ctx.fillRect(hudX, hudY, 100, 24);
        ctx.strokeRect(hudX, hudY, 100, 24);

        ctx.fillStyle = '#00f2fe';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`T - ${((1 - hoveredWaveformPoint.x / w) * 60).toFixed(1)}s`, hudX + 4, hudY + 10);
        ctx.fillStyle = isAnomalous ? '#f87171' : '#fbbf24';
        ctx.fillText(`Δ DEV: ${isAnomalous ? '+28.4%' : '+14.2%'}`, hudX + 4, hudY + 20);
      }

      // Live Drift Callout Tag
      ctx.fillStyle = waveColor;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(
        isAnomalous ? '▲ +28.4% VIB DRIFT (CRITICAL TRIP)' : isWarning ? '▲ +14.2% VIB DRIFT (WARNING)' : '✓ 0.4% NOMINAL',
        w - 14,
        Math.max(16, currentY - 10)
      );

      // Legend in bottom right
      ctx.fillStyle = '#64748b';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('T - 60s', 6, h - 4);
      ctx.textAlign = 'center';
      ctx.fillText('T - 30s', w / 2, h - 4);
      ctx.textAlign = 'right';
      ctx.fillText('T - 0s (LIVE)', w - 6, h - 4);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeScenario, isAnomalous, isWarning, scrubberTime, hoveredWaveformPoint]);

  // Handle canvas mouse move for interactive crosshair
  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoveredWaveformPoint({ x, y });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Calculate time from x: x=0 is -60s, x=w is 0s
    const ratio = x / rect.width;
    const clickedTime = -60 * (1 - ratio);
    setScrubberTime(Math.min(0, Math.max(-60, clickedTime)));
  };

  // 5 Detailed Asset Differential Items
  const differentialAssets = [
    {
      id: 'P01',
      name: 'Motor Casing P01: Drive Bearing Housing',
      subsystem: 'Drive Unit & Kinematics',
      metric: 'Vibration Velocity RMS',
      golden: '0.80 mm/s | 41.2°C',
      current: isAnomalous ? '3.40 mm/s | 78.4°C' : isWarning ? '1.90 mm/s | 54.2°C' : '0.82 mm/s | 41.5°C',
      deltaPct: isAnomalous ? '+325%' : isWarning ? '+137%' : '0.0%',
      deltaStatus: isAnomalous ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOMINAL',
      rootCause: isAnomalous ? 'Severe inner race spalling & cage micro-fracture' : isWarning ? 'Sub-surface frictional bearing race wear' : 'Dynamic balance within ISO 10816-3',
      freqSpike: isAnomalous ? '2.4 kHz (+14.8 dB)' : isWarning ? '2.4 kHz (+6.2 dB)' : 'None (< -45 dB)',
      tempDelta: isAnomalous ? '+37.2°C' : isWarning ? '+13.0°C' : '+0.3°C'
    },
    {
      id: 'V03',
      name: 'Pressure Valve V3: Inlet Line',
      subsystem: 'Fluid Kinetics & Hydraulics',
      metric: 'Differential Line Pressure',
      golden: '3.20 BAR | 42.5 L/min',
      current: isAnomalous ? '4.80 BAR | 18.2 L/min' : isWarning ? '3.85 BAR | 36.1 L/min' : '3.22 BAR | 42.3 L/min',
      deltaPct: isAnomalous ? '+50.0%' : isWarning ? '+20.3%' : '+0.6%',
      deltaStatus: isAnomalous ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOMINAL',
      rootCause: isAnomalous ? 'Downstream line blockage / elastomeric seal extrusion' : isWarning ? 'Incipient valve seat restriction / cavitation' : 'Laminar hydrodynamic equilibrium',
      freqSpike: isAnomalous ? '14.2 kHz Cavitation' : isWarning ? '8.4 kHz Turbulence' : 'Nominal flow acoustics',
      tempDelta: isAnomalous ? '+8.5°C' : isWarning ? '+3.1°C' : '+0.1°C'
    },
    {
      id: 'C02',
      name: 'Hydraulic Coupling C2: Shaft Flange',
      subsystem: 'Mechanical Transmission',
      metric: 'Angular Misalignment',
      golden: '0.04 mm radial | 0.02° angular',
      current: isAnomalous ? '0.28 mm radial | 0.16° angular' : isWarning ? '0.12 mm radial | 0.07° angular' : '0.05 mm radial | 0.02° angular',
      deltaPct: isAnomalous ? '+600%' : isWarning ? '+200%' : '+25%',
      deltaStatus: isAnomalous ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOMINAL',
      rootCause: isAnomalous ? 'Coupling elastomer shear failure & bolt loosening' : isWarning ? 'Thermal expansion misalignment on drive axle' : 'Within ANSI flexible coupling spec',
      freqSpike: isAnomalous ? '1X / 2X Shaft Runout' : isWarning ? '2X Flange Harmonic' : 'Balanced rotational vector',
      tempDelta: isAnomalous ? '+19.4°C' : isWarning ? '+7.8°C' : '+0.5°C'
    },
    {
      id: 'T04',
      name: 'Transformer Junction T4: Terminal Feed',
      subsystem: 'Power Distribution',
      metric: 'Busbar Thermal Gradient',
      golden: '48.0°C | 0.8% Phase Imbalance',
      current: isAnomalous ? '92.5°C | 6.8% Phase Imbalance' : isWarning ? '66.2°C | 2.9% Phase Imbalance' : '48.3°C | 0.9% Phase Imbalance',
      deltaPct: isAnomalous ? '+92.7%' : isWarning ? '+37.9%' : '+0.6%',
      deltaStatus: isAnomalous ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOMINAL',
      rootCause: isAnomalous ? 'Phase B terminal lug high-resistance contact oxidation' : isWarning ? 'Mild harmonic distortion & thermal clustering' : 'Balanced inductive load distribution',
      freqSpike: isAnomalous ? '300 Hz 5th Harmonic' : isWarning ? '180 Hz 3rd Harmonic' : 'Pure 60 Hz fundamental',
      tempDelta: isAnomalous ? '+44.5°C' : isWarning ? '+18.2°C' : '+0.3°C'
    },
    {
      id: 'F02',
      name: 'Cooling Impeller Fan F02: Cowling',
      subsystem: 'Thermal Exhaust Management',
      metric: 'Aerodynamic Backpressure',
      golden: '1,450 RPM | 120 Pa Static Head',
      current: isAnomalous ? '1,120 RPM | 45 Pa Static Head' : isWarning ? '1,320 RPM | 95 Pa Static Head' : '1,448 RPM | 119 Pa Static Head',
      deltaPct: isAnomalous ? '-62.5%' : isWarning ? '-20.8%' : '-0.8%',
      deltaStatus: isAnomalous ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOMINAL',
      rootCause: isAnomalous ? 'Impeller blade foreign object fouling & aerodynamic stall' : isWarning ? 'Intake plenum filter dust accumulation' : 'Full convective aerodynamic flow',
      freqSpike: isAnomalous ? 'Sub-synchronous swirl' : isWarning ? 'Blade pass modulation' : 'Pure 7-blade pass fundamental',
      tempDelta: isAnomalous ? '+14.1°C' : isWarning ? '+5.4°C' : '+0.2°C'
    }
  ];

  const filteredEvents = temporalEvents.filter(evt => {
    if (eventFilter === 'warning' && evt.state !== 'WARNING') return false;
    if (eventFilter === 'anomalous' && evt.state !== 'ANOMALOUS') return false;
    if (eventFilter === 'calibration' && !evt.message?.toLowerCase().includes('baseline')) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        evt.type?.toLowerCase().includes(q) ||
        evt.message?.toLowerCase().includes(q) ||
        evt.state?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="glass-card temporal-card" style={{ width: '100%', overflow: 'hidden' }}>
      {/* 1. Header with Golden Baseline Status & Action Controls */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="card-title-group">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), rgba(79, 172, 254, 0.1))',
            border: '1px solid rgba(var(--accent-rgb), 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(var(--accent-rgb), 0.2)'
          }}>
            <History className="card-title-icon" size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="card-title" style={{ fontSize: '0.92rem', letterSpacing: '0.02em' }}>
                Temporal Engine & "What Changed"
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(var(--accent-rgb), 0.12)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(var(--accent-rgb), 0.25)',
                fontWeight: 700
              }}>
                FR-05 / FR-06
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Snapdragon NPU 60-Frame Golden Baseline & 30-Frame Anti-Glitch Persistence Pipeline
            </div>
          </div>
        </div>

        {/* Right Action Tools: Re-Zero Baseline & Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: calibrationSuccess ? '#10b981' : isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
              boxShadow: `0 0 8px ${calibrationSuccess ? '#10b981' : isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}`
            }} />
            <span style={{ color: 'var(--text-secondary)' }}>Baseline:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>T-0 Locked (±5.0%)</span>
          </div>

          <button
            className="btn btn-outline"
            onClick={handleRecalibrate}
            disabled={isCalibrating}
            style={{ 
              padding: '5px 12px', 
              fontSize: '0.72rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              borderColor: calibrationSuccess ? '#10b981' : 'rgba(var(--accent-rgb), 0.35)',
              background: calibrationSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(var(--accent-rgb), 0.05)'
            }}
            title="Re-acquire 60-frame Golden Reference baseline on Snapdragon NPU"
          >
            {isCalibrating ? (
              <RotateCcw size={13} className="spin-slow" color="var(--accent-cyan)" />
            ) : calibrationSuccess ? (
              <Check size={13} color="#10b981" />
            ) : (
              <RefreshCw size={13} color="var(--accent-cyan)" />
            )}
            <span style={{ fontWeight: 600 }}>
              {isCalibrating ? `Calibrating ${calibrationProgress}%` : calibrationSuccess ? 'Baseline Locked' : 'Re-Zero Baseline'}
            </span>
          </button>
        </div>
      </div>

      {/* Calibration Modal / HUD Overlay during active calibration */}
      {isCalibrating && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(var(--accent-rgb), 0.12), rgba(15, 23, 42, 0.95), rgba(var(--accent-rgb), 0.12))',
          borderBottom: '1px solid rgba(var(--accent-rgb), 0.3)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={16} color="var(--accent-cyan)" className="spin-slow" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                SNAPDRAGON NPU CALIBRATION STAGE {calibrationStep + 1}/5
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                {calibrationSteps[calibrationStep]}
              </div>
            </div>
          </div>
          <div style={{ width: '140px' }}>
            <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${calibrationProgress}%`,
                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
                transition: 'width 0.1s linear'
              }} />
            </div>
            <div style={{ fontSize: '0.62rem', textAlign: 'right', color: 'var(--text-muted)', marginTop: '2px' }}>
              {calibrationProgress}% Complete
            </div>
          </div>
        </div>
      )}

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 2. Interactive Time-Travel Scrubber Bar */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={13} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                Time-Travel Reconstruction Scrubber
              </span>
              <span style={{
                fontSize: '0.64rem',
                fontFamily: 'var(--font-mono)',
                color: scrubberTime >= -0.5 ? '#10b981' : '#38bdf8',
                background: scrubberTime >= -0.5 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 700
              }}>
                {scrubberTime >= -0.5 ? '● LIVE SYNCHRONIZED' : `PAST REPLAY: ${scrubberTime.toFixed(1)}s`}
              </span>
            </div>

            {/* Playback Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn-outline"
                onClick={() => setScrubberTime(-60)}
                style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                title="Jump to T - 60s (Nominal State)"
              >
                <SkipBack size={11} />
                <span>-60s</span>
              </button>

              <button
                className="btn btn-outline"
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.65rem',
                  borderColor: isPlaying ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                  background: isPlaying ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent'
                }}
              >
                {isPlaying ? <Pause size={11} /> : <Play size={11} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                className="btn btn-outline"
                onClick={() => setPlaybackSpeed(s => s === 1 ? 2 : s === 2 ? 5 : 1)}
                style={{ padding: '2px 6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}
                title="Playback Speed"
              >
                {playbackSpeed}x
              </button>

              <button
                className="btn btn-primary"
                onClick={() => { setScrubberTime(0); setIsPlaying(false); }}
                style={{ padding: '2px 8px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={11} />
                <span>Sync Live (T-0)</span>
              </button>
            </div>
          </div>

          {/* Scrubber Range Slider */}
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min="-60"
              max="0"
              step="0.5"
              value={scrubberTime}
              onChange={(e) => {
                setScrubberTime(parseFloat(e.target.value));
                setIsPlaying(false);
              }}
              style={{
                width: '100%',
                height: '6px',
                accentColor: 'var(--accent-cyan)',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Time Marker Ticks */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            <span>-60s (T-60)</span>
            <span>-45s</span>
            <span style={{ color: isWarning ? '#fbbf24' : 'inherit' }}>-30s (Incipient Wear)</span>
            <span style={{ color: isAnomalous ? '#f87171' : 'inherit' }}>-15s (Threshold Breach)</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>T-0 (LIVE)</span>
          </div>
        </div>

        {/* 3. Navigation Sub-Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('waveform')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'waveform' ? 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), rgba(var(--accent-rgb), 0.08))' : 'transparent',
              color: activeTab === 'waveform' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'waveform' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <TrendingUp size={13} />
            <span>Drift Waveform & Persistence</span>
          </button>

          <button
            onClick={() => setActiveTab('visual_delta')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'visual_delta' ? 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), rgba(var(--accent-rgb), 0.08))' : 'transparent',
              color: activeTab === 'visual_delta' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'visual_delta' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Eye size={13} />
            <span>Visual Delta & Ghost Overlay</span>
          </button>

          <button
            onClick={() => setActiveTab('differential')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'differential' ? 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), rgba(var(--accent-rgb), 0.08))' : 'transparent',
              color: activeTab === 'differential' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'differential' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Activity size={13} />
            <span>Asset Differential (Δ)</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'timeline' ? 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), rgba(var(--accent-rgb), 0.08))' : 'transparent',
              color: activeTab === 'timeline' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'timeline' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <History size={13} />
            <span>Event Timeline ({temporalEvents.length})</span>
          </button>
        </div>

        {/* 4. Tab 1: Real-time Drift Waveform & 30-Frame Persistence Pipeline */}
        {activeTab === 'waveform' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Waveform Card */}
            <div style={{
              background: '#020611',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={14} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Dual-Trace Temporal Deviation vs Golden Baseline
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)' }}>
                    <span style={{ width: '8px', height: '2px', background: '#00f2fe' }} />
                    Track A: Vibration Drift
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                    <span style={{ width: '8px', height: '2px', background: '#f59e0b' }} />
                    Track B: Thermal Gradient
                  </span>
                  <span style={{
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isAnomalous ? 'rgba(239, 68, 68, 0.2)' : isWarning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#34d399'
                  }}>
                    {isAnomalous ? '+28.4% TRIP LEVEL' : isWarning ? '+14.2% WARNING' : '0.4% NOMINAL'}
                  </span>
                </div>
              </div>

              {/* Canvas with Crosshair & Click to Seek */}
              <div style={{ width: '100%', height: '140px', position: 'relative', cursor: 'crosshair' }}>
                <canvas 
                  ref={canvasRef} 
                  width={640} 
                  height={140} 
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={() => setHoveredWaveformPoint(null)}
                  onClick={handleCanvasClick}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                <span>Interactive: Click anywhere on waveform or drag slider to scrub temporal history</span>
                <span>Hexagon NPU Sampling Rate: 30 FPS / 33.3ms Latency</span>
              </div>
            </div>

            {/* 30-Frame Rolling Persistence Filter Pipeline (FR-06) */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Snapdragon NPU 30-Frame Anti-Glitch Persistence Pipeline (FR-06)
                  </span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#10b981'
                }}>
                  {trippedFrames} / 30 FRAMES ({isPersistenceSaturated ? 'SATURATED / EMERGENCY TRIP' : isWarning ? 'ACCUMULATING / EVALUATING' : 'ZERO GLITCH PASS'})
                </span>
              </div>

              {/* 30 Discrete Frame Cells Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(30, 1fr)',
                gap: '4px',
                height: '24px',
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '4px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {Array.from({ length: maxFrames }).map((_, i) => {
                  const isCellTripped = i < trippedFrames;
                  const isSelected = selectedFrameCell === i;
                  let cellColor = 'rgba(255, 255, 255, 0.04)';
                  let cellBorder = '1px solid transparent';
                  let cellGlow = 'none';

                  if (isCellTripped) {
                    if (isAnomalous) {
                      cellColor = '#ef4444';
                      cellGlow = '0 0 6px rgba(239, 68, 68, 0.8)';
                    } else if (isWarning) {
                      cellColor = '#f59e0b';
                      cellGlow = '0 0 6px rgba(245, 158, 11, 0.8)';
                    }
                  } else {
                    cellColor = 'rgba(16, 185, 129, 0.25)';
                  }

                  if (isSelected) {
                    cellBorder = '1px solid #ffffff';
                  }

                  return (
                    <div 
                      key={i} 
                      onClick={() => setSelectedFrameCell(i)}
                      style={{ 
                        borderRadius: '3px', 
                        background: cellColor, 
                        boxShadow: cellGlow,
                        border: cellBorder,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Frame #${i + 1}/30: ${isCellTripped ? 'Anomaly Threshold Exceeded' : 'Nominal Toleranced'}`}
                    />
                  );
                })}
              </div>

              {/* Selected Frame Telemetry Detail Inspector */}
              <div style={{
                marginTop: '10px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>INSPECTED FRAME</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>Frame #{selectedFrameCell + 1} of 30</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>NPU INFERENCE LATENCY</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>1.78 ms (Hexagon)</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>PERSISTENCE STATE</span>
                  <span style={{ color: selectedFrameCell < trippedFrames ? (isAnomalous ? '#f87171' : '#fbbf24') : '#34d399', fontWeight: 700 }}>
                    {selectedFrameCell < trippedFrames ? 'DEFECT CONFIRMED' : 'REJECTED TRANSIENT'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>ANTI-GLITCH SUPPRESSION</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Active (0 False Alarms)</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                <span>Warning Threshold: ≥ 10 consecutive frames (~330ms)</span>
                <span>Emergency Trip: ≥ 30 consecutive frames (~1.0s continuous fault verification)</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Tab 2: Visual Delta & Ghost Overlay Comparator */}
        {activeTab === 'visual_delta' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Visual Controls Mode Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={13} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Visual Golden Baseline Differential Comparator
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={`toggle-chip ${visualDeltaMode === 'split' ? 'active' : ''}`}
                  onClick={() => setVisualDeltaMode('split')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  Split Wipe Slider
                </button>
                <button
                  className={`toggle-chip ${visualDeltaMode === 'overlay' ? 'active' : ''}`}
                  onClick={() => setVisualDeltaMode('overlay')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  Ghost CAD Wireframe
                </button>
                <button
                  className={`toggle-chip ${visualDeltaMode === 'vectors' ? 'active' : ''}`}
                  onClick={() => setVisualDeltaMode('vectors')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  Kinematic Vectors
                </button>
                <button
                  className={`toggle-chip ${visualDeltaMode === 'thermal' ? 'active' : ''}`}
                  onClick={() => setVisualDeltaMode('thermal')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  Thermal Heatmap Diff
                </button>
              </div>
            </div>

            {/* Visual Comparison Stage */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '240px',
              background: '#030712',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Synthetic Visual Representation */}
              <svg width="100%" height="100%" viewBox="0 0 600 240" style={{ position: 'absolute', inset: 0 }}>
                {/* Background Blueprint Grid */}
                <defs>
                  <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(var(--accent-rgb), 0.05)" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="deviatedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f87171" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                <rect width="100%" height="100%" fill="url(#gridPattern)" />

                {/* Left Side: Golden Baseline (T-0) Equipment Wireframe */}
                <g opacity={visualDeltaMode === 'split' ? (splitWipePos > 40 ? 1 : 0.2) : 0.6}>
                  {/* Motor Base & Stator */}
                  <rect x="70" y="80" width="160" height="100" rx="8" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
                  {/* Rotor Axis Centerline */}
                  <line x1="40" y1="130" x2="260" y2="130" stroke="#10b981" strokeWidth="1" strokeDasharray="6 3" />
                  {/* Bearing Housing P01 Nominal */}
                  <circle cx="210" cy="130" r="22" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" />
                  {/* Shaft Output */}
                  <rect x="230" y="122" width="50" height="16" rx="2" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  {/* Nominal Label */}
                  <text x="80" y="105" fill="#34d399" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">GOLDEN T-0 REFERENCE</text>
                  <text x="80" y="120" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">VIB: 0.8 mm/s | TEMP: 41.2°C</text>
                </g>

                {/* Right Side: Current Deviated State (T-Now) */}
                <g opacity={visualDeltaMode === 'split' ? (splitWipePos < 60 ? 1 : 0.3) : 1}>
                  {/* Deviated Stator with micro-eccentricity */}
                  <rect 
                    x={isAnomalous ? 362 : isWarning ? 361 : 360} 
                    y={isAnomalous ? 76 : isWarning ? 78 : 80} 
                    width="160" 
                    height="100" 
                    rx="8" 
                    fill={isAnomalous ? 'rgba(239, 68, 68, 0.08)' : isWarning ? 'rgba(245, 158, 11, 0.05)' : 'none'} 
                    stroke={isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#00f2fe'} 
                    strokeWidth="2" 
                  />
                  {/* Deviated Axis with Angular Tilt */}
                  <line 
                    x1="330" 
                    y1={isAnomalous ? 124 : 128} 
                    x2="550" 
                    y2={isAnomalous ? 138 : 132} 
                    stroke={isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#00f2fe'} 
                    strokeWidth="1.5" 
                  />
                  {/* Bearing Housing P01 Hotspot / Distortion */}
                  <circle 
                    cx="500" 
                    cy={isAnomalous ? 134 : 131} 
                    r={isAnomalous ? 28 : 24} 
                    fill={isAnomalous ? 'rgba(239, 68, 68, 0.35)' : isWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(var(--accent-rgb), 0.15)'} 
                    stroke={isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#00f2fe'} 
                    strokeWidth="2.5" 
                  />
                  {/* Deviated Shaft Output */}
                  <rect 
                    x="520" 
                    y={isAnomalous ? 126 : 123} 
                    width="50" 
                    height="16" 
                    rx="2" 
                    fill="none" 
                    stroke={isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#00f2fe'} 
                    strokeWidth="1.5" 
                  />
                  {/* Deviated Label */}
                  <text x="370" y="105" fill={isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#00f2fe'} fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                    {isAnomalous ? 'OBSERVED DEFECT (T-NOW)' : isWarning ? 'INCIPIENT DRIFT (T-NOW)' : 'LIVE MATCHING BASELINE'}
                  </text>
                  <text x="370" y="120" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
                    {isAnomalous ? 'VIB: 3.4 mm/s | TEMP: 78.4°C' : isWarning ? 'VIB: 1.9 mm/s | TEMP: 54.2°C' : 'VIB: 0.8 mm/s | TEMP: 41.5°C'}
                  </text>
                </g>

                {/* Kinematic Displacement Vectors Mode */}
                {(visualDeltaMode === 'vectors' || visualDeltaMode === 'overlay') && (
                  <g>
                    {/* Vector Arrow 1: Shaft Eccentricity */}
                    <line x1="210" y1="130" x2="500" y2={isAnomalous ? 134 : 131} stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                    {/* Physical Delta Callout */}
                    <circle cx="500" cy={isAnomalous ? 134 : 131} r="6" fill="#ef4444" />
                    <text x="460" y="175" fill="#f87171" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      ΔX: +2.4mm SHAFT DEFLECTION
                    </text>
                  </g>
                )}

                {/* Thermal Plume Mode */}
                {visualDeltaMode === 'thermal' && (
                  <g>
                    <circle cx="500" cy="134" r="45" fill="url(#deviatedGrad)" />
                    <text x="440" y="200" fill="#f87171" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      THERMAL PLUME: +37.2°C EXCURSION
                    </text>
                  </g>
                )}

                {/* Split Wipe Dividing Line */}
                {visualDeltaMode === 'split' && (
                  <g>
                    <line 
                      x1={`${splitWipePos}%`} 
                      y1="0" 
                      x2={`${splitWipePos}%`} 
                      y2="240" 
                      stroke="#00f2fe" 
                      strokeWidth="2.5" 
                      strokeDasharray="4 2" 
                    />
                    <circle cx={`${splitWipePos}%`} cy="120" r="14" fill="#00f2fe" />
                    <text x={`${splitWipePos}%`} y="123" fill="#000" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">
                      WIPE
                    </text>
                  </g>
                )}
              </svg>

              {/* Wipe Slider Handle Bar at Bottom */}
              {visualDeltaMode === 'split' && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  width: '80%',
                  background: 'rgba(0, 0, 0, 0.7)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '0.66rem', color: '#10b981', fontWeight: 700 }}>GOLDEN (T-0)</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={splitWipePos}
                    onChange={(e) => setSplitWipePos(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontSize: '0.66rem', color: isAnomalous ? '#ef4444' : '#fbbf24', fontWeight: 700 }}>
                    OBSERVED (T-NOW)
                  </span>
                </div>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)'
            }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>SPATIAL DRIFT COEFFICIENT</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{isAnomalous ? '0.84 (HIGH DISPLACEMENT)' : isWarning ? '0.38 (ELEVATED JITTER)' : '0.04 (NOMINAL)'}</span>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>OPTICAL FLOW DISCORDANCE</span>
                <span style={{ color: isAnomalous ? '#f87171' : '#fbbf24', fontWeight: 700 }}>{isAnomalous ? '+18.4 px/frame' : '+6.1 px/frame'}</span>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>VLM REASONING ATTRIBUTION</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>Shaft misalignment & inner bearing race spalling</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. Tab 3: "What Changed" Multi-Asset Differential Matrix */}
        {activeTab === 'differential' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={13} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Component Differential Telemetry (Baseline vs Observed)
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                5 Industrial Subsystems Tracked
              </span>
            </div>

            {/* 5 Component Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {differentialAssets.map((asset) => {
                const isCrit = asset.deltaStatus === 'CRITICAL';
                const isWarn = asset.deltaStatus === 'WARNING';

                return (
                  <div 
                    key={asset.id}
                    style={{
                      background: isCrit ? 'rgba(239, 68, 68, 0.06)' : isWarn ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.35)' : isWarn ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      padding: '10px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#fff' }}>{asset.name}</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {asset.subsystem} • Primary Target: {asset.metric}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: isCrit ? 'rgba(239, 68, 68, 0.2)' : isWarn ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isCrit ? '#f87171' : isWarn ? '#fbbf24' : '#34d399',
                          border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.4)' : isWarn ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                        }}>
                          Δ {asset.deltaPct} EXCURSION
                        </span>
                      </div>
                    </div>

                    {/* Differential Matrix Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1.2fr 1.6fr 1fr',
                      gap: '8px',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '8px',
                      borderRadius: '6px'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>GOLDEN BASELINE (T-0)</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{asset.golden}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>CURRENT (T-NOW)</span>
                        <span style={{ color: isCrit ? '#f87171' : isWarn ? '#fbbf24' : '#10b981', fontWeight: 600 }}>
                          {asset.current}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>ROOT CAUSE ATTRIBUTION</span>
                        <span style={{ color: '#fff' }}>{asset.rootCause}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem' }}>HARMONIC PEAK</span>
                        <span style={{ color: isCrit ? '#f87171' : isWarn ? '#fbbf24' : 'var(--text-muted)' }}>
                          {asset.freqSpike}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Tab 4: Historical Event Timeline */}
        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Filter Pills & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={13} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter by keyword (e.g. vibration, bearing)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.68rem',
                    color: '#fff',
                    outline: 'none',
                    width: '220px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={`toggle-chip ${eventFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setEventFilter('all')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  All ({temporalEvents.length})
                </button>
                <button
                  className={`toggle-chip ${eventFilter === 'warning' ? 'active' : ''}`}
                  onClick={() => setEventFilter('warning')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px', color: '#f59e0b' }}
                >
                  Warnings
                </button>
                <button
                  className={`toggle-chip ${eventFilter === 'anomalous' ? 'active' : ''}`}
                  onClick={() => setEventFilter('anomalous')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px', color: '#ef4444' }}
                >
                  Anomalies
                </button>
                <button
                  className={`toggle-chip ${eventFilter === 'calibration' ? 'active' : ''}`}
                  onClick={() => setEventFilter('calibration')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px', color: '#10b981' }}
                >
                  Calibrations
                </button>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="timeline-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {filteredEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  No temporal events match the specified filter.
                </div>
              ) : (
                filteredEvents.map((event, idx) => {
                  const stateLower = event.state.toLowerCase();
                  return (
                    <div 
                      key={idx} 
                      className="timeline-event"
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onClick={() => setScrubberTime(Math.max(-60, (event.timestamp - Date.now() / 1000)))}
                      title="Click to seek Time-Travel Scrubber to this event"
                    >
                      <div className={`timeline-indicator ${stateLower}`}>
                        {event.state === 'ANOMALOUS' ? (
                          <AlertOctagon size={13} />
                        ) : event.state === 'WARNING' ? (
                          <AlertTriangle size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                      </div>

                      <div className="timeline-content" style={{ flex: 1 }}>
                        <div className="timeline-title-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="timeline-type">{event.type}</span>
                            <span style={{
                              fontSize: '0.6rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: event.state === 'ANOMALOUS' ? 'rgba(239, 68, 68, 0.2)' : event.state === 'WARNING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: event.state === 'ANOMALOUS' ? '#f87171' : event.state === 'WARNING' ? '#fbbf24' : '#34d399',
                              fontWeight: 700
                            }}>
                              {event.state}
                            </span>
                          </div>
                          <span className="timeline-time">
                            {new Date(event.timestamp * 1000).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="timeline-msg">{event.message}</p>
                        
                        {/* Micro Metadata tag */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          <span>NPU Latency: 1.7ms</span>
                          <span>Persistence: 14/30</span>
                          <span style={{ color: 'var(--accent-cyan)' }}>Click to Seek Timeline →</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 8. Global Bottom Persistence Summary Badge */}
        <div style={{
          marginTop: '4px',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Baseline Engine:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 700 }}>
              Snapdragon NPU 60-Frame Golden Reference
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Anti-Glitch Status:</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#10b981',
              fontWeight: 700
            }}>
              {isAnomalous ? 'FAULT PERSISTENT (>1.0s TRIP)' : isWarning ? 'PERSISTENCE FILTER EVALUATING' : 'ZERO TRANSIENT FAULT LOCK'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
