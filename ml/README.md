---
title: Credit Risk Prediction API
emoji: 💰
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# 💰 Credit Risk Prediction API (FastAPI)

FastAPI microservice serving a trained **Random Forest Classifier** to evaluate credit default risk for loan applicants.

## Endpoints:
- `POST /predict` - Accepts applicant financial parameters and returns default probability score (`risk_score`), classification (`Low`, `Medium`, `High`), and confidence.
- `GET /health` - Service health check endpoint.
- `GET /model-info` - Returns model metadata and performance metrics.
