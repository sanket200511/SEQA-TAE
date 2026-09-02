import json
from typing import List
from app.parsers.base import AnalysisParser
from app.schemas.finding import NormalizedFinding
from app.services.categorization import normalize_categorization


class BanditParser(AnalysisParser):
    """Parser for Bandit Python security tool JSON reports."""

    def can_parse(self, content: bytes, filename: str) -> bool:
        try:
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, dict) and "results" in data:
                if len(data["results"]) == 0 or "issue_severity" in data["results"][0]:
                    return True
        except Exception:
            return False
        return False

    def parse(self, content: bytes) -> List[NormalizedFinding]:
        data = json.loads(content.decode("utf-8"))
        results = data.get("results", [])
        findings: List[NormalizedFinding] = []

        for item in results:
            rule_id = item.get("test_id", "bandit-security")
            test_name = item.get("test_name", "Security Issue")
            issue_text = item.get("issue_text", "")
            raw_sev = item.get("issue_severity", "MEDIUM")
            file_path = item.get("filename", "unknown")
            line_num = item.get("line_number")
            code_snippet = item.get("code")

            category, severity, norm_title = normalize_categorization(
                tool="Bandit",
                raw_rule=f"{rule_id}_{test_name}",
                raw_title=f"{test_name}: {issue_text}",
                raw_category="Security Vulnerability",
                raw_severity=raw_sev
            )

            findings.append(
                NormalizedFinding(
                    rule_id=rule_id,
                    title=norm_title,
                    description=f"Bandit Security Finding [{rule_id}]: {issue_text}. More info: {item.get('more_info', '')}",
                    category=category,
                    severity=severity,
                    file_path=file_path,
                    line_number=line_num,
                    column_number=None,
                    code_snippet=code_snippet.strip() if code_snippet else None,
                    suggested_fix="Remediate security flaw using environment variables, safe queries, or sanitized input."
                )
            )

        return findings
