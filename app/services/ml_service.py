import pickle
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import numpy as np


class CustomDocumentClassifier:
    def __init__(self):
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000)),
            ('clf', MultinomialNB())
        ])
        self.is_trained = False
    
    def train(self, texts: List[str], labels: List[str]):
        self.model.fit(texts, labels)
        self.is_trained = True
    
    def predict(self, text: str) -> str:
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        return self.model.predict([text])[0]
    
    def predict_proba(self, text: str) -> Dict[str, float]:
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        proba = self.model.predict_proba([text])[0]
        classes = self.model.classes_
        return {cls: prob for cls, prob in zip(classes, proba)}
    
    def save(self, path: str):
        with open(path, 'wb') as f:
            pickle.dump(self.model, f)
    
    def load(self, path: str):
        with open(path, 'rb') as f:
            self.model = pickle.load(f)
        self.is_trained = True


def train_classifier(training_data: List[Dict[str, Any]]) -> CustomDocumentClassifier:
    texts = [item['text'] for item in training_data]
    labels = [item['label'] for item in training_data]
    
    classifier = CustomDocumentClassifier()
    classifier.train(texts, labels)
    
    return classifier


class RiskScorer:
    def __init__(self):
        self.risk_keywords = {
            'critical': ['breach', 'violation', 'penalty', 'lawsuit', 'terminate'],
            'high': ['deadline', 'compliance', 'audit', 'regulation', 'mandatory'],
            'medium': ['review', 'update', 'renew', 'expiring', 'notice'],
            'low': ['optional', 'recommendation', 'suggestion', 'consider']
        }
    
    def score(self, text: str) -> str:
        text_lower = text.lower()
        scores = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        for level, keywords in self.risk_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    scores[level] += 1
        
        max_level = max(scores, key=scores.get)
        return max_level if scores[max_level] > 0 else 'low'
