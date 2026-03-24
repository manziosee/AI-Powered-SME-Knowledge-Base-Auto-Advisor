"""
Email notification service.

Sends transactional emails via SMTP (Gmail / SendGrid / any SMTP server).
All templates are plain-text with HTML alternatives.

Usage:
    await send_email(to="user@example.com", subject="...", body="...")
    await send_deadline_alert(user, deadline_entry)
    await send_welcome_email(user, company)
    await send_password_reset_email(user, reset_token)
"""

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Core send function
# ---------------------------------------------------------------------------

async def send_email(
    to: str | List[str],
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
    cc: Optional[List[str]] = None,
) -> bool:
    """
    Send an email asynchronously using SMTP.
    Returns True on success, False on failure (never raises).
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("Email not configured — skipping send to %s", to)
        return False

    recipients = [to] if isinstance(to, str) else to

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
    msg["To"] = ", ".join(recipients)
    if cc:
        msg["Cc"] = ", ".join(cc)

    msg.attach(MIMEText(body_text, "plain"))
    if body_html:
        msg.attach(MIMEText(body_html, "html"))

    all_recipients = recipients + (cc or [])

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _smtp_send, msg, all_recipients)
        logger.info("Email sent to %s — subject: %s", recipients, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", recipients, exc)
        return False


def _smtp_send(msg: MIMEMultipart, recipients: List[str]):
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(msg["From"], recipients, msg.as_string())


# ---------------------------------------------------------------------------
# Transactional email templates
# ---------------------------------------------------------------------------

async def send_welcome_email(user_email: str, user_name: str, company_name: str) -> bool:
    subject = f"Welcome to SME Advisor — {company_name}"
    text = f"""Hi {user_name},

Welcome to SME Knowledge Base & Auto Advisor!

Your account has been created for {company_name}.

Getting started:
1. Upload your business documents (contracts, invoices, tax documents)
2. Ask the AI Advisor questions about your compliance status
3. Check your dashboard for upcoming deadlines and risk alerts

If you have any questions, reply to this email.

Best regards,
The SME Advisor Team
"""
    html = f"""
<html><body>
<h2>Welcome to SME Advisor!</h2>
<p>Hi <strong>{user_name}</strong>,</p>
<p>Your account for <strong>{company_name}</strong> is ready.</p>
<h3>Getting Started</h3>
<ol>
  <li>Upload your business documents (contracts, invoices, tax documents)</li>
  <li>Ask the AI Advisor questions about your compliance</li>
  <li>Monitor your dashboard for deadlines and risk alerts</li>
</ol>
<p>Best regards,<br><strong>The SME Advisor Team</strong></p>
</body></html>
"""
    return await send_email(user_email, subject, text, html)


async def send_password_reset_email(
    user_email: str,
    user_name: str,
    reset_token: str,
    frontend_url: str = "http://localhost:3000",
) -> bool:
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    subject = "Reset your SME Advisor password"
    text = f"""Hi {user_name},

You requested a password reset for your SME Advisor account.

Click the link below to set a new password (valid for 1 hour):
{reset_url}

If you didn't request this, ignore this email — your account is safe.

Best regards,
The SME Advisor Team
"""
    html = f"""
<html><body>
<h2>Password Reset</h2>
<p>Hi <strong>{user_name}</strong>,</p>
<p>Click the button below to reset your password. This link expires in 1 hour.</p>
<p><a href="{reset_url}" style="background:#1F4E79;color:#fff;padding:10px 20px;
   text-decoration:none;border-radius:4px;">Reset Password</a></p>
<p>If you didn't request this, ignore this email.</p>
</body></html>
"""
    return await send_email(user_email, subject, text, html)


async def send_deadline_alert(
    user_email: str,
    user_name: str,
    company_name: str,
    deadlines: List[dict],
) -> bool:
    """Send a deadline reminder with a list of upcoming due dates."""
    count = len(deadlines)
    subject = f"⚠️ {count} Upcoming Deadline{'s' if count > 1 else ''} — {company_name}"

    deadline_lines = "\n".join(
        f"  • {d['deadline']} — {d['title']} [{d.get('risk_level', 'medium').upper()}]"
        for d in deadlines
    )
    text = f"""Hi {user_name},

You have {count} upcoming compliance deadline{'s' if count > 1 else ''} for {company_name}:

{deadline_lines}

Log in to your SME Advisor dashboard to review and take action.

Best regards,
The SME Advisor Team
"""
    rows_html = "".join(
        f"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{d['deadline']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee'>{d['title']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;color:{'red' if d.get('risk_level') in ('critical','high') else 'orange'}'>"
        f"{d.get('risk_level','').upper()}</td></tr>"
        for d in deadlines
    )
    html = f"""
<html><body>
<h2>Upcoming Deadlines — {company_name}</h2>
<p>Hi <strong>{user_name}</strong>, you have <strong>{count} upcoming deadline{'s' if count > 1 else ''}</strong>:</p>
<table style='border-collapse:collapse;width:100%'>
  <tr style='background:#1F4E79;color:#fff'>
    <th style='padding:8px;text-align:left'>Due Date</th>
    <th style='padding:8px;text-align:left'>Title</th>
    <th style='padding:8px;text-align:left'>Risk</th>
  </tr>
  {rows_html}
</table>
<p>Log in to take action.</p>
</body></html>
"""
    return await send_email(user_email, subject, text, html)


async def send_compliance_gap_alert(
    user_email: str,
    user_name: str,
    company_name: str,
    gaps: List[dict],
    coverage_pct: float,
) -> bool:
    """Alert admin about compliance gaps."""
    subject = f"Compliance Alert: {coverage_pct}% coverage — {company_name}"
    gap_lines = "\n".join(
        f"  • [{g['severity'].upper()}] {g['title']}"
        for g in gaps[:10]
    )
    text = f"""Hi {user_name},

Compliance coverage for {company_name} is at {coverage_pct}%.

Top gaps identified:
{gap_lines}

Log in to your dashboard to review the full compliance report and take action.

Best regards,
The SME Advisor Team
"""
    return await send_email(user_email, subject, text)


async def send_document_processed_email(
    user_email: str,
    user_name: str,
    filename: str,
    document_type: str,
    summary: str,
    knowledge_count: int,
) -> bool:
    subject = f"Document Processed: {filename}"
    text = f"""Hi {user_name},

Your document "{filename}" has been processed successfully.

Type: {document_type}
Knowledge entries extracted: {knowledge_count}

Summary:
{summary[:500]}

Log in to view the full analysis and ask questions about this document.

Best regards,
The SME Advisor Team
"""
    return await send_email(user_email, subject, text)
