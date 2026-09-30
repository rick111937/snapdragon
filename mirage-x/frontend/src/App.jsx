import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ExecutiveHeader from './components/ExecutiveHeader';
import ExecutiveKPIs from './components/ExecutiveKPIs';
import LiveCameraPanel from './components/LiveCameraPanel';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import TemporalHistoryPanel from './components/TemporalHistoryPanel';
import EvidenceSopPanel from './components/EvidenceSopPanel';
import PerformancePanel from './components/PerformancePanel';
import ReportModal from './components/ReportModal';
import DigitalTwinView from './components/DigitalTwinView';
import Sidebar from './components/Sidebar';
import { 
  LayoutGrid, 
  Camera, 
  Activity, 
  History, 
  BookOpen, 
  Zap, 
  WifiOff, 
  Wifi, 
  Box,
  FileText,
  Sliders,
  Maximize2,
  TrendingUp,
  Gauge,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card" style={{ padding: '24px', margin: '20px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--state-anomalous)', marginBottom: '8px' }}>Workspace Error Caught</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
            {this.state.error?.message || 'Rendering error encountered in subpanel.'}
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'digitaltwin' | 'camera' | 'analysis' | 'temporal' | 'evidence' | 'performance'
  const [activeScenario, setActiveScenario] = useState('warning'); // 'normal' | 'warning' | 'anomalous'
  const [overviewLayoutMode, setOverviewLayoutMode] = useState('command'); // 'command' | 'balanced' | 'panoramic'
  const [streamSource, setStreamSource] = useState('simulated');
  const [selectedEquipment, setSelectedEquipment] = useState('motor_casing_p01');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.innerWidth <= 1100 && window.innerWidth > 860;
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1100 && window.innerWidth > 860) {
        setIsSidebarCollapsed(true);
      } else if (window.innerWidth > 1100) {
        setIsSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [metallicTheme, setMetallicTheme] = useState(() => {
    try {
      return localStorage.getItem('mirage_metal_theme') || 'titanium';
    } catch {
      return 'titanium';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-metallic-theme', metallicTheme);
    try {
      localStorage.setItem('mirage_metal_theme', metallicTheme);
    } catch {}
  }, [metallicTheme]);

  // Core State
  const [telemetry, setTelemetry] = useState({
    rolling_fps: 28.4,
    mean_latency_ms: 12.8,
    p95_latency_ms: 18.5,
    min_latency_ms: 9.2,
    max_latency_ms: 24.1,
    npu_utilization_pct: 38.5,
    cpu_utilization_pct: 14.2,
    soc_temperature_c: 44.5,
    memory_rss_mb: 284,
    provider: 'Qualcomm QNN (Hexagon NPU)',
    current_state: 'WARNING',
    risk_level: 'MEDIUM',
  });

  const [detections, setDetections] = useState([
    {
      label: 'motor_casing_p01',
      confidence: 0.91,
      state: 'WARNING',
      bbox: { x1: 0.12, y1: 0.28, x2: 0.42, y2: 0.65 },
    },
    {
      label: 'pressure_valve_v3',
      confidence: 0.88,
      state: 'NORMAL',
      bbox: { x1: 0.58, y1: 0.31, x2: 0.72, y2: 0.62 },
    },
    {
      label: 'junction_box_t2',
      confidence: 0.84,
      state: 'NORMAL',
      bbox: { x1: 0.75, y1: 0.42, x2: 0.88, y2: 0.63 },
    },
  ]);

  const [temporalEvents, setTemporalEvents] = useState([
    {
      id: 'evt-101',
      timestamp: Date.now() / 1000 - 320,
      type: 'BASELINE_ACQUIRED',
      state: 'NORMAL',
      message: 'Golden baseline established across 60 frames on Snapdragon NPU.',
    },
    {
      id: 'evt-102',
      timestamp: Date.now() / 1000 - 180,
      type: 'STABILITY_CHECK',
      state: 'NORMAL',
      message: 'Pressure valve V3 confirmed within standard operating bounds (3.2 bar).',
    },
    {
      id: 'evt-103',
      timestamp: Date.now() / 1000 - 95,
      type: 'DEVIATION_DETECTED',
      state: 'WARNING',
      message: 'Motor casing P01 localized surface vibration signature elevated by +18% vs baseline.',
    },
    {
      id: 'evt-104',
      timestamp: Date.now() / 1000 - 22,
      type: 'ANOMALY_CONFIRMED',
      state: 'WARNING',
      message: 'Temporal persistence threshold reached (14/30 frames). SOP checklist dispatched.',
    },
  ]);

  const [evidence, setEvidence] = useState({
    evidence_items: [
      {
        id: 'EV-001',
        type: 'VISUAL',
        source: 'Camera 0 (NPU Vision)',
        label: 'Motor Casing - Micro-vibration Jitter',
        status: 'WARNING',
        detail: 'Bounding box [0.12, 0.28, 0.42, 0.65], confidence 91%',
      },
      {
        id: 'EV-002',
        type: 'TEMPORAL',
        source: 'Temporal Engine (FR-05)',
        label: 'Continuous Deviation vs Golden Baseline',
        status: 'WARNING',
        detail: 'Persistent deviation detected across 14 consecutive frames (>450ms).',
      },
      {
        id: 'EV-003',
        type: 'ACOUSTIC',
        source: 'Acoustic Feature Analyzer (FR-07)',
        label: 'Harmonic Sideband Spike at 2.4 kHz',
        status: 'WARNING',
        detail: '+6.2 dB above baseline envelope. Characteristic of inner race bearing spalling.',
      },
    ],
    sop_matches: [
      {
        id: 'SOP-MECH-402',
        title: 'Industrial High-Pressure Pump & Motor Inspection',
        section: 'Section 4.3: Shaft Alignment & Bearing Thermal Signature',
        confidence: 0.94,
        relevance: 'Direct match for current equipment geometry and acoustic baseline.',
        guidance: [
          'Verify non-contact IR thermography does not exceed 75°C at bearing housing.',
          'Inspect coupling flange bolts for torque marks (standard 45 Nm).',
          'Check lubrication level via sight glass indicator.',
        ],
      },
      {
        id: 'SOP-SAFE-109',
        title: 'High-Voltage Enclosure Safety Clearance',
        section: 'Section 2.1: Lockout / Tagout Verification',
        confidence: 0.88,
        relevance: 'Applicable when inspecting terminal junctions within 1.5m.',
        guidance: [
          'Maintain minimum 1.0m arc flash boundary unless isolated.',
          'Wear Arc-Rated Face Shield and Level 2 dielectric gloves.',
        ],
      },
    ],
  });

  const [reasoning, setReasoning] = useState({
    finding: 'Sub-surface mechanical bearing wear & minor shaft misalignment in Pump Motor Casing P01',
    confidence: 0.91,
    severity: 'MEDIUM',
    chain_of_thought: [
      '1. Visual detection identified Motor Casing P01 with high-frequency micro-jitter.',
      '2. Temporal engine cross-referenced current window against golden baseline established at startup.',
      '3. Acoustic analyzer isolated 2.4 kHz sideband harmonic, which is characteristic of bearing wear.',
      '4. Vector knowledge store matched industrial SOP-MECH-402 with 94% semantic relevance.',
      '5. Local VLM on Snapdragon NPU synthesized evidence and ruled out foundation mount looseness.',
    ],
    recommendations: [
      'Initiate controlled shutdown of Motor Unit P01 according to SOP-MECH-402 §4.3.',
      'Measure physical bearing temperature using calibrated optical pyrometer.',
      'Inspect mechanical seal for fluid weeping or graphite dusting.',
      'Log verification photos via MIRAGE-X report generator.',
    ],
  });

  const [systemStatus, setSystemStatus] = useState({
    app_name: 'MIRAGE-X',
    platform: 'Snapdragon X Elite / Windows 11 on ARM',
    active_risk_level: 'MEDIUM',
  });

  // Scenario Switcher Effects
  useEffect(() => {
    if (activeScenario === 'normal') {
      setDetections([
        { label: 'motor_casing_p01', confidence: 0.94, state: 'NORMAL', bbox: { x1: 0.12, y1: 0.28, x2: 0.42, y2: 0.65 } },
        { label: 'pressure_valve_v3', confidence: 0.92, state: 'NORMAL', bbox: { x1: 0.58, y1: 0.31, x2: 0.72, y2: 0.62 } },
        { label: 'junction_box_t2', confidence: 0.89, state: 'NORMAL', bbox: { x1: 0.75, y1: 0.42, x2: 0.88, y2: 0.63 } },
      ]);
      setTelemetry(prev => ({
        ...prev,
        current_state: 'NORMAL',
        risk_level: 'LOW',
        npu_utilization_pct: 32.1,
        soc_temperature_c: 41.2,
      }));
      setReasoning({
        finding: 'All monitored components operating within nominal tolerances.',
        confidence: 0.96,
        severity: 'LOW',
        chain_of_thought: [
          '1. Visual detections match expected geometry and stability metrics.',
          '2. Temporal deviation is 0.4% (well below threshold of 5.0%).',
          '3. Acoustic signature matches golden reference envelope.',
        ],
        recommendations: [
          'Continue scheduled continuous on-device monitoring.',
          'Next automated baseline re-calibration scheduled in 4 hours.',
        ],
      });
    } else if (activeScenario === 'warning') {
      setDetections([
        { label: 'motor_casing_p01', confidence: 0.91, state: 'WARNING', bbox: { x1: 0.12, y1: 0.28, x2: 0.42, y2: 0.65 } },
        { label: 'pressure_valve_v3', confidence: 0.88, state: 'NORMAL', bbox: { x1: 0.58, y1: 0.31, x2: 0.72, y2: 0.62 } },
        { label: 'junction_box_t2', confidence: 0.84, state: 'NORMAL', bbox: { x1: 0.75, y1: 0.42, x2: 0.88, y2: 0.63 } },
      ]);
      setTelemetry(prev => ({
        ...prev,
        current_state: 'WARNING',
        risk_level: 'MEDIUM',
        npu_utilization_pct: 38.5,
        soc_temperature_c: 44.5,
      }));
      setReasoning({
        finding: 'Sub-surface mechanical bearing wear & minor shaft misalignment in Pump Motor Casing P01',
        confidence: 0.91,
        severity: 'MEDIUM',
        chain_of_thought: [
          '1. Visual detection identified Motor Casing P01 with high-frequency micro-jitter.',
          '2. Temporal engine cross-referenced current window against golden baseline.',
          '3. Acoustic analyzer isolated 2.4 kHz sideband harmonic characteristic of bearing wear.',
          '4. Vector knowledge store matched industrial SOP-MECH-402 with 94% semantic relevance.',
        ],
        recommendations: [
          'Initiate controlled shutdown of Motor Unit P01 according to SOP-MECH-402 §4.3.',
          'Measure physical bearing temperature using calibrated optical pyrometer.',
          'Inspect mechanical seal for fluid weeping or graphite dusting.',
        ],
      });
    } else if (activeScenario === 'anomalous') {
      setDetections([
        { label: 'motor_casing_p01', confidence: 0.93, state: 'ANOMALOUS', bbox: { x1: 0.12, y1: 0.28, x2: 0.42, y2: 0.65 } },
        { label: 'pressure_valve_v3', confidence: 0.89, state: 'WARNING', bbox: { x1: 0.58, y1: 0.31, x2: 0.72, y2: 0.62 } },
        { label: 'junction_box_t2', confidence: 0.81, state: 'NORMAL', bbox: { x1: 0.75, y1: 0.42, x2: 0.88, y2: 0.63 } },
      ]);
      setTelemetry(prev => ({
        ...prev,
        current_state: 'ANOMALOUS',
        risk_level: 'HIGH',
        npu_utilization_pct: 54.2,
        soc_temperature_c: 48.9,
      }));
      setReasoning({
        finding: 'CRITICAL: Severe bearing seizure & thermal runaway hazard in Motor Casing P01',
        confidence: 0.95,
        severity: 'HIGH',
        chain_of_thought: [
          '1. High-amplitude vibration detected exceeding emergency trip threshold (3.4 mm/s).',
          '2. Surface temperature gradient reached 78.4°C (+34°C over baseline).',
          '3. Persistence filter saturated at 32/30 frames (>1.0 second continuous anomaly).',
          '4. Acoustic power in 2.4 kHz band rose by +14.8 dB.',
        ],
        recommendations: [
          'EMERGENCY: Immediate isolation of Motor P01 circuit breaker CB-4.',
          'Evacuate personnel within 3 meters until casing cooling confirmed.',
          'Execute Emergency SOP-SAFE-109 lockout/tagout protocol.',
        ],
      });
    }
  }, [activeScenario]);

  // Connect to live Python backend if available (fallback gracefully if offline)
  useEffect(() => {
    let ws = null;
    let timer = null;

    const checkBackend = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/status', { signal: AbortSignal.timeout(1500) });
        if (res.ok) {
          setIsBackendConnected(true);
          const data = await res.json();
          setSystemStatus(data);
        }
      } catch {
        setIsBackendConnected(false);
      }
    };

    checkBackend();
    timer = setInterval(checkBackend, 5000);

    return () => {
      if (timer) clearInterval(timer);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="app-layout">
      {/* Responsive Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeScenario={activeScenario}
        onChangeScenario={setActiveScenario}
        telemetry={telemetry}
        activeRiskLevel={telemetry.risk_level}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        onOpenReport={() => setIsReportOpen(true)}
        isBackendConnected={isBackendConnected}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Top Navbar */}
        <Header
          activeTab={activeTab}
          systemStatus={systemStatus}
          telemetry={telemetry}
          activeRiskLevel={telemetry.risk_level}
          onOpenReport={() => setIsReportOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          metallicTheme={metallicTheme}
          setMetallicTheme={setMetallicTheme}
        />

        {/* Main Workspace */}
        <ErrorBoundary>
          <main className="dashboard-workspace">
        {activeTab === 'overview' ? (
          <div className="overview-wrapper">
            {/* 1. Executive Mission Control Header Bar */}
            <ExecutiveHeader
              overviewLayoutMode={overviewLayoutMode}
              setOverviewLayoutMode={setOverviewLayoutMode}
              activeScenario={activeScenario}
              setActiveScenario={setActiveScenario}
              onOpenReport={() => setIsReportOpen(true)}
              telemetry={telemetry}
            />

            {/* 2. Executive KPI Telemetry Ribbon (5 Strategic Metrics) */}
            <ExecutiveKPIs
              telemetry={telemetry}
              activeScenario={activeScenario}
              selectedEquipment={selectedEquipment}
              evidence={evidence}
              reasoning={reasoning}
            />

            {/* 3. Five-Panel Layout Container */}
            {overviewLayoutMode === 'command' ? (
              <div className="five-panel-grid mode-command">
                {/* Panel 1: Live Camera Overlay (FR-01, FR-02) */}
                <LiveCameraPanel
                  detections={detections}
                  onSelectEquipment={setSelectedEquipment}
                  selectedEquipment={selectedEquipment}
                  streamSource={streamSource}
                  setStreamSource={setStreamSource}
                  telemetry={telemetry}
                  activeScenario={activeScenario}
                />

                {/* Panel 2: AI Analysis State Matrix (FR-03, FR-04) */}
                <AIAnalysisPanel
                  detections={detections}
                  selectedEquipment={selectedEquipment}
                  onSelectEquipment={setSelectedEquipment}
                  audioEnabled={audioEnabled}
                />

                {/* Lower Tier Tri-Panel Row (Panels 3, 4, 5) */}
                <div className="lower-tier-row">
                  {/* Panel 3: Temporal History & "What Changed" (FR-05, FR-06) */}
                  <TemporalHistoryPanel
                    temporalEvents={temporalEvents}
                    currentRiskLevel={telemetry.risk_level}
                    activeScenario={activeScenario}
                  />

                  {/* Panel 4: Evidence & SOP Knowledge RAG (FR-07, FR-10, FR-11) */}
                  <EvidenceSopPanel
                    evidence={evidence}
                    reasoning={reasoning}
                    selectedEquipment={selectedEquipment}
                  />

                  {/* Panel 5: Snapdragon NPU Performance (FR-12, SRS §15) */}
                  <PerformancePanel
                    telemetry={telemetry}
                    systemStatus={systemStatus}
                  />
                </div>
              </div>
            ) : overviewLayoutMode === 'balanced' ? (
              <div className="five-panel-grid mode-balanced">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <LiveCameraPanel
                    detections={detections}
                    onSelectEquipment={setSelectedEquipment}
                    selectedEquipment={selectedEquipment}
                    streamSource={streamSource}
                    setStreamSource={setStreamSource}
                    telemetry={telemetry}
                    activeScenario={activeScenario}
                  />
                  <TemporalHistoryPanel
                    temporalEvents={temporalEvents}
                    currentRiskLevel={telemetry.risk_level}
                    activeScenario={activeScenario}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <AIAnalysisPanel
                    detections={detections}
                    selectedEquipment={selectedEquipment}
                    onSelectEquipment={setSelectedEquipment}
                    audioEnabled={audioEnabled}
                  />
                  <EvidenceSopPanel
                    evidence={evidence}
                    reasoning={reasoning}
                    selectedEquipment={selectedEquipment}
                  />
                  <PerformancePanel
                    telemetry={telemetry}
                    systemStatus={systemStatus}
                  />
                </div>
              </div>
            ) : (
              <div className="five-panel-grid mode-panoramic">
                <LiveCameraPanel
                  detections={detections}
                  onSelectEquipment={setSelectedEquipment}
                  selectedEquipment={selectedEquipment}
                  streamSource={streamSource}
                  setStreamSource={setStreamSource}
                  telemetry={telemetry}
                  activeScenario={activeScenario}
                />
                <AIAnalysisPanel
                  detections={detections}
                  selectedEquipment={selectedEquipment}
                  onSelectEquipment={setSelectedEquipment}
                  audioEnabled={audioEnabled}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <TemporalHistoryPanel
                    temporalEvents={temporalEvents}
                    currentRiskLevel={telemetry.risk_level}
                    activeScenario={activeScenario}
                  />
                  <EvidenceSopPanel
                    evidence={evidence}
                    reasoning={reasoning}
                    selectedEquipment={selectedEquipment}
                  />
                  <PerformancePanel
                    telemetry={telemetry}
                    systemStatus={systemStatus}
                  />
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'digitaltwin' ? (
          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <DigitalTwinView
              selectedEquipment={selectedEquipment}
              onSelectEquipment={setSelectedEquipment}
              activeScenario={activeScenario}
              telemetry={telemetry}
              detections={detections}
              evidence={evidence}
              reasoning={reasoning}
              onOpenReport={() => setIsReportOpen(true)}
            />
          </div>
        ) : (
          /* Single Panel Focused View */
          <div style={{ maxWidth: (activeTab === 'temporal' || activeTab === 'analysis' || activeTab === 'camera' || activeTab === 'evidence' || activeTab === 'performance') ? '1380px' : '1080px', margin: '0 auto', width: '100%' }}>
            {activeTab === 'camera' && (
              <LiveCameraPanel
                detections={detections}
                onSelectEquipment={setSelectedEquipment}
                selectedEquipment={selectedEquipment}
                streamSource={streamSource}
                setStreamSource={setStreamSource}
                telemetry={telemetry}
                activeScenario={activeScenario}
              />
            )}
            {activeTab === 'analysis' && (
              <AIAnalysisPanel
                detections={detections}
                selectedEquipment={selectedEquipment}
                onSelectEquipment={setSelectedEquipment}
                audioEnabled={audioEnabled}
              />
            )}
            {activeTab === 'temporal' && (
              <TemporalHistoryPanel
                temporalEvents={temporalEvents}
                currentRiskLevel={telemetry.risk_level}
                activeScenario={activeScenario}
              />
            )}
            {activeTab === 'evidence' && (
              <EvidenceSopPanel
                evidence={evidence}
                reasoning={reasoning}
                selectedEquipment={selectedEquipment}
              />
            )}
            {activeTab === 'performance' && (
              <PerformancePanel
                telemetry={telemetry}
                systemStatus={systemStatus}
              />
            )}
          </div>
        )}
      </main>
      </ErrorBoundary>
    </div>

    {/* Formal Inspection Report Modal */}
    <ReportModal
      isOpen={isReportOpen}
      onClose={() => setIsReportOpen(false)}
      reportData={{
        report_id: `MIRAGE-REP-20260928-${Math.floor(Math.random() * 9000 + 1000)}`,
        generated_at: new Date().toLocaleString(),
        overall_status: telemetry.current_state,
        active_risk_level: telemetry.risk_level,
        evidence_summary: evidence.evidence_items,
        reasoning: reasoning,
        sop_references: evidence.sop_matches,
      }}
      telemetry={telemetry}
      activeRiskLevel={telemetry.risk_level}
    />
  </div>
);
}
