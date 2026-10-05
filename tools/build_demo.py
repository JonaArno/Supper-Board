#!/usr/bin/env python3
"""Build docs/index.html (the standalone demo) from board/supper-board.html.

The board file is written the way Claude artifacts expect: page content only,
no <html>/<head> wrapper. This script adds a minimal document shell plus the
demo shim and sample data, so the page runs anywhere (GitHub Pages, or opened
straight from disk).

Usage:  python3 tools/build_demo.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
board = (ROOT / "board" / "supper-board.html").read_text(encoding="utf-8")

shell_head = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
</style>
<script src="seed.js"></script>
<script src="claude-shim.js"></script>
</head>
<body>
"""
shell_tail = "\n</body>\n</html>\n"

out = ROOT / "docs" / "index.html"
out.write_text(shell_head + board + shell_tail, encoding="utf-8")
print(f"Wrote {out.relative_to(ROOT)}")
