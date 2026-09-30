import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Menu,
  CheckCircle2, 
  AlertOctagon, 
  ChevronRight, 
  Zap, 
  Activity,
  Sparkles
} from 'lucide-react';

export default function Header({
  activeTab,
  systemStatus,
  telemetry,
  activeRiskLevel,
  onOpenReport,
  onToggleMobileSidebar,
  metallicTheme = 'titanium',
  setMetallicTheme = () => {}
}) {
  const isHighRisk = activeRiskLevel === 'HIGH' || activeRiskLevel === 'CRITICAL';
  const isMediumRisk = activeRiskLevel === 'MEDIUM';

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTabLabel = (id) => {
    switch (id) {
      case 'overview': return 'Executive 5-Panel Overview (SRS §12)';
      case 'digitaltwin': return '3D Digital Twin CAD & Kinematics';
      case 'camera': return 'Live Camera & NPU Vision Stream';
      case 'analysis': return 'AI Analysis State Matrix & FFT';
      case 'temporal': return 'Temporal Engine ("What Changed")';
      case 'evidence': return 'Evidence & SOP Knowledge Retrieval';
      case 'performance': return 'Snapdragon NPU Performance Matrix';
      default: return 'Inspection Workstation';
    }
  };

  return (
    <header className="top-header">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="header-left-group">
        <button 
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          title="Open Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div className="header-breadcrumb">
          <span className="breadcrumb-root">MIRAGE-X</span>
          <ChevronRight size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current">{getTabLabel(activeTab)}</span>
        </div>
      </div>

      {/* Right: Metallic Theme Switcher, Hardware Badges, Live Clock, Report CTA */}
      <div className="header-right-group">
        {/* Metallic Alloy Theme Selector */}
        <div className="metallic-theme-pill hide-mobile" title="Switch Metallic Alloy Finish & UI Color Theme">
          <span className="metal-finish-label">
            <Sparkles size={11} className="metal-shimmer-icon" />
            <span>ALLOY:</span>
          </span>
          <button 
            type="button"
            className={`metal-finish-btn ${metallicTheme === 'titanium' ? 'active' : ''}`}
            onClick={() => setMetallicTheme('titanium')}
            title="Titanium Gold (Aerospace Titanium, Gunmetal Steel, Precision Gold)"
          >
            <span className="metal-dot gold" />
            <span>TITANIUM</span>
          </button>
          <button 
            type="button"
            className={`metal-finish-btn ${metallicTheme === 'cobalt' ? 'active' : ''}`}
            onClick={() => setMetallicTheme('cobalt')}
            title="Cobalt Steel (Machined Tungsten, Deep Steel, Hyper Cobalt)"
          >
            <span className="metal-dot cobalt" />
            <span>COBALT</span>
          </button>
          <button 
            type="button"
            className={`metal-finish-btn ${metallicTheme === 'copper' ? 'active' : ''}`}
            onClick={() => setMetallicTheme('copper')}
            title="Burnished Copper (Dark Bronze, Molten Copper, Magma Amber)"
          >
            <span className="metal-dot copper" />
            <span>COPPER</span>
          </button>
          <button 
            type="button"
            className={`metal-finish-btn ${metallicTheme === 'platinum' ? 'active' : ''}`}
            onClick={() => setMetallicTheme('platinum')}
            title="Liquid Mercury (Specular Platinum, Anodized Silver, Cyber Emerald)"
          >
            <span className="metal-dot platinum" />
            <span>PLATINUM</span>
          </button>
        </div>

        <div className="metal-knurl-divider hide-mobile" />

        {/* Hardware Status Badge */}
        <div className="status-badge npu-active hide-mobile" title="Qualcomm Hexagon NPU 45 TOPS">
          <Cpu size={14} />
          <span>HEXAGON NPU</span>
        </div>

        {/* Active Risk Level */}
        <div 
          className={`status-badge ${
            isHighRisk ? 'risk-high' : isMediumRisk ? 'risk-medium' : 'risk-low'
          }`}
        >
          {isHighRisk ? <AlertOctagon size={14} /> : isMediumRisk ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          <span>RISK: {activeRiskLevel}</span>
        </div>

        {/* Live System Time */}
        <div className="header-clock hide-mobile">
          <Clock size={12} color="var(--accent-cyan)" />
          <span>{currentTime}</span>
        </div>

        {/* Export Report Button */}
        <button className="btn btn-primary header-report-btn" onClick={onOpenReport}>
          <FileText size={14} />
          <span>Audit Report</span>
        </button>
      </div>
    </header>
  );
}
