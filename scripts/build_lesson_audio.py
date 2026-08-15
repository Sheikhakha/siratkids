#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_lesson_audio.py - Pre-render per-lesson Arabic audio (MP3) for the
lesson-page audio player.

The lesson player (js/main.js) previously relied solely on the Web Speech API.
This script synthesizes each `.lesson-block .ar` block of every lesson with
offline TTS, converts WAV -> MP3 (ffmpeg), and writes js/audio-manifests.js
(page-relative paths + durations). The player then plays the MP3 with
time-based word highlighting and falls back to speechSynthesis per block when
no MP3 exists.

TTS backend: `tts_arabic` (github.com/nipponjo/tts_arabic) - FastPitch +
HiFi-GAN in ONNX format, trained on Nawar Halabi's Arabic Speech Corpus.

Setup (one time):
    py -3.12 -m venv .venv-audio
    .venv-audio\\Scripts\\pip install git+https://github.com/nipponjo/tts_arabic.git
Requires ffmpeg on PATH for MP3 conversion.

Usage:
    python scripts/build_lesson_audio.py                # full build (all lessons)
    python scripts/build_lesson_audio.py --dry-run      # parse + report only, no synthesis
    python scripts/build_lesson_audio.py --only tawheed-1-1
    python scripts/build_lesson_audio.py --only hadith --track hadith
    python scripts/build_lesson_audio.py --resume       # skip blocks with an existing MP3
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

try:
    import numpy as np
except ImportError:
    np = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LESSONS_DIR = os.path.join(ROOT, "lessons")
AUDIO_DIR = os.path.join(ROOT, "audio", "lessons")
MANIFEST_PATH = os.path.join(ROOT, "js", "audio-manifests.js")
REPORT_PATH = os.path.join(AUDIO_DIR, "_build_report.json")
SR = 22050  # tts_arabic FastPitch + HiFi-GAN output sample rate

SALLA = "\uFDFA"  # ﷺ
ORNATE_L = "\uFD3F"  # ﴿
ORNATE_R = "\uFD3E"  # ﴾
ARABIC_DIGITS = str.maketrans("\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669",
                              "0123456789")

STRIP_CHARS = "\uFD3E\uFD3F[]()\u201C\u201D\u2018\u2019\u00AB\u00BB\u061B"  # ﴾ ﴿ [ ] ( ) quotes


def lesson_files():
    """All lesson HTML pages, deterministically ordered. Unit landing pages excluded."""
    files = []
    for root, _dirs, names in os.walk(LESSONS_DIR):
        for name in sorted(names):
            if not name.endswith(".html"):
                continue
            if root == os.path.join(LESSONS_DIR, "tawheed") and name.startswith("unit"):
                continue
            files.append(os.path.join(root, name))
    return sorted(files)


def page_key_and_prefix(path):
    """(basename_without_ext, relative_dir_depth, audio_subdir_name) for a lesson page."""
    rel = os.path.relpath(path, ROOT)
    parts = rel.replace("\\", "/").split("/")
    base = parts[-1][: -len(".html")]
    depth = len(parts) - 1  # 1 for lessons/x.html, 2 for lessons/track/x.html
    prefix = "../" * depth
    return base, prefix


def block_text(ar_div):
    """Visible spoken text of a `.ar` block, matching js/main.js getBlockText():
    clone, drop buttons/.meaning-btn/.audio-word, collapse whitespace."""
    clone = ar_div.__copy__()
    for sel in ("button", ".meaning-btn", ".audio-word"):
        for node in clone.select(sel):
            node.decompose()
    text = clone.get_text("", strip=False)
    return re.sub(r"\s+", " ", text).strip()


def clean_for_tts(text):
    """Text adjustments so the Halabi-corpus TTS reads naturally:
    - expand ﷺ to the honorific phrase
    - drop ornate brackets, citation brackets, quotes
    - normalize Arabic-Indic digits to ASCII digits
    """
    text = text.replace(SALLA, "\u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645")  # صلى الله عليه وسلم
    text = text.translate(ARABIC_DIGITS)
    text = "".join(ch for ch in text if ch not in STRIP_CHARS)
    return re.sub(r"\s+", " ", text).strip()


def extract_blocks(html_path):
    """[(ar_text, clean_text)] for every `.lesson-block .ar` in document order."""
    if BeautifulSoup is None:
        sys.exit("beautifulsoup4 is required: .venv-audio\\Scripts\\pip install beautifulsoup4")
    soup = BeautifulSoup(open(html_path, encoding="utf-8").read(), "html.parser")
    blocks = []
    for ar in soup.select(".lesson-block .ar"):
        raw = block_text(ar)
        blocks.append((raw, clean_for_tts(raw)))
    return blocks


def synth_block(text, args):
    """Synthesize one block. Returns (wav_array or None, error_str)."""
    if np is None:
        return None, "numpy unavailable"
    from tts_arabic import tts
    try:
        wav = tts(
            text,
            speaker=args.speaker,
            pace=args.pace,
            model_id=args.model,
            vocoder_id=args.vocoder,
            play=False,
            cuda=args.cuda,
        )
    except Exception as exc:  # noqa: BLE001 - report per-block failure, keep going
        return None, "{}: {}".format(type(exc).__name__, exc)
    return wav, None


def to_mp3(wav, out_mp3, tmp_dir):
    """Convert a float numpy wave to MP3 via a temp WAV file."""
    import wave as wavmod
    pcm = np.clip(np.nan_to_num(wav), -1.0, 1.0)
    pcm = (pcm * 32767.0).astype(np.int16)
    tmp_wav = os.path.join(tmp_dir, "block_tmp.wav")
    with wavmod.open(tmp_wav, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return False, "ffmpeg not found on PATH"
    cmd = [ffmpeg, "-y", "-v", "error", "-i", tmp_wav, "-codec:a", "libmp3lame", "-b:a", "128k", out_mp3]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        return False, (res.stderr or res.stdout or "ffmpeg failed").strip()[:300]
    return True, None


def probe_mp3_duration(mp3_path):
    """Duration (seconds) of an existing MP3 via ffprobe; 0.0 if unavailable."""
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return 0.0
    try:
        res = subprocess.run(
            [ffprobe, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", mp3_path],
            capture_output=True, text=True,
        )
        return round(float(res.stdout.strip()), 3)
    except (ValueError, OSError):
        return 0.0


def write_manifest(data):
    """data: {page_key: [entry_or_null, ...]} where entry = {'f': relpath, 'd': dur}."""
    lines = ["(function(g){", "g.__AUDIO_MANIFESTS = g.__AUDIO_MANIFESTS || {};", "var M = g.__AUDIO_MANIFESTS;"]
    for key in sorted(data):
        entries = data[key]
        parts = []
        for e in entries:
            if e is None:
                parts.append("null")
            else:
                parts.append('{f:"%s",d:%s}' % (e["f"], format(e["d"], ".3f")))
        lines.append('M["%s"]=[%s];' % (key, ",".join(parts)))
    lines.append("})(self);")
    os.makedirs(os.path.dirname(MANIFEST_PATH), exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser(description="Pre-render per-lesson Arabic MP3s + js/audio-manifests.js")
    ap.add_argument("--dry-run", action="store_true", help="parse lessons and write the report only")
    ap.add_argument("--only", default=None, help="build only lessons whose basename starts with this value")
    ap.add_argument("--track", default=None, help="restrict --only to a lessons/ subdir (e.g. hadith)")
    ap.add_argument("--speaker", type=int, default=1, help="tts_arabic speaker id (0-3), default 1")
    ap.add_argument("--pace", type=float, default=1.0, help="tts_arabic pace, default 1.0")
    ap.add_argument("--model", default="fastpitch", help="tts_arabic model_id, default fastpitch")
    ap.add_argument("--vocoder", default="hifigan", help="tts_arabic vocoder_id, default hifigan")
    ap.add_argument("--cuda", default=None, help="onnxruntime CUDA device index (default CPU)")
    ap.add_argument("--resume", action="store_true", help="skip blocks whose MP3 already exists")
    args = ap.parse_args()

    files = lesson_files()
    if args.only:
        files = [f for f in files if os.path.basename(f)[: -len(".html")].startswith(args.only)]
        if args.track:
            track_dir = os.path.join(LESSONS_DIR, args.track)
            files = [f for f in files if os.path.dirname(f) == track_dir]

    report = {}
    manifest = {}
    tmp_dir = os.path.join(os.environ.get("TEMP", ROOT), "siratkids_audio")
    os.makedirs(tmp_dir, exist_ok=True)

    t0 = time.time()
    n_blocks = n_synth = n_fail = 0
    for path in files:
        key, prefix = page_key_and_prefix(path)
        blocks = extract_blocks(path)
        if not blocks:
            continue
        out_dir = os.path.join(AUDIO_DIR, key)
        os.makedirs(out_dir, exist_ok=True)
        entries = []
        lesson_report = []
        for i, (raw, clean) in enumerate(blocks):
            n_blocks += 1
            out_mp3 = os.path.join(out_dir, "block-%d.mp3" % (i + 1))
            rel_mp3 = "%saudio/lessons/%s/block-%d.mp3" % (prefix, key, i + 1)
            if args.dry_run:
                entries.append(None)
                lesson_report.append({"index": i + 1, "raw": raw, "clean": clean})
                continue
            if args.resume and os.path.exists(out_mp3) and os.path.getsize(out_mp3) > 1000:
                entries.append({"f": rel_mp3, "d": probe_mp3_duration(out_mp3)})
                n_synth += 1
                lesson_report.append({"index": i + 1, "raw": raw, "clean": clean, "resumed": True})
                continue
            if not clean:
                entries.append(None)
                lesson_report.append({"index": i + 1, "raw": raw, "clean": "", "skipped": "empty"})
                continue
            wav, err = synth_block(clean, args)
            if err or wav is None:
                entries.append(None)
                n_fail += 1
                lesson_report.append({"index": i + 1, "raw": raw, "clean": clean, "error": err})
                print("  [FAIL] %s block %d: %s" % (key, i + 1, err))
                continue
            dur = len(wav) / float(SR)
            ok, cerr = to_mp3(wav, out_mp3, tmp_dir)
            if not ok:
                entries.append(None)
                n_fail += 1
                lesson_report.append({"index": i + 1, "raw": raw, "clean": clean, "error": cerr})
                print("  [FAIL] %s block %d: %s" % (key, i + 1, cerr))
                continue
            entries.append({"f": rel_mp3, "d": round(dur, 3)})
            n_synth += 1
            lesson_report.append({"index": i + 1, "raw": raw, "clean": clean, "file": rel_mp3, "dur": round(dur, 3)})
        manifest[key] = entries
        report[key] = {"file": os.path.relpath(path, ROOT).replace("\\", "/"),
                       "blocks": lesson_report,
                       "count": len(blocks)}
        print("%s: %d block(s), %d OK" % (key, len(blocks), sum(1 for e in entries if e)))

    os.makedirs(AUDIO_DIR, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)

    if not args.dry_run:
        write_manifest(manifest)
        print("Manifest written to %s (%d lessons)" % (MANIFEST_PATH, len(manifest)))
    print("Done in %.1fs | lessons=%d blocks=%d ok=%d fail=%d" %
          (time.time() - t0, len(report), n_blocks, n_synth, n_fail))


if __name__ == "__main__":
    main()
