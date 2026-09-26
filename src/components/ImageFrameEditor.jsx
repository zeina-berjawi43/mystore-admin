import React, { useRef, useState } from 'react';
import { DEFAULT_FRAME, MAX_ZOOM, clamp, frameGeometry, panFrame, validFrame } from '../utils/image-frame';
import './ImageFrameEditor.css';

export default function ImageFrameEditor(props) {
  // Remount dimensions/gesture state when the selected image changes.
  return <Editor key={props.src} {...props} />;
}

function Editor({ src, value, onChange, disabled }) {
  const [size, setSize] = useState(null);
  const [failed, setFailed] = useState(false);
  const drag = useRef(null);
  const active = validFrame(value);
  const frame = active ? value : DEFAULT_FRAME;
  const geometry = size ? frameGeometry(size.width, size.height, 1, 1, frame) : null;
  const unavailable = disabled || !size || failed;
  const stop = () => { drag.current = null; };
  const imageStyle = active && geometry ? {
    position: 'absolute', width: `${geometry.width * 100}%`, height: `${geometry.height * 100}%`,
    left: `${geometry.left * 100}%`, top: `${geometry.top * 100}%`, maxWidth: 'none', objectFit: 'fill',
  } : { width: '100%', height: '100%', objectFit: active ? 'cover' : 'contain' };
  return <div className="frame-editor">
    <div className="frame-editor-preview" role="img" aria-label="Product image framing preview"
      onPointerDown={event => {
        if (unavailable || event.button !== 0 || drag.current) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, frame, width: event.currentTarget.clientWidth };
        onChange(frame);
      }}
      onPointerMove={event => {
        const start = drag.current;
        if (!start || unavailable || start.id !== event.pointerId) return;
        const g = frameGeometry(size.width, size.height, start.width, start.width, start.frame);
        onChange(panFrame(start.frame, event.clientX - start.x, event.clientY - start.y, g.travelX, g.travelY));
      }} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
      <img src={src} alt="Product preview" draggable={false} style={imageStyle}
        onLoad={event => { setFailed(false); setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }); }}
        onError={() => { setFailed(true); setSize(null); }} />
    </div>
    <p>{failed ? 'Unable to load image. Choose another image or try again.' : active ? 'Drag to position. Square preview matches Recent and Cart; other cards adapt to their shape.' : 'Original fit preserved. Drag or zoom to set framing.'}</p>
    <div className="frame-editor-controls">
      <button type="button" disabled={unavailable || frame.zoom <= 1} aria-label="Zoom out" onClick={() => onChange({ ...frame, zoom: clamp(frame.zoom - .1, 1, MAX_ZOOM) })}>−</button>
      <input aria-label="Image zoom" type="range" min="1" max={MAX_ZOOM} step="0.01" value={frame.zoom} disabled={unavailable}
        onChange={event => onChange({ ...frame, zoom: Number(event.target.value) })} />
      <button type="button" disabled={unavailable || frame.zoom >= MAX_ZOOM} aria-label="Zoom in" onClick={() => onChange({ ...frame, zoom: clamp(frame.zoom + .1, 1, MAX_ZOOM) })}>+</button>
      <span>{frame.zoom.toFixed(1)}×</span>
      <button type="button" disabled={unavailable} onClick={() => onChange({ ...DEFAULT_FRAME })}>Reset / Center</button>
    </div>
    <p>Product Details keeps the full original image.</p>
  </div>;
}
