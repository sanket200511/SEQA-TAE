from abc import ABC, abstractmethod
from typing import List
from app.schemas.finding import NormalizedFinding


class AnalysisParser(ABC):
    """Abstract Base Class for all Static Code Analysis log parsers."""

    @abstractmethod
    def can_parse(self, content: bytes, filename: str) -> bool:
        """Determines if the log file content can be parsed by this parser instance."""
        pass

    @abstractmethod
    def parse(self, content: bytes) -> List[NormalizedFinding]:
        """Parses raw content into a list of normalized findings."""
        pass
