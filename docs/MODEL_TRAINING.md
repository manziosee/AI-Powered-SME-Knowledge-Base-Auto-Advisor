# Custom AI Model Training Guide

## Overview

Train custom ML models for document classification, risk assessment, and entity extraction.

## Quick Start

### 1. Document Classification

```python
from app.services.ml_service import train_classifier

training_data = [
    {"text": "Service agreement between...", "label": "contract"},
    {"text": "Invoice #12345...", "label": "invoice"},
    {"text": "Company policy...", "label": "policy"},
]

classifier = train_classifier(training_data)
classifier.save("models/custom_classifier.pkl")

# Use it
prediction = classifier.predict("Your document text")
```

### 2. Risk Assessment

```python
from app.services.ml_service import RiskScorer

scorer = RiskScorer()
risk_level = scorer.score("Contract breach with penalties")
# Returns: 'critical', 'high', 'medium', or 'low'
```

## Integration

Replace OpenAI classification in `app/tasks/document_tasks.py`:

```python
from app.services.ml_service import CustomDocumentClassifier

classifier = CustomDocumentClassifier()
classifier.load("models/custom_classifier.pkl")

# Use in processing
doc_type = classifier.predict(extracted_text)
```

## Training Best Practices

- **Minimum**: 50+ examples per category
- **Balanced**: Equal samples across categories
- **Quality**: Clean, representative text
- **Evaluation**: Use train/test split

## Model Files

Save trained models to `models/` directory:
```
models/
├── custom_classifier.pkl
├── risk_scorer.pkl
└── entity_extractor/
```
