from typing import List, Tuple, Optional
from app.parsers.base import AnalysisParser
from app.parsers.eslint import ESLintParser
from app.parsers.bandit import BanditParser
from app.parsers.semgrep import SemgrepParser
from app.parsers.pylint import PylintParser
from app.parsers.csv_parser import CSVParser
from app.parsers.generic_json import GenericJSONParser
from app.schemas.finding import NormalizedFinding


class ParserRegistry:
    """Registry that manages available static analysis log parsers."""

    def __init__(self):
        self.parsers: List[Tuple[str, AnalysisParser]] = [
            ("Bandit", BanditParser()),
            ("ESLint", ESLintParser()),
            ("Semgrep", SemgrepParser()),
            ("Pylint", PylintParser()),
            ("CSV", CSVParser()),
            ("Generic JSON", GenericJSONParser()),
        ]

    def auto_detect_and_parse(self, content: bytes, filename: str) -> Tuple[str, List[NormalizedFinding]]:
        """
        Iterates over registered parsers to detect format and parse findings.
        Returns a tuple of (detected_tool_name, list_of_normalized_findings).
        """
        for tool_name, parser in self.parsers:
            if parser.can_parse(content, filename):
                findings = parser.parse(content)
                return tool_name, findings

        raise ValueError(
            f"Unable to parse file '{filename}'. The file format or log structure is not recognized. "
            "Supported formats: ESLint JSON, Bandit JSON, Semgrep JSON, Pylint JSON, CSV, or Generic JSON."
        )

    def parse_with_tool(self, tool_name: str, content: bytes, filename: str) -> List[NormalizedFinding]:
        """Parses content using a specifically selected tool parser."""
        for registered_name, parser in self.parsers:
            if registered_name.lower() == tool_name.lower():
                return parser.parse(content)

        # Fallback to auto-detect
        _, findings = self.auto_detect_and_parse(content, filename)
        return findings


registry = ParserRegistry()
