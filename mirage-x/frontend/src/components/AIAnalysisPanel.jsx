import { getCanvasColor, getCanvasHex } from '../utils/themeColors';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Thermometer, 
  AudioLines, 
  Radio, 
  Sliders, 
  Volume2, 
  TrendingUp, 
  Cpu,
  Layers,
  Zap,
  Target,
  BarChart3,
  Waves,
  ShieldAlert,
  Gauge,
  Info
} from 'lucide-react';

export default function AIAnalysisPanel({
  detections,
  selectedEquipment,
  onSelectEquipment,
  audioEnabled
}) {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'fused' | 'spectrum'
  const [spectrumMode, setSpectrumMode] = useState('fft'); // 'fft' | 'waveform'
  const spectrumCanvasRef = useRef(null);

  const isAnomalous = detections.some(d => d.state === 'ANOMALOUS');
  const isWarning = detections.some(d => d.state === 'WARNING');

  // Overall Health Score calculation
  const healthScore = isAnomalous ? 38.5 : isWarning ? 74.2 : 98.4;
  const healthGrade = isAnomalous ? 'GRADE F (CRITICAL HAZARD)' : isWarning ? 'GRADE B (MAINTENANCE REQUIRED)' : 'GRADE A (NOMINAL)';

  // Real-time Canvas Visualizer for FFT Spectrum & Oscilloscope Waveform
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const render = () => {
      t += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Cyber background grid
      ctx.strokeStyle = getCanvasColor(0.05);
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (!audioEnabled) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Acoustic Sensor Hardware Muted', w / 2, h / 2 + 4);
        return;
      }

      if (spectrumMode === 'fft') {
        // --- 32-Band FFT Frequency Spectrum ---
        const numBars = 32;
        const barWidth = (w - (numBars - 1) * 3) / numBars;

        // Draw frequency bars
        for (let i = 0; i < numBars; i++) {
          const is24kHzZone = i >= 14 && i <= 17;
          let baseHeight = Math.sin(t * 2.5 + i * 0.45) * 0.18 + 0.28;

          if (is24kHzZone) {
            if (isAnomalous) {
              baseHeight = 0.88 + Math.sin(t * 8 + i) * 0.1; // Spike +14.8dB
            } else if (isWarning) {
              baseHeight = 0.68 + Math.sin(t * 6 + i) * 0.08; // Spike +6.2dB
            } else {
              baseHeight = 0.35 + Math.sin(t * 3 + i) * 0.05;
            }
          }

          const barHeight = Math.max(4, baseHeight * (h - 22));
          const x = i * (barWidth + 3);
          const y = h - 16 - barHeight;

          // Gradient for bars
          const grad = ctx.createLinearGradient(0, y, 0, h);
          if (is24kHzZone && (isAnomalous || isWarning)) {
            grad.addColorStop(0, isAnomalous ? '#ef4444' : '#f59e0b');
            grad.addColorStop(1, 'rgba(239, 68, 68, 0.25)');
          } else {
            grad.addColorStop(0, getCanvasHex());
            grad.addColorStop(1, getCanvasColor(0.15));
          }

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Glowing Cap
          ctx.fillStyle = is24kHzZone && (isAnomalous || isWarning) ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(x, y - 2, barWidth, 2);
        }

        // Draw Envelope Continuous Curve
        ctx.strokeStyle = isAnomalous ? 'rgba(239, 68, 68, 0.8)' : isWarning ? 'rgba(245, 158, 11, 0.8)' : getCanvasColor(0.8);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const is24kHzZone = i >= 14 && i <= 17;
          let baseHeight = Math.sin(t * 2.5 + i * 0.45) * 0.18 + 0.28;
          if (is24kHzZone) {
            baseHeight = isAnomalous ? 0.88 : isWarning ? 0.68 : 0.35;
          }
          const barHeight = Math.max(4, baseHeight * (h - 22));
          const x = i * (barWidth + 3) + barWidth / 2;
          const y = h - 16 - barHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Marker for 2.4 kHz peak
        const markerX = 15.5 * (barWidth + 3);
        ctx.fillStyle = isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#00f2fe';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isAnomalous ? '▲ 2.41 kHz (+14.8dB)' : isWarning ? '▲ 2.41 kHz (+6.2dB)' : '2.4 kHz', markerX, 10);

        // Frequency Axis Line & Labels
        ctx.fillStyle = '#64748b';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('0 Hz', 4, h - 4);
        ctx.textAlign = 'center';
        ctx.fillText('1.2 kHz', w * 0.25, h - 4);
        ctx.fillText('2.4 kHz', markerX, h - 4);
        ctx.fillText('3.6 kHz', w * 0.75, h - 4);
        ctx.textAlign = 'right';
        ctx.fillText('5.0 kHz', w - 4, h - 4);
      } else {
        // --- Oscilloscope Real-Time Time-Domain Waveform ---
        ctx.strokeStyle = isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#00f2fe';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const midY = h / 2 - 4;
        const amp = isAnomalous ? 28 : isWarning ? 18 : 8;

        for (let x = 0; x < w; x++) {
          const freq = isAnomalous ? 0.08 : isWarning ? 0.05 : 0.03;
          const jitter = isAnomalous ? (Math.random() - 0.5) * 6 : 0;
          const y = midY + Math.sin(x * freq + t * 6) * amp + Math.cos(x * 0.02 + t * 3) * (amp * 0.4) + jitter;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Waveform Axis labels
        ctx.fillStyle = '#64748b';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('TIME DOMAIN (±50 mV)', 6, 12);
        ctx.textAlign = 'right';
        ctx.fillText(isAnomalous ? 'HARMONIC CLIPPING DETECTED' : 'PERIODIC ENVELOPE', w - 6, 12);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [audioEnabled, spectrumMode, isAnomalous, isWarning]);

  return (
    <div className="glass-card ai-matrix-card">
      {/* Header with Title & Overall Health Badge */}
      <div className="card-header">
        <div className="card-title-group">
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(var(--accent-rgb), 0.12)',
            border: '1px solid rgba(var(--accent-rgb), 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity className="card-title-icon" size={16} />
          </div>
          <div>
            <span className="card-title">AI Analysis & State Matrix</span>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Snapdragon NPU Multimodal Fusion Engine (FR-03 / FR-04)
            </div>
          </div>
        </div>

        {/* System Health Score Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isAnomalous ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${isAnomalous ? 'rgba(239, 68, 68, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          padding: '4px 10px',
          borderRadius: '20px'
        }}>
          {isAnomalous ? <AlertOctagon size={13} color="#ef4444" /> : isWarning ? <AlertTriangle size={13} color="#f59e0b" /> : <CheckCircle2 size={13} color="#10b981" />}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#34d399'
          }}>
            {healthScore}% HEALTH
          </span>
        </div>
      </div>

      <div className="card-body">
        {/* Navigation Sub-Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
            <button
              onClick={() => setActiveTab('matrix')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'matrix' ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent',
                color: activeTab === 'matrix' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={12} />
              <span>Asset Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('fused')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'fused' ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent',
                color: activeTab === 'fused' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Cpu size={12} />
              <span>Sensor Fusion</span>
            </button>

            <button
              onClick={() => setActiveTab('spectrum')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'spectrum' ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent',
                color: activeTab === 'spectrum' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <AudioLines size={12} />
              <span>Acoustic Lab</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Asset State Matrix */}
        {activeTab === 'matrix' && (
          <div className="equipment-list">
            {detections.map((item, idx) => {
              const isSelected = selectedEquipment === item.label;
              const isItemAnom = item.state === 'ANOMALOUS';
              const isItemWarn = item.state === 'WARNING';
              const stateClass = item.state.toLowerCase();

              return (
                <div
                  key={idx}
                  className={`equipment-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectEquipment(item.label)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    background: isSelected 
                      ? 'rgba(var(--accent-rgb), 0.08)' 
                      : isItemAnom 
                      ? 'rgba(239, 68, 68, 0.04)' 
                      : isItemWarn 
                      ? 'rgba(245, 158, 11, 0.03)' 
                      : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${
                      isSelected 
                        ? 'var(--accent-cyan)' 
                        : isItemAnom 
                        ? 'rgba(239, 68, 68, 0.35)' 
                        : isItemWarn 
                        ? 'rgba(245, 158, 11, 0.3)' 
                        : 'var(--border-subtle)'
                    }`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    boxShadow: isSelected ? '0 0 16px rgba(var(--accent-rgb), 0.18)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Left Selection Ribbon */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '8px',
                      bottom: '8px',
                      width: '3px',
                      background: 'var(--accent-cyan)',
                      borderRadius: '0 2px 2px 0',
                      boxShadow: '0 0 8px var(--accent-cyan)'
                    }} />
                  )}

                  {/* Header Row */}
                  <div className="equip-header">
                    <span className="equip-name" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {isItemAnom ? (
                        <AlertOctagon size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                      ) : isItemWarn ? (
                        <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
                      ) : (
                        <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0 }} />
                      )}
                      <span>{item.label}</span>
                    </span>

                    <span className={`state-pill ${stateClass}`}>
                      {item.state}
                    </span>
                  </div>

                  {/* Component Diagnostic Micro-Telemetry Badges */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '6px',
                    margin: '6px 0',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'hidden'
                  }}>
                    {item.label === 'motor_casing_p01' ? (
                      <>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>VIBRATION</div>
                          <div style={{ color: isItemAnom ? '#f87171' : isItemWarn ? '#fbbf24' : '#10b981', fontWeight: 700 }}>
                            {isItemAnom ? '3.4 mm/s' : isItemWarn ? '1.9 mm/s' : '0.8 mm/s'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>TEMPERATURE</div>
                          <div style={{ color: isItemAnom ? '#f87171' : isItemWarn ? '#fbbf24' : '#10b981', fontWeight: 700 }}>
                            {isItemAnom ? '78.4°C' : isItemWarn ? '54.2°C' : '44.5°C'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>ROTOR RPM</div>
                          <div style={{ color: '#fff', fontWeight: 700 }}>1,750</div>
                        </div>
                      </>
                    ) : item.label === 'pressure_valve_v3' ? (
                      <>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>PRESSURE</div>
                          <div style={{ color: isItemAnom ? '#f87171' : '#10b981', fontWeight: 700 }}>
                            {isItemAnom ? '4.8 BAR' : '3.2 BAR'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>FLUID FLOW</div>
                          <div style={{ color: '#fff', fontWeight: 700 }}>42.5 L/m</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>SEAL RATING</div>
                          <div style={{ color: '#10b981', fontWeight: 700 }}>94% OK</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>PHASE VOLT</div>
                          <div style={{ color: '#fff', fontWeight: 700 }}>480V 3Φ</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>INSULATION</div>
                          <div style={{ color: '#10b981', fontWeight: 700 }}>&gt;50 MΩ</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>ENCLOSURE</div>
                          <div style={{ color: '#10b981', fontWeight: 700 }}>NEMA 4X</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* NPU Confidence Bar */}
                  <div className="confidence-bar-wrapper">
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill" 
                        style={{ 
                          width: `${Math.round(item.confidence * 100)}%`,
                          background: isItemAnom 
                            ? 'linear-gradient(90deg, #f87171, #ef4444)' 
                            : isItemWarn 
                            ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' 
                            : 'linear-gradient(90deg, var(--accent-cyan), #10b981)'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {Math.round(item.confidence * 100)}% Confidence
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Multimodal Sensor Fusion */}
        {activeTab === 'fused' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Hexagon NPU Multimodal Sensor Fused Signals
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Sensor 1: Visual Jitter */}
              <div className="sensor-card" style={{ padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="sensor-label">Visual Jitter (NPU)</span>
                  <span style={{ fontSize: '0.65rem', color: isAnomalous ? '#f87171' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {isAnomalous ? 'PHASE DRIFT' : 'LOCKED'}
                  </span>
                </div>
                <div className={`sensor-value ${isAnomalous ? 'alert' : ''}`}>
                  {isAnomalous ? '±4.2 px' : isWarning ? '±1.8 px' : '±0.8 px'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Optical flow jitter vs baseline
                </div>
              </div>

              {/* Sensor 2: Acoustic Harmonic */}
              <div className="sensor-card" style={{ padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="sensor-label">Acoustic Peak</span>
                  <span style={{ fontSize: '0.65rem', color: audioEnabled ? '#00f2fe' : '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {audioEnabled ? '2.41 kHz' : 'MUTED'}
                  </span>
                </div>
                <div className="sensor-value" style={{ color: audioEnabled ? (isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#00f2fe') : '#64748b' }}>
                  {audioEnabled ? (isAnomalous ? '+14.8 dB' : isWarning ? '+6.2 dB' : '±0.4 dB') : 'OFF'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Bearing race sideband energy
                </div>
              </div>

              {/* Sensor 3: IR Thermography */}
              <div className="sensor-card" style={{ padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="sensor-label">FLIR Surface Temp</span>
                  <span style={{ fontSize: '0.65rem', color: isAnomalous ? '#f87171' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {isAnomalous ? '+34°C RISE' : 'NOMINAL'}
                  </span>
                </div>
                <div className={`sensor-value ${isAnomalous ? 'alert' : ''}`}>
                  {isAnomalous ? '78.4 °C' : isWarning ? '54.2 °C' : '44.5 °C'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Drive-end bearing thermogram
                </div>
              </div>

              {/* Sensor 4: Temporal Persistence */}
              <div className="sensor-card" style={{ padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="sensor-label">Temporal Drift</span>
                  <span style={{ fontSize: '0.65rem', color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {isAnomalous ? 'FAULT CONFIRMED' : isWarning ? 'EVALUATING' : 'LOCKED'}
                  </span>
                </div>
                <div className="sensor-value" style={{ color: isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981' }}>
                  {isAnomalous ? '32/30 frames' : isWarning ? '14/30 frames' : '0/30 frames'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Rolling 30-frame persistence
                </div>
              </div>
            </div>

            {/* Fusion Status Banner */}
            <div style={{
              background: 'rgba(var(--accent-rgb), 0.04)',
              border: '1px solid rgba(var(--accent-rgb), 0.25)',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Zap size={16} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Multimodal fusion pipeline on Qualcomm Hexagon NPU cross-references visual bounding boxes with acoustic FFT sidebands to eliminate false positives in industrial environments.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Acoustic Lab & FFT Spectrum */}
        {activeTab === 'spectrum' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Acoustic Frequency Analyzer
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={`toggle-chip ${spectrumMode === 'fft' ? 'active' : ''}`}
                  onClick={() => setSpectrumMode('fft')}
                  style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                >
                  <BarChart3 size={11} style={{ display: 'inline', marginRight: '3px' }} />
                  FFT Bars
                </button>
                <button
                  className={`toggle-chip ${spectrumMode === 'waveform' ? 'active' : ''}`}
                  onClick={() => setSpectrumMode('waveform')}
                  style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                >
                  <Waves size={11} style={{ display: 'inline', marginRight: '3px' }} />
                  Oscilloscope
                </button>
              </div>
            </div>

            {/* Canvas Spectrum */}
            <div style={{ background: '#030712', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ width: '100%', height: '110px', position: 'relative' }}>
                <canvas 
                  ref={spectrumCanvasRef} 
                  width={380} 
                  height={110} 
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>
            </div>

            {/* Spectrum Readout Footnote */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
              <div className="sensor-card">
                <span className="sensor-label">Center Freq</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>2,412 Hz</span>
              </div>
              <div className="sensor-card">
                <span className="sensor-label">Peak Power</span>
                <span style={{ color: isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                  {isAnomalous ? '-12 dBFS' : isWarning ? '-24 dBFS' : '-48 dBFS'}
                </span>
              </div>
              <div className="sensor-card">
                <span className="sensor-label">Sample Rate</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>48 kHz 24b</span>
              </div>
            </div>
          </div>
        )}

        {/* Global Bottom Mini Banner: Active Asset Summary */}
        <div style={{
          marginTop: '6px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.7rem'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Focus Target:</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
            {selectedEquipment.toUpperCase()}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#10b981', fontWeight: 600 }}>
            {healthGrade}
          </span>
        </div>
      </div>
    </div>
  );
}
