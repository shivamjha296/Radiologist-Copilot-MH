import { useState, useRef, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Send, Paperclip, Square, Check, Edit2 } from 'lucide-react'
import AgentMessage from '../components/AgentMessage'
import AgentPipeline from '../components/AgentPipeline'

const initialMessages = [
  { id:1, role:'agent', agentName:'System', text:'👋 Welcome! I\'m your AI Radiologist Assistant.\n\nI can help you with:\n• Analyze X-rays for pneumonia\n• Extract patient information from PDFs\n• Search patient records\n• Compare scans\n• Generate medical reports\n\nJust type your request or upload X-ray images/PDF reports to get started!', stream:false }
]

export default function Chat(){
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [pipeline, setPipeline] = useState(null)
  const [currentStage, setCurrentStage] = useState(0)
  const [imagePreview, setImagePreview] = useState(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState(null)
  const [pendingReview, setPendingReview] = useState(null) // { threadId, report }
  
  const fileRef = useRef()
  const scrollRef = useRef()
  const messagesContainerRef = useRef()
  const streamingIntervals = useRef({})
  const pipelineTimeout = useRef(null)

  useEffect(()=>{
    if (!isUserScrolling) {
      scrollRef.current?.scrollIntoView({ behavior:'smooth' })
    }
  }, [messages, isUserScrolling])

  // Cleanup all streaming intervals on unmount
  useEffect(()=>{
    return () => {
      Object.values(streamingIntervals.current).forEach(interval => clearInterval(interval))
    }
  }, [])

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      if (!isAtBottom) {
        setIsUserScrolling(true)
      } else {
        setIsUserScrolling(false)
      }
    }
  }

  const addMessage = (msg) => {
    const messageId = Date.now()+Math.random()
    
    if (msg.stream && msg.role === 'agent') {
      const fullText = msg.text
      let currentIndex = 0
      
      setMessages(m=>[...m, { id: messageId, ...msg, text: '', displayText: '' }])
      setIsStreaming(true)
      
      const interval = setInterval(() => {
        if (currentIndex < fullText.length) {
          currentIndex++
          setMessages(m => m.map(message => 
            message.id === messageId 
              ? { ...message, displayText: fullText.slice(0, currentIndex) }
              : message
          ))
        } else {
          clearInterval(interval)
          delete streamingIntervals.current[messageId]
          setIsStreaming(false)
          setMessages(m => m.map(message => 
            message.id === messageId 
              ? { ...message, text: fullText, displayText: fullText, stream: false }
              : message
          ))
        }
      }, 15)
      
      streamingIntervals.current[messageId] = interval
    } else {
      setMessages(m=>[...m, { id: messageId, ...msg, displayText: msg.text }])
    }
  }

  const stopStreaming = () => {
    Object.values(streamingIntervals.current).forEach(interval => clearInterval(interval))
    streamingIntervals.current = {}
    
    if (pipelineTimeout.current) {
      clearTimeout(pipelineTimeout.current)
      pipelineTimeout.current = null
    }
    
    setPipeline(null)
    setCurrentStage(0)
    setIsStreaming(false)
    
    setMessages(m => m.map(message => 
      message.stream 
        ? { ...message, text: message.displayText || message.text, stream: false }
        : message
    ))
    
    toast.success('Response stopped')
  }

  const runPipeline = async (stages, finalResponse) => {
    setPipeline(stages)
    setCurrentStage(0)
    setIsStreaming(true)

    for (let i = 0; i < stages.length; i++) {
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, stages[i].duration)
        pipelineTimeout.current = timeout
      })
      setCurrentStage(i + 1)
    }

    pipelineTimeout.current = setTimeout(() => {
      addMessage(finalResponse)
      setPipeline(null)
      setCurrentStage(0)
      pipelineTimeout.current = null
    }, 500)
  }

  // --- Real API Integration ---

  const handleXrayUpload = async (file) => {
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    addMessage({ role:'user', text:'Analyze this chest X-ray', image: preview })

    const stages = [
      { name:'Smart Task Routing Agent', description:'Routing X-ray to analysis pipeline', duration:800 },
      { name:'Image Analysis Agent', description:'Detecting pathologies with CheXNet model', duration:2500 },
      { name:'Image Analysis Agent', description:'Generating GradCAM segmentation overlay', duration:1500 },
      { name:'NER Agent', description:'Extracting disease entities and severity levels', duration:1800 },
      { name:'Report Generation Agent', description:'Drafting initial report for review', duration:1200 },
    ]

    setPipeline(stages)
    setCurrentStage(0)
    setIsStreaming(true)

    // Simulate pipeline progress while waiting for server
    for (let i = 0; i < stages.length; i++) {
        setCurrentStage(i + 1)
        await new Promise(r => setTimeout(r, stages[i].duration)) 
    }

    try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('http://localhost:8000/api/analyze', {
            method: 'POST',
            body: formData
        })

        if (!response.ok) throw new Error('Analysis failed')

        const data = await response.json()
        
        if (data.status === 'review_required') {
            setCurrentThreadId(data.thread_id)
            setPendingReview({
                threadId: data.thread_id,
                report: data.current_report
            })
            
            addMessage({
                role: 'agent',
                agentName: 'System',
                text: `**Review Required**\n\nHere is the draft report generated by the AI. Please review and approve or edit it.\n\n---\n${data.current_report}\n---`,
                stream: false
            })
        }

    } catch (error) {
        console.error(error)
        toast.error('Failed to analyze image')
        addMessage({ role: 'agent', agentName: 'System', text: '❌ Error analyzing image. Please try again.' })
    } finally {
        setPipeline(null)
        setIsStreaming(false)
    }
  }

  const handleFeedback = async (action, newReport = null) => {
    if (!pendingReview) return

    try {
        toast.loading('Finalizing report...')
        const response = await fetch('http://localhost:8000/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                thread_id: pendingReview.threadId,
                action: action,
                new_report: newReport
            })
        })

        if (!response.ok) throw new Error('Feedback failed')

        const data = await response.json()
        toast.dismiss()
        toast.success('Report finalized!')

        setPendingReview(null)
        setCurrentThreadId(null)

        let finalText = `✅ **Report Finalized!**\n\n`
        if (data.pdf_url) finalText += `📄 [Download PDF](http://localhost:8000${data.pdf_url})\n`
        if (data.visualization_url) finalText += `🖼️ [View Visualization](http://localhost:8000${data.visualization_url})\n`

        addMessage({
            role: 'agent',
            agentName: 'Report Generation Agent',
            text: finalText,
            stream: false
        })

    } catch (error) {
        console.error(error)
        toast.error('Failed to finalize report')
    }
  }

  const handleSend = async ()=>{
    if(!input.trim()) return
    
    // If pending review, treat input as edit if user types "edit"
    if (pendingReview) {
        if (input.toLowerCase().startsWith('edit:')) {
            const editedText = input.substring(5).trim()
            handleFeedback('edit', editedText)
            setInput('')
            return
        } else if (input.toLowerCase() === 'approve') {
            handleFeedback('approve')
            setInput('')
            return
        }
    }

    addMessage({ role:'user', text:input })
    setInput('')
    
    // Simple fallback for text chat
    setTimeout(()=>{
        addMessage({ 
          role:'agent', 
          agentName:'Smart Task Routing Agent', 
          text:'💡 I can help with X-ray analysis. Please upload an image!', 
          stream:true 
        })
    }, 500)
  }

  const handleUpload = (e)=>{
    const f = e.target.files[0]
    if(!f) return
    
    if(f.type === 'application/pdf'){
      toast.error('PDF processing not yet connected to backend')
    } else {
      handleXrayUpload(f)
      toast.success('Image uploaded - analyzing...')
    }
  }

  const handleKeyPress = (e)=>{
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault()
      handleSend()
    }
  }

  const handleRegenerate = (message) => {
    // Simplified regenerate
    toast.success('Regenerate not implemented yet')
  }

  return (
    <div className="h-full flex overflow-hidden">
      <Toaster position="top-right"/>
      
      <div className="flex-1 flex flex-col bg-white h-full">
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4"
        >
          {messages.map(m=> (
            <AgentMessage 
              key={m.id} 
              message={m} 
              isUser={m.role==='user'} 
              onRegenerate={handleRegenerate}
            />
          ))}
          
          {pendingReview && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mx-4">
                <h3 className="font-bold text-yellow-800 mb-2">Review Pending</h3>
                <p className="text-sm text-yellow-700 mb-3">Please review the draft report above.</p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleFeedback('approve')}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                    >
                        <Check size={16} /> Approve
                    </button>
                    <button 
                        onClick={() => {
                            const newText = prompt("Edit Report:", pendingReview.report)
                            if (newText) handleFeedback('edit', newText)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Edit2 size={16} /> Edit
                    </button>
                </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-white" style={{ flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            <label className="p-2.5 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition flex-shrink-0" title="Upload X-ray image">
              <Paperclip size={20} className="text-slate-600"/>
              <input ref={fileRef} onChange={handleUpload} type="file" accept="image/*" className="hidden" />
            </label>
            <input 
              type="text"
              className="flex-1 px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 bg-white placeholder:text-slate-400" 
              placeholder={pendingReview ? 'Type "approve" or "edit: <new text>"' : 'Upload an X-ray to start...'} 
              value={input} 
              onChange={(e)=>setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isStreaming}
            />
            
            {isStreaming ? (
              <button 
                onClick={stopStreaming} 
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition flex-shrink-0 text-base font-medium"
              >
                <Square size={16} fill="currentColor" /> Stop
              </button>
            ) : (
              <button 
                onClick={handleSend} 
                className="px-5 py-2.5 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700 transition flex-shrink-0 text-base font-medium"
                disabled={!input.trim()}
              >
                <Send size={18}/> Send
              </button>
            )}
          </div>
        </div>
      </div>

      {pipeline && (
        <div className="w-80 flex-shrink-0">
          <AgentPipeline stages={pipeline} currentStep={currentStage} />
        </div>
      )}
    </div>
  )
}