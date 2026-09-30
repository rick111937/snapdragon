import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Cpu, 
  Target, 
  BookOpen, 
  Clock, 
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function ExecutiveKPIs({
  telemetry = {},
  activeScenario = 'warning',
  selectedEquipment = 'motor_casing_p01',
  evidence = {},
  reasoning = {}
}) {
  const isAnomalous = activeScenario === 'anomalous';
  const isWarning = activeScenario === 'warning';
  const isNormal = activeScenario === 'normal';

  // KPI 1: Plant Health / OEE Values
  const healthValue = isAnomalous ? 38.5 : isWarning ? 74.2 : 98.4;
  const healthColor = isAnomalous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const healthGlow = isAnomalous ? 'rgba(239, 68, 68, 0.35)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)';
  const healthStatusText = isAnomalous ? '▼ CRITICAL TRIP' : isWarning ? '▲ INCIPIENT DRIFT' : '✓ OPTIMAL NOMINAL';
  const mtbfText = isAnomalous ? '< 120h MTBF' : isWarning ? '1,840h MTBF' : '9,420h MTBF';

  // SVG Circular Gauge Calculations
  const radius = 22;
  const circum = 2 * Math.PI * radius;
  const strokeOffset = circum - (healthValue / 100) * circum;

  // KPI 2: Active Incident Values
  const incidentTitle = isAnomalous ? 'CRITICAL BREACH' : isWarning ? 'MEDIUM WARNING' : 'NORMAL SECURE';
  const incidentSub = isAnomalous ? 'Immediate Shutdown Req.' : isWarning ? 'Bearing Spalling / Vibration' : 'All Bounds Standard';

  // KPI 3: Snapdragon NPU Values
  const fps = telemetry.rolling_fps || (isAnomalous ? 27.8 : isWarning ? 28.4 : 29.8);
  const latency = telemetry.mean_latency_ms || (isAnomalous ? 14.2 : isWarning ? 12.8 : 10.4);
  const npuLoad = telemetry.npu_utilization_pct || (isAnomalous ? 54.2 : isWarning ? 38.5 : 32.1);
  const cpuLoad = telemetry.cpu_utilization_pct || (isAnomalous ? 18.6 : isWarning ? 14.2 : 11.0);

  // KPI 4: Drift & Sparkline Path
  const driftValue = isAnomalous ? '+28.4%' : isWarning ? '+14.2%' : '0.4%';
  const frameCount = isAnomalous ? '32/30 Saturated' : isWarning ? '14/30 Accumulating' : '0/30 Nominal';

  // KPI 5: SOP & Knowledge Match
  const sopMatch = isAnomalous ? '97.8%' : isWarning ? '94.2%' : '99.1%';
  const sopTitle = isAnomalous 
    ? 'SOP-SAFE-109 §2.1 (LOTO)' 
    : isWarning 
    ? 'SOP-MECH-402 §4.3 (ISO 10816)' 
    : 'ROUTINE PM-101 (NOMINAL)';

  return (
    <div className="executive-kpi-ribbon">
      {/* ---------------- CARD 1: FLEET ASSET HEALTH (OEE) ---------------- */}
      <div className={`kpi-card kpi-card-enhanced ${isAnomalous ? 'state-anomalous' : isWarning ? 'state-warning' : 'state-normal'}`}>
        <div className="kpi-card-glow-bar" style={{ background: healthColor }} />
        
        <div className="kpi-card-header">
          <div className="kpi-header-left">
            <span className="kpi-tag-label">FLEET ASSET HEALTH</span>
            <span className="kpi-pill-badge" style={{ color: healthColor, background: `${healthColor}18`, borderColor: `${healthColor}40` }}>
              OEE INDEX
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ background: `${healthColor}18`, borderColor: `${healthColor}45` }}>
            <Activity size={14} color={healthColor} />
          </div>
        </div>

        <div className="kpi-card-body-row">
          <div className="kpi-metrics-col">
            <div className="kpi-card-value" style={{ color: healthColor, textShadow: `0 0 16px ${healthGlow}` }}>
              {healthValue}%
              <span className="kpi-unit-tag">RELIABILITY</span>
            </div>
            <div className="kpi-status-chip" style={{ color: healthColor, background: `${healthColor}14` }}>
              {healthStatusText}
            </div>
          </div>

          {/* Radial Donut Progress Ring */}
          <div className="kpi-donut-container">
            <svg width="56" height="56" viewBox="0 0 56 56" className="kpi-donut-svg">
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="kpi-donut-bg"
              />
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="kpi-donut-fill"
                style={{
                  stroke: healthColor,
                  strokeDasharray: circum,
                  strokeDashoffset: strokeOffset,
                  filter: `drop-shadow(0 0 4px ${healthColor})`
                }}
              />
              <text x="28" y="32" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="800" fontFamily="var(--font-mono)">
                {Math.round(healthValue)}%
              </text>
            </svg>
          </div>
        </div>

        <div className="kpi-card-footer">
          <span className="kpi-footer-metric">
            <span className="kpi-footer-bullet" style={{ background: healthColor }} />
            {mtbfText}
          </span>
          <span className="kpi-footer-sub">3 Subsystems Active</span>
        </div>
      </div>

      {/* ---------------- CARD 2: ACTIVE INCIDENT STATE ---------------- */}
      <div className={`kpi-card kpi-card-enhanced ${isAnomalous ? 'state-anomalous' : isWarning ? 'state-warning' : 'state-normal'}`}>
        <div className="kpi-card-glow-bar" style={{ background: healthColor }} />

        <div className="kpi-card-header">
          <div className="kpi-header-left">
            <span className="kpi-tag-label">ACTIVE INCIDENT STATE</span>
            <span className="kpi-pill-badge" style={{ color: healthColor, background: `${healthColor}18`, borderColor: `${healthColor}40` }}>
              AI RISK: {telemetry.risk_level || 'LOW'}
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ background: `${healthColor}18`, borderColor: `${healthColor}45` }}>
            {isAnomalous ? (
              <AlertOctagon size={14} color="#ef4444" className="pulse-danger" />
            ) : isWarning ? (
              <AlertTriangle size={14} color="#f59e0b" className="pulse-warning" />
            ) : (
              <ShieldAlert size={14} color="#10b981" />
            )}
          </div>
        </div>

        <div className="kpi-card-body-row">
          <div className="kpi-metrics-col" style={{ width: '100%' }}>
            <div className="kpi-card-value incident-val" style={{ color: healthColor, textShadow: `0 0 16px ${healthGlow}` }}>
              {incidentTitle}
            </div>
            
            {/* 3-Stage Threat Level LED Meter */}
            <div className="threat-level-meter" title={`Threat Level: ${telemetry.risk_level || 'LOW'}`}>
              <div className={`threat-led led-low ${!isAnomalous && !isWarning ? 'active' : 'lit'}`} />
              <div className={`threat-led led-med ${isWarning ? 'active' : isAnomalous ? 'lit' : ''}`} />
              <div className={`threat-led led-high ${isAnomalous ? 'active pulse-fast' : ''}`} />
            </div>
          </div>
        </div>

        <div className="kpi-card-footer" style={{ flexWrap: 'wrap', gap: '4px' }}>
          <span className="kpi-footer-metric" style={{ minWidth: 0, maxWidth: '100%' }}>
            <Target size={11} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <span style={{ color: '#fff', whiteSpace: 'nowrap' }}>Target:</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedEquipment}</span>
          </span>
          <span className="kpi-footer-sub" style={{ color: isAnomalous ? '#f87171' : isWarning ? '#fbbf24' : '#34d399', whiteSpace: 'nowrap' }}>
            {incidentSub}
          </span>
        </div>
      </div>

      {/* ---------------- CARD 3: SNAPDRAGON HEXAGON NPU ---------------- */}
      <div className="kpi-card kpi-card-enhanced npu-theme">
        <div className="kpi-card-glow-bar" style={{ background: 'linear-gradient(90deg, #ff3b5c, #00f2fe)' }} />

        <div className="kpi-card-header">
          <div className="kpi-header-left">
            <span className="kpi-tag-label">HEXAGON NPU ENGINE</span>
            <span className="kpi-pill-badge" style={{ color: '#ff758c', background: 'rgba(255, 59, 92, 0.15)', borderColor: 'rgba(255, 59, 92, 0.35)' }}>
              45 TOPS HTP
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(255, 59, 92, 0.15)', borderColor: 'rgba(255, 59, 92, 0.4)' }}>
            <Zap size={14} color="#ff3b5c" />
          </div>
        </div>

        <div className="kpi-card-body-row">
          <div className="kpi-metrics-col">
            <div className="kpi-card-value" style={{ color: '#00f2fe', textShadow: '0 0 14px rgba(0, 242, 254, 0.4)' }}>
              {fps}
              <span className="kpi-unit-tag">FPS THROUGHPUT</span>
            </div>
            <div className="kpi-dual-meter">
              <div className="meter-label-row">
                <span>NPU HTP: {npuLoad}%</span>
                <span>CPU: {cpuLoad}%</span>
              </div>
              <div className="meter-bar-track">
                <div className="meter-bar-fill npu-fill" style={{ width: `${npuLoad}%` }} />
                <div className="meter-bar-fill cpu-fill" style={{ width: `${cpuLoad}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="kpi-card-footer">
          <span className="kpi-footer-metric">
            <Cpu size={11} color="var(--accent-snapdragon)" />
            <span>Snapdragon X Elite</span>
          </span>
          <span className="kpi-footer-sub" style={{ color: '#00f2fe' }}>
            {latency}ms Mean Latency
          </span>
        </div>
      </div>

      {/* ---------------- CARD 4: GOLDEN REFERENCE DRIFT ---------------- */}
      <div className={`kpi-card kpi-card-enhanced ${isAnomalous ? 'state-anomalous' : isWarning ? 'state-warning' : 'state-normal'}`}>
        <div className="kpi-card-glow-bar" style={{ background: healthColor }} />

        <div className="kpi-card-header">
          <div className="kpi-header-left">
            <span className="kpi-tag-label">GOLDEN REFERENCE DRIFT</span>
            <span className="kpi-pill-badge" style={{ color: healthColor, background: `${healthColor}18`, borderColor: `${healthColor}40` }}>
              FR-05 PERSISTENCE
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ background: `${healthColor}18`, borderColor: `${healthColor}45` }}>
            <TrendingUp size={14} color={healthColor} />
          </div>
        </div>

        <div className="kpi-card-body-row">
          <div className="kpi-metrics-col">
            <div className="kpi-card-value" style={{ color: healthColor, textShadow: `0 0 16px ${healthGlow}` }}>
              {driftValue}
              <span className="kpi-unit-tag">RMS DEVIATION</span>
            </div>
            
            {/* Sparkline Visualizer */}
            <div className="kpi-sparkline-box">
              <svg width="100%" height="24" viewBox="0 0 120 24" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`sparkGrad-${activeScenario}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={healthColor} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={healthColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Baseline Guide Line */}
                <line x1="0" y1="18" x2="120" y2="18" stroke="rgba(255,255,255,0.12)" strokeDasharray="2,2" strokeWidth="1" />
                
                {/* Dynamic Scenario Curve */}
                {isNormal ? (
                  <>
                    <path d="M0,18 Q30,17 60,18.5 T120,17.8 L120,24 L0,24 Z" fill={`url(#sparkGrad-${activeScenario})`} />
                    <path d="M0,18 Q30,17 60,18.5 T120,17.8" fill="none" stroke={healthColor} strokeWidth="1.8" />
                  </>
                ) : isWarning ? (
                  <>
                    <path d="M0,18 Q25,18 50,15 T90,9 L120,6 L120,24 L0,24 Z" fill={`url(#sparkGrad-${activeScenario})`} />
                    <path d="M0,18 Q25,18 50,15 T90,9 L120,6" fill="none" stroke={healthColor} strokeWidth="2" />
                    <circle cx="120" cy="6" r="2.5" fill={healthColor} filter={`drop-shadow(0 0 3px ${healthColor})`} />
                  </>
                ) : (
                  <>
                    <path d="M0,18 Q20,18 45,16 Q75,12 90,4 L120,2 L120,24 L0,24 Z" fill={`url(#sparkGrad-${activeScenario})`} />
                    <path d="M0,18 Q20,18 45,16 Q75,12 90,4 L120,2" fill="none" stroke={healthColor} strokeWidth="2.2" />
                    <circle cx="120" cy="2" r="3" fill="#ff3b5c" filter="drop-shadow(0 0 5px #ff3b5c)" />
                  </>
                )}
              </svg>
            </div>
          </div>
        </div>

        <div className="kpi-card-footer">
          <span className="kpi-footer-metric">
            <span className="kpi-footer-bullet" style={{ background: healthColor }} />
            <span>Anti-Glitch:</span> {frameCount}
          </span>
          <span className="kpi-footer-sub">±5.0% Bounds</span>
        </div>
      </div>

      {/* ---------------- CARD 5: SOP KNOWLEDGE RAG ---------------- */}
      <div className="kpi-card kpi-card-enhanced sop-theme">
        <div className="kpi-card-glow-bar" style={{ background: 'linear-gradient(90deg, #10b981, #00f2fe)' }} />

        <div className="kpi-card-header">
          <div className="kpi-header-left">
            <span className="kpi-tag-label">SOP KNOWLEDGE MATCH</span>
            <span className="kpi-pill-badge" style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
              VECTOR RAG
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
            <CheckCircle2 size={14} color="#10b981" />
          </div>
        </div>

        <div className="kpi-card-body-row">
          <div className="kpi-metrics-col">
            <div className="kpi-card-value" style={{ color: '#34d399', textShadow: '0 0 16px rgba(16, 185, 129, 0.35)' }}>
              {sopMatch}
              <span className="kpi-unit-tag">SEMANTIC CONF</span>
            </div>
            <div className="kpi-sop-code-badge" title="Retrieved SOP Document">
              <BookOpen size={10} color="#00f2fe" style={{ flexShrink: 0 }} />
              <span className="sop-code-text">{sopTitle}</span>
            </div>
          </div>
        </div>

        <div className="kpi-card-footer">
          <span className="kpi-footer-metric">
            <span className="kpi-footer-bullet" style={{ background: '#10b981' }} />
            <span>ISO 10816-3 Class II</span>
          </span>
          <span className="kpi-footer-sub" style={{ color: '#34d399' }}>
            Checklist Synced
          </span>
        </div>
      </div>
    </div>
  );
}
