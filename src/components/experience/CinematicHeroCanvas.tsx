import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const createRenderer = (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  return renderer;
};

export const CinematicHeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const renderer = createRenderer(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 0, 24);

    const group = new THREE.Group();
    scene.add(group);

    const glowGeometry = new THREE.IcosahedronGeometry(8.2, 4);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#d4a373'),
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.scale.set(1.2, 0.85, 1.15);
    group.add(glowMesh);

    const particleCount = window.innerWidth < 768 ? 420 : 860;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const palette = ['#f6ede2', '#d4a373', '#7a7a7a', '#ffffff'].map((value) => new THREE.Color(value));

    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      const radius = 5 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const color = palette[index % palette.length];

      positions[stride] = radius * Math.sin(phi) * Math.cos(theta);
      positions[stride + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.72;
      positions[stride + 2] = radius * Math.cos(phi);

      colors[stride] = color.r;
      colors[stride + 1] = color.g;
      colors[stride + 2] = color.b;
      scales[index] = 0.8 + Math.random() * 1.8;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(scales, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.12,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    const ambientLight = new THREE.AmbientLight('#fff8ef', 1.1);
    const keyLight = new THREE.PointLight('#d4a373', 24, 80, 2);
    keyLight.position.set(12, 8, 14);
    const rimLight = new THREE.PointLight('#f8ede0', 14, 80, 2);
    rimLight.position.set(-10, -6, 10);

    scene.add(ambientLight);
    scene.add(keyLight);
    scene.add(rimLight);

    let pointerX = 0;
    let pointerY = 0;

    const updateSize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;

      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const normalizedX = (event.clientX / window.innerWidth) - 0.5;
      const normalizedY = (event.clientY / window.innerHeight) - 0.5;
      pointerX = normalizedX * 0.85;
      pointerY = normalizedY * 0.65;
    };

    const animate = (time: number) => {
      const elapsed = time * 0.00025;
      group.rotation.y += 0.0014;
      group.rotation.x += 0.00035;
      group.position.x += (pointerX * 1.8 - group.position.x) * 0.04;
      group.position.y += (-pointerY * 1.6 - group.position.y) * 0.04;
      glowMesh.rotation.x = elapsed * 2.5;
      glowMesh.rotation.y = elapsed * 1.4;
      particles.rotation.y = -elapsed * 1.7;
      particles.rotation.z = elapsed * 0.35;
      renderer.render(scene, camera);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(updateSize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    window.addEventListener('resize', updateSize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    updateSize();
    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      particleGeometry.dispose();
      particleMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
};
