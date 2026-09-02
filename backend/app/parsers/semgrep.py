import json
from typing import List
from app.parsers.base import AnalysisParser
from app.schemas.finding import NormalizedFinding
from app.services.categorization import normalize_categorization


class SemgrepParser(AnalysisParser):
    """Parser for Semgrep SAST tool JSON reports."""

    def can_parse(self, content: bytes, filename: str) -> bool:
        try:
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, dict) and "results" in data:
                if len(data["results"]) == 0 or ("check_id" in data["results"][0] and "extra" in data["results"][0]):
                    return True
        except Exception:
            return False
        return False

    def parse(self, content: bytes) -> List[NormalizedFinding]:
        data = json.loads(content.decode("utf-8"))
        results = data.get("results", [])
        findings: List[NormalizedFinding] = []

        for item in results:
            check_id = item.get("check_id", "semgrep-check")
            file_path = item.get("path", "unknown")
            start = item.get("start", {})
            line_num = start.get("line")
            col_num = start.get("col")

            extra = item.get("extra", {})
            message = extra.get("message", "Semgrep finding")
            raw_sev = extra.get("severity", "WARNING")
            snippet = extra.get("lines")

            category, severity, norm_title = normalize_categorization(
                tool="Semgrep",
                raw_rule=check_id,
                raw_title=message,
                raw_severity=raw_sev
            )

            findings.append(
                NormalizedFinding(
                    rule_id=check_id.split(".")[-1] if "." in check_id else check_id,
                    title=norm_title,
                    description=f"Semgrep check [{check_id}]: {message}",
                    category=category,
                    severity=severity,
                    file_path=file_path,
                    line_number=line_num,
                    column_number=col_num,
                    code_snippet=snippet.strip() if snippet else None,
                    suggested_fix=f"Review semgrep rule [{check_id}] recommendations and update code."
                )
            )

        return findings
