# Testing Strategy — CodeLens

Testing is vital to verify SQA defect tracking:

## Backend Unit & Integration Tests
Located in `backend/tests/`:
1. `test_parsers.py`: Validates file format auto-detection and accurate conversion into `NormalizedFinding` structures.
2. `test_analysis_lifecycle.py`: Tests the vulnerability resolution state machine (`OPEN` -> `IN PROGRESS` -> `RESOLVED`) and regression re-detection.

### Running Backend Tests
```bash
cd backend
pytest -v
```
