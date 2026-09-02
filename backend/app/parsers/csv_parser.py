import csv
import io
from typing import List
from app.parsers.base import AnalysisParser
from app.schemas.finding import NormalizedFinding
from app.services.categorization import normalize_categorization


class CSVParser(AnalysisParser):
    """Parser for generic static code analysis CSV files."""

    def can_parse(self, content: bytes, filename: str) -> bool:
        if filename.endswith(".csv"):
            return True
        try:
            sample = content.decode("utf-8")[:500]
            return "rule" in sample.lower() and ("file" in sample.lower() or "line" in sample.lower())
        except Exception:
            return False

    def parse(self, content: bytes) -> List[NormalizedFinding]:
        text = content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        findings: List[NormalizedFinding] = []

        for row in reader:
            # Case-insensitive dict lookup helper
            row_clean = {str(k).strip().lower(): str(v).strip() for k, v in row.items() if k}

            rule_id = row_clean.get("rule") or row_clean.get("rule_id") or row_clean.get("code") or "GENERIC-CSV"
            title = row_clean.get("message") or row_clean.get("title") or row_clean.get("description") or "Static finding"
            description = row_clean.get("description") or title
            raw_cat = row_clean.get("category") or row_clean.get("type")
            raw_sev = row_clean.get("severity") or row_clean.get("level")
            file_path = row_clean.get("file") or row_clean.get("file_path") or row_clean.get("path") or "unknown"
            
            line_str = row_clean.get("line") or row_clean.get("line_number")
            line_num = int(line_str) if line_str and line_str.isdigit() else None

            code_snippet = row_clean.get("code") or row_clean.get("snippet") or row_clean.get("code_snippet")
            suggested_fix = row_clean.get("fix") or row_clean.get("suggested_fix") or row_clean.get("remediation")

            category, severity, norm_title = normalize_categorization(
                tool="CSV Import",
                raw_rule=rule_id,
                raw_title=title,
                raw_category=raw_cat,
                raw_severity=raw_sev
            )

            findings.append(
                NormalizedFinding(
                    rule_id=rule_id,
                    title=norm_title,
                    description=description,
                    category=category,
                    severity=severity,
                    file_path=file_path,
                    line_number=line_num,
                    column_number=None,
                    code_snippet=code_snippet,
                    suggested_fix=suggested_fix or "Remediate finding according to coding standards."
                )
            )

        return findings
