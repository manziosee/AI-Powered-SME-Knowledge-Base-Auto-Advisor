"""
Training service — manages the full lifecycle of custom ML models.

Supports two model types:
  1. DocumentClassifier  — TF-IDF + Naive Bayes (classifies doc type)
  2. RiskScorer          — TF-IDF + Logistic Regression (predicts risk level)

Features
────────
- Automatic versioning (semver bump on each training run)
- Persists trained model to /app/models/
- Tracks accuracy, CV score, sample count in ModelVersion table
- activate() makes a version the live model used by the system
- Company-scoped models (per-tenant fine-tuning) or global models
- Built-in rich default dataset that any user can extend
"""

import logging
import os
import pickle
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_version import ModelType, ModelVersion, TrainingStatus
from app.services.ml_service import CustomDocumentClassifier, PredictiveRiskScorer

logger = logging.getLogger(__name__)

MODELS_DIR = os.environ.get("MODELS_DIR", "/app/models")


# ---------------------------------------------------------------------------
# Default built-in dataset  (used when users start from scratch)
# ---------------------------------------------------------------------------

DEFAULT_DOCUMENT_SAMPLES: List[Dict[str, str]] = [
    # ── CONTRACT ────────────────────────────────────────────────────────────
    {"text": "This service agreement is entered into between the parties for provision of consulting services", "label": "contract"},
    {"text": "Employment contract specifying salary compensation benefits and termination conditions", "label": "contract"},
    {"text": "Non-disclosure agreement prohibiting disclosure of confidential business information", "label": "contract"},
    {"text": "Lease agreement for commercial office space at monthly rental rate", "label": "contract"},
    {"text": "Software license agreement granting rights to use the application under these terms", "label": "contract"},
    {"text": "Partnership agreement outlining profit sharing responsibilities and governance structure", "label": "contract"},
    {"text": "Service level agreement guaranteeing 99.9% uptime with penalties for breach", "label": "contract"},
    {"text": "Supply agreement for delivery of raw materials at agreed prices over 12 months", "label": "contract"},
    {"text": "Freelance contract for website development project deliverables and payment milestones", "label": "contract"},
    {"text": "Distribution agreement authorizing resale of products in specified territory", "label": "contract"},
    {"text": "Contractor agreement for construction works including scope timeline and payment", "label": "contract"},
    {"text": "Memorandum of understanding between organizations for collaborative research", "label": "contract"},

    # ── INVOICE ─────────────────────────────────────────────────────────────
    {"text": "Invoice number 12345 total amount due 5000 USD payment due within 30 days", "label": "invoice"},
    {"text": "Tax invoice for consulting services rendered in January subtotal VAT total payable", "label": "invoice"},
    {"text": "Bill for IT support services hours worked rate per hour total charges", "label": "invoice"},
    {"text": "Purchase order confirmation with itemized list of goods quantities and unit prices", "label": "invoice"},
    {"text": "Proforma invoice for export shipment including customs duties and freight charges", "label": "invoice"},
    {"text": "Recurring monthly invoice for SaaS subscription service plan enterprise tier", "label": "invoice"},
    {"text": "Invoice for legal services retainer fee billable hours consultation charges", "label": "invoice"},
    {"text": "Credit note issued to customer for returned goods adjustment to previous invoice", "label": "invoice"},
    {"text": "Statement of account showing outstanding invoices payments received and balance due", "label": "invoice"},
    {"text": "Utility bill electricity consumption units kilowatt hours charges taxes and fees", "label": "invoice"},

    # ── POLICY ──────────────────────────────────────────────────────────────
    {"text": "Employee code of conduct policy covering workplace behavior ethics and disciplinary procedures", "label": "policy"},
    {"text": "Data privacy policy describing how personal information is collected processed and protected", "label": "policy"},
    {"text": "Health and safety policy outlining workplace hazard identification risk assessment procedures", "label": "policy"},
    {"text": "Remote work policy defining eligibility equipment allowance and productivity expectations", "label": "policy"},
    {"text": "Leave policy annual sick maternity paternity leave entitlements and application process", "label": "policy"},
    {"text": "Anti-bribery and corruption policy prohibiting gifts conflicts of interest kickbacks", "label": "policy"},
    {"text": "Information security policy governing data classification access control incident response", "label": "policy"},
    {"text": "Procurement policy vendor selection criteria approval thresholds and tendering procedures", "label": "policy"},
    {"text": "Social media policy guidelines for employee use of social platforms on behalf of company", "label": "policy"},
    {"text": "Environmental sustainability policy targets for reducing carbon emissions waste recycling", "label": "policy"},

    # ── REPORT ──────────────────────────────────────────────────────────────
    {"text": "Quarterly financial report showing revenue EBITDA net profit margins year over year growth", "label": "report"},
    {"text": "Annual performance review summarizing KPIs objectives achieved and areas for improvement", "label": "report"},
    {"text": "Market analysis report competitive landscape TAM SAM SOM growth projections", "label": "report"},
    {"text": "Audit report findings observations recommendations and management responses", "label": "report"},
    {"text": "Board of directors report on company strategy governance and stakeholder value", "label": "report"},
    {"text": "Sales performance report pipeline conversion rates revenue by region and product", "label": "report"},
    {"text": "Operational efficiency report process improvement initiatives cost reduction measures", "label": "report"},
    {"text": "Risk assessment report identifying top risks likelihood impact and mitigation strategies", "label": "report"},
    {"text": "Customer satisfaction survey results NPS scores feedback themes and action plans", "label": "report"},
    {"text": "Due diligence report covering financial legal operational and commercial findings", "label": "report"},

    # ── TAX DOCUMENT ────────────────────────────────────────────────────────
    {"text": "Corporate income tax return form annual taxable income deductions tax liability payable", "label": "tax_document"},
    {"text": "VAT return form taxable turnover input tax output tax net VAT payable to revenue authority", "label": "tax_document"},
    {"text": "PAYE payroll tax deduction schedule employees withholding tax remittance", "label": "tax_document"},
    {"text": "Tax clearance certificate confirming company has no outstanding tax liabilities", "label": "tax_document"},
    {"text": "Withholding tax certificate for dividends interest payments to non-residents", "label": "tax_document"},
    {"text": "Transfer pricing documentation related party transactions arm length principle", "label": "tax_document"},
    {"text": "Capital gains tax computation on disposal of assets depreciation recapture", "label": "tax_document"},
    {"text": "Customs import duty declaration HS code tariff classification valuation method", "label": "tax_document"},
    {"text": "Payroll deduction summary PAYE NSSF NHIF contributions per employee", "label": "tax_document"},
    {"text": "Tax assessment notice from revenue authority additional tax interest penalties", "label": "tax_document"},

    # ── HR DOCUMENT ─────────────────────────────────────────────────────────
    {"text": "Job offer letter position title start date salary benefits probation period", "label": "hr_document"},
    {"text": "Performance appraisal form rating competencies goals achievements and development plan", "label": "hr_document"},
    {"text": "Disciplinary notice warning letter for repeated absences misconduct performance issues", "label": "hr_document"},
    {"text": "Employee onboarding checklist orientation schedule IT access forms induction training", "label": "hr_document"},
    {"text": "Resignation letter notice period last working day handover responsibilities", "label": "hr_document"},
    {"text": "Job description key responsibilities qualifications skills required salary range", "label": "hr_document"},
    {"text": "Training and development plan skills gap analysis learning objectives completion dates", "label": "hr_document"},
    {"text": "Reference letter confirming employment tenure performance and character of employee", "label": "hr_document"},
    {"text": "Organizational chart showing reporting lines department structure headcount", "label": "hr_document"},
    {"text": "Payslip gross salary deductions net pay overtime allowances bonuses", "label": "hr_document"},

    # ── COMPLIANCE ──────────────────────────────────────────────────────────
    {"text": "Regulatory compliance report confirming adherence to financial services regulations", "label": "compliance"},
    {"text": "GDPR data protection impact assessment processing activities risks mitigations", "label": "compliance"},
    {"text": "AML anti-money laundering KYC know your customer due diligence records", "label": "compliance"},
    {"text": "Environmental compliance certificate confirming adherence to waste disposal regulations", "label": "compliance"},
    {"text": "Business license registration certificate authorizing company operations in jurisdiction", "label": "compliance"},
    {"text": "ISO 27001 information security management system audit compliance certificate", "label": "compliance"},
    {"text": "Food safety hygiene compliance inspection certificate HACCP standards met", "label": "compliance"},
    {"text": "Fire safety compliance certificate building inspection emergency evacuation procedures", "label": "compliance"},
    {"text": "Company incorporation certificate memorandum articles of association registered details", "label": "compliance"},
    {"text": "Occupational health compliance record workplace safety inspections corrective actions", "label": "compliance"},
]

DEFAULT_RISK_SAMPLES: List[Dict[str, str]] = [
    # ── CRITICAL ─────────────────────────────────────────────────────────────
    {"text": "Breach of contract lawsuit filed with damages claim of USD 2 million injunction sought", "label": "critical"},
    {"text": "Regulatory violation penalty notice issued immediate compliance required or license revoked", "label": "critical"},
    {"text": "Data breach incident personal data of 10000 customers compromised immediate notification required", "label": "critical"},
    {"text": "Tax authority criminal investigation for suspected fraud substantial penalties apply", "label": "critical"},
    {"text": "Contract termination for cause effective immediately all obligations suspended", "label": "critical"},
    {"text": "Insolvency proceedings initiated creditors meeting scheduled assets to be liquidated", "label": "critical"},
    {"text": "Court order restraining company operations pending resolution of legal dispute", "label": "critical"},
    {"text": "Sanctions violation flagged exports prohibited financial penalties under investigation", "label": "critical"},
    {"text": "Overdue payment exceeding 90 days legal action initiated debt recovery proceedings", "label": "critical"},
    {"text": "Employee dismissal wrongful termination claim filed with labour tribunal urgent response needed", "label": "critical"},

    # ── HIGH ─────────────────────────────────────────────────────────────────
    {"text": "Compliance deadline approaching mandatory filing due within 7 days penalties for late submission", "label": "high"},
    {"text": "Contract renewal deadline expires in 30 days failure to renew results in automatic termination", "label": "high"},
    {"text": "Annual tax return submission due overdue interest accruing at 2 percent per month", "label": "high"},
    {"text": "Audit finding significant control weakness requires management response within 30 days", "label": "high"},
    {"text": "VAT registration threshold exceeded registration mandatory within specified period", "label": "high"},
    {"text": "Employment tribunal claim received response required within 14 days avoid default judgment", "label": "high"},
    {"text": "License renewal overdue operations may be suspended if not renewed immediately", "label": "high"},
    {"text": "Insurance policy expiring in 14 days coverage gap risk if not renewed promptly", "label": "high"},
    {"text": "Non-disclosure agreement violation detected confidential information shared without authorization", "label": "high"},
    {"text": "Regulatory inspection scheduled next week documentation must be ready for review", "label": "high"},

    # ── MEDIUM ───────────────────────────────────────────────────────────────
    {"text": "Contract review recommended before renewal next quarter pricing terms may need renegotiation", "label": "medium"},
    {"text": "Upcoming compliance training required for all staff to be completed within 60 days", "label": "medium"},
    {"text": "Policy update required to align with new regulatory guidance effective next fiscal year", "label": "medium"},
    {"text": "Supplier performance review due underperforming vendor should be assessed for continuation", "label": "medium"},
    {"text": "Annual report preparation underway accounting adjustments needed for accurate disclosure", "label": "medium"},
    {"text": "Employee performance improvement plan initiated targets to be met within 90 days", "label": "medium"},
    {"text": "Software license expiring in 60 days renewal quote requested cost increase expected", "label": "medium"},
    {"text": "Office lease expiring in 6 months landlord to be approached regarding renewal terms", "label": "medium"},
    {"text": "Budget variance exceeding 15 percent management review required to approve overspend", "label": "medium"},
    {"text": "Risk register update due annually scheduled review of all identified risks and controls", "label": "medium"},

    # ── LOW ──────────────────────────────────────────────────────────────────
    {"text": "Recommended best practice review of internal procedures to improve operational efficiency", "label": "low"},
    {"text": "Optional staff wellbeing survey suggested to improve employee engagement scores", "label": "low"},
    {"text": "Consider updating company website to reflect new branding guidelines when convenient", "label": "low"},
    {"text": "Suggestion to implement automated reporting tools to reduce manual data entry effort", "label": "low"},
    {"text": "Annual general meeting to be scheduled within the next quarter at convenient date", "label": "low"},
    {"text": "Routine maintenance of office equipment scheduled as part of preventive maintenance plan", "label": "low"},
    {"text": "Newsletter subscription renewal minor administrative task no business impact", "label": "low"},
    {"text": "Guideline update for travel expense reimbursement process minor procedural change", "label": "low"},
    {"text": "Archive old documents from shared drive housekeeping task low priority", "label": "low"},
    {"text": "Consider reviewing parking allocation policy minor convenience improvement requested", "label": "low"},
]


# ---------------------------------------------------------------------------
# Version management
# ---------------------------------------------------------------------------

async def get_next_version(db: AsyncSession, model_type: ModelType, company_id: Optional[str]) -> str:
    filters = [ModelVersion.model_type == model_type]
    if company_id:
        filters.append(ModelVersion.company_id == company_id)
    else:
        filters.append(ModelVersion.company_id.is_(None))

    result = await db.execute(
        select(ModelVersion).where(and_(*filters)).order_by(ModelVersion.created_at.desc()).limit(1)
    )
    latest = result.scalar_one_or_none()
    if not latest:
        return "1.0.0"

    parts = latest.version.split(".")
    try:
        major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
        return f"{major}.{minor}.{patch + 1}"
    except Exception:
        return "1.0.0"


async def get_active_version(db: AsyncSession, model_type: ModelType, company_id: Optional[str] = None) -> Optional[ModelVersion]:
    filters = [
        ModelVersion.model_type == model_type,
        ModelVersion.is_active.is_(True),
        ModelVersion.status == TrainingStatus.COMPLETED,
    ]
    if company_id:
        filters.append(ModelVersion.company_id == company_id)

    result = await db.execute(select(ModelVersion).where(and_(*filters)).limit(1))
    return result.scalar_one_or_none()


async def activate_version(db: AsyncSession, version_id: str, model_type: ModelType) -> ModelVersion:
    # Deactivate all others
    all_versions = await db.execute(
        select(ModelVersion).where(
            and_(ModelVersion.model_type == model_type, ModelVersion.is_active.is_(True))
        )
    )
    for v in all_versions.scalars().all():
        v.is_active = False

    # Activate the chosen one
    result = await db.execute(select(ModelVersion).where(ModelVersion.id == version_id))
    version = result.scalar_one_or_none()
    if not version:
        raise ValueError(f"ModelVersion {version_id} not found")
    version.is_active = True
    await db.commit()
    return version


# ---------------------------------------------------------------------------
# Core training functions
# ---------------------------------------------------------------------------

async def train_document_classifier(
    db: AsyncSession,
    training_samples: List[Dict[str, str]],
    company_id: Optional[str] = None,
    trained_by: Optional[str] = None,
    notes: Optional[str] = None,
    auto_activate: bool = True,
) -> ModelVersion:
    """
    Train a document classifier and persist it.

    training_samples: list of {"text": "...", "label": "<document_type>"}
    Labels: contract, invoice, policy, report, tax_document, hr_document, compliance, other
    """
    version_str = await get_next_version(db, ModelType.DOCUMENT_CLASSIFIER, company_id)

    mv = ModelVersion(
        model_type=ModelType.DOCUMENT_CLASSIFIER,
        version=version_str,
        status=TrainingStatus.RUNNING,
        company_id=company_id,
        sample_count=len(training_samples),
        trained_by=trained_by,
        notes=notes,
    )
    db.add(mv)
    await db.commit()
    await db.refresh(mv)

    try:
        from app.services.ml_service import CustomDocumentClassifier

        clf = CustomDocumentClassifier()
        texts  = [s["text"]  for s in training_samples]
        labels = [s["label"] for s in training_samples]
        stats  = clf.train(texts, labels)

        filename = f"doc_clf_v{version_str}{'_' + str(company_id)[:8] if company_id else ''}.pkl"
        filepath = os.path.join(MODELS_DIR, filename)
        os.makedirs(MODELS_DIR, exist_ok=True)
        clf.save(filepath)

        mv.status          = TrainingStatus.COMPLETED
        mv.accuracy        = stats.get("cv_accuracy")
        mv.cv_accuracy     = stats.get("cv_accuracy")
        mv.classes         = stats.get("classes", [])
        mv.training_stats  = stats
        mv.file_path       = filepath
        mv.completed_at    = datetime.utcnow()

        if auto_activate:
            # Deactivate previous versions
            prev = await db.execute(
                select(ModelVersion).where(
                    and_(
                        ModelVersion.model_type == ModelType.DOCUMENT_CLASSIFIER,
                        ModelVersion.is_active.is_(True),
                        ModelVersion.id != mv.id,
                    )
                )
            )
            for old in prev.scalars().all():
                old.is_active = False
            mv.is_active = True

        await db.commit()
        logger.info("Document classifier v%s trained: accuracy=%.3f samples=%d", version_str, stats.get("cv_accuracy", 0), len(texts))

    except Exception as exc:
        mv.status        = TrainingStatus.FAILED
        mv.error_message = str(exc)
        await db.commit()
        logger.exception("Document classifier training failed: %s", exc)
        raise

    return mv


async def train_risk_scorer(
    db: AsyncSession,
    training_samples: List[Dict[str, str]],
    company_id: Optional[str] = None,
    trained_by: Optional[str] = None,
    notes: Optional[str] = None,
    auto_activate: bool = True,
) -> ModelVersion:
    """
    Train the predictive risk scorer.

    training_samples: list of {"text": "...", "label": "low|medium|high|critical"}
    """
    version_str = await get_next_version(db, ModelType.RISK_SCORER, company_id)

    mv = ModelVersion(
        model_type=ModelType.RISK_SCORER,
        version=version_str,
        status=TrainingStatus.RUNNING,
        company_id=company_id,
        sample_count=len(training_samples),
        trained_by=trained_by,
        notes=notes,
    )
    db.add(mv)
    await db.commit()
    await db.refresh(mv)

    try:
        from app.services.ml_service import PredictiveRiskScorer

        scorer = PredictiveRiskScorer()
        texts  = [s["text"]  for s in training_samples]
        labels = [s["label"] for s in training_samples]
        stats  = scorer.train(texts, labels)

        filename = f"risk_scorer_v{version_str}{'_' + str(company_id)[:8] if company_id else ''}.pkl"
        filepath = os.path.join(MODELS_DIR, filename)
        os.makedirs(MODELS_DIR, exist_ok=True)
        scorer.save(filepath)

        mv.status         = TrainingStatus.COMPLETED
        mv.accuracy       = stats.get("accuracy")
        mv.cv_accuracy    = stats.get("accuracy")
        mv.classes        = stats.get("classes", [])
        mv.training_stats = stats
        mv.file_path      = filepath
        mv.completed_at   = datetime.utcnow()

        if auto_activate:
            prev = await db.execute(
                select(ModelVersion).where(
                    and_(
                        ModelVersion.model_type == ModelType.RISK_SCORER,
                        ModelVersion.is_active.is_(True),
                        ModelVersion.id != mv.id,
                    )
                )
            )
            for old in prev.scalars().all():
                old.is_active = False
            mv.is_active = True

        await db.commit()
        logger.info("Risk scorer v%s trained: accuracy=%.3f samples=%d", version_str, stats.get("accuracy", 0), len(texts))

    except Exception as exc:
        mv.status        = TrainingStatus.FAILED
        mv.error_message = str(exc)
        await db.commit()
        logger.exception("Risk scorer training failed: %s", exc)
        raise

    return mv


async def train_both_defaults(
    db: AsyncSession,
    extra_doc_samples: Optional[List[Dict[str, str]]] = None,
    extra_risk_samples: Optional[List[Dict[str, str]]] = None,
    trained_by: Optional[str] = None,
) -> Tuple[ModelVersion, ModelVersion]:
    """
    Train both models from the built-in dataset, optionally merging extra samples.
    Called on first boot or from the training Celery task.
    """
    doc_samples  = DEFAULT_DOCUMENT_SAMPLES + (extra_doc_samples or [])
    risk_samples = DEFAULT_RISK_SAMPLES     + (extra_risk_samples or [])
    clf_version  = await train_document_classifier(
        db, doc_samples, trained_by=trained_by, notes="Built-in default dataset"
    )
    risk_version = await train_risk_scorer(
        db, risk_samples, trained_by=trained_by, notes="Built-in default dataset"
    )
    return clf_version, risk_version


# ---------------------------------------------------------------------------
# Load active model from disk
# ---------------------------------------------------------------------------

def load_active_classifier(file_path: str) -> CustomDocumentClassifier:
    clf = CustomDocumentClassifier()
    clf.load(file_path)
    return clf


def load_active_risk_scorer(file_path: str) -> PredictiveRiskScorer:
    scorer = PredictiveRiskScorer()
    scorer.load(file_path)
    return scorer
