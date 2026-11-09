from sqlalchemy import select
from sqlalchemy.orm import Session

from core.security import hash_password

from .models import User
from .schemas import EmployeeImport, EmployeeImportResult

TEMPORARY_PASSWORD = "temporary_password"


def import_employees(db: Session, employees: list[EmployeeImport]) -> EmployeeImportResult:
    incoming_email_ids = {
        employee.highspring_email.strip()
        for employee in employees
        if employee.highspring_email and employee.highspring_email.strip()
    }
    existing_email_ids = set(
        db.scalars(
            select(User.hs_email_id).where(User.hs_email_id.in_(incoming_email_ids))
        ).all()
    )

    created = 0
    skipped = 0
    skipped_missing_email = 0
    seen_email_ids = set()

    for employee in employees:
        highspring_email = (employee.highspring_email or "").strip()
        if not highspring_email:
            skipped_missing_email += 1
            continue

        if (
            highspring_email in existing_email_ids
            or highspring_email in seen_email_ids
        ):
            skipped += 1
            continue

        seen_email_ids.add(highspring_email)
        db.add(
            User(
                hs_email_id=highspring_email,
                google_email=employee.email,
                ldap=employee.ldap,
                password=hash_password(TEMPORARY_PASSWORD),
                first_name=employee.first_name,
                last_name=employee.last_name,
                role=employee.role,
                is_password_reset_required=True,
            )
        )
        created += 1

    db.commit()
    return EmployeeImportResult(
        created=created,
        skipped=skipped,
        skipped_missing_email=skipped_missing_email,
    )
