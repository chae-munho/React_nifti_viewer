/*
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function CrossSection3DViewer({ axialData, coronalData, sagittalData, width, height, depth }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;

    // ✅ 이전 renderer 제거 (중복 방지)
    while (container?.firstChild) {
      container.removeChild(container.firstChild);
    }

    // ❗ sliceData 유효성 검사 (렌더링 방지 조건)
    const expectedAxial = width * height * 4;
    const expectedCoronal = width * depth * 4;
    const expectedSagittal = height * depth * 4;

    if (
      !axialData || axialData.length !== expectedAxial ||
      !coronalData || coronalData.length !== expectedCoronal ||
      !sagittalData || sagittalData.length !== expectedSagittal
    ) {
      console.warn('❌ sliceData 크기 불일치 또는 누락. 렌더링 건너뜀');
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.set(0, 0, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 600);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    function createTexture(sliceData, w, h) {
      const expectedLength = w * h * 4;

      // ✅ sliceData 길이 검증
      if (!sliceData || sliceData.length !== expectedLength) {
        console.error(`⚠️ 잘못된 sliceData 크기: ${sliceData?.length} (예상: ${expectedLength})`);

        // fallback 텍스처: 전부 검정 RGBA
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
    }

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

    scene.add(axialPlane);
    scene.add(coronalPlane);
    scene.add(sagittalPlane);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [axialData, coronalData, sagittalData, width, height, depth]);

  return <div ref={mountRef} style={{ width: '600px', height: '600px' }}></div>;
}

export default CrossSection3DViewer;
*/


/*
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function CrossSection3DViewer({ axialData, coronalData, sagittalData, width, height, depth }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;

    // ✅ 이전 renderer 제거 (중복 방지)
    while (container?.firstChild) {
      container.removeChild(container.firstChild);
    }

    // ❗ sliceData 유효성 검사 (렌더링 방지 조건)
    const expectedAxial = width * height * 4;
    const expectedCoronal = width * depth * 4;
    const expectedSagittal = height * depth * 4;

    if (
      !axialData || axialData.length !== expectedAxial ||
      !coronalData || coronalData.length !== expectedCoronal ||
      !sagittalData || sagittalData.length !== expectedSagittal
    ) {
      console.warn('❌ sliceData 크기 불일치 또는 누락. 렌더링 건너뜀');
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.set(0, 0, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 600);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    function createTexture(sliceData, w, h) {
      const expectedLength = w * h * 4;

      // ✅ sliceData 길이 검증
      if (!sliceData || sliceData.length !== expectedLength) {
        console.error(`⚠️ 잘못된 sliceData 크기: ${sliceData?.length} (예상: ${expectedLength})`);

        // fallback 텍스처: 전부 검정 RGBA
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
    }

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

    scene.add(axialPlane);
    scene.add(coronalPlane);
    scene.add(sagittalPlane);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [axialData, coronalData, sagittalData, width, height, depth]);

  return <div ref={mountRef} style={{ width: '600px', height: '600px' }}></div>;
}

export default CrossSection3DViewer;
*/


import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function CrossSection3DViewer({ axialData, coronalData, sagittalData, width, height, depth }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const texturesRef = useRef({}); // texture 객체 저장

  // ✅ 외부에 선언된 texture 갱신 함수
  const updateTexture = (texture, data, w, h) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(w, h);
    imageData.data.set(data);
    ctx.putImageData(imageData, 0, 0);
    texture.image = canvas;
    texture.needsUpdate = true;
  };

  useEffect(() => {
    const container = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.set(0, 0, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 600);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    const createTexture = (data, w, h) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(w, h);
      imageData.data.set(data);
      ctx.putImageData(imageData, 0, 0);
      return new THREE.CanvasTexture(canvas);
    };

    const axialTex = createTexture(axialData, width, height);
    const coronalTex = createTexture(coronalData, width, depth);
    const sagittalTex = createTexture(sagittalData, height, depth);
    texturesRef.current = {
      axial: axialTex,
      coronal: coronalTex,
      sagittal: sagittalTex,
    };

    const axialPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: axialTex, side: THREE.DoubleSide })
    );
    const coronalPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({ map: coronalTex, side: THREE.DoubleSide })
    );
    coronalPlane.rotation.x = Math.PI / 2;

    const sagittalPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(height, depth),
      new THREE.MeshBasicMaterial({ map: sagittalTex, side: THREE.DoubleSide })
    );
    sagittalPlane.rotation.y = Math.PI / 2;

    scene.add(axialPlane, coronalPlane, sagittalPlane);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const tex = texturesRef.current;
    if (tex.axial && tex.coronal && tex.sagittal) {
      updateTexture(tex.axial, axialData, width, height);
      updateTexture(tex.coronal, coronalData, width, depth);
      updateTexture(tex.sagittal, sagittalData, height, depth);
    }
  }, [axialData, coronalData, sagittalData, width, height, depth]);

  return <div ref={mountRef} style={{ width: '600px', height: '600px' }} />;
}

export default CrossSection3DViewer;
