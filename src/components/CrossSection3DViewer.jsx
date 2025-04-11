
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function CrossSection3DViewer({ axialData, coronalData, sagittalData, width, height, depth }) {
  const mountRef = useRef(null);
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const planesRef = useRef({});

  useEffect(() => {
    const container = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.set(0, 0, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 600);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // ✅ 이전 평면 제거 및 메모리 해제
    Object.values(planesRef.current).forEach(plane => {
      if (plane.material.map) plane.material.map.dispose();
      plane.material.dispose();
      plane.geometry.dispose();
      scene.remove(plane);
    });

    const createTexture = (sliceData, w, h) => {
      const expectedLength = w * h * 4;
      if (!sliceData || sliceData.length !== expectedLength) {
        const fallback = new Uint8ClampedArray(expectedLength);
        for (let i = 0; i < expectedLength; i += 4) {
          fallback[i] = fallback[i + 1] = fallback[i + 2] = 0;
          fallback[i + 3] = 255;
        }
        sliceData = fallback;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(w, h);
      imgData.data.set(sliceData);
      ctx.putImageData(imgData, 0, 0);
      return new THREE.CanvasTexture(canvas);
    };

    const axialTexture = createTexture(axialData, width, height);
    const coronalTexture = createTexture(coronalData, width, depth);
    const sagittalTexture = createTexture(sagittalData, height, depth);

    const axialPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: axialTexture, side: THREE.DoubleSide })
    );

    const coronalPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({ map: coronalTexture, side: THREE.DoubleSide })
    );
    coronalPlane.rotation.x = Math.PI / 2;

    const sagittalPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(height, depth),
      new THREE.MeshBasicMaterial({ map: sagittalTexture, side: THREE.DoubleSide })
    );
    sagittalPlane.rotation.y = Math.PI / 2;

    planesRef.current = { axialPlane, coronalPlane, sagittalPlane };
    scene.add(axialPlane);
    scene.add(coronalPlane);
    scene.add(sagittalPlane);
  }, [axialData, coronalData, sagittalData, width, height, depth]);

  return <div ref={mountRef} style={{ width: '600px', height: '600px' }} />;
}

export default CrossSection3DViewer;
