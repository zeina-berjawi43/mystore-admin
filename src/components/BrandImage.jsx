import { useState } from 'react';
import ProductImage from './ProductImage';
import { brandFrameGeometry, containedBrandFrame } from '../utils/brand-image-frame';

export default function BrandImage(props) {
  return containedBrandFrame(props.imageFrame) ? <ContainedImage key={props.src} {...props} /> : <ProductImage {...props} />;
}
function ContainedImage({ imageFrame, ...props }) {
  const [size, setSize] = useState(null);
  const g = size ? brandFrameGeometry(size.width, size.height, 1, 1, imageFrame) : null;
  return <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
    <img {...props} onLoad={event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
      style={g ? { position: 'absolute', width: `${g.width * 100}%`, height: `${g.height * 100}%`, left: `${g.left * 100}%`, top: `${g.top * 100}%`, maxWidth: 'none' } : { opacity: 0 }} />
  </div>;
}
