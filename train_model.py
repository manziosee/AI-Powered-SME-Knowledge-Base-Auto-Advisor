#!/usr/bin/env python3
"""
Example script to train custom document classifier
"""

from app.services.ml_service import train_classifier

# Sample training data
training_data = [
    # Contracts
    {"text": "This agreement is made between Party A and Party B for the provision of services", "label": "contract"},
    {"text": "Service Level Agreement outlining terms and conditions", "label": "contract"},
    {"text": "Employment contract specifying duties and compensation", "label": "contract"},
    
    # Invoices
    {"text": "Invoice #12345 Amount Due: $5000 Payment Terms: Net 30", "label": "invoice"},
    {"text": "Bill for services rendered in January 2024", "label": "invoice"},
    {"text": "Tax invoice for consulting services", "label": "invoice"},
    
    # Policies
    {"text": "Company policy regarding employee conduct and workplace behavior", "label": "policy"},
    {"text": "Data privacy policy outlining information handling procedures", "label": "policy"},
    {"text": "Health and safety policy for workplace operations", "label": "policy"},
    
    # Reports
    {"text": "Quarterly financial report showing revenue and expenses", "label": "report"},
    {"text": "Annual performance review and business metrics", "label": "report"},
    {"text": "Market analysis report for Q4 2024", "label": "report"},
    
    # Tax Documents
    {"text": "Form 1040 Individual Income Tax Return", "label": "tax_document"},
    {"text": "W-2 Wage and Tax Statement for fiscal year", "label": "tax_document"},
    {"text": "Tax deduction documentation and receipts", "label": "tax_document"},
]

if __name__ == "__main__":
    print("Training custom document classifier...")
    
    # Train the model
    classifier = train_classifier(training_data)
    
    # Save the model
    classifier.save("models/custom_classifier.pkl")
    
    print("✓ Model trained and saved to models/custom_classifier.pkl")
    
    # Test predictions
    test_texts = [
        "This is a service agreement for consulting",
        "Invoice for payment of services",
        "Company policy on remote work",
    ]
    
    print("\nTest predictions:")
    for text in test_texts:
        prediction = classifier.predict(text)
        probabilities = classifier.predict_proba(text)
        print(f"  Text: {text[:50]}...")
        print(f"  Prediction: {prediction}")
        print(f"  Confidence: {max(probabilities.values()):.2%}\n")
