"use client";

/**
 * CyberGlobe — the earth GLB from /public/Models with earth-night.png applied
 * as its base-colour (albedo) map. Geometry, UVs, rotation, scale, camera and
 * interaction are the model's own; only the surface texture is replaced.
 *
 * The texture is loaded through useTexture, which suspends — so the globe is
 * never rendered before its map is ready.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const MODEL_URL = "/Models/earth.glb";
const TEXTURE_URL = "/Textures/earth-night.png";

/** Cheap stand-in shown only while the GLB + texture stream in. */
function EarthFallback() {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.025;
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[2, 48, 48]} />
        <meshStandardMaterial color="#182350" emissive="#101838" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

function EarthModel() {
  const g = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const [map, setMap] = useState<THREE.Texture | null>(null);

  // Load the texture imperatively rather than via a suspending hook, so the
  // model still shows if the image is slow, and so failures are visible.
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      TEXTURE_URL,
      (t) => {
        if (cancelled) return;
        // glTF UVs assume flipY = false; the loader default (true) would
        // mirror the continents vertically.
        t.flipY = false;
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;   // continuous wrap around the sphere
        t.wrapT = THREE.ClampToEdgeWrapping;
        t.anisotropy = 8;
        t.needsUpdate = true;
        setMap(t);
      },
      undefined,
      (err) => console.error("[CyberGlobe] earth texture failed:", err)
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Normalise: centre the model and scale it to a known radius so camera
  // framing doesn't depend on however the GLB was exported.
  const model = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    root.position.sub(center);
    const wrapper = new THREE.Group();
    wrapper.add(root);
    wrapper.scale.setScalar(4 / maxAxis); // → ~2 unit radius
    return wrapper;
  }, [scene]);

  // This GLB ships KHR_materials_pbrSpecularGlossiness, which modern three.js
  // no longer supports — its materials arrive unusable. So we build a fresh
  // MeshStandardMaterial per mesh using the model's own UVs. Geometry, UVs,
  // scale and rotation are untouched; only the surface shading is replaced.
  useEffect(() => {
    if (!map) return;
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const next = new THREE.MeshStandardMaterial({
        map,
        // keep the night-side detail readable without blowing out the day side
        emissive: new THREE.Color("#ffffff"),
        emissiveMap: map,
        emissiveIntensity: 0.35,
        roughness: 0.85,
        metalness: 0.05,
      });
      const prev = mesh.material;
      mesh.material = next;
      // dispose the unusable spec-gloss material we replaced
      (Array.isArray(prev) ? prev : [prev]).forEach((m) => m?.dispose?.());
    });
  }, [model, map]);

  // Scroll turns the globe: page scrollY feeds a target the group eases toward,
  // on top of a slow idle drift so it stays alive at rest.
  const scrollTarget = useRef(0);
  const idle = useRef(0);
  const spun = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      scrollTarget.current = window.scrollY * 0.0022;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((_, dt) => {
    if (!g.current) return;
    idle.current += dt * 0.04;
    spun.current += (scrollTarget.current - spun.current) * 0.08;
    g.current.rotation.y = idle.current + spun.current;
  });

  return (
    <group ref={g} rotation={[0.22, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

export default function CyberGlobe() {
  return (
    <Canvas
      // pulled back so the whole globe sits in frame with a little breathing room
      camera={{ position: [0, 0.05, 6.4], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Palette lighting: powder-blue key, pale-brown rim, so the terminator
          reads without washing out the texture. */}
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#AFD2FA", "#101838", 0.6]} />
      <directionalLight position={[-4, 2.5, 5]} intensity={2.0} color="#FEFAEF" />
      <directionalLight position={[5, -1, -3]} intensity={0.7} color="#B9915E" />
      <Stars radius={90} depth={60} count={2200} factor={4} fade speed={0.25} />

      <Suspense fallback={<EarthFallback />}>
        <EarthModel />
      </Suspense>

      {/* drag rotates; scroll-to-zoom is OFF (scroll turns the globe instead) */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        rotateSpeed={0.4}
      />
    </Canvas>
  );
}
