import React, { useState } from 'react';
import DigitalTwin3D from './DigitalTwin3D';
import { 
  Box, 
  Activity, 
  Flame, 
  Layers, 
  Gauge, 
  Radio, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon,
  Maximize2,
  FileText,
  RotateCw,
  Cpu,
  ArrowRight,
  TrendingUp,
  Zap,
  Info
} from 'lucide-react';

export default function DigitalTwinView({
  selectedEquipment,
  onSelectEquipment,
  activeScenario,
  telemetry,
  detections,
  evidence,
  reasoning,
  onOpenReport
}) {
  const isAnomalous = activeScenario === 'anomalous';
  const isWarning = activeScenario === 'warning';

  // Subsystem filter
  const [isolatedPart, setIsolatedPart] = useState('ALL');

  return (
    <div className="digital-twin-view-page" style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Top Twin Banner */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(255, 59, 92, 0.2))',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.25)',
            flexShrink: 0
          }}>
            <Box size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.2vw, 1.25rem)', fontWeight: 800, color: '#fff', letterSpacing: '0.5px', margin: 0 }}>
                Snapdragon 3D Digital Twin Command Center
              </h2>
              <span style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                padding: '2px 8px',
                borderRadius: '4px',
                background: isAnomalous ? 'rgba(239, 68, 68, 0.2)' : isWarning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#34d399',
                border: `1px solid ${isAnomalous ? 'rgba(239, 68, 68, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                fontWeight: 700
              }}>
                {isAnomalous ? '● RUNAWAY HAZARD' : isWarning ? '▲ BEARING WEAR DETECTED' : '✓ 100% NOMINAL'}
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Real-time Hardware-Accelerated 3D State Replication via Snapdragon Hexagon NPU & Oryon Architecture
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            padding: '6px 12px',
            borderRadius: '6px'
          }}>
            Snapdragon NPU Sync: <strong>{telemetry.rolling_fps || 28.4} FPS</strong> (Latency: {telemetry.mean_latency_ms || 12.8}ms)
          </div>
          <button className="btn btn-primary" onClick={onOpenReport} style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            <FileText size={14} />
            <span>Generate Twin Audit</span>
          </button>
        </div>
      </div>

      {/* Main Digital Twin Grid (3D Centerpiece + Engineering Telemetry Sidebar) */}
      <div className="digital-twin-main-grid">
        {/* Left: Expansive 3D Digital Twin Viewport */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '10px 16px' }}>
            <div className="card-title-group">
              <Box className="card-title-icon" size={17} />
              <span className="card-title">Real-Time Interactive 3D Assembly & Kinematics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Focus Target:</span>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {selectedEquipment.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '520px', position: 'relative' }}>
            <DigitalTwin3D
              selectedEquipment={selectedEquipment}
              onSelectEquipment={onSelectEquipment}
              activeScenario={activeScenario}
              telemetry={telemetry}
              detections={detections}
              isSplitView={false}
            />
          </div>
        </div>

        {/* Right: Engineering Diagnostics & Subsystem Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Active Asset Inspection Card */}
          <div className="glass-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Target Diagnostic telemetry
              </span>
              <span className={`state-pill ${isAnomalous ? 'anomalous' : isWarning ? 'warning' : 'normal'}`}>
                {isAnomalous ? 'CRITICAL' : isWarning ? 'WARNING' : 'NORMAL'}
              </span>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                {selectedEquipment === 'motor_casing_p01' 
                  ? 'Pump Motor Unit P01 (45 kW Induction)'
                  : selectedEquipment === 'pressure_valve_v3'
                  ? 'High-Pressure Globe Valve V3 (300 PSI)'
                  : 'Terminal Power Junction Box T2'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Identifier: <code style={{ color: 'var(--accent-cyan)' }}>{selectedEquipment}</code> | Zone: Sector 4 North
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div className="sensor-card">
                <span className="sensor-label">Surface IR Temp</span>
                <span className={`sensor-value ${isAnomalous ? 'alert' : ''}`}>
                  {isAnomalous ? '78.4 °C' : isWarning ? '54.2 °C' : '41.5 °C'}
                </span>
                <span style={{ fontSize: '0.65rem', color: isAnomalous ? '#f87171' : 'var(--text-muted)' }}>
                  {isAnomalous ? '+34°C over baseline' : 'Nominal < 60°C'}
                </span>
              </div>

              <div className="sensor-card">
                <span className="sensor-label">Vibration RMS</span>
                <span className={`sensor-value ${isAnomalous ? 'alert' : ''}`}>
                  {isAnomalous ? '3.4 mm/s' : isWarning ? '1.9 mm/s' : '0.8 mm/s'}
                </span>
                <span style={{ fontSize: '0.65rem', color: isAnomalous ? '#f87171' : 'var(--text-muted)' }}>
                  ISO 10816 Class II
                </span>
              </div>

              <div className="sensor-card">
                <span className="sensor-label">Acoustic Harmonic</span>
                <span className="sensor-value" style={{ color: isAnomalous || isWarning ? '#f59e0b' : 'var(--accent-cyan)' }}>
                  2.41 kHz
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Sideband Envelope
                </span>
              </div>

              <div className="sensor-card">
                <span className="sensor-label">Internal Pressure</span>
                <span className="sensor-value" style={{ color: isAnomalous ? '#ef4444' : '#10b981' }}>
                  {isAnomalous ? '4.8 BAR' : '3.2 BAR'}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Delta: {isAnomalous ? '+1.6 BAR' : '±0.05 BAR'}
                </span>
              </div>
            </div>

            {/* AI Synthesized Finding */}
            <div style={{
              background: isAnomalous ? 'rgba(239, 68, 68, 0.08)' : isWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(0, 242, 254, 0.05)',
              border: `1px solid ${isAnomalous ? 'rgba(239, 68, 68, 0.3)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 242, 254, 0.2)'}`,
              padding: '10px',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : 'var(--accent-cyan)', marginBottom: '4px' }}>
                <TrendingUp size={13} />
                <span>On-Device Digital Twin Analysis</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {reasoning?.finding || "Twin physics engine reports equilibrium state."}
              </p>
            </div>
          </div>

          {/* Subsystem CAD Tree Navigation */}
          <div className="glass-card" style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>
              Twin Subsystem Breakdown
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div 
                onClick={() => onSelectEquipment('motor_casing_p01')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: selectedEquipment === 'motor_casing_p01' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${selectedEquipment === 'motor_casing_p01' ? 'rgba(0, 242, 254, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981' }} />
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#fff' }}>Motor Assembly P01</div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Stator, Bearings, Coupling Shaft</div>
                  </div>
                </div>
                <ArrowRight size={13} color="var(--text-muted)" />
              </div>

              <div 
                onClick={() => onSelectEquipment('pressure_valve_v3')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: selectedEquipment === 'pressure_valve_v3' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${selectedEquipment === 'pressure_valve_v3' ? 'rgba(0, 242, 254, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#fff' }}>Globe Valve V3</div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Body, Handwheel, Digital Gauge</div>
                  </div>
                </div>
                <ArrowRight size={13} color="var(--text-muted)" />
              </div>

              <div 
                onClick={() => onSelectEquipment('junction_box_t2')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: selectedEquipment === 'junction_box_t2' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${selectedEquipment === 'junction_box_t2' ? 'rgba(0, 242, 254, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#fff' }}>Power Junction T2</div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>480V Terminal, Beacon Light</div>
                  </div>
                </div>
                <ArrowRight size={13} color="var(--text-muted)" />
              </div>
            </div>

            {/* Offline Execution Verification Badge */}
            <div style={{
              marginTop: '10px',
              padding: '8px 10px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.7rem',
              color: '#34d399'
            }}>
              <ShieldCheck size={14} style={{ flexShrink: 0 }} />
              <span>Zero-latency physics loop rendered locally via Snapdragon Adreno GPU + Hexagon NPU.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
