import hashlib
from typing import Optional


def generate_fingerprint(
    tool: str,
    rule_id: str,
    file_path: str,
    code_snippet: Optional[str] = None,
    line_number: Optional[int] = None
) -> str:
    """
    Computes a deterministic SHA-256 fingerprint for static analysis findings.
    Allows tracking the identity of an issue across multiple analysis runs regardless of slight line shifts.
    """
    clean_tool = (tool or "").strip().lower()
    clean_rule = (rule_id or "").strip().lower()
    clean_path = (file_path or "").strip().lower().replace("\\", "/")

    if code_snippet and len(code_snippet.strip()) > 0:
        content_key = "".join(code_snippet.strip().split())  # strip whitespace variations
    else:
        content_key = f"line_{line_number or 0}"

    raw_string = f"{clean_tool}|{clean_rule}|{clean_path}|{content_key}"
    return hashlib.sha256(raw_string.encode("utf-8")).hexdigest()
