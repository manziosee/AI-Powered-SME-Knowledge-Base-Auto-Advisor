#!/usr/bin/env python3
"""
train_model.py — SME Knowledge Base model training CLI
=======================================================

Train the document classifier and/or risk scorer directly from the
command line.  No API, no Docker required — just Python.

Usage
-----
  # Bootstrap both models with the built-in 160+ sample dataset
  python train_model.py --mode both

  # Train only the document classifier
  python train_model.py --mode classifier

  # Train only the risk scorer
  python train_model.py --mode risk

  # Add your own samples on top of the defaults (JSON file)
  python train_model.py --mode both \\
      --doc-samples my_doc_samples.json \\
      --risk-samples my_risk_samples.json

  # Use ONLY your custom samples (skip built-in defaults)
  python train_model.py --mode classifier \\
      --doc-samples my_doc_samples.json \\
      --no-defaults

  # Change output directory
  python train_model.py --mode both --save-dir /data/models

  # Dry run — show sample counts and labels, don't actually train
  python train_model.py --mode both --dry-run

Custom sample JSON format
-------------------------
  [
    {"text": "Invoice #1234 amount due USD 5000", "label": "invoice"},
    {"text": "Service agreement for cloud hosting", "label": "contract"},
    ...
  ]

Document classifier labels
--------------------------
  contract, invoice, policy, report, tax_document,
  hr_document, compliance, other

Risk scorer labels
------------------
  critical, high, medium, low
"""

import argparse
import json
import os
import pickle
import sys
import time
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ── rich output helpers ──────────────────────────────────────────────────────
try:
    from rich.console import Console
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
    from rich.panel import Panel
    from rich.text import Text
    _RICH = True
    console = Console()
except ImportError:
    _RICH = False

    class _FallbackConsole:
        def print(self, *args, **kwargs):
            print(*[str(a) for a in args])
        def rule(self, title=""):
            print(f"\n{'─' * 60}  {title}")

    console = _FallbackConsole()


def _print_header():
    if _RICH:
        console.print(Panel.fit(
            "[bold cyan]SME Knowledge Base — Model Training CLI[/bold cyan]\n"
            "[dim]Train document classifier and risk scorer for your SME system[/dim]",
            border_style="cyan",
        ))
    else:
        console.print("\n" + "=" * 60)
        console.print("  SME Knowledge Base — Model Training CLI")
        console.print("=" * 60)


# ── Built-in rich dataset (165 samples) ─────────────────────────────────────

DOCUMENT_SAMPLES: List[Dict[str, str]] = [
    # ── CONTRACT (20 samples) ────────────────────────────────────────────────
    {"text": "This service agreement is entered into between the parties for provision of consulting services and payment terms", "label": "contract"},
    {"text": "Employment contract specifying salary compensation benefits probation period and termination conditions", "label": "contract"},
    {"text": "Non-disclosure agreement prohibiting disclosure of confidential business information trade secrets", "label": "contract"},
    {"text": "Commercial lease agreement for office space monthly rental deposit and maintenance obligations", "label": "contract"},
    {"text": "Software license agreement granting limited rights to use the application under specified terms", "label": "contract"},
    {"text": "Partnership agreement outlining profit sharing capital contributions responsibilities and governance", "label": "contract"},
    {"text": "Service level agreement guaranteeing 99.9 percent uptime with financial penalties for breach", "label": "contract"},
    {"text": "Supply agreement for raw materials delivery schedule agreed pricing and quality standards", "label": "contract"},
    {"text": "Freelance contract for website development deliverables milestones payment schedule acceptance criteria", "label": "contract"},
    {"text": "Distribution agreement authorizing exclusive resale of products in specified geographic territory", "label": "contract"},
    {"text": "Construction contract scope of works bill of quantities progress payments retention and defects liability", "label": "contract"},
    {"text": "Memorandum of understanding between two organizations for joint research and development collaboration", "label": "contract"},
    {"text": "Shareholders agreement governing voting rights dividend policy pre-emption and drag-along provisions", "label": "contract"},
    {"text": "Franchise agreement granting licensee rights to operate under brand name royalty fees and standards", "label": "contract"},
    {"text": "Loan agreement principal amount interest rate repayment schedule security and default conditions", "label": "contract"},
    {"text": "Maintenance contract for IT infrastructure annual fee response times escalation procedures", "label": "contract"},
    {"text": "Consulting retainer agreement monthly fee scope deliverables intellectual property ownership", "label": "contract"},
    {"text": "Agency agreement appointing agent to sell products on behalf of principal commission structure", "label": "contract"},
    {"text": "Confidentiality and intellectual property assignment agreement for employees on inventions", "label": "contract"},
    {"text": "Joint venture agreement between two companies for a specific project profit sharing exit terms", "label": "contract"},

    # ── INVOICE (18 samples) ─────────────────────────────────────────────────
    {"text": "Invoice number 12345 total amount due 5000 USD payment terms net 30 days bank transfer details", "label": "invoice"},
    {"text": "Tax invoice for consulting services rendered in January subtotal VAT 16 percent total payable", "label": "invoice"},
    {"text": "Bill for IT support services hours worked hourly rate subtotal taxes total charges due", "label": "invoice"},
    {"text": "Purchase order confirmation itemized list of goods quantities unit prices delivery charges total", "label": "invoice"},
    {"text": "Proforma invoice for export shipment FOB value customs duties freight insurance charges", "label": "invoice"},
    {"text": "Monthly recurring invoice for SaaS enterprise subscription plan per-seat pricing annual discount", "label": "invoice"},
    {"text": "Invoice for legal services retainer fee billable hours disbursements consultation charges", "label": "invoice"},
    {"text": "Credit note issued for returned goods partial refund adjustment to original invoice balance", "label": "invoice"},
    {"text": "Statement of account showing outstanding invoices amounts payment received and current balance", "label": "invoice"},
    {"text": "Utility bill electricity consumption kilowatt hours peak off-peak tariff taxes and levies", "label": "invoice"},
    {"text": "Supplier invoice for office supplies stationery furniture equipment unit costs totals", "label": "invoice"},
    {"text": "Interim invoice for construction progress billing percentage complete certified amount payable", "label": "invoice"},
    {"text": "Invoice for advertising services print media digital social media placement production fees", "label": "invoice"},
    {"text": "Professional services invoice project management advisory fees travel expenses reimbursement", "label": "invoice"},
    {"text": "Import duty invoice customs clearance agent fees tariff HS code declared value", "label": "invoice"},
    {"text": "Final invoice on completion of project milestone all outstanding amounts including retention release", "label": "invoice"},
    {"text": "Rental invoice for equipment hire daily weekly monthly rate delivery collection charges", "label": "invoice"},
    {"text": "Medical invoice consultation fees laboratory tests procedures hospital facility charges insurance co-pay", "label": "invoice"},

    # ── POLICY (18 samples) ──────────────────────────────────────────────────
    {"text": "Employee code of conduct policy covering workplace behavior ethics conflicts of interest disciplinary procedures", "label": "policy"},
    {"text": "Data privacy policy describing how personal information is collected processed stored and protected under GDPR", "label": "policy"},
    {"text": "Health and safety policy hazard identification risk assessment PPE requirements incident reporting procedures", "label": "policy"},
    {"text": "Remote work and flexible working policy eligibility criteria equipment allowance productivity expectations", "label": "policy"},
    {"text": "Annual sick maternity paternity parental leave entitlements application process return to work policy", "label": "policy"},
    {"text": "Anti-bribery and corruption policy prohibiting facilitation payments gifts hospitality conflicts of interest", "label": "policy"},
    {"text": "Information security policy data classification access control password requirements incident response", "label": "policy"},
    {"text": "Procurement and vendor management policy approval thresholds tendering evaluation conflict of interest", "label": "policy"},
    {"text": "Social media policy employee guidelines for online platforms brand representation personal use rules", "label": "policy"},
    {"text": "Environmental sustainability policy carbon reduction targets waste management recycling renewable energy", "label": "policy"},
    {"text": "Travel and expenses policy approved accommodation meal per diems transport booking procedures receipts", "label": "policy"},
    {"text": "Whistleblowing policy protected disclosure procedures confidentiality non-retaliation investigation process", "label": "policy"},
    {"text": "Diversity inclusion and equal opportunity policy non-discrimination protected characteristics reasonable adjustments", "label": "policy"},
    {"text": "IT acceptable use policy internet email software installation monitoring personal use guidelines", "label": "policy"},
    {"text": "Financial controls policy authorization limits segregation of duties bank reconciliation audit requirements", "label": "policy"},
    {"text": "Customer complaints handling policy escalation timelines resolution procedures compensation refund policy", "label": "policy"},
    {"text": "Document management and retention policy record keeping storage destruction schedules GDPR compliance", "label": "policy"},
    {"text": "Business continuity policy disaster recovery RTO RPO backup procedures crisis management communication", "label": "policy"},

    # ── REPORT (18 samples) ──────────────────────────────────────────────────
    {"text": "Quarterly financial report revenue EBITDA net profit margins year-over-year growth analysis by segment", "label": "report"},
    {"text": "Annual performance review executive summary KPI achievement strategic objectives and outlook", "label": "report"},
    {"text": "Market analysis report total addressable market competitive landscape growth projections entry barriers", "label": "report"},
    {"text": "Internal audit report findings control weaknesses recommendations management responses action plan", "label": "report"},
    {"text": "Board of directors report governance strategy risk oversight dividend recommendation", "label": "report"},
    {"text": "Sales performance report pipeline stage conversion rates revenue by region product line customer segment", "label": "report"},
    {"text": "Operational efficiency report lean process improvements cost reduction initiatives throughput quality metrics", "label": "report"},
    {"text": "Risk assessment report likelihood impact heat map top risks mitigation strategies residual risk", "label": "report"},
    {"text": "Customer satisfaction survey net promoter score drivers of satisfaction verbatim themes action plans", "label": "report"},
    {"text": "Due diligence report financial legal technical commercial findings red flags for acquisition target", "label": "report"},
    {"text": "Monthly management accounts variance analysis budget vs actual forecast reforecast commentary", "label": "report"},
    {"text": "ESG sustainability report greenhouse gas emissions social impact governance metrics stakeholder disclosure", "label": "report"},
    {"text": "IT security incident report timeline of events root cause analysis containment remediation lessons learned", "label": "report"},
    {"text": "HR workforce analytics report headcount turnover absenteeism diversity gender pay gap data", "label": "report"},
    {"text": "Project status report milestones completed delayed risks issues budget burn rate forecast to complete", "label": "report"},
    {"text": "Feasibility study report technical financial market analysis recommendation for go or no-go decision", "label": "report"},
    {"text": "Board meeting minutes resolutions passed attendance quorum decisions action items next meeting date", "label": "report"},
    {"text": "External auditors report opinion financial statements materiality basis of preparation going concern", "label": "report"},

    # ── TAX DOCUMENT (15 samples) ────────────────────────────────────────────
    {"text": "Corporate income tax return annual taxable income allowable deductions tax liability payable refundable", "label": "tax_document"},
    {"text": "VAT return quarterly taxable turnover input tax output tax net VAT payable to revenue authority", "label": "tax_document"},
    {"text": "PAYE payroll tax schedule monthly employee withholding deductions employer remittance certificates", "label": "tax_document"},
    {"text": "Tax clearance certificate issued by revenue authority confirming no outstanding tax liabilities", "label": "tax_document"},
    {"text": "Withholding tax certificate for dividends interest and royalties paid to non-resident recipients", "label": "tax_document"},
    {"text": "Transfer pricing documentation policy intercompany transactions arm length principle benchmarking", "label": "tax_document"},
    {"text": "Capital gains tax computation on disposal of property plant shares depreciation recapture indexation", "label": "tax_document"},
    {"text": "Customs import duty declaration HS code tariff classification customs value origin certificate", "label": "tax_document"},
    {"text": "Payroll deductions summary PAYE NSSF NHIF pension contributions per employee reconciliation", "label": "tax_document"},
    {"text": "Tax assessment notice additional tax interest penalties objection rights and payment deadline", "label": "tax_document"},
    {"text": "Advance tax ruling request on specific transaction tax treatment confirmation from authority", "label": "tax_document"},
    {"text": "Excise duty return on alcohol tobacco fuel manufactured goods monthly declaration and payment", "label": "tax_document"},
    {"text": "Double taxation agreement claim reduced withholding rate certificate of residence form", "label": "tax_document"},
    {"text": "Tax reconciliation statement reconciling accounting profit to taxable income adjustments schedules", "label": "tax_document"},
    {"text": "Annual tax computation showing chargeable income deductions capital allowances losses carried forward", "label": "tax_document"},

    # ── HR DOCUMENT (18 samples) ─────────────────────────────────────────────
    {"text": "Job offer letter position title department start date salary package benefits probation period acceptance", "label": "hr_document"},
    {"text": "Annual performance appraisal rating scale competencies goals achievements development plan supervisor sign-off", "label": "hr_document"},
    {"text": "Formal disciplinary warning letter first written warning repeated lateness poor performance misconduct", "label": "hr_document"},
    {"text": "Employee onboarding checklist first day orientation IT setup payroll forms company induction schedule", "label": "hr_document"},
    {"text": "Resignation letter notice period last working day handover plan transition responsibilities", "label": "hr_document"},
    {"text": "Job description key responsibilities qualifications experience skills competencies reporting line salary band", "label": "hr_document"},
    {"text": "Training and development plan individual learning objectives skills gap analysis completion timeline costs", "label": "hr_document"},
    {"text": "Employment reference letter confirming job title tenure key responsibilities performance character", "label": "hr_document"},
    {"text": "Organizational chart department structure reporting relationships headcount role titles", "label": "hr_document"},
    {"text": "Monthly payslip gross salary basic overtime allowances deductions PAYE NSSF net pay", "label": "hr_document"},
    {"text": "Redundancy notice selection criteria consultation period enhanced redundancy payment calculation", "label": "hr_document"},
    {"text": "Exit interview form reasons for leaving job satisfaction management feedback suggestions", "label": "hr_document"},
    {"text": "Contract variation letter change of role salary promotion effective date new terms confirmation", "label": "hr_document"},
    {"text": "Grievance procedure form employee complaint nature of grievance witnesses desired outcome", "label": "hr_document"},
    {"text": "Secondment agreement temporary assignment host organization duration responsibilities reporting", "label": "hr_document"},
    {"text": "Employee handbook company values policies benefits procedures workplace rules acknowledgement sign-off", "label": "hr_document"},
    {"text": "Recruitment requisition form vacancy justification budget approval job grade hiring manager", "label": "hr_document"},
    {"text": "Learning and development agreement sponsored study course fees repayment if employee leaves", "label": "hr_document"},

    # ── COMPLIANCE (16 samples) ──────────────────────────────────────────────
    {"text": "Regulatory compliance certificate confirming adherence to financial services prudential requirements", "label": "compliance"},
    {"text": "GDPR data protection impact assessment processing activities risks mitigations data subject rights", "label": "compliance"},
    {"text": "AML anti-money laundering KYC know your customer due diligence records transaction monitoring", "label": "compliance"},
    {"text": "Environmental compliance certificate waste disposal effluent treatment air emissions standards met", "label": "compliance"},
    {"text": "Business license renewal certificate authorizing company to operate issued by local authority", "label": "compliance"},
    {"text": "ISO 27001 information security management system certification audit scope statement of applicability", "label": "compliance"},
    {"text": "Food safety HACCP compliance inspection certificate hygiene practices temperature controls pest control", "label": "compliance"},
    {"text": "Fire safety compliance certificate building inspection emergency exits signage suppression systems", "label": "compliance"},
    {"text": "Certificate of incorporation memorandum articles of association registered office directors", "label": "compliance"},
    {"text": "Occupational health safety compliance record workplace hazard register corrective actions closing dates", "label": "compliance"},
    {"text": "Consumer protection compliance audit fair trading labeling advertising standards adherence report", "label": "compliance"},
    {"text": "Data breach notification to supervisory authority timeline of incident measures taken individuals affected", "label": "compliance"},
    {"text": "Annual returns filed with company registry directors details share capital changes confirmation", "label": "compliance"},
    {"text": "Pharmaceutical product registration certificate quality safety efficacy standards pharmacovigilance", "label": "compliance"},
    {"text": "Building permit and planning approval zoning land use construction standards inspection sign-off", "label": "compliance"},
    {"text": "Export permit customs compliance import license trade sanctions screening certificate of origin", "label": "compliance"},

    # ── OTHER (8 samples) ────────────────────────────────────────────────────
    {"text": "Meeting notes from weekly team sync agenda items discussed decisions actions owners deadlines", "label": "other"},
    {"text": "Internal memo regarding office relocation parking arrangements new building access cards", "label": "other"},
    {"text": "Product brochure features benefits pricing plans contact details call to action", "label": "other"},
    {"text": "Technical specification document system architecture API endpoints data models integration requirements", "label": "other"},
    {"text": "Project charter objectives scope stakeholders milestones budget resources assumptions constraints", "label": "other"},
    {"text": "Press release company announcement new product launch expansion funding round partnership", "label": "other"},
    {"text": "User manual step by step instructions for software installation configuration troubleshooting FAQ", "label": "other"},
    {"text": "Board resolution approval authority minutes signed directors ratification of decision", "label": "other"},
]


RISK_SAMPLES: List[Dict[str, str]] = [
    # ── CRITICAL (15 samples) ────────────────────────────────────────────────
    {"text": "Breach of contract lawsuit filed damages claim USD 2 million emergency injunction sought immediately", "label": "critical"},
    {"text": "Regulatory violation penalty notice issued license suspension threatened immediate corrective action required", "label": "critical"},
    {"text": "Data breach incident personal records of 10000 customers compromised 72-hour notification deadline", "label": "critical"},
    {"text": "Tax authority criminal investigation suspected fraud substantial penalties prosecution risk", "label": "critical"},
    {"text": "Contract terminated for cause with immediate effect all obligations suspended indemnity claims pending", "label": "critical"},
    {"text": "Insolvency proceedings initiated creditors meeting scheduled assets subject to receivership", "label": "critical"},
    {"text": "Court injunction restraining company business operations pending resolution urgent legal response needed", "label": "critical"},
    {"text": "Sanctions violation export controls breach financial penalties under investigation operations frozen", "label": "critical"},
    {"text": "Invoice unpaid exceeding 90 days legal action debt recovery proceedings commenced judgment risk", "label": "critical"},
    {"text": "Wrongful dismissal claim filed with labour tribunal urgent response required default judgment risk", "label": "critical"},
    {"text": "Force majeure notice counterparty invoking termination rights contract dispute arbitration imminent", "label": "critical"},
    {"text": "Health and safety fatality workplace accident regulatory investigation prosecution imminent operations halted", "label": "critical"},
    {"text": "Intellectual property infringement cease and desist urgent legal advice required damages claim", "label": "critical"},
    {"text": "Material breach identified contract right to terminate counterparty has invoked termination notice", "label": "critical"},
    {"text": "Fraud detected internal embezzlement uncovered criminal referral assets frozen urgent board action", "label": "critical"},

    # ── HIGH (15 samples) ────────────────────────────────────────────────────
    {"text": "Compliance filing deadline in 7 days mandatory submission penalties accrue for late filing", "label": "high"},
    {"text": "Contract auto-renews in 30 days must confirm renewal or serve notice to avoid unwanted extension", "label": "high"},
    {"text": "Annual tax return overdue interest accruing at 2 percent per month escalating penalties imminent", "label": "high"},
    {"text": "Audit finding significant control weakness management response required within 30 days", "label": "high"},
    {"text": "VAT registration threshold exceeded registration mandatory within 30 days or penalties apply", "label": "high"},
    {"text": "Employment tribunal claim response required within 14 days to avoid default judgment", "label": "high"},
    {"text": "Business license renewal overdue operations may be suspended if renewal not completed immediately", "label": "high"},
    {"text": "Insurance policy expiring in 14 days coverage gap risk if not renewed promptly", "label": "high"},
    {"text": "NDA breach detected confidential information shared with unauthorized third party legal review needed", "label": "high"},
    {"text": "Regulatory inspection scheduled next week all documentation and compliance records must be ready", "label": "high"},
    {"text": "Key contract milestone missed liquidated damages clause triggered financial impact significant", "label": "high"},
    {"text": "GDPR data subject access request response overdue 30-day deadline breached regulatory complaint risk", "label": "high"},
    {"text": "Board approval required urgently for transaction above authorization limit delay creates exposure", "label": "high"},
    {"text": "Employee dismissed without following procedure unfair dismissal exposure employment law review needed", "label": "high"},
    {"text": "Software vulnerability discovered in production system patch deployment required immediately security risk", "label": "high"},

    # ── MEDIUM (15 samples) ──────────────────────────────────────────────────
    {"text": "Contract renewal due next quarter review pricing terms performance obligations before renewing", "label": "medium"},
    {"text": "Annual compliance training mandatory for all staff to be completed within 60 days", "label": "medium"},
    {"text": "Company policy requires update to align with new regulatory guidance effective next financial year", "label": "medium"},
    {"text": "Underperforming vendor review due assessment of continuation or replacement required", "label": "medium"},
    {"text": "Annual report preparation accounting adjustments required accurate and fair presentation needed", "label": "medium"},
    {"text": "Employee performance improvement plan initiated 90-day review period targets and support plan", "label": "medium"},
    {"text": "Software license expiring in 60 days renewal quote requested budget provision needed", "label": "medium"},
    {"text": "Office lease expiring in 6 months negotiate renewal or identify alternative premises", "label": "medium"},
    {"text": "Budget overspend of 15 percent management review required approval for additional expenditure", "label": "medium"},
    {"text": "Annual risk register review due update likelihood impact ratings and test controls", "label": "medium"},
    {"text": "Third-party due diligence overdue for key supplier supply chain risk review required", "label": "medium"},
    {"text": "Information security awareness training refresh due phishing simulation results below target", "label": "medium"},
    {"text": "Director personal guarantee exposure review recommended given company financial position changes", "label": "medium"},
    {"text": "Regulatory guidance consultation period closes in 45 days company response submission advised", "label": "medium"},
    {"text": "Contract price escalation clause trigger point approaching review pricing strategy negotiations", "label": "medium"},

    # ── LOW (15 samples) ─────────────────────────────────────────────────────
    {"text": "Recommended review of standard operating procedures to improve efficiency and reduce manual steps", "label": "low"},
    {"text": "Optional staff wellbeing survey to be conducted when convenient to gauge employee morale", "label": "low"},
    {"text": "Company website update suggested to reflect current branding no time-sensitive business impact", "label": "low"},
    {"text": "Implement automated reporting tools to reduce manual data entry effort low priority initiative", "label": "low"},
    {"text": "Annual general meeting scheduling required no specific deadline next quarter is acceptable", "label": "low"},
    {"text": "Routine preventive maintenance of office equipment scheduled per maintenance plan no urgency", "label": "low"},
    {"text": "Newsletter subscription minor administrative renewal no business impact if delayed", "label": "low"},
    {"text": "Travel expense reimbursement policy minor update to reflect revised meal per diems", "label": "low"},
    {"text": "Archive old shared drive documents housekeeping exercise no operational impact", "label": "low"},
    {"text": "Parking allocation review minor convenience improvement staff request low priority", "label": "low"},
    {"text": "Consider updating business cards and email signatures to new format when reprinting", "label": "low"},
    {"text": "Library of standard contract templates to be refreshed with updated clauses no urgency", "label": "low"},
    {"text": "Staff suggestion to add more plants to office breakout areas morale initiative", "label": "low"},
    {"text": "Social committee planning next team building event budget approved date to be decided", "label": "low"},
    {"text": "Invitation to join industry association networking group optional membership low annual fee", "label": "low"},
]


# ── Label metadata ───────────────────────────────────────────────────────────

DOC_LABELS = {
    "contract":     "Legal agreements, MOUs, SLAs, lease/employment/NDAs",
    "invoice":      "Bills, tax invoices, purchase orders, statements of account",
    "policy":       "Company policies, codes of conduct, procedures, guidelines",
    "report":       "Financial, operational, audit, ESG, project status reports",
    "tax_document": "Tax returns, VAT filings, clearance certs, PAYE schedules",
    "hr_document":  "Offer letters, appraisals, payslips, job descriptions",
    "compliance":   "Regulatory filings, certifications, licences, GDPR records",
    "other":        "Meeting minutes, memos, technical specs, manuals",
}

RISK_LABELS = {
    "critical": "Immediate legal/financial/regulatory threat requiring urgent action",
    "high":     "Upcoming deadline or significant exposure within 30 days",
    "medium":   "Moderate risk within 60-90 days, needs planning",
    "low":      "Advisory, housekeeping, or low-impact matters",
}


# ── Training helpers ─────────────────────────────────────────────────────────

def _load_json_samples(path: str) -> List[Dict[str, str]]:
    """Load samples from a JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"{path}: expected a JSON array, got {type(data).__name__}")
    for i, item in enumerate(data):
        if "text" not in item or "label" not in item:
            raise ValueError(f"{path}[{i}]: each item must have 'text' and 'label' keys")
    return data


def _show_distribution(samples: List[Dict], title: str):
    """Print label distribution table."""
    counts = Counter(s["label"] for s in samples)
    total = len(samples)

    if _RICH:
        table = Table(title=title, show_header=True, header_style="bold magenta")
        table.add_column("Label", style="cyan", no_wrap=True)
        table.add_column("Count", justify="right")
        table.add_column("Share", justify="right")
        table.add_column("Bar", no_wrap=True)
        for label, count in sorted(counts.items()):
            pct = count / total * 100
            bar = "█" * int(pct / 4)
            table.add_row(label, str(count), f"{pct:.1f}%", bar)
        table.add_row("[bold]TOTAL[/bold]", f"[bold]{total}[/bold]", "100%", "")
        console.print(table)
    else:
        console.print(f"\n{title}")
        console.print(f"{'Label':<20} {'Count':>6}  {'Share':>7}")
        console.print("-" * 40)
        for label, count in sorted(counts.items()):
            pct = count / total * 100
            console.print(f"{label:<20} {count:>6}  {pct:>6.1f}%")
        console.print(f"{'TOTAL':<20} {total:>6}")


def _train_classifier(samples: List[Dict], save_dir: str) -> Tuple[object, Dict]:
    """Train document classifier and save to disk."""
    sys.path.insert(0, str(Path(__file__).parent))
    from app.services.ml_service import CustomDocumentClassifier

    clf = CustomDocumentClassifier()
    texts  = [s["text"]  for s in samples]
    labels = [s["label"] for s in samples]

    t0 = time.perf_counter()
    stats = clf.train(texts, labels)
    elapsed = time.perf_counter() - t0

    stats["training_seconds"] = round(elapsed, 2)

    os.makedirs(save_dir, exist_ok=True)
    filename = f"doc_clf_v{_next_local_version(save_dir, 'doc_clf')}.pkl"
    filepath = os.path.join(save_dir, filename)
    clf.save(filepath)

    return clf, stats, filepath


def _train_risk_scorer(samples: List[Dict], save_dir: str) -> Tuple[object, Dict, str]:
    """Train risk scorer and save to disk."""
    sys.path.insert(0, str(Path(__file__).parent))
    from app.services.ml_service import PredictiveRiskScorer

    scorer = PredictiveRiskScorer()
    texts  = [s["text"]  for s in samples]
    labels = [s["label"] for s in samples]

    t0 = time.perf_counter()
    stats = scorer.train(texts, labels)
    elapsed = time.perf_counter() - t0

    stats["training_seconds"] = round(elapsed, 2)

    os.makedirs(save_dir, exist_ok=True)
    filename = f"risk_scorer_v{_next_local_version(save_dir, 'risk_scorer')}.pkl"
    filepath = os.path.join(save_dir, filename)

    with open(filepath, "wb") as f:
        pickle.dump(scorer, f)

    return scorer, stats, filepath


def _next_local_version(save_dir: str, prefix: str) -> str:
    """Simple versioning: find highest existing version and increment."""
    existing = []
    if os.path.isdir(save_dir):
        for fname in os.listdir(save_dir):
            if fname.startswith(prefix + "_v") and fname.endswith(".pkl"):
                try:
                    ver_part = fname[len(prefix) + 2:-4]  # strip prefix_v and .pkl
                    parts = ver_part.split(".")
                    existing.append((int(parts[0]), int(parts[1]), int(parts[2])))
                except Exception:
                    pass
    if not existing:
        return "1.0.0"
    major, minor, patch = max(existing)
    return f"{major}.{minor}.{patch + 1}"


def _print_stats(stats: Dict, model_name: str):
    """Print training result statistics."""
    if _RICH:
        console.print(f"\n[bold green]✓ {model_name} training complete[/bold green]")
        table = Table(show_header=False, box=None, padding=(0, 2))
        table.add_column(style="dim")
        table.add_column(style="bold")
        table.add_row("Accuracy (test split)",  f"{stats.get('accuracy', 0):.4f}")
        table.add_row("CV Accuracy (5-fold)",   f"{stats.get('cv_accuracy', 0):.4f}")
        table.add_row("CV Std Dev",             f"±{stats.get('cv_std', 0):.4f}")
        table.add_row("Samples used",           str(stats.get("n_samples", "?")))
        table.add_row("Classes",                ", ".join(str(c) for c in stats.get("classes", [])))
        table.add_row("Training time",          f"{stats.get('training_seconds', 0):.1f}s")
        console.print(table)
    else:
        console.print(f"\n✓ {model_name} training complete")
        console.print(f"  Accuracy (test split): {stats.get('accuracy', 0):.4f}")
        console.print(f"  CV Accuracy (5-fold):  {stats.get('cv_accuracy', 0):.4f}")
        console.print(f"  Samples used:          {stats.get('n_samples', '?')}")
        console.print(f"  Training time:         {stats.get('training_seconds', 0):.1f}s")


def _run_predictions(clf_or_scorer, texts: List[str], model_type: str):
    """Run quick test predictions and print results."""
    if _RICH:
        console.rule("[bold]Quick Test Predictions[/bold]")
        table = Table(show_header=True, header_style="bold blue")
        table.add_column("Input Text", max_width=55)
        table.add_column("Prediction", style="cyan")
        table.add_column("Confidence", justify="right")
        for text in texts:
            pred   = clf_or_scorer.predict(text) if hasattr(clf_or_scorer, "predict") else "?"
            probas = clf_or_scorer.predict_proba(text) if hasattr(clf_or_scorer, "predict_proba") else {}
            conf   = max(probas.values()) if probas else 0.0
            table.add_row(text[:55] + ("…" if len(text) > 55 else ""), pred, f"{conf:.1%}")
        console.print(table)
    else:
        console.print("\nQuick Test Predictions:")
        for text in texts:
            pred   = clf_or_scorer.predict(text) if hasattr(clf_or_scorer, "predict") else "?"
            probas = clf_or_scorer.predict_proba(text) if hasattr(clf_or_scorer, "predict_proba") else {}
            conf   = max(probas.values()) if probas else 0.0
            console.print(f"  [{pred}] ({conf:.1%})  {text[:60]}")


# ── CLI ──────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="train_model.py",
        description="Train SME Knowledge Base ML models from the command line.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--mode",
        choices=["both", "classifier", "risk"],
        default="both",
        help="Which model(s) to train (default: both)",
    )
    parser.add_argument(
        "--save-dir",
        default="./models",
        help="Directory to save trained model files (default: ./models)",
    )
    parser.add_argument(
        "--doc-samples",
        metavar="FILE.json",
        help="Path to custom document classifier samples (JSON array)",
    )
    parser.add_argument(
        "--risk-samples",
        metavar="FILE.json",
        help="Path to custom risk scorer samples (JSON array)",
    )
    parser.add_argument(
        "--no-defaults",
        action="store_true",
        help="Use ONLY custom samples — skip the built-in dataset",
    )
    parser.add_argument(
        "--no-test",
        action="store_true",
        help="Skip quick test predictions after training",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show sample counts and label distribution only — do not train",
    )
    parser.add_argument(
        "--list-labels",
        action="store_true",
        help="Print all supported labels with descriptions and exit",
    )
    return parser


def main():
    parser = build_parser()
    args   = parser.parse_args()

    _print_header()

    # ── --list-labels ────────────────────────────────────────────────────────
    if args.list_labels:
        if _RICH:
            t = Table(title="Document Classifier Labels", header_style="bold green")
            t.add_column("Label", style="cyan")
            t.add_column("Description")
            for lbl, desc in DOC_LABELS.items():
                t.add_row(lbl, desc)
            console.print(t)

            t2 = Table(title="Risk Scorer Labels", header_style="bold red")
            t2.add_column("Label", style="cyan")
            t2.add_column("Description")
            for lbl, desc in RISK_LABELS.items():
                t2.add_row(lbl, desc)
            console.print(t2)
        else:
            console.print("\nDocument Classifier Labels:")
            for lbl, desc in DOC_LABELS.items():
                console.print(f"  {lbl:<20} {desc}")
            console.print("\nRisk Scorer Labels:")
            for lbl, desc in RISK_LABELS.items():
                console.print(f"  {lbl:<20} {desc}")
        sys.exit(0)

    # ── Assemble samples ─────────────────────────────────────────────────────
    doc_samples: List[Dict]  = []
    risk_samples: List[Dict] = []

    if args.mode in ("both", "classifier"):
        if not args.no_defaults:
            doc_samples = list(DOCUMENT_SAMPLES)
        if args.doc_samples:
            custom = _load_json_samples(args.doc_samples)
            doc_samples.extend(custom)
            console.print(f"  Loaded {len(custom)} custom document samples from {args.doc_samples}")
        if not doc_samples:
            console.print("ERROR: No document samples to train on. "
                          "Provide --doc-samples or remove --no-defaults.")
            sys.exit(1)

    if args.mode in ("both", "risk"):
        if not args.no_defaults:
            risk_samples = list(RISK_SAMPLES)
        if args.risk_samples:
            custom = _load_json_samples(args.risk_samples)
            risk_samples.extend(custom)
            console.print(f"  Loaded {len(custom)} custom risk samples from {args.risk_samples}")
        if not risk_samples:
            console.print("ERROR: No risk samples to train on. "
                          "Provide --risk-samples or remove --no-defaults.")
            sys.exit(1)

    # ── Show distributions ───────────────────────────────────────────────────
    if doc_samples:
        _show_distribution(doc_samples,  "Document Classifier — Training Data")
    if risk_samples:
        _show_distribution(risk_samples, "Risk Scorer — Training Data")

    if args.dry_run:
        console.print("\n[dim]Dry run complete. Remove --dry-run to train models.[/dim]"
                      if _RICH else "\nDry run complete. Remove --dry-run to train models.")
        sys.exit(0)

    # ── Train models ─────────────────────────────────────────────────────────
    trained_clf    = None
    trained_scorer = None

    if args.mode in ("both", "classifier"):
        if _RICH:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TimeElapsedColumn(),
                transient=True,
            ) as progress:
                task = progress.add_task("Training document classifier…", total=None)
                clf, stats, filepath = _train_classifier(doc_samples, args.save_dir)
                progress.update(task, completed=True)
        else:
            console.print("\nTraining document classifier…")
            clf, stats, filepath = _train_classifier(doc_samples, args.save_dir)

        trained_clf = clf
        _print_stats(stats, "Document Classifier")
        console.print(f"  Saved → {filepath}" if not _RICH
                      else f"  [dim]Saved →[/dim] [bold]{filepath}[/bold]")

    if args.mode in ("both", "risk"):
        if _RICH:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TimeElapsedColumn(),
                transient=True,
            ) as progress:
                task = progress.add_task("Training risk scorer…", total=None)
                scorer, stats, filepath = _train_risk_scorer(risk_samples, args.save_dir)
                progress.update(task, completed=True)
        else:
            console.print("\nTraining risk scorer…")
            scorer, stats, filepath = _train_risk_scorer(risk_samples, args.save_dir)

        trained_scorer = scorer
        _print_stats(stats, "Risk Scorer")
        console.print(f"  Saved → {filepath}" if not _RICH
                      else f"  [dim]Saved →[/dim] [bold]{filepath}[/bold]")

    # ── Quick test predictions ───────────────────────────────────────────────
    if not args.no_test:
        if trained_clf:
            _run_predictions(trained_clf, [
                "Invoice #9876 total amount due USD 12,500 payment due net 30 days",
                "Non-disclosure agreement for merger talks confidentiality obligations",
                "GDPR data protection impact assessment for new CRM system deployment",
                "Quarterly board report revenue growth EBITDA margin year over year",
                "Annual tax return corporate income tax deductions payable to revenue",
                "PAYE payroll deductions schedule monthly employee withholding remittance",
                "Employee performance appraisal rating competencies development plan",
                "General meeting minutes resolutions passed quorum directors attendance",
            ], "Document Classifier")

        if trained_scorer:
            _run_predictions(trained_scorer, [
                "Regulatory breach penalty notice license revoked immediate action required",
                "Contract renewal due in 28 days must confirm or serve termination notice",
                "Annual risk register review due update ratings and test all controls",
                "Consider updating company website branding when convenient low priority",
                "Data breach 5000 customer records leaked 72-hour notification deadline breached",
                "Office parking allocation review minor staff convenience improvement requested",
            ], "Risk Scorer")

    if _RICH:
        console.print(Panel(
            f"[bold green]Training complete![/bold green]\n"
            f"Models saved to [bold]{args.save_dir}[/bold]\n\n"
            "[dim]To use these models in the API:\n"
            "  1. Copy .pkl files to /app/models/ in your container\n"
            "  2. Restart the backend service\n"
            "  3. Or trigger training via the API: POST /api/v1/admin/ml/train[/dim]",
            border_style="green",
        ))
    else:
        console.print(f"\n✓ All done. Models saved to {args.save_dir}")
        console.print("  Copy .pkl files to /app/models/ in your container and restart the backend.")


if __name__ == "__main__":
    main()
