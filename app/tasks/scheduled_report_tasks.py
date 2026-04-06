"""
Scheduled report delivery task.

Runs hourly via Celery Beat. For each Report with a cron schedule whose
next_run_at <= now, it generates the report and emails it, then updates
next_run_at for the next cycle.
"""

from app.core.celery_app import celery_app


@celery_app.task(name="app.tasks.scheduled_report_tasks.deliver_scheduled_reports")
def deliver_scheduled_reports():
    import asyncio
    from datetime import datetime

    async def run():
        from app.core.database import AsyncSessionLocal
        from app.models.report import Report, ReportStatus, ReportType, ReportFormat
        from app.models.company import Company
        from app.services.report_service import generate_pdf_report, generate_excel_report
        from sqlalchemy import select, and_

        async with AsyncSessionLocal() as db:
            now = datetime.utcnow()

            result = await db.execute(
                select(Report).where(
                    and_(
                        Report.schedule.isnot(None),
                        Report.next_run_at <= now,
                        Report.schedule_email.isnot(None),
                    )
                )
            )
            due_reports = result.scalars().all()

            for report in due_reports:
                try:
                    # Load company
                    company_result = await db.execute(
                        select(Company).where(Company.id == report.company_id)
                    )
                    company = company_result.scalar_one_or_none()
                    if not company:
                        continue

                    # Build report data (reuse analytics helper logic)
                    from app.api.v1.endpoints.analytics import _build_report_data
                    report_data = await _build_report_data(db, report.company_id, report.report_type)

                    if report.report_format == ReportFormat.PDF:
                        content = generate_pdf_report(report_data, company.name, report.report_type.value)
                        mime = "application/pdf"
                        ext = "pdf"
                    elif report.report_format == ReportFormat.EXCEL:
                        content = generate_excel_report(report_data, company.name, report.report_type.value)
                        mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        ext = "xlsx"
                    else:
                        content = str(report_data).encode()
                        mime = "text/plain"
                        ext = "txt"

                    # Send email with attachment
                    _send_report_email(
                        recipients=report.schedule_email,
                        company_name=company.name,
                        report_type=report.report_type.value,
                        content=content,
                        mime=mime,
                        ext=ext,
                    )

                    # Advance next_run_at
                    try:
                        from croniter import croniter
                        cron = croniter(report.schedule, now)
                        report.next_run_at = cron.get_next(datetime)
                    except Exception:
                        report.next_run_at = None  # disable if cron is invalid

                    report.last_sent_at = now
                    report.status = ReportStatus.READY

                except Exception as exc:
                    import logging
                    logging.getLogger(__name__).error("Scheduled report %s failed: %s", report.id, exc)
                    report.status = ReportStatus.FAILED
                    report.error_message = str(exc)

            await db.commit()

    asyncio.run(run())


def _send_report_email(recipients: str, company_name: str, report_type: str, content: bytes, mime: str, ext: str):
    """Best-effort SMTP send with report as attachment."""
    import smtplib
    import email.mime.multipart
    import email.mime.base
    import email.mime.text
    import email.encoders
    from app.core.config import settings

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return  # SMTP not configured — skip silently

    msg = email.mime.multipart.MIMEMultipart()
    msg["Subject"] = f"[AdvisorAI] Scheduled Report: {report_type.replace('_', ' ').title()} — {company_name}"
    msg["From"] = settings.SMTP_USER
    msg["To"] = recipients

    body = email.mime.text.MIMEText(
        f"Hi,\n\nPlease find attached your scheduled {report_type.replace('_', ' ')} report for {company_name}.\n\nAdvisorAI",
        "plain",
    )
    msg.attach(body)

    part = email.mime.base.MIMEBase("application", "octet-stream")
    part.set_payload(content)
    email.encoders.encode_base64(part)
    part.add_header("Content-Disposition", f'attachment; filename="{report_type}_{company_name}.{ext}"')
    msg.attach(part)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.sendmail(settings.SMTP_USER, [r.strip() for r in recipients.split(",")], msg.as_string())
