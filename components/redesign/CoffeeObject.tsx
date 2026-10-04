"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import s from "./brew.module.css";

/** Procedural ceramic and brass: no external model or rendering service. */
export default function CoffeeObject({
  paused,
  progress,
  rotation,
}: {
  paused: boolean;
  progress: RefObject<{ value: number }>;
  rotation: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const rotationRef = useRef(rotation);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let started = false;

    async function initialize() {
      const THREE = await import("three");
      if (disposed || !container) return;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
      });
      if (!context) return;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        context,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
      camera.position.set(0, 2.7, 6.2);
      camera.lookAt(0, 0.1, 0);
      scene.add(new THREE.HemisphereLight(0xffefdb, 0x6b6757, 3));
      const key = new THREE.DirectionalLight(0xffead2, 5);
      key.position.set(-3, 5, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffd187, 4);
      rim.position.set(4, 2, -3);
      scene.add(rim);
      const front = new THREE.DirectionalLight(0xffffff, 2);
      front.position.set(0, 1, 5);
      scene.add(front);
      const lathe = (points: [number, number][]) =>
        new THREE.LatheGeometry(
          points.map(([x, y]) => new THREE.Vector2(x, y)),
          80,
        );
      const ceramic = new THREE.MeshStandardMaterial({
        color: 0x20201c,
        roughness: 0.3,
        metalness: 0.25,
        side: THREE.DoubleSide,
      });
      const gold = new THREE.MeshStandardMaterial({
        color: 0xcaa567,
        roughness: 0.3,
        metalness: 0.65,
      });
      const coffee = new THREE.MeshStandardMaterial({
        color: 0x9a622b,
        roughness: 0.6,
      });
      const beanMaterial = new THREE.MeshStandardMaterial({
        color: 0x56301a,
        roughness: 0.45,
      });
      const cupGeometry = lathe([
        [0, 0],
        [0.59, 0],
        [0.68, 0.1],
        [0.83, 0.7],
        [0.88, 1.13],
        [0.85, 1.17],
        [0.81, 1.12],
        [0.77, 0.7],
        [0.62, 0.14],
        [0, 0.14],
      ]);
      const saucerGeometry = lathe([
        [0, 0],
        [0.7, 0],
        [1.35, 0.06],
        [1.5, 0.16],
        [1.48, 0.2],
        [1.34, 0.15],
        [0.7, 0.06],
        [0, 0.06],
      ]);
      const surfaceGeometry = new THREE.CircleGeometry(0.82, 80);
      const handleGeometry = new THREE.TorusGeometry(
        0.32,
        0.09,
        20,
        48,
        Math.PI * 1.15,
      );
      const rimGeometry = new THREE.TorusGeometry(0.852, 0.025, 12, 80);
      const saucerRimGeometry = new THREE.TorusGeometry(1.475, 0.023, 12, 80);
      const emblemGeometry = new THREE.PlaneGeometry(0.5, 0.5);
      const labelGeometry = new THREE.PlaneGeometry(0.94, 0.28);
      const beanGeometry = new THREE.SphereGeometry(1, 28, 20);
      const pos = beanGeometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i),
          y = pos.getY(i),
          z = pos.getZ(i);
        const groove =
          z > 0
            ? Math.exp(-Math.pow((x - Math.sin(y * 2.7) * 0.1) / 0.12, 2)) *
              0.35 *
              Math.max(0, 1 - y * y)
            : 0;
        pos.setXYZ(i, x * 0.19, y * 0.3, (z - groove) * 0.16);
      }
      beanGeometry.computeVertexNormals();
      const geometries = [
        cupGeometry,
        saucerGeometry,
        surfaceGeometry,
        handleGeometry,
        rimGeometry,
        saucerRimGeometry,
        emblemGeometry,
        labelGeometry,
        beanGeometry,
      ];
      const materials: import("three").Material[] = [
        ceramic,
        gold,
        coffee,
        beanMaterial,
      ];
      const textures: import("three").Texture[] = [];
      const cup = new THREE.Group();
      cup.add(new THREE.Mesh(cupGeometry, ceramic));
      const saucer = new THREE.Mesh(saucerGeometry, ceramic);
      saucer.position.y = -0.09;
      cup.add(saucer);
      const surface = new THREE.Mesh(surfaceGeometry, coffee);
      surface.rotation.x = -Math.PI / 2;
      surface.position.y = 1.05;
      cup.add(surface);
      const lip = new THREE.Mesh(rimGeometry, gold);
      lip.rotation.x = Math.PI / 2;
      lip.position.y = 1.155;
      cup.add(lip);
      const saucerLip = new THREE.Mesh(saucerRimGeometry, gold);
      saucerLip.rotation.x = Math.PI / 2;
      saucerLip.position.y = 0.085;
      cup.add(saucerLip);
      const handle = new THREE.Mesh(handleGeometry, ceramic);
      handle.rotation.z = -Math.PI / 2;
      handle.position.set(0.86, 0.63, 0);
      cup.add(handle);
      const emblemTexture = new THREE.TextureLoader().load(
        "/assets/brand-mark.png",
      );
      emblemTexture.colorSpace = THREE.SRGBColorSpace;
      textures.push(emblemTexture);
      const emblemMaterial = new THREE.MeshBasicMaterial({
        map: emblemTexture,
        transparent: true,
        depthWrite: false,
      });
      materials.push(emblemMaterial);
      const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
      emblem.position.set(0, 0.73, 0.819);
      emblem.rotation.x = -0.16;
      cup.add(emblem);
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 512;
      labelCanvas.height = 150;
      const labelContext = labelCanvas.getContext("2d")!;
      labelContext.fillStyle = "#d9b777";
      labelContext.font = "600 99px Georgia";
      labelContext.textAlign = "center";
      labelContext.fillText("Caffeine", 256, 109);
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
      textures.push(labelTexture);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        depthWrite: false,
      });
      materials.push(labelMaterial);
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(0, 0.34, 0.757);
      label.rotation.x = -0.2;
      cup.add(label);
      cup.position.y = -0.57;
      const composition = new THREE.Group();
      composition.add(cup);
      scene.add(composition);
      const beans = Array.from({ length: 5 }, (_, i) => {
        const bean = new THREE.Mesh(beanGeometry, beanMaterial);
        bean.rotation.set(i * 0.6, i * 0.4, i);
        composition.add(bean);
        return bean;
      });
      canvas.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;display:block";
      canvas.setAttribute("aria-hidden", "true");
      container.appendChild(canvas);
      let frame = 0,
        last = 0,
        elapsed = 0,
        dirty = true;
      let lastRotation = rotationRef.current,
        lastProgress = -1;
      const resize = () => {
        const { width, height } = container.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        composition.scale.setScalar(Math.min(1, camera.aspect / 0.94));
        dirty = true;
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();
      const contextLost = (event: Event) => {
        event.preventDefault();
        setReady(false);
      };
      const contextRestored = () => {
        dirty = true;
        setReady(true);
      };
      canvas.addEventListener("webglcontextlost", contextLost);
      canvas.addEventListener("webglcontextrestored", contextRestored);
      function render(now: number) {
        if (disposed) return;
        frame = requestAnimationFrame(render);
        if (!visible || document.hidden) {
          last = now;
          return;
        }
        const moving = !pausedRef.current && !reduced.matches;
        dirty ||=
          lastRotation !== rotationRef.current ||
          lastProgress !== progress.current.value;
        if ((!moving && !dirty) || now - last < 32) return;
        const delta = last ? Math.min((now - last) / 1000, 0.06) : 0;
        if (moving) elapsed += delta;
        last = now;
        lastRotation = rotationRef.current;
        lastProgress = progress.current.value;
        const p = progress.current.value;
        cup.rotation.y =
          (rotationRef.current * Math.PI) / 180 +
          (moving ? Math.sin(elapsed * 0.35) * 0.22 : 0) +
          p * Math.PI * 0.5;
        cup.rotation.z = -0.1 + p * 0.17;
        composition.position.y = moving ? Math.sin(elapsed * 0.7) * 0.065 : 0;
        beans.forEach((bean, i) => {
          const angle = (i * Math.PI * 2) / 5 + elapsed * 0.12;
          bean.position.set(
            Math.cos(angle) * (1.85 + p * 0.15),
            Math.sin(angle) * 1.25 + 0.25,
            Math.sin(angle) * 0.6,
          );
          bean.rotation.y = elapsed * 0.2 + i;
        });
        renderer.render(scene, camera);
        dirty = false;
      }
      frame = requestAnimationFrame(render);
      setReady(true);
      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        canvas.removeEventListener("webglcontextlost", contextLost);
        canvas.removeEventListener("webglcontextrestored", contextRestored);
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        textures.forEach((t) => t.dispose());
        renderer.dispose();
        canvas.remove();
      };
      if (disposed) cleanup();
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !started) {
          started = true;
          initialize().catch(() => {
            if (!disposed) setReady(false);
          });
        }
      },
      { rootMargin: "250px" },
    );
    observer.observe(container);
    return () => {
      disposed = true;
      observer.disconnect();
      cleanup?.();
    };
  }, [progress]);
  return (
    <div
      ref={host}
      role="img"
      aria-label="Interactive black ceramic Caffeine espresso cup with a gold rim and floating coffee beans"
      style={{ position: "absolute", inset: 0 }}
    >
      {!ready && (
        <div
          className={s.objectLoading}
          style={{ transform: `rotate(${rotation * 0.12}deg)` }}
        >
          <Image
            src="/assets/hot-coffee.webp"
            alt=""
            fill
            sizes="(max-width: 600px) 90vw, 45vw"
          />
        </div>
      )}
    </div>
  );
}
