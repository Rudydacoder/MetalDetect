"use client";

/**
 * BuoyModel — the water_device GLB (its own baked animation intact) floating in
 * a large, procedurally animated Three.js water surface.
 *
 * The Blender procedural water (RIVER FLOW / SECONDARY WATER MOTION modifiers)
 * does not survive glTF export, so any static water mesh inside the GLB is
 * hidden and replaced with a shader-driven plane here. The surface layers a
 * broad directional current, medium advected waves, fine ripples and a ripple
 * ring around the buoy, so the flow is clearly moving — not a flat blue plane.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const MODEL_URL = "/Models/water_device.glb";

/* ------------------------------------------------------------------ water ---
 * Tunables — STEP 6 knobs. Larger = stronger / faster / brighter.
 * ------------------------------------------------------------------------- */
const WATER = {
  size: 26,          // plane extent (world units)
  segments: 168,     // mesh density — higher = smoother waves, heavier
  y: -0.22,          // surface height (STEP 5: raise/lower so buoy sits on it)
  currentSpeed: 0.9, // how fast the whole current drifts
  flowDir: [1.0, 0.32] as [number, number], // direction of travel
  waveBig: 0.13,     // broad slow swell amplitude
  waveMed: 0.075,    // medium wave amplitude
  ripple: 0.03,      // fine surface ripple amplitude
  buoyRipple: 0.06,  // disturbance ring around the buoy
  brightness: 1.06,  // overall lift so movement reads
  contrast: 1.16,    // separation between troughs and crests
};

// shared GLSL value noise (declared in both stages)
const NOISE_GLSL = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
`;

const waterVertex = `
uniform float uTime;
uniform float uCurrentSpeed;
uniform float uWaveBig;
uniform float uWaveMed;
uniform float uRipple;
uniform float uBuoyRipple;
uniform vec2  uFlowDir;
varying float vElev;
varying vec2  vWorld;
varying float vDist;
${NOISE_GLSL}
void main() {
  vec3 pos = position;         // plane local XY; +Z is "up" (mesh is rotated flat)
  vec2 p = pos.xy;
  vWorld = p;
  vec2 flow = normalize(uFlowDir);
  vec2 perp = vec2(-flow.y, flow.x);
  float t = uTime;

  // 1) broad slow directional current (long wavelength, travels along flow)
  float big = sin(dot(p, flow) * 0.34 - t * uCurrentSpeed * 1.05) * uWaveBig;

  // 2) medium waves: advected noise ridges sliding along the current
  vec2 fc = p * 0.5 - flow * (t * uCurrentSpeed * 0.6);
  float med = (vnoise(fc) * 2.0 - 1.0) * uWaveMed;
  med += sin(dot(p, perp) * 0.8 - t * uCurrentSpeed * 1.6) * uWaveMed * 0.5;

  // 3) small ripples
  float small = sin(p.x * 2.6 + t * 3.2) * uRipple * 0.4
              + sin(p.y * 2.9 - t * 2.6) * uRipple * 0.4
              + (vnoise(p * 3.0 - flow * t * 1.4) * 2.0 - 1.0) * uRipple * 0.5;

  // 4) buoy disturbance ring at origin
  float d = length(p);
  vDist = d;
  float ring = sin(d * 4.2 - t * 4.0) * exp(-d * 0.7) * uBuoyRipple;

  float elev = big + med + small + ring;
  vElev = elev;
  pos.z += elev;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waterFragment = `
precision highp float;
uniform float uTime;
uniform float uCurrentSpeed;
uniform float uBrightness;
uniform float uContrast;
uniform vec2  uFlowDir;
uniform vec3  uDeep;
uniform vec3  uMid;
uniform vec3  uFoam;
varying float vElev;
varying vec2  vWorld;
varying float vDist;
${NOISE_GLSL}
void main() {
  vec2 flow = normalize(uFlowDir);
  float t = uTime;

  // height-based base colour
  float h = clamp(vElev * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uDeep, uMid, smoothstep(0.22, 0.78, h));

  // DIRECTIONAL CURRENT STREAKS — advected noise makes bright bands slide along
  // the flow, so the current is obviously moving rather than shimmering in place
  vec2 sc = vWorld * 0.6 - flow * (t * uCurrentSpeed * 0.95);
  float streak = vnoise(sc) * 0.6 + vnoise(sc * 2.3 - flow * t * 1.2) * 0.4;
  streak = smoothstep(0.5, 0.92, streak);
  col += uFoam * streak * 0.34;

  // foam on the crests
  float crest = smoothstep(0.74, 0.96, h);
  col = mix(col, uFoam, crest * 0.5);

  // brighten the buoy ripple ring
  float ring = max(sin(vDist * 4.2 - t * 4.0), 0.0) * exp(-vDist * 0.7);
  col += uFoam * ring * 0.18;

  // contrast + brightness so the motion carries
  col = (col - 0.5) * uContrast + 0.5;
  col *= uBrightness;

  // fade the far edges to transparent so the plane melts into the dark scene
  float edge = smoothstep(13.0, 6.0, length(vWorld));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), edge);
}
`;

function Water() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCurrentSpeed: { value: WATER.currentSpeed },
      uWaveBig: { value: WATER.waveBig },
      uWaveMed: { value: WATER.waveMed },
      uRipple: { value: WATER.ripple },
      uBuoyRipple: { value: WATER.buoyRipple },
      uBrightness: { value: WATER.brightness },
      uContrast: { value: WATER.contrast },
      uFlowDir: { value: new THREE.Vector2(WATER.flowDir[0], WATER.flowDir[1]) },
      uDeep: { value: new THREE.Color("#101838") },  // deep blue trough
      uMid: { value: new THREE.Color("#3f68b8") },   // mid current
      uFoam: { value: new THREE.Color("#AFD2FA") },  // powder-blue crests/streaks
    }),
    []
  );

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });

  return (
    <group position={[0, WATER.y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WATER.size, WATER.size, WATER.segments, WATER.segments]} />
        <shaderMaterial
          ref={mat}
          vertexShader={waterVertex}
          fragmentShader={waterFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
      {/* opaque deep-blue backing just under the surface so we never see the
          scene background through the animated plane near the buoy */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <circleGeometry args={[8, 48]} />
        <meshBasicMaterial color="#0b132c" transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------------------------- device --- */

function DeviceFallback() {
  return (
    <mesh>
      <cylinderGeometry args={[0.6, 0.5, 0.7, 24]} />
      <meshStandardMaterial color="#4a6bb5" roughness={0.5} metalness={0.3} />
    </mesh>
  );
}

function Device() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);

  // Normalise scale/centre, and hide any static water/river mesh the GLB carries
  // (we render our own animated water instead).
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      if (/(water|river|sea|ocean|flow|surface|plane|liquid)/i.test(o.name)) {
        o.visible = false;
      }
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    root.position.sub(center);
    const wrapper = new THREE.Group();
    wrapper.add(root);
    wrapper.scale.setScalar(2.2 / maxAxis);
    return wrapper;
  }, [scene]);

  // Play every baked clip (keeps the buoy's own Blender animation running).
  useEffect(() => {
    const list = Object.values(actions);
    list.forEach((a) => a?.reset().setLoop(THREE.LoopRepeat, Infinity).play());
    return () => list.forEach((a) => a?.stop());
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

/* ----------------------------------------------------------------- root --- */

export default function BuoyModel() {
  return (
    <Canvas
      // close-in framing so the device reads as the subject, not a speck
      camera={{ position: [1.9, 1.05, 2.3], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Palette lighting: floral-white key, powder-blue fill, pale-brown warmth */}
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#AFD2FA", "#101838", 0.85]} />
      <directionalLight position={[4, 6, 3]} intensity={1.9} color="#FEFAEF" />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} color="#AFD2FA" />
      <pointLight position={[0, -1, 2]} intensity={0.5} color="#B9915E" />
      <pointLight position={[0, -0.6, 0]} intensity={0.7} color="#4a6bb5" distance={6} />

      <Suspense fallback={<DeviceFallback />}>
        <Float speed={1.4} rotationIntensity={0.18} floatIntensity={0.5}>
          <Device />
        </Float>
      </Suspense>

      <Water />

      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={6}
        maxPolarAngle={Math.PI / 1.9}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}
