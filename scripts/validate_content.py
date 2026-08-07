#!/usr/bin/env python3
# Thin entry point that keeps the documented command
# `python scripts/validate_content.py` working. The real suite lives in
# validate_arabic_content.py (kept as one canonical implementation).
from validate_arabic_content import main

if __name__ == '__main__':
    raise SystemExit(main())
