# MIRAGE-X

Multimodal Industrial Reality & Anomaly Guidance Engine  
On-device multimodal AI inspection platform for Snapdragon-powered HP PCs.

See `docs/srs/` for the full Software Requirements Specification and
`docs/context/` for the living project context document used to brief
AI coding assistants (e.g. Antigravity IDE) on this repository.

## Pipeline

```
Camera / Microphone / Documents
  -> Vision / Audio / OCR
  -> Context Engine
  -> Temporal Engine
  -> Anomaly Engine
  -> VLM / RAG
  -> Explanation & Recommendation
  -> Dashboard / Report
```

## Status

Scaffolding stage. No pipeline stage is implemented yet. See
`docs/context/MIRAGE-X_Context_Document.md` → "Layer B – Progress & State
Tracker" for the current build status and next actions.

## Getting started

1. Create a virtual environment and install dependencies from `requirements.txt`.
2. Read `docs/srs/` and `docs/context/` before writing any pipeline code.
3. Start with MVP-1 (NPU Vision Pipeline) per the MVP plan in the SRS.
