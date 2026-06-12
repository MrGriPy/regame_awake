import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FACE_VALUES = [2, 5, 3, 4, 1, 6];

const FACE_NORMALS = {
  1: new THREE.Vector3(0, 0, 1),
  2: new THREE.Vector3(1, 0, 0),
  3: new THREE.Vector3(0, 1, 0),
  4: new THREE.Vector3(0, -1, 0),
  5: new THREE.Vector3(-1, 0, 0),
  6: new THREE.Vector3(0, 0, -1),
};

const FACE_QUATS = {
  1: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
  2: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)),
  3: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
  4: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
  5: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
  6: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)),
};

const DOTS = {
  1: [[0, 0]],
  2: [[-0.28, 0.28], [0.28, -0.28]],
  3: [[-0.28, 0.28], [0, 0], [0.28, -0.28]],
  4: [[-0.28, 0.28], [0.28, 0.28], [-0.28, -0.28], [0.28, -0.28]],
  5: [[-0.28, 0.28], [0.28, 0.28], [0, 0], [-0.28, -0.28], [0.28, -0.28]],
  6: [[-0.28, 0.28], [0.28, 0.28], [-0.28, 0], [0.28, 0], [-0.28, -0.28], [0.28, -0.28]],
};

function makeTex(n, bg, dot) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = dot;
  DOTS[n].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(S / 2 + x * S, S / 2 - y * S, S * 0.09, 0, Math.PI * 2);
    ctx.fill();
  });
  return new THREE.CanvasTexture(c);
}

function makeMats(bg, dot) {
  return FACE_VALUES.map(n =>
    new THREE.MeshStandardMaterial({ map: makeTex(n, bg, dot), roughness: 0.35, metalness: 0.05 })
  );
}

const INIT_SPEED = 12;
const DECAY = 2.0;
const STEER_START = 0.70;
const LAND_T = 0.92;
const POP_DUR = 0.30;
const SQUASH_DUR = 0.10;
const EXIT_DUR = 0.22;

function generateScatterPositions(count) {
  const r = (a, b) => a + Math.random() * (b - a);

  if (count === 1) return [{ x: 0, y: 0 }]

  if (count === 2) {
    const slots = [
      { x: r(-2.6, -1.3), y: r(-1.6, 1.6) },
      { x: r( 1.3,  2.6), y: r(-1.6, 1.6) },
    ];
    if (Math.random() < 0.5) [slots[0], slots[1]] = [slots[1], slots[0]];
    return slots;
  }

  const layouts = [
    [
      { x: r(-0.4,  0.4), y: r( 1.0,  1.6) },
      { x: r(-2.6, -1.3), y: r(-1.6, -0.8) },
      { x: r( 1.3,  2.6), y: r(-1.6, -0.8) },
    ],
    [
      { x: r(-2.6, -1.3), y: r( 0.8,  1.6) },
      { x: r( 1.3,  2.6), y: r( 0.8,  1.6) },
      { x: r(-0.4,  0.4), y: r(-1.6, -0.8) },
    ],
  ];
  const layout = layouts[Math.floor(Math.random() * 2)];
  for (let i = layout.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [layout[i], layout[j]] = [layout[j], layout[i]];
  }
  return layout;
}

function getBounceY(t) {
  const segs = [
    { t0: 0,    t1: 0.40, h: 0.55 },
    { t0: 0.40, t1: 0.70, h: 0.22 },
    { t0: 0.70, t1: 0.92, h: 0.07 },
  ];
  for (const sg of segs) {
    if (t < sg.t1) {
      const p = (t - sg.t0) / (sg.t1 - sg.t0);
      return sg.h * 4 * p * (1 - p);
    }
  }
  return 0;
}

function Die({ rollCount, onRollComplete, bg = '#f8f5f0', dot = '#1a1a2e', posX = 0, posY = 0, delay = 0, allowedFaces = null, switchCount = 0 }) {
  const meshRef = useRef();
  const groupRef = useRef();

  const p = useRef({
    phase: 'idle',
    delayLeft: 0,
    rollTime: 0,
    idleT: Math.random() * Math.PI * 2,
    prevCount: rollCount,
    result: 1,
    speed: 0,
    ax: 1, az: 0,
    wobbleAmp: 0.25,
    wobbleFreq: 3.0,
    squashT: -1,
    popT: 0,
    exitT: 0,
    exitToHidden: false,
    finalApproach: false,
    targetQuat: new THREE.Quaternion(),
    fromX: posX,
    _v: new THREE.Vector3(),
    _q: new THREE.Quaternion(),
  });

  const mats = useRef(makeMats(bg, dot));

  useEffect(() => {
    const s = p.current;
    if (rollCount <= s.prevCount) return;
    s.prevCount = rollCount;
    s.delayLeft = delay;
    s.rollTime = 0;
    s.speed = INIT_SPEED;
    s.fromX = posX < 0 ? posX - 5.5 : posX + 5.5;
    const axAngle = (Math.random() - 0.5) * 1.4;
    s.ax = Math.cos(axAngle);
    s.az = Math.sin(axAngle) * 0.5;
    const axLen = Math.sqrt(s.ax * s.ax + s.az * s.az);
    s.ax /= axLen; s.az /= axLen;
    s.wobbleAmp = 0.2 + Math.random() * 0.35;
    s.wobbleFreq = 2.5 + Math.random() * 3.0;
    s.finalApproach = false;
    if (s.phase === 'done' || s.phase === 'popping') {
      s.phase = 'exiting';
      s.exitT = 0;
    } else {
      s.phase = 'pending';
    }
    onRollComplete(null);
  }, [rollCount, delay, onRollComplete, posX]);

  useEffect(() => {
    if (switchCount === 0) return;
    const s = p.current;
    if (s.phase === 'done' || s.phase === 'popping') {
      s.exitToHidden = true;
      s.phase = 'exiting';
      s.exitT = 0;
    } else if (s.phase === 'idle') {
      s.phase = 'idle_hidden';
    }
  }, [switchCount]);

  useFrame((_, dt) => {
    const s = p.current;
    const mesh = meshRef.current;
    const grp = groupRef.current;
    if (!mesh || !grp) return;

    if (s.phase === 'idle_hidden') {
      grp.scale.setScalar(0);
      return;
    }

    if (s.phase === 'idle') {
      s.idleT += dt * 0.55;
      grp.position.y = posY + Math.sin(s.idleT + (posX > 0 ? 1.2 : 0)) * 0.07;
      mesh.rotation.y += dt * 0.35;
      return;
    }

    if (s.phase === 'exiting') {
      s.exitT += dt;
      const pt = Math.min(s.exitT / EXIT_DUR, 1);
      grp.scale.setScalar(1 - pt);
      if (pt >= 1) {
        grp.scale.setScalar(0);
        grp.position.set(s.fromX, posY, 0);
        s.phase = s.exitToHidden ? 'idle_hidden' : 'pending';
        s.exitToHidden = false;
      }
      return;
    }

    if (s.phase === 'pending') {
      s.delayLeft -= dt;
      if (s.delayLeft > 0) return;
      s.phase = 'rolling';
      grp.scale.setScalar(1);
      mesh.scale.setScalar(1);
      s.squashT = -1;
      grp.position.set(s.fromX, posY, 0);
      mesh.quaternion.setFromEuler(new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ));
      return;
    }

    if (s.phase === 'rolling') {
      s.rollTime += dt;
      s.speed = INIT_SPEED * Math.exp(-DECAY * s.rollTime);

      const bt     = Math.min(s.rollTime / 1.6, 1.0);
      const btPrev  = Math.min((s.rollTime - dt) / 1.6, 1.0);

      const wob = s.wobbleAmp * Math.exp(-DECAY * 0.7 * s.rollTime) * Math.sin(s.rollTime * s.wobbleFreq);
      s._v.set(s.ax, wob, s.az).normalize();
      s._q.setFromAxisAngle(s._v, s.speed * dt);
      mesh.quaternion.multiply(s._q);

      if (!s.finalApproach && bt >= STEER_START) {
        s.finalApproach = true;
        const cam = new THREE.Vector3(0, 0, 1);
        const faces = allowedFaces ?? [1, 2, 3, 4, 5, 6];
        let bestVal = faces[0], bestDot = -Infinity;
        for (const v of faces) {
          const d = FACE_NORMALS[v].clone().applyQuaternion(mesh.quaternion).dot(cam);
          if (d > bestDot) { bestDot = d; bestVal = v; }
        }
        s.result = bestVal;
        s.targetQuat.copy(FACE_QUATS[bestVal]);
      }

      if (s.finalApproach && bt < LAND_T) {
        const steerP = (bt - STEER_START) / (LAND_T - STEER_START);
        mesh.quaternion.slerp(s.targetQuat, Math.min(steerP * steerP * 18 * dt, 0.5));
      }

      grp.position.x = THREE.MathUtils.lerp(grp.position.x, posX, 1 - Math.exp(-8 * dt));
      const curY = getBounceY(bt);
      const preY = getBounceY(btPrev);
      grp.position.y = posY + curY;

      if (preY > 0.02 && curY <= 0.02 && bt < STEER_START) s.squashT = 0;
      if (s.squashT >= 0) {
        s.squashT += dt;
        const sq = Math.sin(Math.PI * Math.min(s.squashT / SQUASH_DUR, 1));
        mesh.scale.set(1 + sq * 0.20, 1 - sq * 0.22, 1 + sq * 0.20);
        if (s.squashT >= SQUASH_DUR) { mesh.scale.setScalar(1); s.squashT = -1; }
      }

      if (bt >= LAND_T && btPrev < LAND_T) {
        mesh.quaternion.copy(s.targetQuat);
        mesh.scale.setScalar(1);
        grp.position.set(posX, posY, 0);
        s.squashT = 0;
        s.phase = 'popping';
        s.popT = 0;
        onRollComplete(s.result);
      }
      return;
    }

    if (s.phase === 'popping') {
      s.popT += dt;
      const pt = Math.min(s.popT / POP_DUR, 1);
      grp.scale.setScalar(1 + 0.13 * Math.sin(pt * Math.PI));
      if (pt >= 1) {
        grp.scale.setScalar(1);
        s.phase = 'done';
      }
    }
  });

  return (
    <group ref={groupRef} position={[posX, posY, 0]}>
      <mesh ref={meshRef} material={mats.current}>
        <boxGeometry args={[1.3, 1.3, 1.3]} />
      </mesh>
    </group>
  );
}

export default function DiceScene({ rollCount, onResult, extraDie = false, switchCount = 0, singleDie = false }) {
  const stateRef = useRef({});
  stateRef.current = { onResult, extraDie, singleDie };

  const resultsArr = useRef([null, null, null]);
  const doneRef = useRef(0);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (rollCount > prevCountRef.current) {
      prevCountRef.current = rollCount;
      resultsArr.current = [null, null, null];
      doneRef.current = 0;
    }
  }, [rollCount]);

  const stableCbs = useRef(null);
  if (!stableCbs.current) {
    stableCbs.current = [0, 1, 2].map((idx) => (val) => {
      if (val === null) return;
      const { onResult, extraDie, singleDie } = stateRef.current;
      const diceCount = singleDie ? 1 : extraDie ? 3 : 2;
      resultsArr.current[idx] = val;
      doneRef.current += 1;
      if (doneRef.current === diceCount) {
        const v = resultsArr.current;
        const total = singleDie ? v[0] : extraDie ? v[0] + v[1] + v[2] : v[0] + v[1];
        onResult?.({
          die1: v[0],
          die2: singleDie ? undefined : v[1],
          die3: extraDie ? v[2] : undefined,
          total,
        });
      }
    });
  }

  const allowedFaces = null;
  const diceCount = singleDie ? 1 : extraDie ? 3 : 2;
  const scatterPositions = useMemo(() => generateScatterPositions(diceCount), [rollCount, diceCount]);
  const delays = singleDie ? [0] : extraDie ? [0, 0.15, 0.30] : [0, 0.25];

  return (
    <Canvas camera={{ position: [0, 1.5, 6.5], fov: 42 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={1.0} />
      <directionalLight position={[3, 8, 5]} intensity={1.1} />
      <pointLight position={[-3, 4, 3]} intensity={0.4} color="#fff8e7" />
      {scatterPositions.map((pos, i) => (
        <Die
          key={`die-${i}`}
          rollCount={rollCount}
          onRollComplete={stableCbs.current[i]}
          posX={pos.x}
          posY={pos.y}
          delay={delays[i]}
          switchCount={switchCount}
          bg={i === 2 ? '#fef3c7' : '#f8f5f0'}
          dot={i === 2 ? '#dc2626' : '#1a1a2e'}
          allowedFaces={allowedFaces}
        />
      ))}
    </Canvas>
  );
}