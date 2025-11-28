import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Circle } from 'lucide-react'

export default function AgentPipeline({ stages }){
  const [activeStage, setActiveStage] = useState(0)

  useEffect(()=>{
    if(activeStage < stages.length - 1){
      const timer = setTimeout(()=>{
        setActiveStage(activeStage + 1)
      }, stages[activeStage].duration || 2000)
      return ()=>clearTimeout(timer)
    }
  }, [activeStage, stages])

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 h-full">
      <div className="text-sm font-medium text-gray-700">Multi-Agent Pipeline</div>
      {stages.map((stage, i)=>{
        const isActive = i === activeStage
        const isDone = i < activeStage
        const isPending = i > activeStage

        return (
          <div key={i} className={`flex items-center gap-3 transition-all ${isActive ? 'scale-105' : ''}`}>
            <div className="flex-shrink-0">
              {isDone && <CheckCircle2 className="text-green-500" size={22}/>}
              {isActive && <Loader2 className="text-blue-500 animate-spin" size={22}/>}
              {isPending && <Circle className="text-gray-300" size={22}/>}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : isDone ? 'text-gray-700' : 'text-gray-400'}`}>
                {stage.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{stage.description}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
