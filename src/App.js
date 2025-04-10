/*
import { useState, useRef, useEffect } from 'react';
import * as nifti from 'nifti-reader-js';
import './styles.css';
import CrossSection3DViewer from './components/CrossSection3DViewer';

function NiftiViewer() {
  const [niftiHeader, setNiftiHeader] = useState(null);
  const [niftiImage, setNiftiImage] = useState(null);
  const [textData, setTextData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [sliceData, setSliceData] = useState(null);
  const [show3D, setShow3D] = useState(false);

  const canvasRefs = {
    axial: useRef(null),
    coronal: useRef(null),
    sagittal: useRef(null),
  };
  const sliderRefs = {
    axial: useRef(null),
    coronal: useRef(null),
    sagittal: useRef(null),
  };

  const fileMapping = {
    'T1w.nii': '/testTxt/test01.txt',
    'spm152.nii.gz': '/testTxt/test02.txt',
    'MR_Gd.nii.gz': '/testTxt/test03.txt',
    'CT_Philips.nii.gz': '/testTxt/test01.txt',
    '5D.nii': '/testTxt/test02.txt',
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const arrayBuffer = await file.arrayBuffer();
    const data = nifti.isCompressed(arrayBuffer)
      ? nifti.decompress(arrayBuffer)
      : arrayBuffer;

    if (nifti.isNIFTI(data)) {
      const header = nifti.readHeader(data);
      const image = nifti.readImage(header, data);
      setNiftiHeader(header);
      setNiftiImage(image);
      setupSliders(header);
      drawAllViews(header, image);
    }

    if (fileMapping[file.name]) {
      fetch(fileMapping[file.name])
        .then(res => res.text())
        .then(text => {
          setTextData(text.split('\n'));
        });
    }
  };

  const setupSliders = (header) => {
    const dims = header.dims;
    sliderRefs.axial.current.max = dims[3] - 1;
    sliderRefs.coronal.current.max = dims[2] - 1;
    sliderRefs.sagittal.current.max = dims[1] - 1;

    sliderRefs.axial.current.value = Math.floor(dims[3] / 2);
    sliderRefs.coronal.current.value = Math.floor(dims[2] / 2);
    sliderRefs.sagittal.current.value = Math.floor(dims[1] / 2);
  };

  const drawAllViews = (header, image) => {
    ['axial', 'coronal', 'sagittal'].forEach(view => {
      drawSlice(view, parseInt(sliderRefs[view].current.value), header, image);
    });
  };

  const handleSliderChange = (view) => {
    if (niftiHeader && niftiImage) {
      drawSlice(view, parseInt(sliderRefs[view].current.value), niftiHeader, niftiImage);
    }
  };

  const drawSlice = (view, slice, header, image, ctxOverride = null) => {
    const dims = header.dims;
    const canvas = ctxOverride ? null : canvasRefs[view].current;
    const ctx = ctxOverride || canvas.getContext('2d');
    let cols, rows, sliceSize, sliceOffset;

    if (view === 'axial') {
      cols = dims[1]; rows = dims[2];
      sliceSize = cols * rows;
      sliceOffset = slice * sliceSize;
    } else if (view === 'coronal') {
      cols = dims[1]; rows = dims[3];
      sliceSize = dims[2] * cols;
      sliceOffset = slice * cols;
    } else {
      cols = dims[2]; rows = dims[3];
      sliceSize = dims[1] * cols;
      sliceOffset = slice;
    }

    if (!ctxOverride) {
      canvas.width = cols;
      canvas.height = rows;
    }
    const imageData = ctx.createImageData(cols, rows);
    let typedData;
    switch (header.datatypeCode) {
      case nifti.NIFTI1.TYPE_UINT8: typedData = new Uint8Array(image); break;
      case nifti.NIFTI1.TYPE_INT16: typedData = new Int16Array(image); break;
      case nifti.NIFTI1.TYPE_INT32: typedData = new Int32Array(image); break;
      case nifti.NIFTI1.TYPE_FLOAT32: typedData = new Float32Array(image); break;
      case nifti.NIFTI1.TYPE_FLOAT64: typedData = new Float64Array(image); break;
      case nifti.NIFTI1.TYPE_INT8: typedData = new Int8Array(image); break;
      case nifti.NIFTI1.TYPE_UINT16: typedData = new Uint16Array(image); break;
      case nifti.NIFTI1.TYPE_UINT32: typedData = new Uint32Array(image); break;
      default: return;
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let offset;
        if (view === 'axial') offset = sliceOffset + row * cols + col;
        else if (view === 'coronal') offset = slice * cols + row * sliceSize + col;
        else offset = col * sliceSize + row * dims[1] + slice;

        const value = typedData[offset];
        const i = (row * cols + col) * 4;
        imageData.data[i] = value & 0xFF;
        imageData.data[i + 1] = value & 0xFF;
        imageData.data[i + 2] = value & 0xFF;
        imageData.data[i + 3] = 0xFF;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleAnalyze = () => {
    if (!niftiHeader || !niftiImage) return;

    const dims = niftiHeader.dims;
    const mid = {
      axial: Math.floor(dims[3] / 2),
      coronal: Math.floor(dims[2] / 2),
      sagittal: Math.floor(dims[1] / 2),
    };

    const getRGBAData = (view, slice) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
    
      let w, h;
      if (view === 'axial') {
        w = niftiHeader.dims[1];
        h = niftiHeader.dims[2];
      } else if (view === 'coronal') {
        w = niftiHeader.dims[1];
        h = niftiHeader.dims[3];
      } else {
        w = niftiHeader.dims[2];
        h = niftiHeader.dims[3];
      }
    
      canvas.width = w;
      canvas.height = h;
    
      drawSlice(view, slice, niftiHeader, niftiImage, ctx);  // ✅ 여기서 직접 그리기
    
      return ctx.getImageData(0, 0, w, h).data;
    };
    
    
    setSliceData({
      axial: getRGBAData('axial', mid.axial),
      coronal: getRGBAData('coronal', mid.coronal),
      sagittal: getRGBAData('sagittal', mid.sagittal),
    });
    setShow3D(true);
  };

  return (
    <>
      <div className="topbar">
        <div className="logo">
          <img src="/img/mint_logo.svg" alt="Logo" />
        </div>
      </div>

      <div className="container">
        <div className="sidebar">
          <div className="pink-bar"></div>
          <div className="menu">
            <div className="icon"><img src="/img/Open_with.svg" alt="1" width="36" /></div>
            <div className="icon"><img src="/img/3d_rotation.svg" alt="3D Rotation" width="36" /></div>
            <div className="icon"><img src="/img/Animation.svg" alt="2" width="36" /></div>
            <div className="icon"><img src="/img/Contrast.svg" alt="3" width="36" /></div>
            <div className="icon"><img src="/img/Center_focus_strong.svg" alt="4" width="36" /></div>
          </div>
        </div>

        <div className="main-content">
          <div className="image-stack">
            {['axial', 'coronal', 'sagittal'].map(view => (
              <div className="image-box" key={view}>
                <div className="name-box">
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </div>
                <div className="sliderContainer">
                  <input
                    type="range"
                    ref={sliderRefs[view]}
                    min="0"
                    defaultValue="0"
                    onInput={() => handleSliderChange(view)}
                  />
                </div>
                <canvas ref={canvasRefs[view]} />
              </div>
            ))}
          </div>

          <div className="brain-model-box">
            {show3D && sliceData && (
              <CrossSection3DViewer
                axialData={sliceData.axial}
                coronalData={sliceData.coronal}
                sagittalData={sliceData.sagittal}
                width={niftiHeader?.dims[1]}
                height={niftiHeader?.dims[2]}
                depth={niftiHeader?.dims[3]}
              />
            )}
            <div id="progress-container">
              <div id="progress-bar"></div>
            </div>
          </div>
        </div>

        <div className="info-panel">
          <div className="pink-rectangle"><span>&lt;</span></div>

          <div className="patient-info-box">
            <h2>Patient Info</h2>
            <ul>
              <li><strong>Patient ID: </strong><span className="patientId">{textData[0] || 'N/A'}</span></li>
              <li><strong>Gender: </strong><span className="gender">{textData[1] || 'N/A'}</span></li>
              <li><strong>Date of Birth: </strong><span className="dateOfBirth">{textData[2] || 'N/A'}</span></li>
            </ul>
          </div>

          <div className="diagnostic-result-box">
            <h2>Analysis</h2>
            <ul>
              {textData.slice(3).map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="buttons">
            <input type="file" id="file" onChange={handleFileChange} />
            <label htmlFor="file" className="custom-file-label upload-btn">Upload</label>
            <button className="glb_file_label">3D Conversion</button>
            <button className="analyze_file_label" onClick={handleAnalyze}>Analyze</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default NiftiViewer;

*/

import { useState, useRef, useEffect } from 'react';
import * as nifti from 'nifti-reader-js';
import './styles.css';
import CrossSection3DViewer from './components/CrossSection3DViewer';

function NiftiViewer() {
  const [niftiHeader, setNiftiHeader] = useState(null);
  const [niftiImage, setNiftiImage] = useState(null);
  const [textData, setTextData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [sliceData, setSliceData] = useState(null);
  const [show3D, setShow3D] = useState(false);

  const canvasRefs = {
    axial: useRef(null),
    coronal: useRef(null),
    sagittal: useRef(null),
  };
  const sliderRefs = {
    axial: useRef(null),
    coronal: useRef(null),
    sagittal: useRef(null),
  };

  const fileMapping = {
    'T1w.nii': '/testTxt/test01.txt',
    'spm152.nii.gz': '/testTxt/test02.txt',
    'MR_Gd.nii.gz': '/testTxt/test03.txt',
    'CT_Philips.nii.gz': '/testTxt/test01.txt',
    '5D.nii': '/testTxt/test02.txt',
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const arrayBuffer = await file.arrayBuffer();
    const data = nifti.isCompressed(arrayBuffer) ? nifti.decompress(arrayBuffer) : arrayBuffer;

    if (nifti.isNIFTI(data)) {
      const header = nifti.readHeader(data);
      const image = nifti.readImage(header, data);
      setNiftiHeader(header);
      setNiftiImage(image);
      setupSliders(header);
      drawAllViews(header, image);
    }

    if (fileMapping[file.name]) {
      fetch(fileMapping[file.name])
        .then(res => res.text())
        .then(text => {
          setTextData(text.split('\n'));
        });
    }
  };

  const setupSliders = (header) => {
    const dims = header.dims;
    sliderRefs.axial.current.max = dims[3] - 1;
    sliderRefs.coronal.current.max = dims[2] - 1;
    sliderRefs.sagittal.current.max = dims[1] - 1;

    sliderRefs.axial.current.value = Math.floor(dims[3] / 2);
    sliderRefs.coronal.current.value = Math.floor(dims[2] / 2);
    sliderRefs.sagittal.current.value = Math.floor(dims[1] / 2);
  };

  const handleSliderChange = (view) => {
    if (niftiHeader && niftiImage) {
      drawSlice(view, parseInt(sliderRefs[view].current.value), niftiHeader, niftiImage);
      if (show3D) update3DSliceData(); // ✅ 슬라이더 움직일 때 3D 동기화
    }
  };

  const drawAllViews = (header, image) => {
    ['axial', 'coronal', 'sagittal'].forEach(view => {
      drawSlice(view, parseInt(sliderRefs[view].current.value), header, image);
    });
  };

  const drawSlice = (view, slice, header, image, ctxOverride = null) => {
    const dims = header.dims;
    const canvas = ctxOverride ? null : canvasRefs[view].current;
    const ctx = ctxOverride || canvas.getContext('2d');
    let cols, rows, sliceSize, sliceOffset;

    if (view === 'axial') {
      cols = dims[1]; rows = dims[2];
      sliceSize = cols * rows;
      sliceOffset = slice * sliceSize;
    } else if (view === 'coronal') {
      cols = dims[1]; rows = dims[3];
      sliceSize = dims[2] * cols;
      sliceOffset = slice * cols;
    } else {
      cols = dims[2]; rows = dims[3];
      sliceSize = dims[1] * cols;
      sliceOffset = slice;
    }

    if (!ctxOverride) {
      canvas.width = cols;
      canvas.height = rows;
    }

    const imageData = ctx.createImageData(cols, rows);
    let typedData;
    switch (header.datatypeCode) {
      case nifti.NIFTI1.TYPE_UINT8: typedData = new Uint8Array(image); break;
      case nifti.NIFTI1.TYPE_INT16: typedData = new Int16Array(image); break;
      case nifti.NIFTI1.TYPE_INT32: typedData = new Int32Array(image); break;
      case nifti.NIFTI1.TYPE_FLOAT32: typedData = new Float32Array(image); break;
      case nifti.NIFTI1.TYPE_FLOAT64: typedData = new Float64Array(image); break;
      case nifti.NIFTI1.TYPE_INT8: typedData = new Int8Array(image); break;
      case nifti.NIFTI1.TYPE_UINT16: typedData = new Uint16Array(image); break;
      case nifti.NIFTI1.TYPE_UINT32: typedData = new Uint32Array(image); break;
      default: return;
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let offset;
        if (view === 'axial') offset = sliceOffset + row * cols + col;
        else if (view === 'coronal') offset = slice * cols + row * sliceSize + col;
        else offset = col * sliceSize + row * dims[1] + slice;

        const value = typedData[offset];
        const i = (row * cols + col) * 4;
        imageData.data[i] = value & 0xff;
        imageData.data[i + 1] = value & 0xff;
        imageData.data[i + 2] = value & 0xff;
        imageData.data[i + 3] = 0xff;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const getRGBAData = (view, slice) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let w, h;

    if (view === 'axial') {
      w = niftiHeader.dims[1];
      h = niftiHeader.dims[2];
    } else if (view === 'coronal') {
      w = niftiHeader.dims[1];
      h = niftiHeader.dims[3];
    } else {
      w = niftiHeader.dims[2];
      h = niftiHeader.dims[3];
    }

    canvas.width = w;
    canvas.height = h;

    drawSlice(view, slice, niftiHeader, niftiImage, ctx);
    return ctx.getImageData(0, 0, w, h).data;
  };

  const update3DSliceData = () => {
    setSliceData({
      axial: getRGBAData('axial', parseInt(sliderRefs.axial.current.value)),
      coronal: getRGBAData('coronal', parseInt(sliderRefs.coronal.current.value)),
      sagittal: getRGBAData('sagittal', parseInt(sliderRefs.sagittal.current.value)),
    });
  };

  const handleAnalyze = () => {
    if (!niftiHeader || !niftiImage) return;
    update3DSliceData(); // ✅ 초기 분석 시에도 sliceData 생성
    setShow3D(true);
  };

  return (
    <>
      <div className="topbar">
        <div className="logo">
          <img src="/img/mint_logo.svg" alt="Logo" />
        </div>
      </div>

      <div className="container">
        <div className="sidebar">
          <div className="pink-bar"></div>
          <div className="menu">
            <div className="icon"><img src="/img/Open_with.svg" alt="1" width="36" /></div>
            <div className="icon"><img src="/img/3d_rotation.svg" alt="3D Rotation" width="36" /></div>
            <div className="icon"><img src="/img/Animation.svg" alt="2" width="36" /></div>
            <div className="icon"><img src="/img/Contrast.svg" alt="3" width="36" /></div>
            <div className="icon"><img src="/img/Center_focus_strong.svg" alt="4" width="36" /></div>
          </div>
        </div>

        <div className="main-content">
          <div className="image-stack">
            {['axial', 'coronal', 'sagittal'].map(view => (
              <div className="image-box" key={view}>
                <div className="name-box">{view.charAt(0).toUpperCase() + view.slice(1)}</div>
                <div className="sliderContainer">
                  <input
                    type="range"
                    ref={sliderRefs[view]}
                    min="0"
                    defaultValue="0"
                    onInput={() => handleSliderChange(view)}
                  />
                </div>
                <canvas ref={canvasRefs[view]} />
              </div>
            ))}
          </div>

          <div className="brain-model-box">
            {show3D && sliceData && (
              <CrossSection3DViewer
                axialData={sliceData.axial}
                coronalData={sliceData.coronal}
                sagittalData={sliceData.sagittal}
                width={niftiHeader?.dims[1]}
                height={niftiHeader?.dims[2]}
                depth={niftiHeader?.dims[3]}
              />
            )}
            <div id="progress-container"><div id="progress-bar"></div></div>
          </div>
        </div>

        <div className="info-panel">
          <div className="pink-rectangle"><span>&lt;</span></div>
          <div className="patient-info-box">
            <h2>Patient Info</h2>
            <ul>
              <li><strong>Patient ID: </strong><span className="patientId">{textData[0] || 'N/A'}</span></li>
              <li><strong>Gender: </strong><span className="gender">{textData[1] || 'N/A'}</span></li>
              <li><strong>Date of Birth: </strong><span className="dateOfBirth">{textData[2] || 'N/A'}</span></li>
            </ul>
          </div>
          <div className="diagnostic-result-box">
            <h2>Analysis</h2>
            <ul>
              {textData.slice(3).map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="buttons">
            <input type="file" id="file" onChange={handleFileChange} />
            <label htmlFor="file" className="custom-file-label upload-btn">Upload</label>
            <button className="glb_file_label">3D Conversion</button>
            <button className="analyze_file_label" onClick={handleAnalyze}>Analyze</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default NiftiViewer;


