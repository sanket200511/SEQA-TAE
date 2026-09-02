import json
from typing import List
from app.parsers.base import AnalysisParser
from app.schemas.finding import NormalizedFinding
from app.services.categorization import normalize_categorization


class ESLintParser(AnalysisParser):
    """Parser for ESLint JSON reports."""

    def can_parse(self, content: bytes, filename: str) -> bool:
        if not filename.endswith(".json") and "eslint" not in filename.lower():
            return False
        try:
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, list) and len(data) > 0 and "filePath" in data[0] and "messages" in data[0]:
                return True
        except Exception:
            return False
        return False

    def parse(self, content: bytes) -> List[NormalizedFinding]:
        data = json.loads(content.decode("utf-8"))
        findings: List[NormalizedFinding] = []

        for file_entry in data:
            file_path = file_entry.get("filePath", "unknown")
            messages = file_entry.get("messages", [])

            for msg in messages:
                rule_id = msg.get("ruleId") or "eslint-general"
                title = msg.get("message", "ESLint issue detected")
                raw_sev = "High" if msg.get("severity") == 2 else "Medium"
                
                category, severity, norm_title = normalize_categorization(
                    tool="ESLint",
                    raw_rule=rule_id,
                    raw_title=title,
                    raw_severity=raw_sev
                )

                findings.append(
                    NormalizedFinding(
                        rule_id=rule_id,
                        title=norm_title,
                        description=f"ESLint rule '{rule_id}': {title}",
                        category=category,
                        severity=severity,
                        file_path=file_path,
                        line_number=msg.get("line"),
                        column_number=msg.get("column"),
                        code_snippet=None,
                        suggested_fix=f"Review ESLint rule configuration or refactor line {msg.get('line')}"
                    )
                )

        return findings
