import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Sliders, 
  Maximize2, 
  FileText, 
  Cpu, 
  Radio, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon,
  Sparkles,
  Layers
} from 'lucide-react';

export default function ExecutiveHeader({
  overviewLayoutMode,
  setOverviewLayoutMode,
  activeScenario,
  setActiveScenario,
  onOpenReport,
  telemetry = {}
}) {
  const [livePulse, setLivePulse] = useState(true);

  // Subtle live edge pulse toggle every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isAnomalous = activeScenario === 'anomalous';
  const isWarning = activeScenario === 'warning';
  const isNormal = activeScenario === 'normal';

  return (
    <div className="executive-control-header executive-control-header-enhanced">
      {/* 1. Left Title Group with Hexagon Halo & Snapdragon Silicon Tag */}
      <div className="executive-title-group">
        <div className="executive-icon-badge-halo">
          <div className="halo-ring" />
          <Cpu size={20} color="var(--accent-cyan)" className="cpu-icon-pulse" />
        </div>

        <div className="executive-title-content">
          <div className="executive-title-row">
            <span className="executive-main-title">EXECUTIVE MISSION CONTROL</span>
            <span className="executive-dot-divider">•</span>
            <span className="executive-sub-badge">INDUSTRIAL EDGE</span>
            
            <span className="silicon-pill-badge" title="Snapdragon Hexagon HTP Tensor Engine">
              <Zap size={11} color="var(--accent-snapdragon)" />
              <span>SNAPDRAGON 45 TOPS</span>
            </span>

            <span className="metal-alloy-badge hide-mobile" title="Aerospace-Grade Milled Titanium Architecture">
              <Sparkles size={11} color="var(--accent-primary)" />
              <span>AEROSPACE ALLOY SPEC</span>
            </span>

            <span className="zero-cloud-pill">
              <span className="live-beacon-dot" />
              <span>ZERO CLOUD RELIANCE</span>
            </span>
          </div>

          <div className="executive-meta-row">
            <span className="meta-text">
              Qualcomm Snapdragon X Elite Hexagon NPU (HTP v73) • Multimodal Vision-Acoustic-Temporal RAG Pipeline
            </span>
          </div>
        </div>
      </div>

      {/* 2. Right Actions: Layout Modes, Scenario Presets, Audit Report */}
      <div className="executive-header-actions">
        {/* Layout View Mode Switcher */}
        <div className="layout-switcher-modern" title="Switch Industrial Overview Layout Preset">
          <button 
            className={`layout-pill-btn ${overviewLayoutMode === 'command' ? 'active' : ''}`}
            onClick={() => setOverviewLayoutMode('command')}
            title="Command Center: Featured Hero Reticle & AI Matrix on top, Tri-panel Telemetry below"
          >
            <Sliders size={13} />
            <span>Command</span>
          </button>
          <button 
            className={`layout-pill-btn ${overviewLayoutMode === 'balanced' ? 'active' : ''}`}
            onClick={() => setOverviewLayoutMode('balanced')}
            title="Balanced: Dual-column synchronous inspection workspace"
          >
            <LayoutGrid size={13} />
            <span>Balanced</span>
          </button>
          <button 
            className={`layout-pill-btn ${overviewLayoutMode === 'panoramic' ? 'active' : ''}`}
            onClick={() => setOverviewLayoutMode('panoramic')}
            title="Panoramic Cockpit: Triple-column widescreen command deck"
          >
            <Maximize2 size={13} />
            <span>Panoramic</span>
          </button>
        </div>

        {/* Quick Scenario Evaluator */}
        <div className="scenario-evaluator-group">
          <button
            className={`scenario-pill-btn scenario-nominal ${isNormal ? 'active' : ''}`}
            onClick={() => setActiveScenario('normal')}
            title="Preset A: Nominal Baseline (All components operating within golden bounds)"
          >
            <span className="scenario-led led-green" />
            <span className="scenario-name">Nominal A</span>
          </button>

          <button
            className={`scenario-pill-btn scenario-warning ${isWarning ? 'active' : ''}`}
            onClick={() => setActiveScenario('warning')}
            title="Preset B: Incipient Warning (+14.2% Vibration drift on Motor Casing P01, 2.4 kHz acoustic spike)"
          >
            <span className="scenario-led led-amber" />
            <span className="scenario-name">Warning B</span>
          </button>

          <button
            className={`scenario-pill-btn scenario-critical ${isAnomalous ? 'active' : ''}`}
            onClick={() => setActiveScenario('anomalous')}
            title="Preset C: Critical Anomaly (+28.4% Vibration, 78.4°C thermal runaway, emergency lockout SOP)"
          >
            <span className="scenario-led led-red" />
            <span className="scenario-name">Critical C</span>
          </button>
        </div>

        {/* Audit Report Action Button */}
        <button
          className="btn btn-primary executive-report-btn"
          onClick={onOpenReport}
          title="Compile ISO 10816-3 Industrial Inspection Audit Log"
        >
          <FileText size={13} />
          <span>Audit Report</span>
        </button>
      </div>
    </div>
  );
}
