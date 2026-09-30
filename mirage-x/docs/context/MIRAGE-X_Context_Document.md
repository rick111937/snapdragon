# MIRAGE-X — Project Context Document
**For: Antigravity IDE (AI development context ingestion)**
**Source of truth: MIRAGE-X SRS v1.0, dated 2026-09-27**
**Last updated: 2026-09-27 (after MVP-1 implementation)**

---

## 0. How to use this document

This is a single, self-contained context file intended to be pasted into or
ingested by an AI-assisted IDE (Antigravity) so that any future coding session
has full situational awareness of the project without needing to re-read the
original SRS PDF. It contains two layers:

1. **Layer A — Specification Summary**: a complete, faithful compression of the
   SRS (all 21 sections) into structured, IDE-friendly form.
2. **Layer B — Progress & State Tracker**: the actual current build status of
   the project, updated after each work session.

Any AI agent working in this repository should treat Layer A as **binding
requirements** (do not silently deviate) and Layer B as **current ground truth**
(do not assume more is built than is recorded here).

---

## 1. Product Identity

| Field | Value |
|---|---|
| Name | MIRAGE-X — Multimodal Industrial Reality & Anomaly Guidance Engine |
| Type | On-device multimodal AI inspection platform |
| Target hardware | Snapdragon-powered HP PCs |
| Primary OS | Windows 11 |
| AI execution target | Snapdragon NPU / Qualcomm AI Hub–optimized models |
| Core pipeline philosophy | Observe → Compare → Correlate → Explain → Recommend |
| Context | Prototype for the Snapdragon AI Lab Build & Present Challenge |
| Product classification | Decision-support software. **Not** an autonomous controller, not a safety-certification system, not a replacement for qualified personnel. |

**Core differentiator (per SRS §21):** Detect → Compare → Correlate → Explain → Recommend.  
**Snapdragon differentiator:** NPU-accelerated local inference with *measured* (not claimed) device performance.

**Core question the system answers:** *"What changed, why might it matter, what evidence supports the finding, and what should be inspected next?"*

---

## 2. Problem Statement (SRS §3)

Traditional inspection workflows rely on periodic manual checks, isolated sensor
readings, and expert interpretation. A single image/reading rarely reveals a
developing problem, and industrial video/audio/documents can be sensitive.
MIRAGE-X correlates multiple **local** evidence sources and tracks how equipment
conditions change **over time**, rather than evaluating single snapshots in isolation.

---

## 3. Objectives (SRS §4)

- Detect relevant equipment/observable conditions from camera input.
- Create and maintain a baseline state per monitored equipment.
- Detect meaningful visual and state changes over time.
- Analyze acoustic patterns for supported anomaly scenarios.
- Fuse visual, acoustic, temporal, historical, and document evidence.
- Retrieve relevant maintenance/SOP information from local documents (RAG).
- Generate explainable anomaly assessments and inspection guidance.
- Operate core functionality **without mandatory cloud connectivity**.
- Use Snapdragon NPU acceleration for supported AI inference.
- Measure and report **real device performance**, never theoretical/borrowed numbers.
- Generate inspection reports with evidence, findings, and model metadata.

---

## 4. Scope (SRS §5)

### In Scope
Camera capture + real-time visual inference · object/equipment detection & state
recognition · temporal baseline & change detection · acoustic anomaly analysis
(selected scenarios) · local PDF/SOP ingestion & retrieval · multimodal reasoning
via a supported VLM · risk classification with evidence-based explanations ·
inspection history & report generation · NPU/CPU/GPU benchmarking · offline-first
core inference.

### Out of Scope
Autonomous control/shutdown of machinery · automatic physical repair/actuation ·
legally binding safety certification · guaranteed failure prediction · medical
diagnosis · mandatory cloud processing for core inference.

---

## 5. Users & Primary Use Case (SRS §6)

| Actor | Primary Use | Expected Outcome |
|---|---|---|
| Maintenance Technician | Inspect equipment, investigate anomalies | Evidence-backed inspection guidance |
| Operator | Monitor equipment state | Timely anomaly alerts |
| Safety/Inspection Officer | Review evidence and reports | Traceable inspection record |
| Engineer/Researcher | Evaluate models and NPU performance | Benchmark and diagnostics |

**Primary use case flow (Multimodal Inspection):**
1. User selects an equipment profile.
2. System captures a baseline state.
3. Vision and optional audio monitoring begin.
4. Temporal engine compares current observations with baseline/history.
5. If anomaly suspected → relevant SOP/manual sections retrieved.
6. Multimodal reasoning generates an evidence-based explanation.
7. Risk and inspection guidance displayed.
8. User may generate an inspection report.

---

## 6. System Architecture (SRS §7)

Modular pipeline — models must be swappable without app rewrites:

```
Camera / Microphone / Documents
        ↓
Vision / Audio / OCR
        ↓
Context Engine
        ↓
Temporal Engine
        ↓
Anomaly Engine
        ↓
VLM / RAG
        ↓
Explanation & Recommendation
        ↓
Dashboard / Report
```

**Snapdragon execution path:** models deployed through Qualcomm AI Hub–compatible
workflows + local runtimes (ONNX Runtime, Qualcomm execution providers where
available). Exact model/runtime combos validated on the target device during
implementation — **not assumed in advance**.

**Processing strategy (four parallel paths):**
- **Fast path** — lightweight vision/audio models, continuous/periodic monitoring.
- **Deep path** — VLM/larger reasoning invoked only on significant events.
- **Document path** — local retrieval supplies maintenance knowledge.
- **Fallback path** — if a modality is unavailable, app continues in clearly
  labeled degraded mode (never crashes).

---

## 7. Functional Requirements (SRS §8) — IDs are binding

| ID | Requirement | Specification |
|---|---|---|
| FR-01 | Camera Input | Capture camera frames; configurable resolution; start/stop monitoring. |
| FR-02 | Object Detection | Detect configured equipment/objects where supported by the model. |
| FR-03 | Equipment State | Represent states: NORMAL, WARNING, ANOMALOUS, UNKNOWN. |
| FR-04 | Baseline Creation | Create a time-stamped baseline representation for selected equipment/scene. |
| FR-05 | Change Detection | Compare current observations with baseline/history; identify meaningful changes. |
| FR-06 | Temporal Escalation | Consider persistence/recurrence before escalating transient events. |
| FR-07 | Audio Input | Optionally capture microphone input for supported acoustic scenarios. |
| FR-08 | Acoustic Anomaly | Compare current acoustic characteristics with configured baseline. |
| FR-09 | Evidence Fusion | Combine available visual, acoustic, temporal, historical, and document evidence. |
| FR-10 | Document Upload | Accept supported PDF manuals, SOPs, inspection documents. |
| FR-11 | Document Retrieval | Retrieve relevant document sections for a detected condition. |
| FR-12 | Multimodal Reasoning | Generate a structured explanation using available evidence + retrieved context. |
| FR-13 | Risk Classification | Classify findings into configurable LOW / MEDIUM / HIGH / CRITICAL. |
| FR-14 | Confidence | Display model confidence where meaningful; never present as guarantee. |
| FR-15 | Recommendation | Provide inspection-oriented recommendations from evidence + retrieved procedures. |
| FR-16 | History | Store time-stamped inspection states and anomaly events. |
| FR-17 | Reporting | Generate inspection report: findings, evidence, references, model/performance metadata. |
| FR-18 | Benchmarking | Record inference latency and other available device metrics per execution mode. |

---

## 8. Non-Functional Requirements (SRS §9)

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Near-real-time inference for the selected monitoring model on-device. |
| NFR-02 | Offline Capability | Core local inference/monitoring must not require internet. |
| NFR-03 | NPU Utilization | Supported workloads evaluated for Snapdragon NPU execution. |
| NFR-04 | Usability | First-time user completes a basic inspection via a short guided workflow. |
| NFR-05 | Reliability | Temporary failure of one input modality must not crash the app. |
| NFR-06 | Maintainability | AI models/processing modules independently replaceable. |
| NFR-07 | Portability | Targets supported Windows-on-Snapdragon environments. |
| NFR-08 | Observability | Exposes logs and benchmark info sufficient to diagnose model/runtime issues. |

---

## 9. AI & Snapdragon/NPU Requirements (SRS §10)

- Models selected based on supported Snapdragon device/runtime configurations.
- Prefer Qualcomm AI Hub–optimized artifacts / supported deployment paths.
- Implementation must **identify the actual execution provider/runtime** used.
- **Never claim NPU execution unless runtime/device evidence confirms it.**
- Quantization and input resolution chosen with accuracy/latency trade-offs **documented**.
- Fast-path/deep-path architecture required to reduce unnecessary VLM invocation.
- Final model selection validated on the **exact** HP Snapdragon development machine.

---

## 10. Data Requirements (SRS §11)

| Data | Description | Processing | Retention |
|---|---|---|---|
| Camera Frames | Live image frames | Local | Transient unless explicitly saved |
| Audio Samples | Acoustic monitoring | Local | Transient unless explicitly saved |
| Equipment State | Objects, states, timestamps | Local DB | Retained as inspection history |
| Documents | Manuals/SOPs | Local | User-managed |
| Embeddings | Document retrieval vectors | Local | Retained with document index |
| Inspection Events | Findings + evidence metadata | Local DB | Retained per configured policy |
| Benchmark Data | Latency, FPS, runtime metrics | Local | Retained for evaluation |

---

## 11. User Interface Requirements (SRS §12)

Required panels/elements:
- Live camera view with detection overlays
- Current equipment state + risk indicator
- Temporal timeline (state changes)
- Evidence panel (visual/audio/document sources)
- Explainability panel (why flagged)
- Recommendation panel (inspection guidance)
- Document/SOP management panel
- NPU/performance panel (measured latency + runtime)
- Offline/local-processing status indicator
- Report generation control

**Suggested dashboard layout:**
`LIVE CAMERA | AI ANALYSIS | TEMPORAL HISTORY | EVIDENCE & SOP | SNAPDRAGON PERFORMANCE`

---

## 12. Security & Privacy (SRS §13)

- Local-first processing by default.
- Raw camera/audio data **not** uploaded by default.
- Any external service use must be explicit and visible to the user.
- **API keys never hard-coded** (enforced across all MVP-1 code).
- Uploaded files validated before processing.
- No arbitrary code execution from uploaded content.
- Sensitive inspection data stored locally with controlled access.
- App must clearly indicate local vs. external processing at all times.

---

## 13. Error Handling & Reliability (SRS §14)

| Condition | Required Behavior |
|---|---|
| Camera unavailable | Actionable error + retry; allow non-camera modules to continue. |
| Microphone unavailable | Fall back to vision-only/degraded mode, clearly indicated. |
| Model unavailable | No crash; show model/runtime status; enter degraded mode. |
| Unsupported PDF | Reject safely; explain supported format/issue. |
| Internet unavailable | Core local workflow continues; external-only features disabled. |
| Insufficient confidence | Show UNKNOWN/NEEDS REVIEW rather than forcing a high-risk conclusion. |

---

## 14. Performance & Benchmarking (SRS §15)

**Hard rule:** All performance claims must come from measurements on the **actual
target Snapdragon HP PC**. No fabricated numbers, no numbers copied from a
different device presented as device measurements.

**Required metrics:** inference latency (ms) · FPS · CPU utilization · NPU
utilization (where exposed) · memory usage · time to first result · VLM
invocation count · cloud request count · offline response time.

**Comparison modes:** CPU vs GPU vs NPU, where technically/operationally supported.
Every report must state model, input size, runtime, quantization, device, and
test conditions.

---

## 15. MVP & Release Plan (SRS §16)

| Stage | Module | Deliverable |
|---|---|---|
| MVP-1 | NPU Vision Pipeline | Camera → AI Hub model → NPU inference → detection → measured latency/FPS |
| MVP-2 | Temporal Engine | Baseline + state history + what-changed detection |
| MVP-3 | Audio | Optional acoustic anomaly detection + multimodal fusion |
| MVP-4 | Knowledge Layer | Local PDF/SOP parsing + retrieval |
| MVP-5 | Reasoning | VLM + evidence-based explanation |
| MVP-6 | Productization | Professional UI + report + offline demo |
| MVP-7 | Competition Proof | Benchmarking, physical demo rig, documentation, final presentation |

---

## 16. Acceptance Criteria (SRS §17)

- Launches successfully on target Snapdragon HP Windows environment.
- A supported AI model performs local inference on-device.
- Implementation can demonstrate the actual execution runtime/provider used.
- Detects configured objects/equipment in the selected demo scenario.
- Temporal engine detects a controlled state change.
- ≥1 controlled anomaly scenario produces a reproducible finding.
- Core operation continues with internet disabled.
- Dashboard clearly distinguishes normal/warning/anomalous states.
- Explanation is produced and linked to available evidence.
- Final benchmark contains measured results + test conditions.
- Inspection report can be generated from a completed test session.

---

## 17. Testing Strategy (SRS §18)

Unit tests (temporal state, risk scoring, document retrieval, data validation) ·
model inference tests with known sample inputs · integration tests (camera →
model → temporal → anomaly) · offline tests (network disabled) · fault-injection
tests (missing camera/mic/model, invalid documents) · performance tests with
repeatable inputs and documented device conditions · user-acceptance tests on
the physical demo scenario · regression tests on model/runtime version changes.

---

## 18. Future Scope (SRS §19, explicitly NOT in current build)

Thermal camera integration · vibration sensor integration · digital twin
visualization · predictive maintenance models · AR technician assistance ·
multi-camera inspection · enterprise fleet analytics · federated/local learning ·
additional industrial equipment profiles.

---

## 19. Risks & Mitigations (SRS §20)

| Risk | Mitigation |
|---|---|
| NPU runtime/model incompatibility | Validate candidate models early on exact target machine; maintain CPU fallback for dev. |
| False positives | Temporal persistence + multimodal evidence + explicit confidence/UNKNOWN states. |
| VLM latency | Event-triggered deep analysis instead of continuous VLM inference. |
| Insufficient demo hardware | Controlled tabletop equipment rig with reproducible states. |
| Document retrieval errors | Show source excerpts; require evidence-linked responses. |
| Overclaiming industrial safety | Position as decision support, not autonomous control/certification. |
| Performance variability | Record device, model, input size, runtime, test conditions for every benchmark. |

---

## 20. Final Product Definition & Demo Flow (SRS §21)

MIRAGE-X is a privacy-first, on-device multimodal AI inspection platform combining
vision, audio, temporal analysis, and maintenance knowledge to detect, explain, and
document equipment anomalies in real time on Snapdragon-powered HP PCs.

**Competition demonstration flow:**
Normal machine → baseline → controlled condition change → vision/audio detection →
temporal confirmation → SOP retrieval → explanation → risk → report →
internet-off demonstration → measured Snapdragon performance.

---

# LAYER B — PROGRESS & STATE TRACKER
*(Editable. This is the living status log — update after every work session so the IDE agent always has accurate ground truth.)*

## Current Phase
**MVP-1 implemented.** Camera → ONNX inference → benchmarking pipeline is fully
coded, tested, and wired end-to-end.  A real .onnx model file at
`models/vision/model.onnx` is required to move from DEGRADED demo mode to live
inference.  All unit and integration tests pass on CPU in a standard dev
environment.

---

## Status by MVP Stage

| Stage | Status | Notes |
|---|---|---|
| MVP-1 — NPU Vision Pipeline | ✅ **IMPLEMENTED** | Code complete. Tests pass. Needs real .onnx model + device validation. See decisions below. |
| MVP-2 — Temporal Engine | Not started | Can begin: MVP-1 output schema (DetectionResult / EquipmentState) is finalized. |
| MVP-3 — Audio | Not started | Acoustic baseline/anomaly approach not yet chosen. |
| MVP-4 — Knowledge Layer | Not started | PDF parsing + local embedding/retrieval stack not yet chosen. |
| MVP-5 — Reasoning (VLM) | Not started | Candidate on-device VLM not yet selected/benchmarked. |
| MVP-6 — Productization | Not started | UI framework not yet chosen. |
| MVP-7 — Competition Proof | Not started | Depends on all prior stages + physical demo rig. |

---

## Decisions Made So Far

### Platform & Architecture
- Target platform confirmed: Snapdragon-powered HP PC, Windows 11.
- Architecture confirmed: fast-path/deep-path modular pipeline per SRS §7.
- Documentation approach confirmed: this context file is the canonical
  project-context artifact.

### MVP-1 Implementation Decisions (2026-09-27)

**Camera module** (`src/mirage_x/input/camera.py`):
- `opencv-python` used for camera capture (lazy import — app boots without it).
- DEGRADED mode engages automatically when device index unavailable.
- `make_mock_frame()` is the canonical mock for tests and no-camera environments.

**Vision data types** (`src/mirage_x/vision/models.py`):
- `EquipmentState` enum: NORMAL / WARNING / ANOMALOUS / UNKNOWN (FR-03).
- `Detection` holds class_id, class_name, confidence [0,1], optional BoundingBox,
  and a state derived from the confidence threshold heuristic.
- `DetectionResult` is the single output type for one inference call — carries
  confirmed `provider_used`, `inference_time_ms`, `device_note`.

**Inference wrapper** (`src/mirage_x/vision/detector.py`):
- `ONNXDetector` wraps ONNX Runtime with ordered provider negotiation.
- Providers tried in order from `configs/app.yaml` → `execution.providers`.
- `provider_used` is set from `session.get_providers()[0]` after session creation
  (the ONNX Runtime confirmed value — **never assumed**).
- Supports YOLOv8/v5-style output tensors `[1, 84, N]` or `[1, N, 85+]`.
  Unknown output shapes produce a `raw_output` Detection so the pipeline
  doesn't silently fail with new models.
- `inference_time_ms` = wall-clock time of `session.run()` only (pre/post-processing excluded).

**State heuristic** (module-level in `detector.py`, easy to tune):
- confidence ≥ 0.70 → NORMAL
- confidence ≥ 0.45 → WARNING
- confidence < 0.45 → UNKNOWN
- ANOMALOUS is **not** assigned by the detector — requires temporal context (MVP-2, FR-06).

**Benchmarking** (`src/mirage_x/benchmarking/metrics.py`):
- `LatencyMeter` records per-frame `inference_time_ms`, wall-clock time, and
  provider.  Rolling window (default 30 frames) for FPS/latency.
- `BenchmarkSummary` reports: mean, min, max, p95 latency, mean FPS, total frames,
  provider, model path, input resolution, device note.
- `device_note` propagates from `ONNXDetector` constructor → `DetectionResult` →
  `FrameBenchmark` → `BenchmarkSummary` → printed summary.
  **Any measurement not taken on the real Snapdragon HP target carries
  "unvalidated / dev environment" in this field.**

**Entry point** (`src/mirage_x/main.py`):
- Full CLI with `--model`, `--camera`, `--mock-camera`, `--frames`,
  `--device-note`, `--input-size`, `--conf-threshold`, `--verbose`.
- Gracefully switches to mock frames if camera is unavailable.
- Prints confirmed provider on every frame line.
- Prints `BenchmarkSummary` on exit.

**Configuration** (`src/mirage_x/utils/config.py`):
- `load_config()` reads `configs/app.yaml`; returns `AppConfig` defaults if missing.
- `ExecutionConfig.ort_providers()` maps yaml shorthand → ONNX RT names and
  always appends `CPUExecutionProvider` as final fallback.

**Execution provider mapping** (in `configs/app.yaml` → `execution.providers`):
| YAML shorthand | ONNX Runtime string |
|---|---|
| `qnn` | `QNNExecutionProvider` |
| `cuda` | `CUDAExecutionProvider` |
| `dml` | `DmlExecutionProvider` |
| `cpu` | `CPUExecutionProvider` |

---

## Open Decisions (to be resolved before/at device validation)

1. **Which detection model to use from Qualcomm AI Hub.**
   - Recommended starting point: YOLOv8n ONNX (80-class COCO, 640×640 input)
     from AI Hub or converted via `yolov8 export format=onnx`.
   - The detector already handles YOLOv8 output format.
   - Custom label file can be supplied via `--labels` to remap COCO classes to
     equipment-specific labels.

2. **QNN runtime package name on the target device.**
   - The standard `onnxruntime` package will attempt `QNNExecutionProvider` if
     it finds the QNN SDK on the system.
   - On the Snapdragon HP device: install Qualcomm's ONNX Runtime package
     (check AI Hub docs for the exact package name) and re-run validation.
   - Until confirmed, `provider_used` will read `CPUExecutionProvider`.

3. **Quantization level for the detection model.**
   - FP32 is the safe starting point (confirmed output format).
   - INT8 quantization should be evaluated on the device for latency improvement,
     with accuracy vs. latency trade-off documented per SRS §10.

4. **Which local vector store / embedding model for document retrieval (MVP-4).**

5. **Which VLM will serve the deep-path reasoning role (MVP-5).**

6. **UI framework for MVP-6** (must support the SRS §12 dashboard layout).

7. **Local database for equipment state / inspection history (MVP-2 / FR-16).**
   SQLite is the current default assumption; confirm before MVP-2 starts.

---

## File Inventory (MVP-1, as built)

```
src/mirage_x/
  utils/
    config.py           — AppConfig loader (reads configs/app.yaml)
    logging_setup.py    — Centralised logging setup
  input/
    camera.py           — CameraCapture (FR-01), make_mock_frame()
  vision/
    models.py           — EquipmentState, Detection, DetectionResult (FR-02/03)
    detector.py         — ONNXDetector with provider negotiation (FR-02)
  benchmarking/
    metrics.py          — LatencyMeter, BenchmarkSummary (FR-18)
  main.py               — CLI entry point, end-to-end MVP-1 loop

tests/
  conftest.py           — pytest options + marker registration
  unit/
    test_vision_models.py
    test_benchmarking.py
    test_camera.py
    test_detector.py
  integration/
    test_mvp1_pipeline.py

configs/app.yaml        — execution providers, camera, risk levels
requirements.txt        — updated for MVP-1 (opencv-python, onnxruntime added)
pytest.ini              — excludes requires_model tests from default run
```

---

## Known Constraints to Respect During Implementation

- Never report NPU execution unless the runtime/device evidence actually confirms it (SRS §10).
- Never fabricate or borrow benchmark numbers from another device (SRS §15).
- All core inference must work with the network disabled (NFR-02, Acceptance Criteria).
- No modality failure may crash the app — always degrade gracefully (NFR-05, SRS §14).
- No hard-coded API keys anywhere in the codebase (SRS §13).
- ANOMALOUS state requires temporal context — the detector alone cannot set it (FR-06).

---

## Next Immediate Actions

1. **Device validation (MVP-1 completion)**:
   - Install QNN-capable ONNX Runtime on the HP Snapdragon device.
   - Download a YOLOv8n.onnx from Qualcomm AI Hub or export via `ultralytics`.
   - Run: `python -m mirage_x.main --model models/vision/model.onnx --device-note "HP Snapdragon X Elite, target device"`
   - Record `provider_used` and latency/FPS in this tracker.
   - If `provider_used == "QNNExecutionProvider"`, NPU execution is confirmed.

2. **Begin MVP-2 (Temporal Engine)**:
   - Input schema is stable: `DetectionResult` from `vision/models.py`.
   - Implement `temporal/engine.py`: baseline creation (FR-04), change detection
     (FR-05), persistence-based escalation to ANOMALOUS (FR-06).
   - Update Layer B before writing any MVP-2 code.

3. **Update this tracker** every session before starting new work.

---
*End of MIRAGE-X context document. Keep this file up to date as the single source of truth for any AI coding agent (including Antigravity IDE sessions) working on this repository.*
