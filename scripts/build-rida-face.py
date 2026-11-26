#!/usr/bin/env python3
import json, os, subprocess, sys, tempfile, glob
import cv2
import numpy as np

VIDEO_INPUT = r"C:\Users\el\antigravity\scratch\PortFolio\public\video\portfolio.mp4".replace(r"\antigravity", r"\.gemini\antigravity")
OUT_DIR = r"C:\Users\el\antigravity\scratch\dev-portfolio-template".replace(r"\antigravity", r"\.gemini\antigravity")

FPS = 24
TARGET_W = 430
TARGET_H = 590
POINTS = 34

print(f"Reading video: {VIDEO_INPUT}")
cap = cv2.VideoCapture(VIDEO_INPUT)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS) or FPS
print(f"Total frames: {total_frames}, FPS: {fps}")

tmp = tempfile.mkdtemp(prefix="rida_face_")
print(f"Temp directory: {tmp}")

# Crop region in 1920x1080: X=610..1300 (W=690), Y=50..995 (H=945)
CROP_Y1, CROP_Y2 = 50, 995
CROP_X1, CROP_X2 = 610, 1300

frame_idx = 0
paths = []

while True:
    ok, frame = cap.read()
    if not ok:
        break
    
    crop = frame[CROP_Y1:CROP_Y2, CROP_X1:CROP_X2]
    
    # Compute corner background color
    corners = np.vstack([crop[:30, :30], crop[:30, -30:], crop[-30:, :30]])
    bg_color = np.median(corners, axis=(0, 1))
    
    # Distance to bg
    diff = np.linalg.norm(crop.astype(float) - bg_color, axis=2)
    back = (diff < 22).astype(np.uint8) * 255
    back = cv2.morphologyEx(back, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    back = cv2.morphologyEx(back, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    
    keep = 1.0 - cv2.GaussianBlur(back, (0, 0), 1.5).astype(np.float32) / 255.0
    out = (crop.astype(np.float32) * keep[:, :, None]).clip(0, 255).astype(np.uint8)
    
    # CLAHE tone adjustment for clear ASCII glyph luminance
    lab = cv2.cvtColor(out, cv2.COLOR_BGR2LAB)
    L = lab[:, :, 0]
    subject = L > 6
    cl = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(4, 4))
    L2 = cl.apply(L)
    lut = (255 * (np.arange(256) / 255.0) ** 0.8).astype(np.uint8)
    lab[:, :, 0] = np.where(subject, cv2.LUT(L2, lut), 0)
    out = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    resized = cv2.resize(out, (TARGET_W, TARGET_H), interpolation=cv2.INTER_LANCZOS4)
    
    p = os.path.join(tmp, f"{frame_idx:04d}.png")
    cv2.imwrite(p, resized)
    paths.append(p)
    frame_idx += 1

cap.release()
print(f"Processed {len(paths)} frames.")

# Encode VP9 webm and H264 mp4
out_webm = os.path.join(OUT_DIR, "face.webm")
out_mp4 = os.path.join(OUT_DIR, "face.mp4")
out_json = os.path.join(OUT_DIR, "face-track.json")

src = ["-framerate", str(FPS), "-i", os.path.join(tmp, "%04d.png")]
print("Encoding face.webm...")
subprocess.run(["ffmpeg", "-y", "-v", "error", *src, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "34", "-pix_fmt", "yuv420p", out_webm], check=True)

print("Encoding face.mp4...")
subprocess.run(["ffmpeg", "-y", "-v", "error", *src, "-c:v", "libx264", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out_mp4], check=True)

# Optical flow tracking on face.mp4
print("Computing facial tracking points...")
cap = cv2.VideoCapture(out_mp4)
gray_frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    gray_frames.append(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))
cap.release()

H, W = gray_frames[0].shape
corners = cv2.goodFeaturesToTrack(gray_frames[0], maxCorners=POINTS, qualityLevel=0.005, minDistance=max(8, W // 22), blockSize=7)
if corners is None:
    sys.exit("No corners detected")

pts = corners.reshape(-1, 2).astype(np.float32)
rng = np.random.default_rng(1)
while len(pts) < POINTS:
    pts = np.vstack([pts, pts[len(pts) % len(pts)] + rng.normal(0, 6, 2).astype(np.float32)])

alive = np.ones(len(pts), bool)
lk = dict(winSize=(21, 21), maxLevel=3, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))

def pack(p, ok):
    return [[round(float(x) / W, 4), round(float(y) / H, 4)] if k else None for (x, y), k in zip(p, ok)]

track = [pack(pts, alive)]
for prev, cur in zip(gray_frames, gray_frames[1:]):
    nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev, cur, pts, None, **lk)
    back, st2, _ = cv2.calcOpticalFlowPyrLK(cur, prev, nxt, None, **lk)
    good = (st.ravel() == 1) & (st2.ravel() == 1) & (np.abs(back - pts).max(axis=1) < 3.0)
    inside = (nxt[:, 0] >= 0) & (nxt[:, 0] < W) & (nxt[:, 1] >= 0) & (nxt[:, 1] < H)
    alive &= good & inside
    pts = np.where(alive[:, None], nxt, pts)
    track.append(pack(pts, alive))

result = {
    "fps": FPS,
    "width": TARGET_W,
    "height": TARGET_H,
    "frames": track
}

with open(out_json, "w", encoding="utf-8") as f:
    json.dump(result, f, separators=(",", ":"))

print(f"Successfully generated: face.webm, face.mp4, face-track.json ({len(track)} frames)")
