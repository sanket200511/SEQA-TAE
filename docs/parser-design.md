# Parser Architecture — CodeLens

## Abstract Interface
All parsers inherit from `AnalysisParser`:

```python
class AnalysisParser(ABC):
    @abstractmethod
    def can_parse(self, content: bytes, filename: str) -> bool:
        pass

    @abstractmethod
    def parse(self, content: bytes) -> List[NormalizedFinding]:
        pass
```

## Implemented Tool Parsers
1. **BanditParser**: Parses Python security reports, extracting CWE identifiers and raw code snippets.
2. **ESLintParser**: Parses JavaScript/TypeScript linting outputs, mapping `complexity` and `no-unused-vars`.
3. **SemgrepParser**: Parses Semgrep SAST JSON rules for path traversal, SQL injection, and hardcoded secrets.
4. **PylintParser**: Parses Pylint outputs (`C0103`, `R0915`, `W0612`), categorizing code smells.
5. **CSVParser**: Generic CSV log importer reading rule, message, severity, file, line, and category headers.
6. **GenericJSONParser**: Fallback parser for standard array logs.
