"""
=============================================================================
  Credit Risk Prediction Model
  German Credit Risk Dataset — Full ML Pipeline
=============================================================================
  This script:
    1. Loads & preprocesses the German Credit Risk dataset
    2. Performs feature engineering & correlation analysis
    3. Trains Random Forest + Logistic Regression, picks best by F1-Score
    4. Outputs predict_proba (decimal 0–1 risk scores)
    5. Exports the winning model as .joblib for Flask / FastAPI
    6. Prints human-readable feature importance ("weights")
=============================================================================
"""

import os
import warnings
import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib
matplotlib.use("Agg")                       # Non-interactive backend (no GUI needed)
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    f1_score,
    accuracy_score,
    precision_score,
    recall_score,
    confusion_matrix,
)
import joblib

warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────────────────────────────────────
# 1.  DATA ACQUISITION
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("STEP 1 — Loading the German Credit Risk Dataset")
print("=" * 70)

# The dataset is bundled as a CSV inside the same directory.
# If you don't have it, download from:
#   https://www.kaggle.com/datasets/uciml/german-credit
# and place the file `german_credit_data.csv` next to this script.

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH   = os.path.join(SCRIPT_DIR, "german_credit_data.csv")

# --- Helper: fetch the COMPLETE dataset (with Risk column) from a mirror ---
COMPLETE_CSV_URL = (
    "https://raw.githubusercontent.com/dsrscientist/dataset1/master/"
    "german_credit_data.csv"
)

def fetch_complete_csv(dest_path):
    """Try multiple sources to get the dataset WITH the Risk column."""
    import urllib.request
    urls = [
        # Primary: well-known GitHub mirror that includes Risk
        COMPLETE_CSV_URL,
        # Fallback: another mirror
        "https://raw.githubusercontent.com/jbrownlee/Datasets/master/"
        "german.csv",
    ]
    for url in urls:
        try:
            print(f"  ↓ Trying {url[:60]}...")
            urllib.request.urlretrieve(url, dest_path)
            test_df = pd.read_csv(dest_path)
            if "Risk" in test_df.columns or "risk" in [c.lower() for c in test_df.columns]:
                print(f"  ✓ Downloaded complete dataset ({test_df.shape[0]} rows)")
                return True
            print(f"    ✗ Downloaded but no Risk column, trying next source...")
        except Exception as e:
            print(f"    ✗ Failed: {e}")
    return False

def generate_risk_from_features(df):
    """
    If the CSV has features but no Risk column, derive a realistic Risk label.
    Uses a rule-based approach modeled on the original UCI credit scoring:
      - Higher duration, higher amount, fewer savings → higher risk.
    """
    print("  ℹ  Deriving Risk labels from feature heuristics (UCI-inspired)...")
    risk_score = np.zeros(len(df))

    # Duration: longer loans are riskier
    if "Duration" in df.columns:
        risk_score += (df["Duration"] > df["Duration"].median()).astype(int) * 1

    # Credit amount: larger amounts are riskier
    if "Credit amount" in df.columns:
        risk_score += (df["Credit amount"] > df["Credit amount"].median()).astype(int) * 1

    # Saving accounts: less savings = more risk
    if "Saving accounts" in df.columns:
        savings_risk = df["Saving accounts"].map({
            "little": 2, "moderate": 1, "quite rich": 0, "rich": 0
        }).fillna(2)  # NaN = no savings info = risky
        risk_score += savings_risk

    # Checking account: less checking = more risk
    if "Checking account" in df.columns:
        checking_risk = df["Checking account"].map({
            "little": 2, "moderate": 1, "rich": 0
        }).fillna(2)  # NaN = no checking info = risky
        risk_score += checking_risk

    # Age: younger = slightly more risky
    if "Age" in df.columns:
        risk_score += (df["Age"] < 30).astype(int) * 1

    # Housing: renters are slightly riskier
    if "Housing" in df.columns:
        risk_score += (df["Housing"] == "rent").astype(int) * 1

    # Threshold: top ~30% are "bad" (matches original UCI class distribution ≈ 70/30)
    threshold = np.percentile(risk_score, 70)
    df["Risk"] = np.where(risk_score >= threshold, "bad", "good")
    counts = df["Risk"].value_counts()
    print(f"  ✓ Risk labels generated: good={counts.get('good',0)}, bad={counts.get('bad',0)}")
    return df

# ---------- Load or create the dataset ----------
if os.path.exists(CSV_PATH):
    df = pd.read_csv(CSV_PATH)
    print(f"\n  ✓ Loaded CSV: {CSV_PATH}")
    print(f"    Shape: {df.shape}, Columns: {list(df.columns)}\n")

    # Check if the Risk column exists
    if "Risk" not in df.columns:
        print("  ⚠  CSV is missing the 'Risk' target column.")
        print("     Attempting to download a complete version...\n")

        # Try to download the complete CSV with Risk
        complete_path = os.path.join(SCRIPT_DIR, "german_credit_complete.csv")
        if fetch_complete_csv(complete_path):
            df = pd.read_csv(complete_path)
            CSV_PATH = complete_path
        else:
            # Could not download → derive Risk from features
            print("  ⚠  Could not download complete dataset.")
            df = generate_risk_from_features(df)
else:
    # No CSV at all — try downloading, else generate synthetic
    print("  ⚠  CSV not found, attempting download...")
    if not fetch_complete_csv(CSV_PATH):
        print("  ⚠  Generating a synthetic dataset so the pipeline still runs.")
        print("     For real results, place 'german_credit_data.csv' in ml/.\n")
        np.random.seed(42)
        n = 1000
        df = pd.DataFrame({
            "Unnamed: 0": range(n),
            "Age":            np.random.randint(19, 75, n),
            "Sex":            np.random.choice(["male", "female"], n),
            "Job":            np.random.randint(0, 4, n),
            "Housing":        np.random.choice(["own", "rent", "free"], n),
            "Saving accounts": np.random.choice(["little", "moderate", "quite rich", "rich", np.nan], n),
            "Checking account": np.random.choice(["little", "moderate", "rich", np.nan], n),
            "Credit amount":  np.random.randint(250, 20000, n),
            "Duration":       np.random.randint(4, 72, n),
            "Purpose":        np.random.choice(
                ["car", "furniture/equipment", "radio/TV", "education", "business", "repairs"], n
            ),
            "Risk":           np.random.choice(["good", "bad"], n, p=[0.7, 0.3]),
        })
        df.to_csv(CSV_PATH, index=False)
        print(f"  ✓ Synthetic CSV saved to {CSV_PATH}\n")
    else:
        df = pd.read_csv(CSV_PATH)

print(f"\n  Final dataset — Shape: {df.shape}")
print(f"  Columns: {list(df.columns)}\n")
print(df.head())
print()

# ──────────────────────────────────────────────────────────────────────────────
# 2.  DATA PREPROCESSING
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("STEP 2 — Preprocessing (missing values + encoding)")
print("=" * 70)

# Drop unnamed index column if present
if "Unnamed: 0" in df.columns:
    df.drop("Unnamed: 0", axis=1, inplace=True)

# ---- 2a. Handle missing values ----
# Fill categorical NaNs with the mode (most frequent value)
for col in df.select_dtypes(include=["object", "string"]).columns:
    if df[col].isnull().sum() > 0:
        mode_val = df[col].mode()[0]
        df[col].fillna(mode_val, inplace=True)
        print(f"  • Filled {col} NaNs with mode = '{mode_val}'")

# Fill numeric NaNs with the median
for col in df.select_dtypes(include="number").columns:
    if df[col].isnull().sum() > 0:
        median_val = df[col].median()
        df[col].fillna(median_val, inplace=True)
        print(f"  • Filled {col} NaNs with median = {median_val}")

print(f"\n  Missing values after cleaning:\n{df.isnull().sum()}\n")

# ---- 2b. Encode categorical features ----
# We store the encoders so they can be saved alongside the model
label_encoders = {}
categorical_cols = df.select_dtypes(include=["object", "string"]).columns.tolist()

# Make sure the target ('Risk') is encoded: good → 0, bad → 1
if "Risk" in categorical_cols:
    categorical_cols.remove("Risk")

for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    label_encoders[col] = le
    print(f"  • Encoded '{col}' → classes: {list(le.classes_)}")

# Encode risk: good = 0, bad = 1 (positive class = "bad" = default)
if pd.api.types.is_string_dtype(df["Risk"]):
    df["Risk"] = df["Risk"].map({"good": 0, "bad": 1}).astype(int)
    print("  • Mapped Risk  → good=0, bad=1")

print(f"\n  Final dtypes:\n{df.dtypes}\n")

# ──────────────────────────────────────────────────────────────────────────────
# 3.  FEATURE ENGINEERING — Correlation Analysis
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("STEP 3 — Correlation with Target (Risk)")
print("=" * 70)

correlation = df.corr(numeric_only=True)["Risk"].drop("Risk").sort_values(ascending=False)
print("\n  Feature correlations with Risk (descending):\n")
for feat, corr_val in correlation.items():
    bar = "█" * int(abs(corr_val) * 40)
    sign = "+" if corr_val >= 0 else "−"
    print(f"    {feat:<22s}  {sign}{abs(corr_val):.4f}  {bar}")

# Save correlation heatmap
plt.figure(figsize=(10, 8))
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap="RdYlGn_r", fmt=".2f", linewidths=0.5)
plt.title("Feature Correlation Heatmap — German Credit Risk")
plt.tight_layout()
heatmap_path = os.path.join(SCRIPT_DIR, "correlation_heatmap.png")
plt.savefig(heatmap_path, dpi=150)
plt.close()
print(f"\n  ✓ Heatmap saved → {heatmap_path}\n")

# ──────────────────────────────────────────────────────────────────────────────
# 4.  MODEL TRAINING & COMPARISON
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("STEP 4 — Training Random Forest & Logistic Regression")
print("=" * 70)

X = df.drop("Risk", axis=1)
y = df["Risk"]

# 80/20 stratified split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
print(f"\n  Train set: {X_train.shape[0]} samples")
print(f"  Test  set: {X_test.shape[0]} samples\n")

# Scale features (important for Logistic Regression)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

# ---- 4a. Random Forest ----
print("  ── Random Forest Classifier ──")
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    class_weight="balanced",         # Handles class imbalance
    random_state=42,
    n_jobs=-1,
)
rf_model.fit(X_train_scaled, y_train)
rf_preds = rf_model.predict(X_test_scaled)
rf_f1    = f1_score(y_test, rf_preds)

print(classification_report(y_test, rf_preds, target_names=["Good (0)", "Bad (1)"]))
print(f"  F1-Score (Bad class): {rf_f1:.4f}\n")

# ---- 4b. Logistic Regression ----
print("  ── Logistic Regression ──")
lr_model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced",
    random_state=42,
    solver="lbfgs",
)
lr_model.fit(X_train_scaled, y_train)
lr_preds = lr_model.predict(X_test_scaled)
lr_f1    = f1_score(y_test, lr_preds)

print(classification_report(y_test, lr_preds, target_names=["Good (0)", "Bad (1)"]))
print(f"  F1-Score (Bad class): {lr_f1:.4f}\n")

# ---- 4c. Select the winner ----
print("=" * 70)
print("STEP 5 — Model Comparison")
print("=" * 70)

results = pd.DataFrame({
    "Model":     ["Random Forest", "Logistic Regression"],
    "Accuracy":  [accuracy_score(y_test, rf_preds),  accuracy_score(y_test, lr_preds)],
    "Precision": [precision_score(y_test, rf_preds),  precision_score(y_test, lr_preds)],
    "Recall":    [recall_score(y_test, rf_preds),     recall_score(y_test, lr_preds)],
    "F1-Score":  [rf_f1,                              lr_f1],
})
print(f"\n{results.to_string(index=False)}\n")

if rf_f1 >= lr_f1:
    best_model = rf_model
    best_name  = "Random Forest"
    best_f1    = rf_f1
else:
    best_model = lr_model
    best_name  = "Logistic Regression"
    best_f1    = lr_f1

print(f"  🏆 Winner: {best_name}  (F1 = {best_f1:.4f})\n")

# ──────────────────────────────────────────────────────────────────────────────
# 5.  PROBABILITY OUTPUT — predict_proba demo
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("STEP 6 — predict_proba (Risk Probability Scores)")
print("=" * 70)

sample = X_test_scaled[:5]
probabilities = best_model.predict_proba(sample)

print("\n  Sample predictions (first 5 test rows):\n")
print(f"  {'Row':<6} {'P(Good)':<12} {'P(Bad/Default)':<18} {'Predicted':<10}")
print(f"  {'---':<6} {'-------':<12} {'--------------':<18} {'---------':<10}")

for i, prob in enumerate(probabilities):
    pred = "Bad ⚠" if prob[1] >= 0.5 else "Good ✓"
    print(f"  {i:<6} {prob[0]:<12.4f} {prob[1]:<18.4f} {pred:<10}")

print("\n  ℹ  In production, use `model.predict_proba(X)[:, 1]` to get")
print("     the default-risk probability as a single float (0 → 1).\n")

# ──────────────────────────────────────────────────────────────────────────────
# 6.  EXPORT MODEL — .joblib
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("STEP 7 — Exporting Model (.joblib)")
print("=" * 70)

export_payload = {
    "model":           best_model,
    "scaler":          scaler,
    "label_encoders":  label_encoders,
    "feature_names":   list(X.columns),
    "best_model_name": best_name,
    "best_f1_score":   best_f1,
}

model_path = os.path.join(SCRIPT_DIR, "credit_risk_model.joblib")
joblib.dump(export_payload, model_path)
print(f"\n  ✓ Model saved → {model_path}")
print(f"    Size: {os.path.getsize(model_path) / 1024:.1f} KB\n")

print("  ── How to load in Flask / FastAPI ──\n")
print("""
  import joblib, numpy as np

  # Load the saved bundle
  bundle = joblib.load("credit_risk_model.joblib")
  model           = bundle["model"]
  scaler          = bundle["scaler"]
  label_encoders  = bundle["label_encoders"]
  feature_names   = bundle["feature_names"]

  # Example: score a new applicant
  # Build a DataFrame with the same columns used during training.
  import pandas as pd
  new_data = pd.DataFrame([{
      "Age": 35,
      "Sex": "male",
      "Job": 2,
      "Housing": "own",
      "Saving accounts": "moderate",
      "Checking account": "little",
      "Credit amount": 5000,
      "Duration": 24,
      "Purpose": "car",
  }])

  # Encode categoricals using the saved encoders
  for col, le in label_encoders.items():
      if col in new_data.columns:
          new_data[col] = le.transform(new_data[col].astype(str))

  # Scale & predict
  X_new  = scaler.transform(new_data[feature_names])
  prob   = model.predict_proba(X_new)[0, 1]   # probability of default
  print(f"Default risk: {prob:.2%}")
""")

# ──────────────────────────────────────────────────────────────────────────────
# 7.  FEATURE IMPORTANCE / WEIGHTS SUMMARY
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("STEP 8 — Feature Importance (Weights)")
print("=" * 70)

if best_name == "Random Forest":
    importances = best_model.feature_importances_
    feat_imp = pd.Series(importances, index=X.columns).sort_values(ascending=False)
    print("\n  Random Forest feature importances (Gini-based):\n")
else:
    # For Logistic Regression, use absolute coefficient magnitude
    importances = np.abs(best_model.coef_[0])
    feat_imp = pd.Series(importances, index=X.columns).sort_values(ascending=False)
    print("\n  Logistic Regression absolute coefficients:\n")

for feat, imp in feat_imp.items():
    bar = "█" * int(imp / feat_imp.max() * 30)
    print(f"    {feat:<22s}  {imp:.4f}  {bar}")

# Save importance bar chart
plt.figure(figsize=(10, 6))
feat_imp.plot(kind="barh", color=sns.color_palette("viridis", len(feat_imp)))
plt.xlabel("Importance" if best_name == "Random Forest" else "|Coefficient|")
plt.title(f"Feature Importance — {best_name}")
plt.gca().invert_yaxis()
plt.tight_layout()
importance_path = os.path.join(SCRIPT_DIR, "feature_importance.png")
plt.savefig(importance_path, dpi=150)
plt.close()
print(f"\n  ✓ Chart saved → {importance_path}")

# ──────────────────────────────────────────────────────────────────────────────
# DONE
# ──────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("✅  Pipeline complete!")
print(f"    Best model : {best_name} (F1 = {best_f1:.4f})")
print(f"    Saved to   : {model_path}")
print("=" * 70 + "\n")
