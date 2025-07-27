'use client'

import { useState } from 'react'

type Props = {
  carNo: string
  images: string[]
  setImages: (urls: string[]) => void
}

export default function ImageUploader({ carNo, images, setImages }: Props) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  // 🏷 単一画像アップロード
  const handleUpload = async (file: File, index: number) => {
    if (!carNo) {
      alert('❌ 先に車両ID (car_no) を入力してください')
      return
    }

    setUploadingIndex(index)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('carNo', carNo)
    formData.append('fileIndex', (index + 1).toString())

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      const newImages = [...images]
      newImages[index] = data.url
      setImages(newImages)
    } else {
      alert('❌ 画像アップロードに失敗しました')
    }

    setUploadingIndex(null)
  }

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={frameStyle}>
          {images[i] ? (
            <img
              src={images[i]}
              alt={`車画像${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
            />
          ) : (
            <div style={placeholderStyle}>📷 {i + 1}</div>
          )}

          <input
            type="file"
            accept="image/*"
            style={{ marginTop: '8px', width: '100%' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUpload(e.target.files[0], i)
              }
            }}
          />

          {uploadingIndex === i && <p style={{ fontSize: '12px', color: '#555' }}>⏳ アップロード中...</p>}
        </div>
      ))}
    </div>
  )
}

/* 🎨 スタイル */
const frameStyle: React.CSSProperties = {
  width: '120px',
  textAlign: 'center',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '8px',
  background: '#f9fafb',
}

const placeholderStyle: React.CSSProperties = {
  width: '100%',
  height: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  color: '#aaa',
  background: '#e5e7eb',
  borderRadius: '6px',
}
