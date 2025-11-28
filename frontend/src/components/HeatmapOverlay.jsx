import { useEffect, useState } from 'react'

export default function HeatmapOverlay({ imageUrl }){
  const [opacity, setOpacity] = useState(0)

  useEffect(()=>{
    setTimeout(()=>setOpacity(1), 200)
  }, [])

  return (
    <div className="relative inline-block">
      <img src={imageUrl} alt="X-ray" className="rounded-lg shadow-lg max-w-md" />
      <div 
        className="absolute inset-0 bg-gradient-to-br from-red-500/40 via-yellow-500/30 to-transparent rounded-lg transition-opacity duration-1000"
        style={{ opacity }}
      />
      <div className="absolute top-2 right-2 bg-white/90 px-3 py-1 rounded-full text-xs font-medium shadow">
        CAM Heatmap
      </div>
    </div>
  )
}
