"""
Country-specific compliance rules engine.

Rules are seeded in the DB and can be managed by SUPER_ADMIN / ADMIN via the admin API.
This service handles:
  - Seeding default rules for supported countries
  - Matching rules against a company's profile and knowledge entries
  - Computing a compliance gap report
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.compliance_rule import ComplianceRule, RuleCategory, RuleSeverity


# ---------------------------------------------------------------------------
# Default seed data for common African / global SME jurisdictions
# ---------------------------------------------------------------------------

DEFAULT_RULES: List[Dict[str, Any]] = [
    # Rwanda
    {
        "country_code": "RW", "language_code": "en", "category": "TAX",
        "severity": "CRITICAL",
        "title": "RRA Monthly VAT Filing",
        "description": "Businesses registered for VAT must file monthly VAT returns with Rwanda Revenue Authority by the 15th of the following month.",
        "legal_reference": "Law No. 37/2012 – Value Added Tax",
        "deadline_pattern": "monthly-15",
        "keywords": ["vat", "tax return", "rra", "revenue authority"],
        "action_required": "File Form VAT-3 and remit payment to RRA by the 15th.",
        "penalty_description": "2% penalty per month on unpaid VAT, plus interest.",
    },
    {
        "country_code": "RW", "language_code": "en", "category": "TAX",
        "severity": "CRITICAL",
        "title": "RRA Annual Corporate Income Tax",
        "description": "All companies must file annual income tax returns within 3 months of financial year-end.",
        "legal_reference": "Law No. 16/2005 – Direct Taxes on Income",
        "deadline_pattern": "annual-Q1",
        "keywords": ["corporate tax", "income tax", "annual return"],
        "action_required": "Submit Form CIT and pay within 3 months of year-end.",
        "penalty_description": "10% penalty plus 2% monthly interest on late payment.",
    },
    {
        "country_code": "RW", "language_code": "en", "category": "LABOR",
        "severity": "WARNING",
        "title": "RSSB Social Security Contributions",
        "description": "Employers must remit RSSB contributions (pension + health) by the 15th of the following month.",
        "legal_reference": "Law No. 45/2010 – Pension Scheme",
        "deadline_pattern": "monthly-15",
        "keywords": ["rssb", "pension", "social security", "employee contribution"],
        "action_required": "Submit RSSB declaration and remit 8% employee + 8% employer contributions.",
        "penalty_description": "1.5% monthly penalty on outstanding contributions.",
    },
    # Kenya
    {
        "country_code": "KE", "language_code": "en", "category": "TAX",
        "severity": "CRITICAL",
        "title": "KRA Monthly VAT Return",
        "description": "VAT-registered businesses must file monthly returns by the 20th of the following month.",
        "legal_reference": "VAT Act Cap 476",
        "deadline_pattern": "monthly-20",
        "keywords": ["vat", "kra", "tax return"],
        "action_required": "File VAT return on iTax portal and remit payment.",
        "penalty_description": "5% of the unpaid tax or KES 10,000, whichever is higher.",
    },
    {
        "country_code": "KE", "language_code": "en", "category": "LABOR",
        "severity": "WARNING",
        "title": "NSSF & NHIF Monthly Remittance",
        "description": "Employers must remit NSSF and NHIF contributions by the 9th of the following month.",
        "legal_reference": "NSSF Act 2013 / NHIF Act Cap 255",
        "deadline_pattern": "monthly-9",
        "keywords": ["nssf", "nhif", "social security", "health insurance"],
        "action_required": "File and pay both NSSF and NHIF contributions on the respective portals.",
        "penalty_description": "Penalty of 5% per month on unpaid NSSF; NHIF penalties vary.",
    },
    # Nigeria
    {
        "country_code": "NG", "language_code": "en", "category": "TAX",
        "severity": "CRITICAL",
        "title": "FIRS Monthly VAT Return",
        "description": "Companies registered for VAT must file monthly returns by the 21st of the following month.",
        "legal_reference": "Value Added Tax Act Cap V1",
        "deadline_pattern": "monthly-21",
        "keywords": ["vat", "firs", "value added tax"],
        "action_required": "File Form 002 and remit VAT to FIRS.",
        "penalty_description": "N10,000 first month, N5,000 subsequent months for late filing.",
    },
    # South Africa
    {
        "country_code": "ZA", "language_code": "en", "category": "TAX",
        "severity": "CRITICAL",
        "title": "SARS Bi-Monthly VAT201",
        "description": "VAT vendors must submit VAT201 return every two months via eFiling.",
        "legal_reference": "Value-Added Tax Act 89 of 1991",
        "deadline_pattern": "bimonthly",
        "keywords": ["vat", "sars", "vat201", "efiling"],
        "action_required": "Complete and submit VAT201 on SARS eFiling before due date.",
        "penalty_description": "10% of unpaid VAT plus interest at prescribed rate.",
    },
    # France
    {
        "country_code": "FR", "language_code": "fr", "category": "TAX",
        "severity": "CRITICAL",
        "title": "Déclaration TVA mensuelle",
        "description": "Les entreprises soumises au régime normal doivent déposer une déclaration de TVA mensuelle (CA3).",
        "legal_reference": "Code général des impôts art. 287",
        "deadline_pattern": "monthly",
        "keywords": ["tva", "déclaration", "ca3", "impôts"],
        "action_required": "Déposer la déclaration CA3 et payer la TVA au Trésor Public.",
        "penalty_description": "Majoration de 5 % en cas de retard de paiement.",
    },
    # USA (generic federal)
    {
        "country_code": "US", "language_code": "en", "category": "TAX",
        "severity": "CRITICAL",
        "title": "IRS Quarterly Estimated Tax Payments",
        "description": "Small businesses must make quarterly estimated federal tax payments (Form 1040-ES or 1120-W).",
        "legal_reference": "IRC Section 6654 / 6655",
        "deadline_pattern": "quarterly",
        "keywords": ["estimated tax", "quarterly payment", "irs", "1040-es"],
        "action_required": "Submit Form 941 and estimated payments by April 15, June 15, Sept 15, Jan 15.",
        "penalty_description": "Underpayment penalty computed at federal short-term rate + 3%.",
    },
    # GDPR — applicable to EU companies and those processing EU data
    {
        "country_code": "EU", "language_code": "en", "category": "DATA_PRIVACY",
        "severity": "CRITICAL",
        "title": "GDPR Data Processing Records",
        "description": "Organizations processing personal data of EU residents must maintain records of processing activities (Article 30).",
        "legal_reference": "GDPR Regulation (EU) 2016/679 — Art. 30",
        "deadline_pattern": "ongoing",
        "keywords": ["gdpr", "data protection", "personal data", "processing records"],
        "action_required": "Maintain up-to-date Record of Processing Activities (RoPA) and appoint DPO if required.",
        "penalty_description": "Up to €20 million or 4% of annual global turnover, whichever is higher.",
    },
]


async def seed_default_rules(db: AsyncSession) -> int:
    """Insert default compliance rules if they don't already exist. Returns count inserted."""
    inserted = 0
    for rule_data in DEFAULT_RULES:
        existing = await db.execute(
            select(ComplianceRule).where(
                and_(
                    ComplianceRule.country_code == rule_data["country_code"],
                    ComplianceRule.title == rule_data["title"],
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        category_map = {e.value.upper(): e for e in RuleCategory}
        severity_map = {e.value.upper(): e for e in RuleSeverity}

        rule = ComplianceRule(
            country_code=rule_data["country_code"],
            language_code=rule_data.get("language_code", "en"),
            category=category_map.get(rule_data["category"], RuleCategory.OTHER),
            severity=severity_map.get(rule_data["severity"], RuleSeverity.WARNING),
            title=rule_data["title"],
            description=rule_data["description"],
            legal_reference=rule_data.get("legal_reference"),
            deadline_pattern=rule_data.get("deadline_pattern"),
            keywords=rule_data.get("keywords", []),
            action_required=rule_data.get("action_required"),
            penalty_description=rule_data.get("penalty_description"),
            affected_industries=rule_data.get("affected_industries", []),
        )
        db.add(rule)
        inserted += 1

    await db.commit()
    return inserted


async def get_rules_for_company(
    db: AsyncSession,
    country_code: str,
    industry: Optional[str] = None,
    category: Optional[str] = None,
) -> List[ComplianceRule]:
    """Return active compliance rules applicable to a company."""
    filters = [
        ComplianceRule.is_active.is_(True),
        ComplianceRule.country_code.in_([country_code, "EU"]),
    ]
    if category:
        category_map = {e.value: e for e in RuleCategory}
        cat_enum = category_map.get(category.lower())
        if cat_enum:
            filters.append(ComplianceRule.category == cat_enum)

    result = await db.execute(select(ComplianceRule).where(and_(*filters)))
    rules = result.scalars().all()

    # Filter by industry (empty list means applies to all)
    if industry:
        rules = [
            r for r in rules
            if not r.affected_industries or industry.lower() in [i.lower() for i in r.affected_industries]
        ]

    return rules


def match_rules_to_text(rules: List[ComplianceRule], text: str) -> List[ComplianceRule]:
    """Filter rules whose keywords appear in the given text."""
    text_lower = text.lower()
    matched = []
    for rule in rules:
        if any(kw.lower() in text_lower for kw in (rule.keywords or [])):
            matched.append(rule)
    return matched


async def compute_compliance_gaps(
    db: AsyncSession,
    company_id: str,
    country_code: str,
    industry: Optional[str],
    knowledge_titles: List[str],
) -> Dict[str, Any]:
    """Compare applicable rules against known knowledge entries to find gaps."""
    rules = await get_rules_for_company(db, country_code, industry)
    knowledge_text = " ".join(knowledge_titles).lower()

    covered = []
    gaps = []
    for rule in rules:
        keywords = rule.keywords or []
        is_covered = any(kw.lower() in knowledge_text for kw in keywords)
        entry = {
            "rule_id": str(rule.id),
            "title": rule.title,
            "category": rule.category.value,
            "severity": rule.severity.value,
            "legal_reference": rule.legal_reference,
            "action_required": rule.action_required,
        }
        if is_covered:
            covered.append(entry)
        else:
            gaps.append(entry)

    total = len(rules)
    coverage_pct = round((len(covered) / total * 100) if total else 0, 1)

    return {
        "total_rules": total,
        "covered": len(covered),
        "gaps": len(gaps),
        "coverage_percentage": coverage_pct,
        "covered_rules": covered,
        "gap_rules": gaps,
    }
