#!/bin/sh
# Pre-pull the FaceFusion models once, then start the swap API.
#
# FaceFusion normally downloads models lazily on the first run, which makes the
# first face swap very slow. We instead pre-download them at container startup
# into /facefusion/.assets, which is a named docker volume — so the download
# happens once and persists across restarts (the marker file makes restarts a
# no-op).
#
# FaceFusion has no per-model download flag; `force-download` only supports a
# `lite` / `full` scope. We pre-pull `lite` (the reliable minimal set: face
# analyser + a base swapper) — `full` is avoided because it greedily fetches many
# unrelated heavy models (frame colorizer, deep-swap "corridor", age modifier, …)
# and a single corrupt source aborts the whole thing. The extra models our
# max-quality swap config needs (hyperswap swapper, GFPGAN enhancer, occlusion
# masker) are auto-downloaded lazily on the FIRST swap, then cached in the volume,
# so only that first swap is slow.
set -e

ASSETS_DIR="/facefusion/.assets"
MARKER="${ASSETS_DIR}/.models-downloaded"

if [ -f "${MARKER}" ]; then
  echo "[facefusion] Pre-download already attempted; skipping."
else
  # Skip the bulk `force-download --download-scope lite` — it pulls many
  # unrelated heavy models (deoldify colorizer, etc.) that we don't use and
  # can exhaust disk space. Instead, just start the server; the models our
  # swap config actually needs (hyperswap swapper, GFPGAN enhancer, occluder,
  # face analyser) are auto-downloaded lazily on the FIRST swap, validated,
  # and cached in the volume — so only that first swap is slow.
  echo "[facefusion] Skipping bulk pre-download; models will download lazily on first swap."
  touch "${MARKER}"
fi

echo "[facefusion] Starting swap API on :7865"
exec uvicorn server:app --host 0.0.0.0 --port 7865 --app-dir /facefusion
