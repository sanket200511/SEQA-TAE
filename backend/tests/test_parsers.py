import json
from app.parsers.eslint import ESLintParser
from app.parsers.bandit import BanditParser
from app.parsers.semgrep import SemgrepParser
from app.parsers.pylint import PylintParser
from app.parsers.csv_parser import CSVParser


def test_eslint_parser():
    data = [
        {
            "filePath": "src/app.js",
            "messages": [
                {
                    "ruleId": "no-unused-vars",
                    "severity": 2,
                    "message": "'val' is defined but never used.",
                    "line": 5,
                    "column": 2
                }
            ]
        }
    ]
    parser = ESLintParser()
    content = json.dumps(data).encode("utf-8")

    assert parser.can_parse(content, "report.json") is True
    findings = parser.parse(content)
    assert len(findings) == 1
    assert findings[0].category == "Code Smell"
    assert "Unused Variable" in findings[0].title


def test_bandit_parser():
    data = {
        "results": [
            {
                "test_id": "B105",
                "test_name": "hardcoded_password_string",
                "issue_text": "Possible hardcoded password",
                "issue_severity": "HIGH",
                "filename": "config.py",
                "line_number": 10,
                "code": "SECRET = '1234'"
            }
        ]
    }
    parser = BanditParser()
    content = json.dumps(data).encode("utf-8")

    assert parser.can_parse(content, "bandit.json") is True
    findings = parser.parse(content)
    assert len(findings) == 1
    assert findings[0].category == "Security Vulnerability"
    assert findings[0].severity == "High"


def test_csv_parser():
    csv_data = "rule,message,severity,file,line,category\nSEC-01,Secret found,HIGH,app.py,12,Security Vulnerability\n"
    parser = CSVParser()
    content = csv_data.encode("utf-8")

    assert parser.can_parse(content, "test.csv") is True
    findings = parser.parse(content)
    assert len(findings) == 1
    assert findings[0].rule_id == "SEC-01"
