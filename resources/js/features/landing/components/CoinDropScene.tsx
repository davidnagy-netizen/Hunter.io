import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { gsap } from "../lib/gsap";
import { COIN_LAYOUT, COIN_SCALE, dropStartY } from "./coinLayout";

const COIN_URL = `${import.meta.env.BASE_URL}fundor-coin.glb`;
const COIN_COUNT = COIN_LAYOUT.length;
const CAMERA_TARGET: [number, number, number] = [0.75, 0.55, 0];

useGLTF.preload(COIN_URL);

function CameraAim() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.lookAt(...CAMERA_TARGET);
  }, [camera]);
  return null;
}

/**
 * A dark occlusion shadow (`ContactShadows` below) never reads against this scene's own dark
 * navy background — it can only darken, and there's little left to darken. This is the part
 * that actually reads as "gold surface": an additive radial glow, painted with a canvas gradient
 * since three.js has no built-in one, so it lightens the ground with warm color instead.
 */
function GoldGlow() {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255, 197, 110, 0.65)");
    gradient.addColorStop(0.45, "rgba(255, 175, 80, 0.3)");
    gradient.addColorStop(1, "rgba(255, 175, 80, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <mesh position={[0.75, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.6, 3.6]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Coin({
  index,
  settled,
  onReady,
}: {
  index: number;
  settled: boolean;
  onReady: (index: number, group: THREE.Group | null) => void;
}) {
  const { scene } = useGLTF(COIN_URL);
  const [cloned] = useState(() => scene.clone(true));
  const ref = useRef<THREE.Group>(null);
  const layout = COIN_LAYOUT[index];
  const atRest = settled || !layout.dropsIn;
  const startY = atRest ? layout.y : dropStartY(layout);
  const startRotation: [number, number, number] = atRest
    ? [layout.restTiltX, layout.restRotationY, layout.restTiltZ]
    : [0.4, 0, 0.7];

  useLayoutEffect(() => {
    onReady(index, ref.current);
    return () => onReady(index, null);
  }, [index, onReady]);

  return (
    <primitive
      ref={ref}
      object={cloned}
      position={[layout.x, startY, layout.z]}
      rotation={startRotation}
      scale={COIN_SCALE}
    />
  );
}

export interface CoinDropSceneProps {
  className?: string;
  settled?: boolean;
  onCoinsReady?: (coins: (THREE.Group | null)[]) => void;
}

export function CoinDropScene({
  className = "",
  settled = false,
  onCoinsReady,
}: CoinDropSceneProps) {
  const reducedMotion = usePrefersReducedMotion();
  const coinsRef = useRef<(THREE.Group | null)[]>(Array(COIN_COUNT).fill(null));
  const [allReady, setAllReady] = useState(false);
  const registerCoin = useCallback(
    (index: number, group: THREE.Group | null) => {
      coinsRef.current[index] = group;
      setAllReady(coinsRef.current.every((c) => c));
    },
    [],
  );

  useLayoutEffect(() => {
    if (!allReady) return;
    if (!settled) onCoinsReady?.(coinsRef.current);
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      coinsRef.current.forEach((coin, i) => {
        if (!coin) return;
        if (!settled && COIN_LAYOUT[i].dropsIn) return;
        gsap.to(coin.rotation, {
          y: `+=${Math.PI * 2}`,
          duration: 16 + i * 2.5,
          repeat: -1,
          ease: "none",
        });
      });
    });
    return () => ctx.revert();
  }, [allReady, settled, reducedMotion, onCoinsReady]);

  return (
    <div className={className}>
      <Canvas
        shadows
        camera={{ position: [0.75, 3.7, 5.0], fov: 32 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true }}
      >
        <CameraAim />
        <ambientLight intensity={0.6} color="#fff3d9" />
        <directionalLight
          position={[3, 6, 3]}
          intensity={2.4}
          color="#ffd27a"
          castShadow
        />
        <directionalLight
          position={[-4, 2, -2]}
          intensity={0.35}
          color="#8fb8ff"
        />
        <Suspense fallback={null}>
          <Environment preset="sunset" background={false} />
          {COIN_LAYOUT.map((_, i) => (
            <Coin key={i} index={i} settled={settled} onReady={registerCoin} />
          ))}
          <GoldGlow />
          <ContactShadows
            position={[0.75, -0.03, 0]}
            opacity={0.7}
            scale={3.2}
            blur={1.8}
            far={2.5}
            color="#3a2205"
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
