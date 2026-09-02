import json
from typing import List
from app.parsers.base import AnalysisParser
from app.schemas.finding import NormalizedFinding
from app.services.categorization import normalize_categorization


class GenericJSONParser(AnalysisParser):
    """Fallback parser for generic JSON arrays or dicts containing static analysis findings."""

    def can_parse(self, content: bytes, filename: str) -> bool:
        if not filename.endswith(".json"):
            return False
        try:
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                return True
            if isinstance(data, dict) and any(k in data for k in ["findings", "issues", "results", "reports"]):
                return True
        except Exception:
            return False
        return False

    def parse(self, content: bytes) -> List[NormalizedFinding]:
        data = json.loads(content.decode("utf-8"))
        items = []

        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            for key in ["findings", "issues", "results", "reports"]:
                if key in data and isinstance(data[key], list):
                    items = data[key]
                    break

        findings: List[NormalizedFinding] = []
        for item in items:
            if not isinstance(item, dict):
                continue

            rule_id = str(item.get("rule_id") or item.get("rule") or item.get("id") or item.get("key") or "JSON-FINDING")
            title = str(item.get("title") or item.get("message") or item.get("name") or item.get("description") or "Static finding")
            description = str(item.get("description") or title)
            raw_cat = item.get("category") or item.get("type")
            raw_sev = item.get("severity") or item.get("level")
            file_path = str(item.get("file_path") or item.get("file") or item.get("path") or item.get("filename") or "unknown")

            line_num = item.get("line_number") or item.get("line")
            if line_num is not None:
                try:
                    line_num = int(line_num)
                except (ValueError, TypeError):
                    line_num = None

            col_num = item.get("column_number") or item.get("column") or item.get("col")
            if col_num is not None:
                try:
                    col_num = int(col_num)
                except (ValueError, TypeError):
                    col_num = None

            code_snippet = item.get("code_snippet") or item.get("snippet") or item.get("code")
            suggested_fix = item.get("suggested_fix") or item.get("fix") or item.get("remediation")

            category, severity, norm_title = normalize_categorization(
                tool="Generic JSON",
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
                    column_number=col_num,
                    code_snippet=code_snippet,
                    suggested_fix=suggested_fix or "Fix identified issue in according to project standards."
                )
            )

        return findings
