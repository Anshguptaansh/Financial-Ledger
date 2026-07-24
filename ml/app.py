"""
=============================================================================
  Credit Risk Prediction — FastAPI Microservice
=============================================================================
  Loads the trained .joblib model and serves predictions via REST API.

  Endpoints:
    POST /predict      — score an applicant, returns risk_score + risk_level
    GET  /health       — health check
    GET  /model-info   — model metadata (name, F1, features)

  Run:
    cd ml
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
=============================================================================
"""

import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

# ── Load model bundle at startup ─────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "credit_risk_model.joblib")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model file not found at {MODEL_PATH}. "
        "Run credit_risk_model.py first to train and export the model."
    )

bundle = joblib.load(MODEL_PATH)
model          = bundle["model"]
scaler         = bundle["scaler"]
label_encoders = bundle["label_encoders"]
feature_names  = bundle["feature_names"]
model_name     = bundle["best_model_name"]
model_f1       = bundle["best_f1_score"]

print(f"✅ Loaded model: {model_name} (F1 = {model_f1:.4f})")
print(f"   Features: {feature_names}")

# ── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Credit Risk Prediction API",
    description="Predicts loan default probability using a trained ML model.",
    version="1.0.0",
)

# Allow CORS for development (Node.js backend on port 5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response schemas ───────────────────────────────────────────────

class ApplicantInput(BaseModel):
    """Input data for credit risk prediction."""
    age: int                        = Field(..., ge=18, le=100, description="Applicant age in years")
    sex: str                        = Field(..., description="'male' or 'female'")
    job: int                        = Field(..., ge=0, le=3, description="Job category (0-3)")
    housing: str                    = Field(..., description="'own', 'rent', or 'free'")
    saving_accounts: Optional[str]  = Field("little", description="'little', 'moderate', 'quite rich', 'rich'")
    checking_account: Optional[str] = Field("little", description="'little', 'moderate', 'rich'")
    credit_amount: int              = Field(..., gt=0, description="Loan amount in currency units")
    duration: int                   = Field(..., gt=0, description="Loan duration in months")
    purpose: str                    = Field(..., description="Loan purpose, e.g. 'car', 'education', 'business'")

    model_config = {"json_schema_extra": {
        "examples": [{
            "age": 35,
            "sex": "male",
            "job": 2,
            "housing": "own",
            "saving_accounts": "moderate",
            "checking_account": "little",
            "credit_amount": 5000,
            "duration": 24,
            "purpose": "car",
        }]
    }}


class PredictionOutput(BaseModel):
    """Prediction result."""
    risk_score: float     # 0.0 – 1.0  (probability of default)
    risk_level: str       # "Low", "Medium", "High"
    prediction: str       # "good" or "bad"
    confidence: float     # confidence of the prediction (max probability)
    model_used: str       # which model produced this result


def classify_risk_level(score: float) -> str:
    """Convert numeric risk score to a human-readable level."""
    if score < 0.3:
        return "Low"
    elif score < 0.6:
        return "Medium"
    else:
        return "High"


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictionOutput)
async def predict(applicant: ApplicantInput):
    """Score a loan applicant and return default-risk probability."""
    try:
        # Build a DataFrame matching the training feature names
        raw = pd.DataFrame([{
            "Age":              applicant.age,
            "Sex":              applicant.sex,
            "Job":              applicant.job,
            "Housing":          applicant.housing,
            "Saving accounts":  applicant.saving_accounts or "little",
            "Checking account": applicant.checking_account or "little",
            "Credit amount":    applicant.credit_amount,
            "Duration":         applicant.duration,
            "Purpose":          applicant.purpose,
        }])

        # Encode categoricals using the saved label encoders
        for col, le in label_encoders.items():
            if col in raw.columns:
                val = raw[col].astype(str).values[0]
                # Handle unseen labels gracefully
                if val in le.classes_:
                    raw[col] = le.transform(raw[col].astype(str))
                else:
                    # Fall back to the most common class index
                    raw[col] = 0

        # Scale and predict
        X = scaler.transform(raw[feature_names])
        proba = model.predict_proba(X)[0]

        risk_score  = float(round(proba[1], 4))     # P(bad)
        prediction  = "bad" if risk_score >= 0.5 else "good"
        confidence  = float(round(max(proba), 4))

        return PredictionOutput(
            risk_score=risk_score,
            risk_level=classify_risk_level(risk_score),
            prediction=prediction,
            confidence=confidence,
            model_used=model_name,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok", "model_loaded": True, "model": model_name}


@app.get("/model-info")
async def model_info():
    """Return metadata about the loaded model."""
    return {
        "model_name": model_name,
        "f1_score":   round(model_f1, 4),
        "features":   feature_names,
        "risk_levels": {
            "Low":    "risk_score < 0.3",
            "Medium": "0.3 ≤ risk_score < 0.6",
            "High":   "risk_score ≥ 0.6",
        },
    }
