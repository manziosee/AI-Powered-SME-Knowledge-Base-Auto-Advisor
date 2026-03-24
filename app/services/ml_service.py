"""
ML service — document classification and predictive risk scoring.

Classifier: TF-IDF + Naive Bayes pipeline (trainable, serialisable).
Risk scorer:
  - Legacy keyword-based fast path (RiskScorer)
  - Predictive ML scorer (PredictiveRiskScorer) using Logistic Regression with
    TF-IDF features, trained on labelled knowledge entries.
"""

import pickle
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
from sklearn.metrics import classification_report

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Document Classifier
# ---------------------------------------------------------------------------

class CustomDocumentClassifier:
    def __init__(self):
        self.model = Pipeline([
            ("tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1, 2), sublinear_tf=True)),
            ("clf", MultinomialNB(alpha=0.1)),
        ])
        self.is_trained = False
        self.classes_: List[str] = []
        self.trained_at: Optional[datetime] = None

    def train(self, texts: List[str], labels: List[str]) -> Dict[str, Any]:
        self.model.fit(texts, labels)
        self.is_trained = True
        self.classes_ = list(self.model.classes_)
        self.trained_at = datetime.now(timezone.utc)

        # Cross-validation score
        if len(texts) >= 5:
            scores = cross_val_score(self.model, texts, labels, cv=min(5, len(texts)), scoring="accuracy")
            cv_score = float(scores.mean())
        else:
            cv_score = None

        return {
            "samples": len(texts),
            "classes": self.classes_,
            "cv_accuracy": cv_score,
            "trained_at": self.trained_at.isoformat(),
        }

    def predict(self, text: str) -> str:
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        return self.model.predict([text])[0]

    def predict_proba(self, text: str) -> Dict[str, float]:
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        proba = self.model.predict_proba([text])[0]
        return {cls: round(float(p), 4) for cls, p in zip(self.model.classes_, proba)}

    def batch_predict(self, texts: List[str]) -> List[str]:
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        return list(self.model.predict(texts))

    def save(self, path: str):
        with open(path, "wb") as f:
            pickle.dump({"model": self.model, "classes": self.classes_, "trained_at": self.trained_at}, f)

    def load(self, path: str):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.classes_ = data.get("classes", [])
        self.trained_at = data.get("trained_at")
        self.is_trained = True


def train_classifier(training_data: List[Dict[str, Any]]) -> CustomDocumentClassifier:
    texts = [item["text"] for item in training_data]
    labels = [item["label"] for item in training_data]
    classifier = CustomDocumentClassifier()
    classifier.train(texts, labels)
    return classifier


# ---------------------------------------------------------------------------
# Keyword-based Risk Scorer (fast path, no training needed)
# ---------------------------------------------------------------------------

class RiskScorer:
    RISK_KEYWORDS: Dict[str, List[str]] = {
        "critical": [
            "breach", "violation", "penalty", "lawsuit", "terminate", "criminal",
            "injunction", "insolvency", "fraud", "sanctions",
        ],
        "high": [
            "deadline", "compliance", "audit", "regulation", "mandatory", "overdue",
            "non-compliant", "infringement", "liability", "expire", "revoke",
        ],
        "medium": [
            "review", "update", "renew", "expiring", "notice", "reminder",
            "approaching", "assessment", "warning", "caution",
        ],
        "low": [
            "optional", "recommendation", "suggestion", "consider", "may", "could",
            "best practice", "guideline",
        ],
    }

    LEVEL_WEIGHTS = {"critical": 4, "high": 3, "medium": 2, "low": 1}

    def score(self, text: str) -> str:
        text_lower = text.lower()
        scores: Dict[str, int] = {level: 0 for level in self.RISK_KEYWORDS}
        for level, keywords in self.RISK_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    scores[level] += self.LEVEL_WEIGHTS[level]

        max_level = max(scores, key=scores.get)
        return max_level if scores[max_level] > 0 else "low"

    def score_with_confidence(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        raw_scores: Dict[str, int] = {level: 0 for level in self.RISK_KEYWORDS}
        matched_keywords: Dict[str, List[str]] = {level: [] for level in self.RISK_KEYWORDS}

        for level, keywords in self.RISK_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    raw_scores[level] += self.LEVEL_WEIGHTS[level]
                    matched_keywords[level].append(kw)

        total = sum(raw_scores.values()) or 1
        confidences = {level: round(s / total, 3) for level, s in raw_scores.items()}
        max_level = max(raw_scores, key=raw_scores.get)
        predicted = max_level if raw_scores[max_level] > 0 else "low"

        return {
            "risk_level": predicted,
            "confidence": confidences.get(predicted, 0.0),
            "scores": raw_scores,
            "matched_keywords": matched_keywords,
        }


# ---------------------------------------------------------------------------
# Predictive ML Risk Scorer (Logistic Regression — needs labelled data to train)
# ---------------------------------------------------------------------------

RISK_LEVELS = ["low", "medium", "high", "critical"]


class PredictiveRiskScorer:
    """
    Trains a Logistic Regression classifier on labelled (text, risk_level) pairs.
    Falls back to keyword scorer when not trained.
    """

    def __init__(self):
        self.model = Pipeline([
            (
                "tfidf",
                TfidfVectorizer(
                    max_features=8000,
                    ngram_range=(1, 3),
                    sublinear_tf=True,
                    min_df=1,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    C=1.0,
                    max_iter=1000,
                    multi_class="multinomial",
                    solver="lbfgs",
                    class_weight="balanced",
                ),
            ),
        ])
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.trained_at: Optional[datetime] = None
        self.training_stats: Dict[str, Any] = {}
        self._fallback = RiskScorer()

    def train(self, texts: List[str], labels: List[str]) -> Dict[str, Any]:
        """
        labels should be one of: low, medium, high, critical
        Minimum 4 samples (one per class) recommended.
        """
        if len(texts) < 4:
            raise ValueError("Need at least 4 labelled samples to train the risk scorer.")

        y = self.label_encoder.fit_transform(labels)
        self.model.fit(texts, y)
        self.is_trained = True
        self.trained_at = datetime.now(timezone.utc)

        # Evaluate
        y_pred = self.model.predict(texts)
        report = classification_report(y, y_pred, target_names=self.label_encoder.classes_, output_dict=True)

        self.training_stats = {
            "samples": len(texts),
            "classes": list(self.label_encoder.classes_),
            "accuracy": round(report["accuracy"], 4),
            "trained_at": self.trained_at.isoformat(),
        }
        return self.training_stats

    def predict(self, text: str) -> str:
        if not self.is_trained:
            return self._fallback.score(text)
        idx = self.model.predict([text])[0]
        return self.label_encoder.inverse_transform([idx])[0]

    def predict_proba(self, text: str) -> Dict[str, float]:
        if not self.is_trained:
            result = self._fallback.score_with_confidence(text)
            return {k: result["scores"].get(k, 0) for k in RISK_LEVELS}
        proba = self.model.predict_proba([text])[0]
        classes = self.label_encoder.classes_
        return {cls: round(float(p), 4) for cls, p in zip(classes, proba)}

    def predict_batch(self, texts: List[str]) -> List[str]:
        if not self.is_trained:
            return [self._fallback.score(t) for t in texts]
        idxs = self.model.predict(texts)
        return list(self.label_encoder.inverse_transform(idxs))

    def score_with_explanation(self, text: str) -> Dict[str, Any]:
        risk_level = self.predict(text)
        probabilities = self.predict_proba(text)
        keyword_info = self._fallback.score_with_confidence(text)

        return {
            "risk_level": risk_level,
            "probabilities": probabilities,
            "confidence": max(probabilities.values()),
            "method": "ml" if self.is_trained else "keyword",
            "matched_keywords": keyword_info.get("matched_keywords", {}),
            "model_trained": self.is_trained,
        }

    def save(self, path: str):
        with open(path, "wb") as f:
            pickle.dump({
                "model": self.model,
                "label_encoder": self.label_encoder,
                "trained_at": self.trained_at,
                "training_stats": self.training_stats,
            }, f)

    def load(self, path: str):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.label_encoder = data["label_encoder"]
        self.trained_at = data.get("trained_at")
        self.training_stats = data.get("training_stats", {})
        self.is_trained = True


# ---------------------------------------------------------------------------
# Deadline proximity risk booster
# ---------------------------------------------------------------------------

def boost_risk_for_deadline(base_risk: str, deadline: Optional[datetime]) -> str:
    """Escalate risk level when a deadline is within certain thresholds."""
    if deadline is None:
        return base_risk

    now = datetime.now(timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    days_remaining = (deadline - now).days
    level_order = ["low", "medium", "high", "critical"]

    if days_remaining < 0:
        return "critical"
    elif days_remaining <= 3:
        bumps = 2
    elif days_remaining <= 7:
        bumps = 1
    else:
        return base_risk

    idx = level_order.index(base_risk) if base_risk in level_order else 0
    new_idx = min(idx + bumps, len(level_order) - 1)
    return level_order[new_idx]
