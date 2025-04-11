import { useState, useRef, useEffect } from 'react';
import * as nifti from 'nifti-reader-js';
import './styles.css';
import CrossSection3DViewer from './components/CrossSection3DViewer';

function NiftiViewer() {
  const [niftiHeader, setNiftiHeader] = useState(null);
  const [niftiImage, setNiftiImage] = useState(null);
  const [textData, setTextData] = useState([]);
  const [sliceData, setSliceData] = useState(null);

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
      update3DSliceData(header, image);
    }

    if (fileMapping[file.name]) {
      fetch(fileMapping[file.name])
        .then((res) => res.text())
        .then((text) => setTextData(text.split('\n')));
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
    ['axial', 'coronal', 'sagittal'].forEach((view) => {
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
        imageData.data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const getRGBAData = (view, slice, header, image) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let w, h;

    if (view === 'axial') {
      w = header.dims[1];
      h = header.dims[2];
    } else if (view === 'coronal') {
      w = header.dims[1];
      h = header.dims[3];
    } else {
      w = header.dims[2];
      h = header.dims[3];
    }

    canvas.width = w;
    canvas.height = h;
    drawSlice(view, slice, header, image, ctx);
    return ctx.getImageData(0, 0, w, h).data;
  };

  const update3DSliceData = (header, image) => {
    const dims = header.dims;
    const axial = parseInt(sliderRefs.axial.current.value);
    const coronal = parseInt(sliderRefs.coronal.current.value);
    const sagittal = parseInt(sliderRefs.sagittal.current.value);

    setSliceData({
      axial: getRGBAData('axial', axial, header, image),
      coronal: getRGBAData('coronal', coronal, header, image),
      sagittal: getRGBAData('sagittal', sagittal, header, image),
    });
  };

  const handleSliderChange = (view) => {
    if (!niftiHeader || !niftiImage) return;
    drawSlice(view, parseInt(sliderRefs[view].current.value), niftiHeader, niftiImage);
    update3DSliceData(niftiHeader, niftiImage);
  };

  return (
    <>
      <div className="topbar">
        <div className="logo"><img src="/img/mint_logo.svg" alt="Logo" /></div>
      </div>

      <div className="container">
        <div className="sidebar">
          <div className="pink-bar"></div>
          <div className="menu">
            <div className="icon"><img src="/img/Open_with.svg" width="36" /></div>
            <div className="icon"><img src="/img/3d_rotation.svg" width="36" /></div>
            <div className="icon"><img src="/img/Animation.svg" width="36" /></div>
            <div className="icon"><img src="/img/Contrast.svg" width="36" /></div>
            <div className="icon"><img src="/img/Center_focus_strong.svg" width="36" /></div>
          </div>
        </div>

        <div className="main-content">
          <div className="image-stack">
            {['axial', 'coronal', 'sagittal'].map((view) => (
              <div className="image-box" key={view}>
                <div className="name-box">{view.toUpperCase()}</div>
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
            {sliceData && niftiHeader && (
              <CrossSection3DViewer
                axialData={sliceData.axial}
                coronalData={sliceData.coronal}
                sagittalData={sliceData.sagittal}
                width={niftiHeader.dims[1]}
                height={niftiHeader.dims[2]}
                depth={niftiHeader.dims[3]}
              />
            )}
          </div>
        </div>

        <div className="info-panel">
          <div className="pink-rectangle"><span>&lt;</span></div>
          <div className="patient-info-box">
            <h2>Patient Info</h2>
            <ul>
              <li><strong>Patient ID: </strong>{textData[0] || 'N/A'}</li>
              <li><strong>Gender: </strong>{textData[1] || 'N/A'}</li>
              <li><strong>Date of Birth: </strong>{textData[2] || 'N/A'}</li>
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
          </div>
        </div>
      </div>
    </>
  );
}

export default NiftiViewer;
