import React, { useState } from 'react';
import { frameGeometry, validFrame } from '../utils/image-frame';

export default function ProductImage(props) {
  return <Thumbnail key={props.src} {...props} />;
}
function Thumbnail({ imageFrame, ...props }) {
  const [size, setSize] = useState(null);
  if (!validFrame(imageFrame)) return <img {...props} />;
  const g = size ? frameGeometry(size.width, size.height, 1, 1, imageFrame) : null;
  return <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
    <img {...props} onLoad={event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
      style={g ? { position: 'absolute', width: `${g.width * 100}%`, height: `${g.height * 100}%`, left: `${g.left * 100}%`, top: `${g.top * 100}%`, maxWidth: 'none' } : { opacity: 0 }} />
  </div>;
}
