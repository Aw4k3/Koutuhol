import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 260,
          background: '#020617',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#10b981',
          borderRadius: 96,
          border: '16px solid #10b981',
          fontWeight: 700,
        }}
      >
        ক
      </div>
    ),
    { ...size }
  );
}