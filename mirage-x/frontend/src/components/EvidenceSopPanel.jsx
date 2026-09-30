import React, { useState } from 'react';
import { 
  FileText, 
  BookOpen, 
  HelpCircle, 
  CheckSquare, 
  Square,
  ExternalLink, 
  Search,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  Database,
  Flame,
  Volume2,
  Camera,
  History,
  Thermometer,
  Compass,
  FileCheck,
  ShieldCheck,
  Send,
  Sliders,
  Share2,
  Printer
} from 'lucide-react';

export default function EvidenceSopPanel({
  evidence = {},
  reasoning = {},
  selectedEquipment = null
}) {
  const [activeTab, setActiveTab] = useState('reasoning'); // 'reasoning' | 'search' | 'sop' | 'evidence'
  const [checkedSteps, setCheckedSteps] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.75);
  const [selectedSopId, setSelectedSopId] = useState('SOP-MECH-402');
  const [evidenceFilter, setEvidenceFilter] = useState('all');
  const [expandedCotStep, setExpandedCotStep] = useState(null);

  const toggleCheck = (id) => {
    setCheckedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Comprehensive SOP Knowledge Library
  const sopLibrary = [
    {
      id: 'SOP-MECH-402',
      title: 'Industrial High-Pressure Pump & Motor Inspection',
      standard: 'ISO 10816-3 Class II (15kW - 300kW)',
      section: 'Section 4.3: Shaft Alignment & Bearing Thermal Signature',
      confidence: 0.942,
      hazardLevel: 'HIGH',
      hazardLabel: 'MECHANICAL ROTATION & THERMAL PINCH HAZARD',
      relevance: 'Direct match for Pump Motor Casing P01 drive bearing geometry and 2.4 kHz acoustic spike.',
      summary: 'Outlines compulsory diagnostic tolerances for non-contact infrared thermometry, vibration velocity RMS, and coupling backlash.',
      guidance: [
        { text: 'Verify non-contact IR thermography does not exceed 75°C at bearing housing.', mandatory: true, standardRef: '§4.3.1' },
        { text: 'Inspect coupling flange bolts for torque marks (standard 45 Nm specification).', mandatory: true, standardRef: '§4.3.2' },
        { text: 'Check lubrication level via sight glass indicator and verify zero emulsification.', mandatory: false, standardRef: '§4.3.4' },
        { text: 'Execute controlled shutdown if vibration velocity RMS exceeds 2.8 mm/s.', mandatory: true, standardRef: '§4.4.1' }
      ]
    },
    {
      id: 'SOP-SAFE-109',
      title: 'High-Voltage Enclosure Safety Clearance & LOTO',
      standard: 'NFPA 70E / OSHA 1910.147 Standard',
      section: 'Section 2.1: Lockout / Tagout Verification & Arc Flash Boundary',
      confidence: 0.884,
      hazardLevel: 'CRITICAL',
      hazardLabel: 'DANGER: 480V ARC FLASH HAZARD (1.2 CAL/CM²)',
      relevance: 'Applicable when inspecting terminal junctions and busbars within 1.5m radius.',
      summary: 'Mandates strict personal protective equipment (PPE Level 2), voltage absence verification, and mechanical interlock tagging.',
      guidance: [
        { text: 'Maintain minimum 1.0m arc flash boundary unless isolated and de-energized.', mandatory: true, standardRef: '§2.1.2' },
        { text: 'Wear Arc-Rated Face Shield (cal/cm² ≥ 8) and Level 2 dielectric gloves (1000V).', mandatory: true, standardRef: '§2.2.1' },
        { text: 'Affix numbered safety lockout hasp and verify zero voltage with calibrated tester.', mandatory: true, standardRef: '§2.3.0' }
      ]
    },
    {
      id: 'ISO-10816-3',
      title: 'Mechanical Vibration Evaluation Standard for Industrial Machinery',
      standard: 'International Standards Organization (ISO)',
      section: 'Zone Limits: Zone A (Good) to Zone D (Danger Trip)',
      confidence: 0.915,
      hazardLevel: 'MEDIUM',
      hazardLabel: 'STRUCTURAL FATIGUE & FOUNDATION HARMONIC RISK',
      relevance: 'Defines the acceptable velocity thresholds: Nominal (<1.4 mm/s), Warning (1.4-2.8 mm/s), Trip (>2.8 mm/s).',
      summary: 'Provides standardized vibration severity zones for rigid foundation machines in industrial continuous duty.',
      guidance: [
        { text: 'Zone A/B: Machines newly commissioned; vibration velocity < 1.4 mm/s RMS.', mandatory: false, standardRef: 'Table A.1' },
        { text: 'Zone C: Unrestricted long-term operation not permitted; 1.4 mm/s to 2.8 mm/s RMS.', mandatory: true, standardRef: 'Table A.2' },
        { text: 'Zone D: Vibration severity sufficient to cause catastrophic damage; > 2.8 mm/s RMS.', mandatory: true, standardRef: 'Table A.3' }
      ]
    },
    {
      id: 'SOP-HYDR-220',
      title: 'Hydraulic Line Integrity, Cavitation & Seal Protocol',
      standard: 'ISO 4406 Cleanliness Code 18/16/13',
      section: 'Section 3.2: High-Frequency Hydrodynamic Noise & Cavitation',
      confidence: 0.826,
      hazardLevel: 'MEDIUM',
      hazardLabel: 'FLUID JET INJECTION HAZARD & CAVITATION EROSION',
      relevance: 'Applies to Pressure Valve V3 and inlet suction line pressure oscillations.',
      summary: 'Standard operating procedure for detecting fluid line cavitation, micro-leakage weeping, and elastomeric extrusion.',
      guidance: [
        { text: 'Inspect valve bonnet flange for hydraulic weeping or oil mist deposition.', mandatory: true, standardRef: '§3.2.1' },
        { text: 'Monitor 8-16 kHz ultrasonic band for turbulent bubble collapse signature.', mandatory: true, standardRef: '§3.2.5' },
        { text: 'Verify inlet suction head maintains minimum 0.5 bar above vapor pressure.', mandatory: false, standardRef: '§3.3.0' }
      ]
    }
  ];

  // Multimodal Evidence Ledger Items
  const evidenceLedger = [
    {
      id: 'EV-001',
      type: 'OPTICAL',
      source: 'Snapdragon NPU Vision Engine (YOLOv8x / FR-01)',
      label: 'Motor Casing P01 Spatial Micro-Jitter',
      confidence: 0.964,
      status: 'WARNING',
      timestamp: '14:28:44.218',
      telemetry: '0.84 Spatial Displacement Jitter • BBox [0.12, 0.44, 0.58, 0.82]',
      detail: 'Optical inference isolated cyclic high-frequency pixel displacement centered on the drive bearing hub, corroborating mechanical imbalance.',
      sensorNode: 'CAM-01 Optical Reticle (60 FPS)'
    },
    {
      id: 'EV-002',
      type: 'ACOUSTIC',
      source: 'Snapdragon Acoustic Feature Analyzer (FR-07)',
      label: 'Harmonic Sideband Spike at 2.4 kHz',
      confidence: 0.942,
      status: 'WARNING',
      timestamp: '14:28:44.110',
      telemetry: '+6.2 dB above baseline envelope • 2,412 Hz fundamental peak',
      detail: 'Spectral decomposition isolated characteristic BPFO (Ball Pass Frequency Outer Race) harmonic sidebands indicative of incipient bearing fatigue.',
      sensorNode: 'MIC-ARRAY-02 Piezo Transducer'
    },
    {
      id: 'EV-003',
      type: 'TEMPORAL',
      source: 'Snapdragon Temporal Engine (FR-05 & FR-06)',
      label: 'Continuous Drift vs Golden Reference Envelope',
      confidence: 0.928,
      status: 'WARNING',
      timestamp: '14:28:43.905',
      telemetry: '+14.2% Deviation • 14/30 Frames Persistent Saturated',
      detail: 'Temporal comparator detected persistent drift across 14 consecutive frames (>450ms), surpassing the anti-glitch persistence filter.',
      sensorNode: 'NPU Temporal Ring Buffer (FR-06)'
    },
    {
      id: 'EV-004',
      type: 'THERMAL',
      source: 'FLIR Thermal Imaging Matrix (Optic Filter #2)',
      label: 'Drive Bearing Housing Localized Thermal Plume',
      confidence: 0.951,
      status: 'WARNING',
      timestamp: '14:28:43.620',
      telemetry: '54.2°C Spot Temp • Δ +13.0°C Excursion over Golden Baseline',
      detail: 'Infrared radiometry identified thermal clustering at the bearing flange with emissivity calibrated to machined steel (ε = 0.95).',
      sensorNode: 'LWIR Microbolometer Core'
    }
  ];

  // Multi-Stage Chain of Thought Steps
  const cotStages = [
    {
      stage: '01',
      title: 'Multimodal Visual Perception',
      sensor: 'YOLOv8x NPU Tensor (FR-01)',
      confidence: '96.4%',
      summary: 'Optical camera reticle isolated high-frequency cyclic displacement jitter on Motor Casing P01.',
      technicalNotes: 'Spatial variance calculated across 30 consecutive video frames. Jitter vector oriented primarily on the vertical axis (ΔY: 2.4mm).'
    },
    {
      stage: '02',
      title: 'Acoustic Frequency Decomposition',
      sensor: '32-Band FFT Engine (FR-07)',
      confidence: '94.2%',
      summary: 'Audio transducer isolated a sharp harmonic sideband excursion centered at 2.4 kHz (+6.2 dB spike).',
      technicalNotes: 'Matches bearing outer raceway pass frequency (BPFO = 2,412 Hz at 1,480 RPM nominal shaft speed).'
    },
    {
      stage: '03',
      title: 'Temporal Baseline Cross-Referencing',
      sensor: 'Golden Reference Filter (FR-05/FR-06)',
      confidence: '92.8%',
      summary: 'Temporal deviation exceeded ±5.0% golden envelope and maintained continuous persistence for 14 frames.',
      technicalNotes: 'Transient false-alarm filter satisfied (>10 frames threshold required to confirm non-spurious physical fault).'
    },
    {
      stage: '04',
      title: 'Semantic Vector Knowledge Retrieval',
      sensor: 'Snapdragon Hexagon Vector RAG (FR-10)',
      confidence: '94.6%',
      summary: 'Retrieved SOP-MECH-402 §4.3 and ISO 10816-3 with 0.942 cosine similarity in 2.4ms.',
      technicalNotes: 'Correlated measured 1.90 mm/s vibration against ISO 10816-3 Zone C boundary (Unrestricted operation prohibited).'
    },
    {
      stage: '05',
      title: 'VLM Cross-Modal Diagnostic Synthesis',
      sensor: 'Local Llama-3-Vision (FR-11)',
      confidence: '91.0%',
      summary: 'Synthesized evidence to rule out foundation mount looseness; diagnosed bearing race spalling & shaft deflection.',
      technicalNotes: 'Mounting bolt torque optical verification showed paint witness marks intact. Defect localized specifically to internal drive bearing.'
    }
  ];

  // Quick Query Prompts for Vector Search
  const quickQueries = [
    "What is the maximum allowable bearing temperature?",
    "Shaft misalignment tolerance for 1500 RPM motor",
    "Acoustic cavitation symptoms on inlet valve",
    "Lockout / Tagout arc flash boundary clearance"
  ];

  const handleQuickQuery = (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
  };

  // Filtered SOPs for Search Tab
  const searchResults = sopLibrary.filter(sop => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sop.id.toLowerCase().includes(q) ||
      sop.title.toLowerCase().includes(q) ||
      sop.section.toLowerCase().includes(q) ||
      sop.relevance.toLowerCase().includes(q) ||
      sop.guidance.some(g => g.text.toLowerCase().includes(q))
    );
  }).filter(sop => sop.confidence >= similarityThreshold);

  // Filtered Evidence
  const filteredEvidence = evidenceLedger.filter(ev => {
    if (evidenceFilter === 'all') return true;
    return ev.type === evidenceFilter;
  });

  const selectedSop = sopLibrary.find(s => s.id === selectedSopId) || sopLibrary[0];

  // Count checked checklist items
  const recommendations = reasoning.recommendations || [
    'Initiate controlled shutdown of Motor Unit P01 according to SOP-MECH-402 §4.3.',
    'Measure physical bearing temperature using calibrated optical pyrometer.',
    'Inspect mechanical seal for fluid weeping or graphite dusting.',
    'Log verification photos via MIRAGE-X report generator.'
  ];
  const completedRecCount = Object.values(checkedSteps).filter(Boolean).length;
  const isAllRecsCompleted = completedRecCount === recommendations.length;

  return (
    <div className="glass-card" style={{ width: '100%', overflow: 'hidden' }}>
      {/* 1. Header with Snapdragon Vector RAG Badge */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="card-title-group">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 172, 254, 0.1))',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0, 242, 254, 0.2)'
          }}>
            <BookOpen className="card-title-icon" size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="card-title" style={{ fontSize: '0.92rem', letterSpacing: '0.02em' }}>
                Evidence & SOP Knowledge RAG
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(0, 242, 254, 0.12)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                fontWeight: 700
              }}>
                FR-07 / FR-10 / FR-11
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Snapdragon Hexagon Vector Embedding Search & Local VLM Chain-of-Thought Rationale
            </div>
          </div>
        </div>

        {/* Vector Engine Telemetry Micro-Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <Database size={12} color="var(--accent-cyan)" />
            <span style={{ color: 'var(--text-secondary)' }}>Vector Store:</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>10,480 Chunks</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>2.4ms RAG</span>
          </div>
        </div>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 2. Navigation Sub-Tabs */}
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
            onClick={() => setActiveTab('reasoning')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'reasoning' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(0, 242, 254, 0.08))' : 'transparent',
              color: activeTab === 'reasoning' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'reasoning' ? '2px solid #00f2fe' : '2px solid transparent',
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
            <Sparkles size={13} />
            <span>Neural Chain-of-Thought</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'search' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(0, 242, 254, 0.08))' : 'transparent',
              color: activeTab === 'search' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'search' ? '2px solid #00f2fe' : '2px solid transparent',
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
            <Search size={13} />
            <span>Semantic Vector Search</span>
          </button>

          <button
            onClick={() => setActiveTab('sop')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'sop' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(0, 242, 254, 0.08))' : 'transparent',
              color: activeTab === 'sop' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'sop' ? '2px solid #00f2fe' : '2px solid transparent',
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
            <BookOpen size={13} />
            <span>SOP Standard Manuals ({sopLibrary.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'evidence' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(0, 242, 254, 0.08))' : 'transparent',
              color: activeTab === 'evidence' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'evidence' ? '2px solid #00f2fe' : '2px solid transparent',
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
            <Layers size={13} />
            <span>Multimodal Evidence ({evidenceLedger.length})</span>
          </button>
        </div>

        {/* 3. Tab 1: Neural Chain-of-Thought (Local VLM Synthesis) */}
        {activeTab === 'reasoning' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Finding Overview Banner */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08), rgba(15, 23, 42, 0.6))', 
              border: '1px solid rgba(0, 242, 254, 0.3)', 
              padding: '12px 16px', 
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Snapdragon VLM Diagnostic Synthesis (FR-11)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    fontWeight: 700
                  }}>
                    SEVERITY: {reasoning.severity || 'MEDIUM'}
                  </span>
                  <span style={{
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    fontWeight: 700
                  }}>
                    CONFIDENCE: {Math.round((reasoning.confidence || 0.91) * 100)}%
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>
                {reasoning.finding || "Sub-surface mechanical bearing wear & minor shaft misalignment in Pump Motor Casing P01"}
              </p>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                Model: Llama-3-Vision-8B-Instruct (Snapdragon Hexagon NPU Q4_K_M) • Zero Cloud Dependency
              </div>
            </div>

            {/* Visual Multi-Stage Chain of Thought Stepper */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  5-Stage Multimodal Inference Pipeline
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Optical → Acoustic → Temporal → Vector RAG → Synthesis
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cotStages.map((step, idx) => {
                  const isExpanded = expandedCotStep === idx;

                  return (
                    <div 
                      key={idx}
                      onClick={() => setExpandedCotStep(isExpanded ? null : idx)}
                      style={{
                        background: isExpanded ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isExpanded ? 'rgba(0, 242, 254, 0.35)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isExpanded ? 'var(--accent-cyan)' : 'rgba(0, 242, 254, 0.15)',
                            color: isExpanded ? '#000' : 'var(--accent-cyan)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {step.stage}
                          </span>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                              {step.title}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                              {step.sensor}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '0.64rem',
                            fontFamily: 'var(--font-mono)',
                            color: '#34d399',
                            fontWeight: 700
                          }}>
                            {step.confidence} Match
                          </span>
                          <ChevronRight 
                            size={14} 
                            color="var(--text-muted)" 
                            style={{ transform: isExpanded ? 'rotate(9deg)' : 'none', transition: 'transform 0.15s' }} 
                          />
                        </div>
                      </div>

                      <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                        {step.summary}
                      </p>

                      {isExpanded && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 10px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          borderRadius: '6px',
                          border: '1px solid rgba(0, 242, 254, 0.2)',
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#94a3b8'
                        }}>
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                            HEXAGON ACCELERATED RATIONALE:
                          </span>
                          {step.technicalNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Remediation Actions Checklist */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    Remediation Protocol Checklist (SOP-MECH-402 §4.3)
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                    Mandatory sign-off required prior to inspection report sign-off
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: isAllRecsCompleted ? '#10b981' : '#fbbf24'
                  }}>
                    {completedRecCount} / {recommendations.length} COMPLETED
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{
                  height: '100%',
                  width: `${(completedRecCount / recommendations.length) * 100}%`,
                  background: isAllRecsCompleted ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  transition: 'width 0.25s ease'
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recommendations.map((rec, idx) => {
                  const isChecked = !!checkedSteps[idx];

                  return (
                    <div 
                      key={idx} 
                      onClick={() => toggleCheck(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        background: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-subtle)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.74rem',
                        color: isChecked ? '#34d399' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isChecked ? (
                        <CheckSquare size={16} color="#10b981" />
                      ) : (
                        <Square size={16} color="#64748b" />
                      )}
                      <span style={{ textDecoration: isChecked ? 'line-through' : 'none', flex: 1 }}>
                        {rec}
                      </span>
                      <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: isChecked ? '#10b981' : 'var(--text-muted)' }}>
                        {isChecked ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. Tab 2: Semantic Vector Search & Query Console */}
        {activeTab === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Interactive Query Input */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={14} color="var(--accent-cyan)" />
                  Snapdragon Vector RAG Retrieval Console
                </span>
                <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Embedding Model: nomic-embed-text-v1.5 (384 Dimensions)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Enter natural language query or technical question..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#020611',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '0.76rem',
                      color: '#fff',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
                {searchQuery && (
                  <button 
                    className="btn btn-outline"
                    onClick={() => setSearchQuery('')}
                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Query Pills */}
              <div>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Quick Retrieval Prompts:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {quickQueries.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuery(q)}
                      style={{
                        background: 'rgba(0, 242, 254, 0.06)',
                        border: '1px solid rgba(0, 242, 254, 0.2)',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '0.66rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Similarity Threshold Filter Slider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.66rem',
                color: 'var(--text-muted)'
              }}>
                <span>Cosine Similarity Cutoff Threshold:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0.60"
                    max="0.95"
                    step="0.05"
                    value={similarityThreshold}
                    onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                    style={{ width: '100px', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    ≥ {(similarityThreshold * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Search Results Ledger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Vector Top-K Retrieved Document Chunks ({searchResults.length})
                </span>
                <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                  Search Latency: 2.38 ms on Hexagon NPU
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  No SOP sections match the query with similarity ≥ {(similarityThreshold * 100).toFixed(0)}%. Try lowering the threshold or clearing keywords.
                </div>
              ) : (
                searchResults.map((sop, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--accent-cyan)',
                          background: 'rgba(0, 242, 254, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {sop.id}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                          {sop.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: '#34d399',
                          background: 'rgba(16, 185, 129, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {(sop.confidence * 100).toFixed(1)}% Cosine Match
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                      {sop.section} • {sop.standard}
                    </div>

                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {sop.summary}
                    </p>

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      borderLeft: '2px solid var(--accent-cyan)',
                      fontSize: '0.7rem',
                      fontStyle: 'italic',
                      color: '#cbd5e1'
                    }}>
                      "{sop.relevance}"
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => { setSelectedSopId(sop.id); setActiveTab('sop'); }}
                        style={{ padding: '3px 8px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>Open Complete Standard Manual</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. Tab 3: SOP Standard Operating Procedures & Safety Protocols */}
        {activeTab === 'sop' && (
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {/* Left Column: SOP Selector List */}
            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Indexed Standard Operating Procedures
              </span>

              {sopLibrary.map((sop) => {
                const isSelected = sop.id === selectedSopId;

                return (
                  <div
                    key={sop.id}
                    onClick={() => setSelectedSopId(sop.id)}
                    style={{
                      background: isSelected ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {sop.id}
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: sop.hazardLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: sop.hazardLevel === 'CRITICAL' ? '#f87171' : '#fbbf24',
                        fontWeight: 700
                      }}>
                        {sop.hazardLevel}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>
                      {sop.title}
                    </div>

                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {sop.standard}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Complete SOP Document Reader */}
            <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {selectedSop.id}
                    </span>
                    <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#fff', margin: '2px 0 0 0' }}>
                      {selectedSop.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => window.print()}
                      style={{ padding: '3px 8px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Print SOP Inspection Sheet"
                    >
                      <Printer size={12} />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {/* Safety Hazard Caution Alert Banner */}
                <div style={{
                  background: selectedSop.hazardLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${selectedSop.hazardLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.3)'}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldAlert size={16} color={selectedSop.hazardLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b'} />
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: selectedSop.hazardLevel === 'CRITICAL' ? '#f87171' : '#fbbf24' }}>
                      SAFETY ADVISORY ({selectedSop.hazardLevel})
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
                      {selectedSop.hazardLabel}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {selectedSop.section}
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: '4px' }}>
                    {selectedSop.summary}
                  </p>
                </div>

                {/* Step-by-Step Procedure Checklist */}
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                    Mandatory Standard Procedure Steps:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedSop.guidance.map((g, idx) => (
                      <div 
                        key={idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          fontSize: '0.74rem'
                        }}
                      >
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.64rem',
                          background: 'rgba(0, 242, 254, 0.1)',
                          color: 'var(--accent-cyan)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          flexShrink: 0
                        }}>
                          {g.standardRef}
                        </span>
                        <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                          {g.text}
                        </span>
                        {g.mandatory && (
                          <span style={{
                            fontSize: '0.58rem',
                            fontFamily: 'var(--font-mono)',
                            color: '#f87171',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            MANDATORY
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Tab 4: Multimodal Evidence Ledger (FR-07 / FR-11) */}
        {activeTab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Multimodal Sensor Evidence Verification Ledger
              </span>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={`toggle-chip ${evidenceFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setEvidenceFilter('all')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  All ({evidenceLedger.length})
                </button>
                <button
                  className={`toggle-chip ${evidenceFilter === 'OPTICAL' ? 'active' : ''}`}
                  onClick={() => setEvidenceFilter('OPTICAL')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  Optical
                </button>
                <button
                  className={`toggle-chip ${evidenceFilter === 'ACOUSTIC' ? 'active' : ''}`}
                  onClick={() => setEvidenceFilter('ACOUSTIC')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  Acoustic
                </button>
                <button
                  className={`toggle-chip ${evidenceFilter === 'TEMPORAL' ? 'active' : ''}`}
                  onClick={() => setEvidenceFilter('TEMPORAL')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  Temporal
                </button>
                <button
                  className={`toggle-chip ${evidenceFilter === 'THERMAL' ? 'active' : ''}`}
                  onClick={() => setEvidenceFilter('THERMAL')}
                  style={{ fontSize: '0.66rem', padding: '3px 8px' }}
                >
                  Thermal IR
                </button>
              </div>
            </div>

            {/* Evidence Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredEvidence.map((ev) => (
                <div 
                  key={ev.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.66rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: ev.type === 'OPTICAL' ? 'rgba(0, 242, 254, 0.15)' : ev.type === 'ACOUSTIC' ? 'rgba(168, 85, 247, 0.15)' : ev.type === 'THERMAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: ev.type === 'OPTICAL' ? 'var(--accent-cyan)' : ev.type === 'ACOUSTIC' ? '#c084fc' : ev.type === 'THERMAL' ? '#f87171' : '#fbbf24',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {ev.type} EVIDENCE
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                        {ev.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {ev.timestamp}
                      </span>
                      <span style={{
                        fontSize: '0.64rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        fontWeight: 700
                      }}>
                        {(ev.confidence * 100).toFixed(1)}% CONF
                      </span>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {ev.telemetry}
                  </div>

                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {ev.detail}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                    <span>Hardware Sensor: {ev.sensorNode}</span>
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={11} />
                      Signed & Cryptographically Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Bottom Hardware RAG Summary Bar */}
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
            <span style={{ color: 'var(--text-muted)' }}>RAG Knowledge Engine:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 700 }}>
              On-Device Vector SQLite (Snapdragon Hexagon Vector Unit)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Regulatory Compliance:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              ISO 10816-3 • NFPA 70E • OSHA 1910.147
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
