import json
from typing import List
from app.parsers.base import AnalysisParser
from app.schemas.finding import NormalizedFinding
from app.services.categorization import normalize_categorization


class PylintParser(AnalysisParser):
    """Parser for Pylint JSON output reports."""

    def can_parse(self, content: bytes, filename: str) -> bool:
        try:
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, list) and len(data) > 0:
                item = data[0]
                if "symbol" in item and "message-id" in item:
                    return True
        except Exception:
            return False
        return False

    def parse(self, content: bytes) -> List[NormalizedFinding]:
        data = json.loads(content.decode("utf-8"))
        findings: List[NormalizedFinding] = []

        for item in data:
            rule_id = item.get("message-id") or item.get("symbol", "pylint-issue")
            symbol = item.get("symbol", "")
            message = item.get("message", "")
            file_path = item.get("path") or item.get("module", "unknown")
            line_num = item.get("line")
            col_num = item.get("column")
            msg_type = item.get("type", "warning")

            category, severity, norm_title = normalize_categorization(
                tool="Pylint",
                raw_rule=f"{rule_id} {symbol}",
                raw_title=f"{symbol}: {message}",
                raw_category="Code Smell" if msg_type in ["convention", "refactor", "warning"] else "Bug",
                raw_severity=msg_type
            )

            findings.append(
                NormalizedFinding(
                    rule_id=rule_id,
                    title=norm_title,
                    description=f"Pylint [{rule_id}:{symbol}] in object '{item.get('obj', '')}': {message}",
                    category=category,
                    severity=severity,
                    file_path=file_path,
                    line_number=line_num,
                    column_number=col_num,
                    code_snippet=None,
                    suggested_fix=f"Follow PEP 8 or refactor symbol '{symbol}'."
                )
            )

        return findings
