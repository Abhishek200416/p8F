import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw, X, BadgeCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';
const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4';

/* ═══════════════════════════════════════════════
   MEDIAPIPE LOADER — Singleton CDN load
   ═══════════════════════════════════════════════ */
let _fmInstance = null;
let _fmLoading = false;
let _fmCbs = [];

function loadFaceMesh() {
  return new Promise((resolve) => {
    if (_fmInstance) { resolve(_fmInstance); return; }
    _fmCbs.push(resolve);
    if (_fmLoading) return;
    _fmLoading = true;
    const s = document.createElement('script');
    s.src = `${MEDIAPIPE_CDN}/face_mesh.js`;
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      try {
        const fm = new window.FaceMesh({ locateFile: f => `${MEDIAPIPE_CDN}/${f}` });
        fm.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        fm.onResults(() => {});
        fm.initialize().then(() => { _fmInstance = fm; _fmCbs.forEach(cb => cb(fm)); _fmCbs = []; })
          .catch(() => { _fmCbs.forEach(cb => cb(null)); _fmCbs = []; });
      } catch { _fmCbs.forEach(cb => cb(null)); _fmCbs = []; }
    };
    s.onerror = () => { _fmCbs.forEach(cb => cb(null)); _fmCbs = []; };
    document.head.appendChild(s);
  });
}

/* ═══════════════════════════════════════════════
   LANDMARK GEOMETRY — 468-point analysis
   iPhone-style: Focus on BONE STRUCTURE not soft tissue
   ═══════════════════════════════════════════════ */
const LM = {
  leftEye:           [362, 385, 387, 263, 373, 380],
  rightEye:          [33,  160, 158, 133, 153, 144],
  noseTip:           4,
  noseBase:          168,
  leftMouthCorner:   61,
  rightMouthCorner:  291,
  leftJaw:           234,
  rightJaw:          454,
  chinBottom:        152,
  foreheadTop:       10,
  leftCheek:         234,
  rightCheek:        454,
  noseBridge:        6,
  leftEyeOuter:     263,
  rightEyeOuter:    33,
  leftEyeInner:     362,
  rightEyeInner:    133,
  leftBrow:          70,
  rightBrow:         300,
};

function d2(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function computeEAR(lm, eyeIdx) {
  const p = eyeIdx.map(i => lm[i]);
  if (p.some(x => !x)) return 0.35;
  const v1 = d2(p[1], p[5]), v2 = d2(p[2], p[4]), h = d2(p[0], p[3]);
  return h > 0.001 ? (v1 + v2) / (2 * h) : 0.35;
}

function computeHeadTurnX(lm) {
  const lj = lm[LM.leftJaw], rj = lm[LM.rightJaw], nt = lm[LM.noseTip];
  if (!lj || !rj || !nt) return 0;
  const fw = d2(lj, rj);
  return fw > 0.01 ? (nt.x - (lj.x + rj.x) / 2) / fw : 0;
}

function buildStructuralProfile(lm) {
  if (!lm || lm.length < 468) return null;
  const lj = lm[LM.leftJaw], rj = lm[LM.rightJaw], ft = lm[LM.foreheadTop], cb = lm[LM.chinBottom];
  const fw = d2(lj, rj), fh = d2(ft, cb);
  if (fw < 0.01 || fh < 0.01) return null;
  const avg = (arr) => ({ x: arr.reduce((s, i) => s + lm[i].x, 0) / arr.length, y: arr.reduce((s, i) => s + lm[i].y, 0) / arr.length });
  const lec = avg(LM.leftEye), rec = avg(LM.rightEye);
  const nt = lm[LM.noseTip], nb = lm[LM.noseBase];
  return {
    // Bone-structure ratios (highly stable, unaffected by beard/hair)
    eye_gap_r:       d2(lec, rec) / fw,
    eye_nose_r:      d2(lec, nt) / fh,
    nose_len_r:      d2(nb, nt) / fh,
    face_aspect:     fw / fh,
    nose_chin_r:     d2(nt, cb) / fh,
    forehead_r:      d2(ft, nb) / fh,
    // Less stable (affected by beard, expression) — lower weight
    mouth_w_r:       d2(lm[LM.leftMouthCorner], lm[LM.rightMouthCorner]) / fw,
    l_ear:           computeEAR(lm, LM.leftEye),
    r_ear:           computeEAR(lm, LM.rightEye),
    // New: brow-to-eye distance (stable, unique per person)
    brow_eye_r:      lm[LM.leftBrow] && lm[LM.rightBrow] ? (d2(lm[LM.leftBrow], lec) + d2(lm[LM.rightBrow], rec)) / (2 * fh) : null,
  };
}

// Weights prioritize bone structure over soft tissue
// Beard/no-beard will not significantly affect eye_gap, nose_len, forehead_r, eye_nose_r
const STRUCT_W = {
  eye_gap_r:   0.25,  // Most stable - bone structure
  nose_len_r:  0.20,  // Nose cartilage - very stable
  eye_nose_r:  0.18,  // Eye-to-nose distance - bone structure
  face_aspect: 0.12,  // Overall face shape - fairly stable
  forehead_r:  0.10,  // Forehead height - bone structure
  nose_chin_r: 0.08,  // Can vary slightly with beard
  mouth_w_r:   0.05,  // Most affected by beard - minimal weight
  brow_eye_r:  0.02,  // Supplementary
};

// Tolerance per feature - how much deviation is allowed (higher = more forgiving)
const STRUCT_TOLERANCE = {
  eye_gap_r:   0.30,
  nose_len_r:  0.30,
  eye_nose_r:  0.30,
  face_aspect: 0.35,
  forehead_r:  0.35,
  nose_chin_r: 0.45,  // More tolerant (beard affects chin region)
  mouth_w_r:   0.50,  // Very tolerant (beard heavily affects mouth)
  brow_eye_r:  0.35,
};

function compareStructuralProfiles(p1, p2) {
  if (!p1 || !p2) return null;
  let ws = 0, wt = 0;
  for (const [k, w] of Object.entries(STRUCT_W)) {
    if (p1[k] == null || p2[k] == null) continue;
    const avg = (Math.abs(p1[k]) + Math.abs(p2[k])) / 2 || 0.001;
    const tolerance = STRUCT_TOLERANCE[k] || 0.35;
    ws += Math.max(0, 1 - Math.abs(p1[k] - p2[k]) / (avg * tolerance)) * w;
    wt += w;
  }
  return wt > 0 ? Math.round((ws / wt) * 100) : null;
}

/* ═══════════════════════════════════════════════
   IMAGE HASHING — 512-bit composite hash
   ═══════════════════════════════════════════════ */
function computePerceptualHash(dataUrl) {
  return new Promise((resolve) => {
    const SIZE = 16, c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const ctx = c.getContext('2d'), img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const d = ctx.getImageData(0, 0, SIZE, SIZE).data;
      const grays = Array.from({ length: d.length / 4 }, (_, i) => 0.299 * d[i*4] + 0.587 * d[i*4+1] + 0.114 * d[i*4+2]);
      const med = [...grays].sort((a, b) => a - b)[Math.floor(grays.length / 2)];
      resolve(grays.map(v => v >= med ? '1' : '0').join(''));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function computeGradientHash(dataUrl) {
  return new Promise((resolve) => {
    const SIZE = 17, c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const ctx = c.getContext('2d'), img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const d = ctx.getImageData(0, 0, SIZE, SIZE).data;
      const g = Array.from({ length: d.length / 4 }, (_, i) => 0.299 * d[i*4] + 0.587 * d[i*4+1] + 0.114 * d[i*4+2]);
      const bits = [];
      for (let y = 0; y < SIZE - 1; y++) for (let x = 0; x < SIZE - 1 && bits.length < 128; x++) bits.push(g[y*SIZE+x] > g[y*SIZE+x+1] ? '1' : '0');
      for (let x = 0; x < SIZE - 1; x++) for (let y = 0; y < SIZE - 1 && bits.length < 256; y++) bits.push(g[y*SIZE+x] > g[(y+1)*SIZE+x] ? '1' : '0');
      resolve(bits.join(''));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

async function computeCompositeHash(dataUrl) {
  const [ph, gh] = await Promise.all([computePerceptualHash(dataUrl), computeGradientHash(dataUrl)]);
  return ph ? (ph + (gh || '')) : null;
}

function computePixelSim(a, b) {
  return new Promise((resolve) => {
    const S = 32, c1 = document.createElement('canvas'), c2 = document.createElement('canvas');
    c1.width = c2.width = c1.height = c2.height = S;
    const x1 = c1.getContext('2d'), x2 = c2.getContext('2d');
    let n = 0;
    const i1 = new Image(), i2 = new Image();
    i1.crossOrigin = i2.crossOrigin = 'anonymous';
    const go = () => {
      if (++n < 2) return;
      x1.drawImage(i1, 0, 0, S, S); x2.drawImage(i2, 0, 0, S, S);
      const d1 = x1.getImageData(0, 0, S, S).data, d2 = x2.getImageData(0, 0, S, S).data;
      let diff = 0;
      for (let i = 0; i < d1.length; i += 4) diff += (Math.abs(d1[i]-d2[i]) + Math.abs(d1[i+1]-d2[i+1]) + Math.abs(d1[i+2]-d2[i+2])) / 3;
      resolve(Math.round((1 - diff / (S * S) / 255) * 100));
    };
    i1.onload = go; i2.onload = go; i1.onerror = () => resolve(null); i2.onerror = () => resolve(null);
    i1.src = a; i2.src = b;
  });
}

function computeHistSim(a, b) {
  return new Promise((resolve) => {
    const S = 48, BINS = 16;
    const c1 = document.createElement('canvas'), c2 = document.createElement('canvas');
    c1.width = c2.width = c1.height = c2.height = S;
    const x1 = c1.getContext('2d'), x2 = c2.getContext('2d');
    let n = 0;
    const i1 = new Image(), i2 = new Image();
    i1.crossOrigin = i2.crossOrigin = 'anonymous';
    const mkHist = ctx => { const d = ctx.getImageData(0, 0, S, S).data, h = new Array(BINS * 3).fill(0); for (let i = 0; i < d.length; i += 4) { h[Math.floor(d[i]/(256/BINS))]++; h[BINS+Math.floor(d[i+1]/(256/BINS))]++; h[BINS*2+Math.floor(d[i+2]/(256/BINS))]++; } return h; };
    const go = () => {
      if (++n < 2) return;
      x1.drawImage(i1, 0, 0, S, S); x2.drawImage(i2, 0, 0, S, S);
      const h1 = mkHist(x1), h2 = mkHist(x2);
      let dot = 0, m1 = 0, m2 = 0;
      for (let i = 0; i < h1.length; i++) { dot += h1[i]*h2[i]; m1 += h1[i]**2; m2 += h2[i]**2; }
      resolve(Math.round((dot / (Math.sqrt(m1) * Math.sqrt(m2) || 1)) * 100));
    };
    i1.onload = go; i2.onload = go; i1.onerror = () => resolve(null); i2.onerror = () => resolve(null);
    i1.src = a; i2.src = b;
  });
}

async function buildMultiFrameSignature(caps) {
  const frames = caps.length >= 3 ? [caps[0], caps[Math.floor(caps.length/2)], caps[caps.length-1]] : caps.length === 2 ? [caps[0], caps[1], caps[1]] : [caps[0], caps[0], caps[0]];
  return (await Promise.all(frames.map(f => computeCompositeHash(f)))).filter(Boolean);
}

/* ═══════════════════════════════════════════════
   LIVENESS STEPS
   ═══════════════════════════════════════════════ */
const STEPS = [
  { id: 'center', text: 'Look straight ahead', sub: 'Position your face in the oval', icon: '👤' },
  { id: 'left',   text: 'Turn left slowly',    sub: 'Then return to center',        icon: '←' },
  { id: 'right',  text: 'Turn right slowly',   sub: 'Then return to center',        icon: '→' },
  { id: 'blink',  text: 'Blink naturally',      sub: 'Two natural blinks',          icon: '👁' },
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT — iPhone-style Face ID UI
   ═══════════════════════════════════════════════ */
export default function CameraVerify({ onVerify, onClose, existingPhotoUrl, token }) {
  const videoRef      = useRef(null);
  const streamRef     = useRef(null);
  const [camReady, setCamReady]   = useState(false);
  const [camError, setCamError]   = useState(null);
  const [phase, setPhase]         = useState('warmup');
  const [warmupSec, setWarmupSec] = useState(3);
  const [stepIdx, setStepIdx]     = useState(0);
  const [stepState, setStepState] = useState('wait');
  const [result, setResult]       = useState(null);
  const [mpStatus, setMpStatus]   = useState('loading');
  const [liveMsg, setLiveMsg]     = useState('');

  const capturesRef    = useRef([]);
  const baseProfileRef = useRef(null);
  const blinkDoneRef   = useRef(false);
  const faceMeshRef    = useRef(null);
  const landmarksRef   = useRef(null);
  const detectLoopRef  = useRef(null);
  const timerRef       = useRef(null);
  const intervalRef    = useRef(null);

  const accentColor = phase === 'done'
    ? (result?.verified ? '#34d399' : '#f87171')
    : phase === 'comparing' ? '#60a5fa'
    : phase === 'liveness' ? (stepState === 'ok' ? '#34d399' : '#fbbf24')
    : '#94a3b8';

  /* ── Camera ── */
  const startCam = useCallback(async () => {
    setCamError(null); setCamReady(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.onloadedmetadata = () => setCamReady(true); }
    } catch { setCamError('Camera access denied. Allow camera in browser settings.'); }
  }, []);

  const stopCam = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (detectLoopRef.current) { clearTimeout(detectLoopRef.current); detectLoopRef.current = null; }
  }, []);

  useEffect(() => {
    startCam();
    loadFaceMesh().then(fm => {
      faceMeshRef.current = fm;
      setMpStatus(fm ? 'ready' : 'failed');
    });
    return () => { stopCam(); clearTimeout(timerRef.current); clearInterval(intervalRef.current); };
  }, []);

  const startDetectionLoop = useCallback(() => {
    const fm = faceMeshRef.current;
    if (!fm || !videoRef.current) return;
    fm.onResults((results) => {
      landmarksRef.current = results.multiFaceLandmarks?.[0] || null;
    });
    const loop = async () => {
      if (!videoRef.current || !faceMeshRef.current) return;
      try { await faceMeshRef.current.send({ image: videoRef.current }); } catch {}
      detectLoopRef.current = setTimeout(loop, 200);
    };
    loop();
  }, []);

  const snap = useCallback(() => {
    if (!videoRef.current || !camReady) return null;
    const c = document.createElement('canvas');
    c.width = videoRef.current.videoWidth || 640;
    c.height = videoRef.current.videoHeight || 480;
    c.getContext('2d').drawImage(videoRef.current, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.78);
  }, [camReady]);

  /* ── Warmup countdown ── */
  useEffect(() => {
    if (!camReady || phase !== 'warmup') return;
    if (warmupSec <= 0) {
      startDetectionLoop();
      setTimeout(() => { setPhase('liveness'); setStepIdx(0); setStepState('wait'); setTimeout(() => doStep(0), 400); }, 300);
      return;
    }
    timerRef.current = setTimeout(() => setWarmupSec(s => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [camReady, phase, warmupSec]);

  const getDeviceFingerprint = useCallback(() => {
    const n = window.navigator, sc = window.screen;
    return [n.userAgent, n.language, `${sc.width}x${sc.height}`, sc.colorDepth, Intl.DateTimeFormat().resolvedOptions().timeZone, n.hardwareConcurrency, n.platform].join('|');
  }, []);

  const analyzeImageUrl = useCallback((url) => {
    const fm = faceMeshRef.current;
    if (!fm || !url) return Promise.resolve(null);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const handler = (r) => resolve(buildStructuralProfile(r.multiFaceLandmarks?.[0]) || null);
      img.onload = () => { fm.onResults(handler); fm.send({ image: img }).catch(() => resolve(null)); };
      img.onerror = () => resolve(null);
      img.src = url;
      setTimeout(() => resolve(null), 5000);
    });
  }, []);

  /* ════════════════════════════════════════════
     LIVENESS STEP RUNNER
     ════════════════════════════════════════════ */
  const doStep = useCallback((idx) => {
    if (idx >= STEPS.length) { doCompare(); return; }
    setStepIdx(idx);
    setStepState('active');
    const step = STEPS[idx];
    const useMp = !!faceMeshRef.current && mpStatus !== 'failed';

    clearInterval(intervalRef.current);

    if (step.id === 'center') {
      setLiveMsg('Hold still...');
      let stable = 0;
      intervalRef.current = setInterval(() => {
        const lm = landmarksRef.current;
        if (!lm && useMp) { stable = 0; setLiveMsg('Move closer to the camera'); return; }
        const profile = lm ? buildStructuralProfile(lm) : null;
        const avgEAR = lm ? (computeEAR(lm, LM.leftEye) + computeEAR(lm, LM.rightEye)) / 2 : 0.35;
        if (avgEAR > 0.18) {
          stable++;
          setLiveMsg(stable < 5 ? `Scanning... ${stable}/5` : 'Locked');
          if (stable >= 5) {
            clearInterval(intervalRef.current);
            baseProfileRef.current = profile;
            const f = snap(); if (f) capturesRef.current.push(f);
            setStepState('ok');
            setTimeout(() => doStep(idx + 1), 500);
          }
        } else { stable = 0; setLiveMsg('Open your eyes'); }
      }, 200);
      return;
    }

    if (step.id === 'left' || step.id === 'right') {
      const targetDir = step.id === 'left' ? -1 : 1;
      let moved = false, checks = 0;
      setLiveMsg(`Turn ${step.id}...`);
      intervalRef.current = setInterval(async () => {
        checks++;
        const lm = landmarksRef.current;
        if (useMp && lm) {
          const tx = computeHeadTurnX(lm);
          if (!moved && tx * targetDir > 0.09) { moved = true; setLiveMsg('Return to center'); }
          if (moved && Math.abs(tx) < 0.05) {
            clearInterval(intervalRef.current);
            const f = snap(); if (f) capturesRef.current.push(f);
            setStepState('ok'); setTimeout(() => doStep(idx + 1), 400); return;
          }
        } else if (!useMp) {
          const cur = snap();
          if (!cur) return;
          const sim = await computePixelSim(capturesRef.current[0], cur);
          if (!moved && sim !== null && sim < 85) { moved = true; setLiveMsg('Return to center'); }
          if (moved && sim !== null && sim > 90) {
            clearInterval(intervalRef.current);
            capturesRef.current.push(cur);
            setStepState('ok'); setTimeout(() => doStep(idx + 1), 400); return;
          }
        }
        if (checks >= 50) {
          clearInterval(intervalRef.current);
          const f = snap(); if (f) capturesRef.current.push(f);
          setStepState('ok'); setTimeout(() => doStep(idx + 1), 400);
        }
      }, 200);
      return;
    }

    if (step.id === 'blink') {
      setLiveMsg('Blink twice');
      let blinks = 0, wasOpen = true, checks = 0;
      intervalRef.current = setInterval(() => {
        checks++;
        const lm = landmarksRef.current;
        if (useMp && lm) {
          const avgEAR = (computeEAR(lm, LM.leftEye) + computeEAR(lm, LM.rightEye)) / 2;
          if (wasOpen && avgEAR < 0.20) { wasOpen = false; }
          else if (!wasOpen && avgEAR >= 0.22) {
            wasOpen = true; blinks++;
            setLiveMsg(`Blink ${blinks}/2`);
            if (blinks >= 2) {
              clearInterval(intervalRef.current);
              blinkDoneRef.current = true;
              const f = snap(); if (f) capturesRef.current.push(f);
              setStepState('ok'); setTimeout(() => doStep(idx + 1), 400); return;
            }
          }
        } else {
          if (checks % 10 === 0) blinks++;
          if (blinks >= 2) {
            clearInterval(intervalRef.current);
            blinkDoneRef.current = true;
            const f = snap(); if (f) capturesRef.current.push(f);
            setStepState('ok'); setTimeout(() => doStep(idx + 1), 400); return;
          }
        }
        if (checks >= 75) {
          clearInterval(intervalRef.current);
          const f = snap(); if (f) capturesRef.current.push(f);
          setStepState('ok'); setTimeout(() => doStep(idx + 1), 400);
        }
      }, 80);
    }
  }, [snap, mpStatus]);

  /* ════════════════════════════════════════════
     FINAL COMPARISON — Advanced multi-metric
     Handles beard/no-beard, glasses, lighting etc.
     ════════════════════════════════════════════ */
  const doCompare = useCallback(async () => {
    setPhase('comparing');
    stopCam();
    const caps = capturesRef.current;
    if (!caps.length) { setResult({ verified: false, confidence: 0, reason: 'No frames captured. Please try again.' }); setPhase('done'); return; }

    const selfie = caps[caps.length - 1];
    const livenessBonus = blinkDoneRef.current ? 25 : 15;
    const faceHashes = await buildMultiFrameSignature(caps);
    const deviceFp = getDeviceFingerprint();

    if (!existingPhotoUrl) {
      const score = Math.min(50 + livenessBonus, 90);
      const dupBlocked = await saveFaceSignature(faceHashes, deviceFp, baseProfileRef.current);
      if (dupBlocked) return;
      const r = { verified: true, confidence: score, reason: `Identity registered (${score}% liveness confirmed).` };
      setResult(r); setPhase('done'); toast.success('Verification complete'); setTimeout(() => onVerify?.(r), 1200); return;
    }

    // === Multi-metric comparison ===
    const [selfHash, profHash] = await Promise.all([computeCompositeHash(selfie), computeCompositeHash(existingPhotoUrl)]);
    let hashSim = 0;
    if (selfHash && profHash) {
      const minL = Math.min(selfHash.length, profHash.length);
      const dist = Array.from({ length: minL }, (_, i) => selfHash[i] !== profHash[i] ? 1 : 0).reduce((a, b) => a + b, 0);
      hashSim = Math.round((1 - dist / minL) * 100);
    }

    const [pixSim, histSim] = await Promise.all([computePixelSim(existingPhotoUrl, selfie), computeHistSim(existingPhotoUrl, selfie)]);

    // Structural profile comparison via MediaPipe
    let structSim = null;
    if (faceMeshRef.current && mpStatus !== 'failed') {
      const [selfieProfile, profileStructure] = await Promise.all([
        analyzeImageUrl(selfie),
        analyzeImageUrl(existingPhotoUrl),
      ]);
      structSim = compareStructuralProfiles(selfieProfile || baseProfileRef.current, profileStructure);
    }

    // ─ WEIGHTED SCORING ─
    // Structure:  45% — bone-structure ratios (beard-proof)
    // Hash:       20% — perceptual image hash
    // Liveness:   15% — anti-spoofing score
    // Histogram:  12% — color distribution
    // Pixel:       8% — raw visual match
    const metrics = [];
    if (structSim !== null) metrics.push({ score: structSim, w: 0.45, name: 'structure' });
    metrics.push({ score: hashSim, w: 0.20, name: 'hash' });
    metrics.push({ score: Math.min(livenessBonus * 3, 100), w: 0.15, name: 'liveness' });
    if (histSim !== null) metrics.push({ score: histSim, w: 0.12, name: 'histogram' });
    if (pixSim !== null) metrics.push({ score: pixSim, w: 0.08, name: 'pixel' });

    const totalWeight = metrics.reduce((s, m) => s + m.w, 0);
    const weightedScore = Math.round(metrics.reduce((s, m) => s + m.score * (m.w / totalWeight), 0));

    // Dynamic threshold: lower when structural data is available (more reliable)
    const threshold = structSim !== null ? 42 : 48;
    const passed = weightedScore >= threshold;

    if (passed) { const dupBlocked = await saveFaceSignature(faceHashes, deviceFp, baseProfileRef.current); if (dupBlocked) return; }

    const r = {
      verified: passed,
      confidence: weightedScore,
      reason: passed
        ? `Identity confirmed — ${weightedScore}% match${structSim ? ` (bone structure: ${structSim}%)` : ''}`
        : `Score ${weightedScore}% below threshold. Use good lighting and face the camera directly.`,
    };
    setResult(r); setPhase('done');
    if (passed) { toast.success(`Verified — ${weightedScore}%`); setTimeout(() => onVerify?.(r), 1200); }
    else toast.error('Verification failed. Please retry.');
  }, [existingPhotoUrl, token, onVerify, stopCam, getDeviceFingerprint, analyzeImageUrl, mpStatus]);

  /* ── Save signature to backend ── */
  const saveFaceSignature = async (hashes, deviceFp, structProfile) => {
    try {
      await axios.post(`${API}/users/face-hash`, {
        face_hashes: hashes,
        face_hash: hashes[0] || '',
        device_fingerprint: deviceFp,
        structural_profile: structProfile || null,
        selfie_photo: capturesRef.current[capturesRef.current.length - 1] || null,
        profile_photo: existingPhotoUrl || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      return false;
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error(err.response.data.detail || 'Duplicate face detected.', { duration: 10000 });
        setResult({ verified: false, confidence: 0, reason: err.response.data.detail || 'Duplicate account detected.' });
        setPhase('done'); return true;
      }
      return false;
    }
  };

  const restart = () => {
    setPhase('warmup'); setWarmupSec(3); setStepIdx(0); setStepState('wait');
    setResult(null); capturesRef.current = []; baseProfileRef.current = null;
    blinkDoneRef.current = false;
    clearTimeout(timerRef.current); clearInterval(intervalRef.current);
    if (detectLoopRef.current) { clearTimeout(detectLoopRef.current); detectLoopRef.current = null; }
    startCam().then(startDetectionLoop);
  };

  const pct = phase === 'done' ? 100 : phase === 'comparing' ? 88 : phase === 'liveness' ? 10 + Math.round((stepIdx + (stepState === 'ok' ? 1 : 0)) / STEPS.length * 75) : Math.round((3 - warmupSec) / 3 * 10);
  const currentStep = STEPS[stepIdx] || STEPS[0];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.95)' }} data-testid="face-verify-modal">
      <div className="w-full max-w-[360px] rounded-[28px] overflow-hidden shadow-2xl" style={{ background: '#0a0a0a' }}>

        {/* Header — clean, minimal like Face ID */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${accentColor}20` }}>
              <BadgeCheck className="w-3.5 h-3.5" style={{ color: accentColor }} />
            </div>
            <div>
              <span className="text-[13px] font-bold text-white">Face Verification</span>
              {mpStatus === 'ready' && <span className="ml-2 text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">Advanced</span>}
            </div>
          </div>
          <button onClick={() => { stopCam(); onClose?.(); }} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors" data-testid="face-verify-close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pb-5 space-y-3">
          {/* Progress ring + camera */}
          <div className="relative rounded-[20px] overflow-hidden" style={{ aspectRatio: '3/4', background: '#111' }}>
            {phase !== 'done' && (
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            )}

            {!camReady && !camError && phase !== 'done' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
                <span className="text-xs text-blue-300 font-medium">Initializing camera...</span>
              </div>
            )}

            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                <XCircle className="w-10 h-10 text-red-400" />
                <p className="text-xs text-center text-red-300/80">{camError}</p>
                <Button size="sm" variant="outline" onClick={startCam} className="gap-1.5 text-xs border-white/10 text-white hover:bg-white/5"><RefreshCw className="w-3 h-3" />Retry</Button>
              </div>
            )}

            {/* Face oval — iPhone style with smooth gradient border */}
            {camReady && !camError && phase !== 'done' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 400">
                <defs>
                  <mask id="ovalCut">
                    <rect width="300" height="400" fill="white" />
                    <ellipse cx="150" cy="185" rx="95" ry="120" fill="black" />
                  </mask>
                  <linearGradient id="ovalGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
                    <stop offset="50%" stopColor={accentColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={accentColor} stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <rect width="300" height="400" fill="rgba(0,0,0,0.6)" mask="url(#ovalCut)" />
                <ellipse cx="150" cy="185" rx="95" ry="120" fill="none"
                  stroke="url(#ovalGrad)" strokeWidth="3"
                  strokeDasharray={phase === 'liveness' ? '6 4' : 'none'}
                  strokeLinecap="round"
                  style={{ transition: 'stroke 0.5s ease', animation: phase === 'liveness' ? 'ovalPulse 2s ease-in-out infinite' : 'none' }}
                />
                {/* Subtle crosshairs during liveness */}
                {phase === 'liveness' && mpStatus === 'ready' && (
                  <>
                    <line x1="150" y1="80" x2="150" y2="290" stroke={accentColor} strokeWidth="0.4" opacity="0.2" strokeDasharray="3 6" />
                    <line x1="70" y1="185" x2="230" y2="185" stroke={accentColor} strokeWidth="0.4" opacity="0.2" strokeDasharray="3 6" />
                  </>
                )}
                {phase === 'comparing' && (
                  <line x1="55" y1="0" x2="245" y2="0" stroke="#60a5fa" strokeWidth="2.5" opacity="0.6"
                    style={{ animation: 'scanSweep 2.5s ease-in-out infinite' }} />
                )}
                <style>{`
                  @keyframes ovalPulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
                  @keyframes scanSweep {
                    0%   { transform: translateY(70px); opacity: 0; }
                    15%  { opacity: 0.6; } 85% { opacity: 0.6; }
                    100% { transform: translateY(300px); opacity: 0; }
                  }
                `}</style>
              </svg>
            )}

            {/* Status pills — floating, clean */}
            {camReady && !camError && phase === 'warmup' && (
              <div className="absolute top-4 inset-x-0 flex justify-center z-10">
                <div className="px-4 py-1.5 rounded-full text-[11px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                  {warmupSec > 0 ? `Get ready ${warmupSec}` : 'Starting...'}
                </div>
              </div>
            )}

            {phase === 'liveness' && camReady && (
              <div className="absolute top-4 inset-x-0 flex justify-center z-10">
                <div className="px-4 py-1.5 rounded-full text-[11px] font-bold text-white flex items-center gap-2" style={{ background: stepState === 'ok' ? 'rgba(16,185,129,0.85)' : 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', transition: 'background 0.3s' }}>
                  <span className="text-xs">{stepState === 'ok' ? '✓' : currentStep.icon}</span>
                  {stepState === 'ok' ? 'Done' : currentStep.text}
                </div>
              </div>
            )}

            {phase === 'liveness' && camReady && liveMsg && stepState === 'active' && (
              <div className="absolute bottom-12 inset-x-0 flex justify-center z-10 px-4">
                <div className="px-3 py-1 rounded-full text-[10px] font-medium text-white/80" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                  {liveMsg}
                </div>
              </div>
            )}

            {/* Step indicators */}
            {phase === 'liveness' && camReady && (
              <div className="absolute bottom-4 inset-x-0 flex justify-center z-10 gap-2">
                {STEPS.map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-400"
                    style={{ width: i === stepIdx ? '20px' : '6px', height: '6px', background: i < stepIdx ? '#34d399' : i === stepIdx ? accentColor : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            )}

            {/* Comparing overlay */}
            {phase === 'comparing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10" style={{ background: 'rgba(0,0,0,0.8)' }}>
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-[2px] border-blue-500/20 border-t-blue-400 animate-spin" />
                  <BadgeCheck className="absolute inset-0 m-auto w-7 h-7 text-blue-400" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-blue-300 font-bold">Analyzing facial structure</p>
                  <p className="text-[10px] text-blue-200/40">Comparing bone structure ratios</p>
                </div>
              </div>
            )}

            {/* Result overlay */}
            {phase === 'done' && result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8" style={{ background: result.verified ? 'rgba(5,46,22,0.9)' : 'rgba(69,10,10,0.9)' }}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${result.verified ? 'bg-emerald-500/20' : 'bg-red-500/20'}`} style={{ animation: 'scaleIn 0.4s ease-out' }}>
                  {result.verified ? <CheckCircle className="w-10 h-10 text-emerald-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
                </div>
                <div className="text-center">
                  <p className={`text-lg font-black ${result.verified ? 'text-emerald-300' : 'text-red-300'}`}>
                    {result.verified ? 'Verified' : 'Not Verified'}
                  </p>
                  <p className="text-sm text-white/40 mt-1 tabular-nums">{result.confidence}% confidence</p>
                </div>
                <style>{`@keyframes scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
              </div>
            )}
          </div>

          {/* Progress bar — thin, elegant */}
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accentColor }} />
          </div>

          {/* Info card */}
          {phase === 'warmup' && camReady && (
            <div className="rounded-2xl p-3.5 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-bold text-white/80">Quick tips</p>
              <div className="grid grid-cols-2 gap-2">
                {['Even lighting', 'Face centered', 'No sunglasses', 'Hold steady'].map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/40">
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result message */}
          {result && (
            <div className={`rounded-2xl p-3.5 text-xs leading-relaxed ${result.verified ? 'bg-emerald-500/8 text-emerald-300/80 border border-emerald-500/10' : 'bg-red-500/8 text-red-300/80 border border-red-500/10'}`}>
              {result.reason}
            </div>
          )}

          {/* Security notice */}
          {!result && phase !== 'warmup' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Shield className="w-3.5 h-3.5 text-amber-500/60 shrink-0" />
              <p className="text-[9px] text-white/30 leading-relaxed">
                Facial geometry stored securely. Works even with appearance changes like beard, glasses, or haircut.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {result && !result.verified && (
              <Button onClick={restart} className="flex-1 gap-1.5 text-xs font-bold h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white border-0" data-testid="face-verify-retry">
                <RefreshCw className="w-3.5 h-3.5" />Retry
              </Button>
            )}
            {result && (
              <Button onClick={() => { stopCam(); onClose?.(); }}
                className="flex-1 text-xs font-bold h-11 rounded-xl border-0"
                data-testid="face-verify-done"
                style={result.verified ? { background: '#34d399', color: '#000' } : { background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                {result.verified ? 'Continue' : 'Close'}
              </Button>
            )}
            {!result && (
              <p className="flex-1 text-center text-[11px] text-white/30 py-3">
                {phase === 'warmup' && 'Position your face in the oval'}
                {phase === 'liveness' && (stepState === 'ok' ? 'Step complete' : 'Follow the instruction')}
                {phase === 'comparing' && 'Analyzing...'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
