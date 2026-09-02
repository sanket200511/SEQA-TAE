import re
from typing import Tuple, Optional

# Mapping rules for Code Smells & Security Vulnerabilities

CODE_SMELL_RULES = {
    # Complexity
    r"(complexity|c901|cyclomatic|too-complex|function-too-complex)": "High Cyclomatic Complexity",
    # Unused
    r"(unused|w0612|no-unused-vars|unused-variable|unused-import|unused-argument)": "Unused Variable",
    # Duplication
    r"(duplicate|r0801|duplicate-code|copy-paste)": "Duplicate Code",
    # Long Method / Class
    r"(long-method|max-lines-per-function|too-many-statements|too-many-lines|large-class)": "Long Method / Large Class",
    # Deep Nesting
    r"(nesting|max-depth|too-many-nested-blocks)": "Deep Nesting",
    # Magic Numbers
    r"(magic-number|no-magic-numbers|magic-value)": "Magic Number",
    # Naming
    r"(naming|c0103|invalid-name|camelcase|snake_case)": "Poor Naming",
    # Dead Code
    r"(dead-code|unreachable|no-unreachable)": "Dead Code",
    # Parameters
    r"(max-params|too-many-arguments|too-many-instance-attributes)": "Too Many Parameters",
}

SECURITY_RULES = {
    r"(sql|sql-injection|b608|sqli)": ("SQL Injection", "Critical"),
    r"(password|secret|key|b105|b106|hardcoded|credential)": ("Hardcoded Secret", "High"),
    r"(crypto|md5|sha1|b303|b311|weak-cryptography)": ("Weak Cryptography", "Medium"),
    r"(command|shell|exec|subprocess|b602|b603|eval|system)": ("Command Injection", "Critical"),
    r"(path|traversal|directory-traversal|b304|b305)": ("Path Traversal", "High"),
    r"(random|insecure-random|b311)": ("Insecure Randomness", "Medium"),
    r"(xss|cross-site|sanitiz)": ("Cross-Site Scripting (XSS)", "High"),
}


def normalize_categorization(
    tool: str,
    raw_rule: str,
    raw_title: str,
    raw_category: Optional[str] = None,
    raw_severity: Optional[str] = None
) -> Tuple[str, str, str]:
    """
    Normalizes a finding into:
    (category, severity, detailed_title)
    
    Categories:
      - Security Vulnerability
      - Code Smell
      - Bug
      - Performance
      - Maintainability
      - Other
    """
    rule_lower = (raw_rule + " " + raw_title + " " + (raw_category or "")).lower()

    # 1. Check for Security Vulnerabilities
    for pattern, (sec_subcat, default_sev) in SECURITY_RULES.items():
        if re.search(pattern, rule_lower):
            severity = normalize_severity(raw_severity) or default_sev
            return "Security Vulnerability", severity, f"{sec_subcat}: {raw_title}"

    # 2. Check for Code Smells
    for pattern, smell_subcat in CODE_SMELL_RULES.items():
        if re.search(pattern, rule_lower):
            severity = normalize_severity(raw_severity) or "Medium"
            return "Code Smell", severity, f"{smell_subcat}: {raw_title}"

    # 3. Fallback based on raw category or severity
    cat = "Other"
    if raw_category:
        cat_lower = raw_category.lower()
        if "sec" in cat_lower or "vuln" in cat_lower:
            cat = "Security Vulnerability"
        elif "smell" in cat_lower or "style" in cat_lower or "refactor" in cat_lower:
            cat = "Code Smell"
        elif "bug" in cat_lower or "error" in cat_lower:
            cat = "Bug"
        elif "perf" in cat_lower:
            cat = "Performance"

    severity = normalize_severity(raw_severity) or "Low"
    return cat, severity, raw_title


def normalize_severity(raw_sev: Optional[str]) -> Optional[str]:
    if not raw_sev:
        return None

    sev_upper = str(raw_sev).upper()
    if any(k in sev_upper for k in ["CRIT", "ERROR", "HIGH", "FATAL"]):
        if "CRIT" in sev_upper or "FATAL" in sev_upper:
            return "Critical"
        return "High"
    elif any(k in sev_upper for k in ["MED", "WARN", "MEDIUM"]):
        return "Medium"
    elif any(k in sev_upper for k in ["LOW", "MINOR"]):
        return "Low"
    elif any(k in sev_upper for k in ["INFO", "NOTE", "STYLE"]):
        return "Informational"

    return "Medium"
