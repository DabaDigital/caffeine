"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useSiteMotion } from "./Motion";
import s from "./scene.module.css";

/** The opening timeline owns progress; this scene translates it into real depth. */
export function CoffeeScene() {
  const host = useRef<HTMLDivElement>(null);
  const { paused } = useSiteMotion();
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let disposed = false;
    let generation = 0;
    let cleanupScene: (() => void) | undefined;

    async function initialize() {
      const currentGeneration = ++generation;
      if (media.matches || disposed) return;
      const THREE = await import("three");
      if (
        disposed ||
        media.matches ||
        currentGeneration !== generation ||
        !container
      )
        return;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
      });
      if (!context) return;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        context,
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
      camera.position.z = 9;
      scene.add(new THREE.HemisphereLight(0xfff0da, 0x4d4538, 2.3));
      const key = new THREE.DirectionalLight(0xffead2, 4);
      key.position.set(-4, 5, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xe2ebc5, 3);
      rim.position.set(4, 1, -3);
      scene.add(rim);

      // A curved, recessed seam gives the bean a recognizable face at every size.
      const geometry = new THREE.SphereGeometry(1, 48, 32);
      const position = geometry.attributes.position;
      const colors: number[] = [];
      const roast = new THREE.Color(0x52321f);
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i),
          y = position.getY(i),
          z = position.getZ(i);
        const seam = Math.sin(y * 2.7) * 0.09;
        const groove =
          z > 0
            ? Math.exp(-Math.pow((x - seam) / 0.12, 2)) *
              0.32 *
              Math.max(0, 1 - y * y)
            : 0;
        const texture =
          1 + Math.sin(y * 35 + x * 9) * Math.sin(z * 24 + y * 12) * 0.011;
        const color = roast
          .clone()
          .multiplyScalar(
            (0.88 + Math.sin(y * 7 + x * 9) * 0.08) * (1 - groove * 1.9),
          );
        colors.push(color.r, color.g, color.b);
        position.setXYZ(
          i,
          x * 0.28 * texture,
          y * 0.45 * texture,
          (z - groove) * 0.25 * texture,
        );
      }
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
      geometry.computeVertexNormals();

      // A tiny shared texture breaks up the highlights without fetching a model.
      const grain = new Uint8Array(128 * 128);
      let random = 461;
      for (let i = 0; i < grain.length; i++) {
        random = (random * 16807) % 2147483647;
        grain[i] = 90 + Math.floor((random / 2147483647) * 90);
      }
      const grainTexture = new THREE.DataTexture(
        grain,
        128,
        128,
        THREE.RedFormat,
      );
      grainTexture.wrapS = grainTexture.wrapT = THREE.RepeatWrapping;
      grainTexture.magFilter = THREE.LinearFilter;
      grainTexture.needsUpdate = true;
      const material = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.68,
        metalness: 0,
        bumpMap: grainTexture,
        bumpScale: 0.026,
        clearcoat: 0.1,
        clearcoatRoughness: 0.48,
      });
      const composition = new THREE.Group();
      scene.add(composition);
      const seeds = [
        { x: 1.5, y: 1.55, z: -0.4, scale: 0.4, angle: 0.7, depth: 4.2 },
        { x: 1.68, y: -1.4, z: 0.2, scale: 0.44, angle: 1.4, depth: 3.8 },
        { x: -1.65, y: 1.25, z: -0.6, scale: 0.34, angle: 1.1, depth: 2.4 },
        { x: -0.8, y: -2, z: -0.7, scale: 0.28, angle: -0.5, depth: 3 },
      ];
      const beans = seeds.map((seed) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(seed.x, seed.y, seed.z);
        mesh.scale.setScalar(seed.scale);
        mesh.rotation.set(-0.2, -0.25, seed.angle);
        composition.add(mesh);
        return mesh;
      });
      container.appendChild(canvas);
      const resize = () => {
        const { width, height } = container.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        composition.scale.x = Math.min(1, camera.aspect * 1.15);
        renderer.render(scene, camera);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();
      container.dataset.ready = "true";

      let visible = true;
      let frame = 0;
      let elapsed = 0;
      let last = 0;
      let pointerX = 0,
        pointerY = 0;
      let progress = 0;
      const hero = container.closest<HTMLElement>("[data-opening], section");
      const pointer = (event: globalThis.PointerEvent) => {
        if (
          event.pointerType !== "mouse" ||
          !finePointer.matches ||
          pausedRef.current
        )
          return;
        const box = container.getBoundingClientRect();
        pointerX =
          THREE.MathUtils.clamp(
            (event.clientX - box.left) / box.width - 0.5,
            -0.5,
            0.5,
          ) * 0.24;
        pointerY =
          THREE.MathUtils.clamp(
            (event.clientY - box.top) / box.height - 0.5,
            -0.5,
            0.5,
          ) * 0.18;
      };
      const resetPointer = () => {
        pointerX = 0;
        pointerY = 0;
      };
      hero?.addEventListener("pointermove", pointer);
      hero?.addEventListener("pointerleave", resetPointer);
      function render(now: number) {
        if (disposed) return;
        frame = requestAnimationFrame(render);
        if (!visible || document.hidden || pausedRef.current) {
          last = now;
          return;
        }
        // 30 fps is sufficient for slow ornamental motion on mobile GPUs.
        if (now - last < 32) return;
        const delta = Math.min((now - last) / 1000, 0.06);
        elapsed += delta;
        last = now;
        const target = Number(hero?.dataset.sceneProgress || 0);
        const targetProgress = Number.isFinite(target)
          ? THREE.MathUtils.clamp(target, 0, 1)
          : 0;
        progress = THREE.MathUtils.damp(progress, targetProgress, 8, delta);
        const spread = 1 + progress * 0.76;
        beans.forEach((bean, index) => {
          const seed = seeds[index];
          const turn = progress * (index % 2 === 0 ? 0.28 : -0.23);
          const x = seed.x * Math.cos(turn) - seed.y * Math.sin(turn);
          const y = seed.x * Math.sin(turn) + seed.y * Math.cos(turn);
          bean.position.x = x * spread;
          bean.position.y =
            y * spread + Math.sin(elapsed * 0.65 + index * 1.6) * 0.1;
          bean.position.z = seed.z + progress * seed.depth;
          bean.rotation.x = -0.2 + progress * (index % 2 ? -1.6 : 1.8);
          bean.rotation.y =
            Math.sin(elapsed * 0.35 + index) * 0.45 + progress * 2.6;
          bean.rotation.z =
            seed.angle + Math.sin(elapsed * 0.45 + index) * 0.14 + turn * 3;
        });
        composition.rotation.y = THREE.MathUtils.damp(
          composition.rotation.y,
          pointerX,
          4,
          delta,
        );
        composition.rotation.x = THREE.MathUtils.damp(
          composition.rotation.x,
          pointerY,
          4,
          delta,
        );
        renderer.render(scene, camera);
      }
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      visibilityObserver.observe(container);
      frame = requestAnimationFrame(render);

      const onContextLost = (event: Event) => {
        event.preventDefault();
        cleanupScene?.();
        cleanupScene = undefined;
      };
      canvas.addEventListener("webglcontextlost", onContextLost);

      cleanupScene = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        hero?.removeEventListener("pointermove", pointer);
        hero?.removeEventListener("pointerleave", resetPointer);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        geometry.dispose();
        material.dispose();
        grainTexture.dispose();
        renderer.dispose();
        canvas.remove();
        delete container.dataset.ready;
      };
    }
    const onPreference = () => {
      generation++;
      cleanupScene?.();
      cleanupScene = undefined;
      if (!media.matches)
        void initialize().catch(() => {
          /* Keep the photo fallback. */
        });
    };
    void initialize().catch(() => {
      /* WebGL is an optional enhancement. */
    });
    media.addEventListener("change", onPreference);
    return () => {
      disposed = true;
      generation++;
      media.removeEventListener("change", onPreference);
      cleanupScene?.();
    };
  }, []);

  return (
    <div ref={host} className={s.scene} aria-hidden="true">
      <div className={s.fallback}>
        {[0, 1, 2, 3].map((index) => (
          <Image
            key={index}
            src="/assets/floating-bean.webp"
            alt=""
            width={140}
            height={120}
            className={`${s.bean} ${s[`bean${index}`]}`}
          />
        ))}
      </div>
    </div>
  );
}
