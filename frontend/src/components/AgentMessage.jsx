import { Bot, User, Loader2, Copy, RefreshCw, Download, Check } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import HeatmapOverlay from './HeatmapOverlay'
import ReportCard from './ReportCard'

// Simple Markdown parser to convert **text** to <strong>text</strong>
const parseMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ line breaks with 2
    .replace(/\n/g, '<br/>') // Line breaks
}

export default function AgentMessage({ message, isUser, onRegenerate }){
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const messageEndRef = useRef(null)

  useEffect(()=>{
    setTimeout(()=>setVisible(true), 100)
  }, [])

  const handleCopy = () => {
    const textToCopy = message.displayText || message.text
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message)
      toast.success('Regenerating response...')
    }
  }

  const handleExport = () => {
    const textToExport = message.displayText || message.text
    const blob = new Blob([textToExport], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `response-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Exported successfully!')
  }

  // Use displayText from message state (handled at Chat level)
  const text = message.displayText || message.text
  const streaming = message.stream && !isUser

  if(!visible) return null

  // If message has report data, show ReportCard instead
  if(message.reportData && !isUser) {
    return (
      <div 
        className="flex gap-3 items-start animate-fade-in group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-700">
          <Bot size={16}/>
        </div>
        <div className="flex-1">
          {message.agentName && (
            <div className="text-xs text-slate-600 mb-2 font-medium">{message.agentName}</div>
          )}
          <ReportCard reportData={message.reportData} />
          
          {/* Action Buttons for Report Card */}
          <div className={`mt-2 flex items-center gap-2 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={() => {
                const reportText = JSON.stringify(message.reportData, null, 2)
                navigator.clipboard.writeText(reportText)
                toast.success('Report copied to clipboard!')
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
              title="Copy report"
            >
              <Copy size={14} />
              <span>Copy</span>
            </button>
            
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
              title="Regenerate report"
            >
              <RefreshCw size={14} />
              <span>Regenerate</span>
            </button>
            
            <button
              onClick={() => {
                const reportText = JSON.stringify(message.reportData, null, 2)
                const blob = new Blob([reportText], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `report-${Date.now()}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                toast.success('Report exported!')
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
              title="Export report"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
          
          <div ref={messageEndRef} />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start animate-fade-in group`}
      onMouseEnter={() => !isUser && setShowActions(true)}
      onMouseLeave={() => !isUser && setShowActions(false)}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
        {isUser ? <User size={16}/> : <Bot size={16}/>}
      </div>
      <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
        {message.agentName && !isUser && (
          <div className="text-sm text-slate-600 mb-1 font-medium">{message.agentName}</div>
        )}
        <div className={`inline-block px-4 py-3 rounded-lg max-w-2xl text-base ${isUser ? 'bg-teal-600 text-white' : 'bg-white shadow-sm border border-slate-200'}`}>
          <div 
            className="whitespace-pre-wrap leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
          />
          {streaming && <Loader2 className="inline-block ml-2 animate-spin" size={16}/>}
        </div>
        
        {/* Action Buttons - Only for agent messages */}
        {!isUser && !streaming && (
          <div className={`mt-2 flex items-center gap-2 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
              title="Copy response"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
              title="Regenerate response"
            >
              <RefreshCw size={14} />
              <span>Regenerate</span>
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
              title="Export as text file"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        )}
        
        {message.image && isUser && (
          <div className="mt-2 flex justify-end">
            <HeatmapOverlay imageUrl={message.image} />
          </div>
        )}
        {message.metadata && (
          <div className="mt-1 text-[11px] text-gray-400">{message.metadata}</div>
        )}
        <div ref={messageEndRef} />
      </div>
    </div>
  )
}
