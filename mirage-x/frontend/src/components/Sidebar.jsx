import React from 'react';
import { 
  LayoutGrid, 
  Box, 
  Camera, 
  Activity, 
  History, 
  BookOpen, 
  Zap, 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertOctagon, 
  ChevronLeft, 
  ChevronRight, 
  Wifi, 
  WifiOff, 
  Layers,
  Sparkles,
  X
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeScenario,
  onChangeScenario,
  telemetry = {},
  activeRiskLevel,
  audioEnabled,
  setAudioEnabled,
  onOpenReport,
  isBackendConnected,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) {
  const isHighRisk = activeRiskLevel === 'HIGH' || activeRiskLevel === 'CRITICAL';
  const isMediumRisk = activeRiskLevel === 'MEDIUM';
  const effectivelyCollapsed = isCollapsed && !isMobileOpen;

  const navItems = [
    {
      id: 'overview',
      label: 'Executive Overview',
      subtitle: '5-Panel Grid (SRS §12)',
      icon: LayoutGrid
    },
    {
      id: 'digitaltwin',
      label: '3D Digital Twin',
      subtitle: 'CAD & Kinematics',
      icon: Box,
      badge: '3D'
    },
    {
      id: 'camera',
      label: 'Live Camera Stream',
      subtitle: 'NPU Vision & FLIR',
      icon: Camera
    },
    {
      id: 'analysis',
      label: 'AI State Matrix',
      subtitle: 'Sensor Fusion & FFT',
      icon: Activity
    },
    {
      id: 'temporal',
      label: 'Temporal Engine',
      subtitle: 'What Changed (FR-05)',
      icon: History
    },
    {
      id: 'evidence',
      label: 'Evidence & SOP RAG',
      subtitle: 'Knowledge Retrieval',
      icon: BookOpen
    },
    {
      id: 'performance',
      label: 'Snapdragon NPU',
      subtitle: '45 TOPS Hardware',
      icon: Zap
    }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${effectivelyCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Section */}
        <div className="sidebar-brand-container">
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <Cpu size={22} color="var(--accent-cyan)" />
            </div>
            {!effectivelyCollapsed && (
              <div className="brand-text-group">
                <div className="brand-name">
                  <span>MIRAGE-X</span>
                  <span className="npu-pill">NPU</span>
                </div>
                <div className="brand-caption">Snapdragon On-Device AI</div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button 
            className="sidebar-toggle-btn desktop-only"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          {/* Mobile Close Button */}
          <button 
            className="sidebar-toggle-btn mobile-only"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Middle Section: Navigation & Scenarios */}
        <div className="sidebar-middle-scroll">
          {/* Navigation Items */}
          <div className="sidebar-nav-section">
            {!effectivelyCollapsed && (
              <div className="sidebar-section-title">
                Inspection Workstations
              </div>
            )}

            <nav className="sidebar-nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    title={effectivelyCollapsed ? item.label : undefined}
                  >
                    <div className="nav-item-icon-wrapper">
                      <Icon size={17} />
                    </div>
                    {!effectivelyCollapsed && (
                      <div className="nav-item-content">
                        <div className="nav-item-label-row">
                          <span className="nav-item-label">{item.label}</span>
                          {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                        </div>
                        <span className="nav-item-subtitle">{item.subtitle}</span>
                      </div>
                    )}
                    {isActive && <div className="nav-active-pip" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Demo Scenarios Section */}
          {!effectivelyCollapsed ? (
            <div className="sidebar-scenarios-section">
              <div className="sidebar-section-title">
                <Layers size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Demo Scenarios
              </div>
              <div className="scenario-chips-vertical">
                <button
                  className={`scenario-btn ${activeScenario === 'normal' ? 'active normal' : ''}`}
                  onClick={() => onChangeScenario('normal')}
                >
                  <span className="scenario-beacon beacon-normal" />
                  <span className="scenario-btn-text">Preset A: Nominal</span>
                </button>

                <button
                  className={`scenario-btn ${activeScenario === 'warning' ? 'active warning' : ''}`}
                  onClick={() => onChangeScenario('warning')}
                >
                  <span className="scenario-beacon beacon-warning" />
                  <span className="scenario-btn-text">Preset B: Warning</span>
                </button>

                <button
                  className={`scenario-btn ${activeScenario === 'anomalous' ? 'active anomalous' : ''}`}
                  onClick={() => onChangeScenario('anomalous')}
                >
                  <span className="scenario-beacon beacon-critical" />
                  <span className="scenario-btn-text">Preset C: Critical</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="sidebar-collapsed-scenario-pips">
              <button 
                className={`mini-scenario-dot ${activeScenario === 'normal' ? 'active normal' : ''}`}
                onClick={() => onChangeScenario('normal')}
                title="Scenario A: Nominal"
              >
                A
              </button>
              <button 
                className={`mini-scenario-dot ${activeScenario === 'warning' ? 'active warning' : ''}`}
                onClick={() => onChangeScenario('warning')}
                title="Scenario B: Warning"
              >
                B
              </button>
              <button 
                className={`mini-scenario-dot ${activeScenario === 'anomalous' ? 'active anomalous' : ''}`}
                onClick={() => onChangeScenario('anomalous')}
                title="Scenario C: Critical"
              >
                C
              </button>
            </div>
          )}
        </div>

        {/* Pinned Footer & Hardware Diagnostics */}
        <div className="sidebar-footer">
          {/* Audio Sensor Toggle with Live Animated Equalizer */}
          <button 
            className={`sidebar-action-btn ${audioEnabled ? 'active' : ''}`}
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? "Acoustic AI Sensor Active" : "Acoustic AI Muted"}
          >
            <div className="audio-toggle-left">
              {audioEnabled ? <Volume2 size={15} color="var(--accent-cyan)" /> : <VolumeX size={15} color="#64748b" />}
              {!effectivelyCollapsed && (
                <span className="sidebar-action-label">
                  {audioEnabled ? "Acoustic Sensor: ON" : "Acoustic Sensor: OFF"}
                </span>
              )}
            </div>
            {audioEnabled && !effectivelyCollapsed && (
              <div className="mini-equalizer-bars">
                <span className="eq-bar eq-bar-1" />
                <span className="eq-bar eq-bar-2" />
                <span className="eq-bar eq-bar-3" />
                <span className="eq-bar eq-bar-4" />
                <span className="eq-bar eq-bar-5" />
              </div>
            )}
          </button>

          {/* Export Report Action */}
          <button 
            className="sidebar-report-btn"
            onClick={onOpenReport}
            title="Export Certified Audit Report"
          >
            <FileText size={15} />
            {!effectivelyCollapsed && <span>Audit Report</span>}
          </button>

          {/* Hardware & Offline Certification */}
          {!effectivelyCollapsed && (
            <div className="sidebar-hw-badges">
              <div className="sidebar-status-pill offline">
                <ShieldCheck size={12} />
                <span>100% On-Device Certified</span>
              </div>

              <div className="sidebar-status-pill npu">
                <Cpu size={12} />
                <span>Snapdragon Hexagon (45 TOPS)</span>
              </div>

              <div className="sidebar-bridge-status">
                {isBackendConnected ? (
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wifi size={11} /> Python Bridge (Port 8000)
                  </span>
                ) : (
                  <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <WifiOff size={11} /> Edge Autonomous Mode
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
