import { useState, useRef, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Send, Paperclip, Sparkles, MessageSquare, Square } from 'lucide-react'
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
    
    // If it's a streaming message, handle streaming at state level
    if (msg.stream && msg.role === 'agent') {
      const fullText = msg.text
      let currentIndex = 0
      
      // Add message with empty text first
      setMessages(m=>[...m, { id: messageId, ...msg, text: '', displayText: '' }])
      setIsStreaming(true)
      
      // Stream the text character by character
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
          // Mark streaming as complete
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
    // Clear all streaming intervals
    Object.values(streamingIntervals.current).forEach(interval => clearInterval(interval))
    streamingIntervals.current = {}
    
    // Clear pipeline timeout if exists
    if (pipelineTimeout.current) {
      clearTimeout(pipelineTimeout.current)
      pipelineTimeout.current = null
    }
    
    // Stop any ongoing pipeline
    setPipeline(null)
    setCurrentStage(0)
    setIsStreaming(false)
    
    // Mark all streaming messages as complete with their current text
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

  // Workflow 1: X-ray Analysis with Segmentation
  const simulateXrayWorkflow = (file) => {
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    
    addMessage({ role:'user', text:'Analyze this chest X-ray for pneumonia', image: preview })
    
    const stages = [
      { name:'Smart Task Routing Agent', description:'Routing X-ray to analysis pipeline', duration:800 },
      { name:'Image Analysis Agent', description:'Detecting pathologies with CheXNet model', duration:2500 },
      { name:'Image Analysis Agent', description:'Generating GradCAM segmentation overlay', duration:1500 },
      { name:'NER Agent', description:'Extracting disease entities and severity levels', duration:1800 },
      { name:'Report Generation Agent', description:'Formatting findings into structured report', duration:1200 },
    ]

    const finalResponse = { 
      role:'agent', 
      agentName:'Image Analysis Agent', 
      text:'✅ **Analysis Complete!**\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔴 **HIGH CONFIDENCE FINDINGS**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Pneumonia (Left Cardiac Shadow)**\n• Confidence: 82.3%\n• Location: Behind left cardiac shadow\n• Severity: Moderate\n• Grad-CAM: Red zone highlighting affected region\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n� **NORMAL FINDINGS**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Heart Size**\n• Assessment: Normal\n\n**Aortic Knuckle**\n• Assessment: Normal\n\n**Costo-phrenic Angles**\n• Assessment: Both normal\n\n**Bony Thorax**\n• Assessment: Normal\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 **STRUCTURED ENTITIES EXTRACTED**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Disease: Pneumonia\n• Anatomical Region: Left cardiac shadow\n• Severity: Moderate\n• Other structures: Normal\n\n**Visual Segmentation:**\n• Heatmap overlay generated\n• Hot spots highlight left cardiac shadow opacity\n• Red zones = High probability regions\n\n⏱️ Processing: CheXNet model | 6.8 seconds',
      stream:true,
      image: preview
    }

    runPipeline(stages, finalResponse)
  }

  // Workflow 2: Complete Report Generation
  const simulateReportWorkflow = () => {
    addMessage({ role:'user', text:'Generate a comprehensive report for patient ID NSSH.1215787' })
    
    const stages = [
      { name:'Smart Task Routing Agent', description:'Routing to report generation pipeline', duration:800 },
      { name:'Patient Management Agent', description:'Fetching patient history and recent scans', duration:1500 },
      { name:'Image Analysis Agent', description:'Analyzing latest X-ray scan', duration:2000 },
      { name:'NER Agent', description:'Extracting medical entities from findings', duration:1800 },
      { name:'Report Generation Agent', description:'Generating structured report with BioMedCLIP', duration:2200 },
      { name:'Validation Agent', description:'Validating report consistency and confidence', duration:1000 },
      { name:'Chatbot Communication Agent', description:'Creating patient-friendly summary', duration:1200 },
    ]

    const reportData = {
      patientName: 'Anand Bineet Birendra Kumar',
      patientId: 'NSSH.1215787',
      age: '31',
      gender: 'Male',
      date: 'October 18, 2025',
      study: 'Chest X-ray PA & Lateral',
      clinicalIndication: 'Cough and fever for 5 days. Suspected pneumonia.',
      findings: [
        'Soft tissue opacity seen behind left cardiac shadow due to pneumonia',
        'The heart size appears normal',
        'The aortic knuckle is normal',
        'Both costo-phrenic angles are normal',
        'The bony thorax and both dome of diaphragms appear normal'
      ],
      impression: [
        'Pneumonia behind left cardiac shadow',
        'Heart size normal',
        'No other acute abnormalities'
      ],
      recommendations: [
        'Antibiotic therapy as indicated',
        'Follow-up X-ray in 2 weeks',
        'Cardiology consultation recommended'
      ],
      validation: {
        consistency: 'Verified ✓',
        confidenceScore: '96.8%',
        templateCompliance: 'Yes ✓'
      },
      generatedBy: 'MedGemma + BioMedCLIP',
      processingTime: '10.5 sec'
    }

    const finalResponse = { 
      role:'agent', 
      agentName:'Report Generation & Validation Agent',
      reportData: reportData,
      stream:false 
    }

    runPipeline(stages, finalResponse)
  }

  // Workflow 3: Patient Database Search
  const simulatePatientSearch = () => {
    addMessage({ role:'user', text:'Show all patients with pneumonia' })
    
    const stages = [
      { name:'Smart Task Routing Agent', description:'Routing to database query pipeline', duration:600 },
      { name:'Patient Management Agent', description:'Searching patient records database', duration:1500 },
      { name:'NER Agent', description:'Filtering by extracted disease entities', duration:1000 },
      { name:'Scheduling & Workflow Agent', description:'Sorting by urgency and follow-up dates', duration:800 },
    ]

    const finalResponse = { 
      role:'agent', 
      agentName:'Patient Management Agent', 
      text:'✅ **Found 4 Patients with Pneumonia**\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n1️⃣ **ANAND BINEET BIRENDRA KUMAR**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• UHID: NSSH.1215787\n• Age: 31 | Gender: Male\n• Diagnosis: Pneumonia (Left cardiac shadow)\n• Status: 🟢 Active Treatment\n• Study Date: September 3, 2024\n• Location: Behind left cardiac shadow\n• Follow-up: October 25, 2025\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n2️⃣ **KAUSHIK V KRISHNAN**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• UHID: NSSH.1243309\n• Age: 37 | Gender: Male\n• Diagnosis: Bilateral Pneumonia (Both lower zones)\n• Status: � ICU - Critical Care\n• Study Date: July 1, 2024\n• Devices: Tracheostomy, NG tube, CVC\n• Follow-up: Daily ICU monitoring\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n3️⃣ **SHREYAS SANGHAVI**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• UHID: NSSH.1272962\n• Age: 33 | Gender: Male\n• Diagnosis: Pneumonia (Left cardiac shadow)\n• Status: 🟢 Active Treatment\n• Study Date: July 9, 2024\n• Location: Behind left cardiac shadow\n• Follow-up: October 28, 2025\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n4️⃣ **SAMEER TUKARAM SAWANT**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• UHID: NSSH.1281948\n• Age: 46 | Gender: Male\n• Diagnosis: Pneumonia (Left cardiac shadow)\n• Status: � Requires Evaluation\n• Study Date: November 21, 2024\n• Device: Nasogastric tube in position\n• Follow-up: October 30, 2025\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 **SEARCH SUMMARY**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Total records: 8 patients scanned\n• Matches: 4 active pneumonia cases (50%)\n• Search time: 0.28 seconds\n• Sorted by: Clinical urgency + Status\n\n💡 Navigate to Patients page for full database',
      stream:true 
    }

    runPipeline(stages, finalResponse)
  }

  // Workflow 4: X-ray Comparison
  const simulateComparison = () => {
    addMessage({ role:'user', text:'Compare patient scans from last month' })
    
    const stages = [
      { name:'Smart Task Routing Agent', description:'Routing to comparison analysis pipeline', duration:700 },
      { name:'Patient Management Agent', description:'Retrieving historical X-ray scans', duration:1400 },
      { name:'X-ray Comparison Agent', description:'Aligning and comparing images', duration:2000 },
      { name:'Image Analysis Agent', description:'Detecting changes in pathology', duration:1800 },
      { name:'NER Agent', description:'Extracting progression data', duration:1200 },
      { name:'Report Generation Agent', description:'Generating comparison report', duration:1500 },
    ]

    const finalResponse = { 
      role:'agent', 
      agentName:'X-ray Comparison Agent', 
      text:'✅ **Comparative Analysis Complete**\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅 **BASELINE SCAN** (Sep 3, 2024)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Patient: Anand Bineet B. Kumar (NSSH.1215787)\n• Pneumonia Severity: 82%\n• Lung Opacity: 82%\n• Affected Area: 4.2 cm²\n• Status: Active consolidation in RLL\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅 **CURRENT SCAN** (Oct 18, 2025)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Pneumonia Severity: 52%\n• Lung Opacity: 61%\n• Affected Area: 2.8 cm²\n• Status: Resolving consolidation\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📈 **CHANGES DETECTED** (411 days)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ Pneumonia severity: ↓ 45% improvement\n✅ Lung opacity: ↓ 32% clearer\n✅ Affected area: ↓ 1.4 cm² reduction\n✅ Air bronchograms: Resolving\n✅ Pleural effusion: Resolved\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🩺 **CLINICAL INTERPRETATION**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nPatient showing **significant clinical improvement**.\nPneumonia responding well to treatment.\nConsolidation decreased substantially.\nNo new infiltrates detected.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💊 **RECOMMENDATIONS**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✓ Continue antibiotic regimen\n✓ Follow-up X-ray in 2 weeks\n✓ Monitor for complete resolution\n\n⏱️ Comparison completed in 8.6 seconds',
      stream:true 
    }

    runPipeline(stages, finalResponse)
  }

  // Workflow 5: NER Extraction from Report
  const simulatePDFProcessing = (file) => {
    const fileName = file ? file.name : 'medical_report.pdf'
    addMessage({ role:'user', text:`Extract patient information from this medical report\n\n📄 ${fileName}` })
    
    const stages = [
      { name:'Smart Task Routing Agent', description:'Routing to NER extraction pipeline', duration:700 },
      { name:'NER Agent', description:'Extracting medical entities with BioBERT', duration:2500 },
      { name:'Validation Agent', description:'Validating extracted data accuracy', duration:1200 },
      { name:'Patient Management Agent', description:'Storing records in database', duration:1500 },
    ]

    const finalResponse = { 
      role:'agent', 
      agentName:'NER Agent', 
      text:'✅ **Medical Entities Extracted Successfully!**\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 **PATIENT INFORMATION**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Name: Govind Narayan Mundle\n• UHID: NSSH.620780\n• Age: 68 years | Gender: Male\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🏥 **EXTRACTED CLINICAL DATA**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Diseases:**\n• Scoliosis (Confidence: 99%)\n• Osteoporosis (Confidence: 97%)\n\n**Anatomical Terms:**\n• Upper dorsal spine\n• Costo-phrenic angles\n• Aortic knuckle\n\n**Medications:**\n• Calcium supplements\n• Vitamin D3\n\n**Procedures:**\n• Chest X-ray PA/Lateral\n• Bone density assessment\n\n**Vitals:**\n• BP: 135/85 mmHg\n• Temperature: 98.6°F\n• Heart Rate: 72 bpm\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅 **TIMELINE**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Study Date: May 20, 2025\n• Referring: Self-referral (2015-SELF)\n• Follow-up: November 20, 2025\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💾 **DATABASE STATUS**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✓ Record saved: NSSH.620780\n✓ Extraction confidence: 98.2%\n✓ HIPAA compliant: Yes\n✓ Entities structured: 14 items\n\n🎉 Patient "Govind Narayan Mundle" added!\n\n⏱️ Extraction completed in 4.8 seconds',
      stream:true 
    }

    runPipeline(stages, finalResponse)
  }

  const handleSend = async ()=>{
    if(!input.trim()) return
    const userInput = input.toLowerCase()
    
    if(userInput.includes('generate') && userInput.includes('report') && (userInput.includes('nssh.1215787') || userInput.includes('1215787'))){
      simulateReportWorkflow()
    }
    else if(userInput.includes('extract') && (userInput.includes('patient') || userInput.includes('report'))){
      simulatePDFProcessing()
    }
    else if(userInput.includes('show') && userInput.includes('patient')){
      simulatePatientSearch()
    }
    else if(userInput.includes('compare') && userInput.includes('scan')){
      simulateComparison()
    }
    else if(userInput.includes('report') || userInput.includes('generate')){
      simulateReportWorkflow()
    }
    else {
      addMessage({ role:'user', text:input })
      setTimeout(()=>{
        addMessage({ 
          role:'agent', 
          agentName:'Smart Task Routing Agent', 
          text:'💡 I can help with:\n\n1️⃣ **X-ray Analysis** - Upload image for pathology detection\n2️⃣ **Report Generation** - "Generate report for patient ID NSSH.1215787"\n3️⃣ **Patient Search** - "Show all patients with pneumonia"\n4️⃣ **X-ray Comparison** - "Compare patient scans from last month"\n5️⃣ **NER Extraction** - "Extract patient info from report"\n\nUpload an X-ray using the 📷 button!', 
          stream:true 
        })
      }, 500)
    }
    
    setInput('')
  }

  const handleUpload = (e)=>{
    const f = e.target.files[0]
    if(!f) return
    
    // Check if it's a PDF or image
    if(f.type === 'application/pdf'){
      simulatePDFProcessing(f)
      toast.success('PDF uploaded - extracting patient info...')
    } else {
      simulateXrayWorkflow(f)
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
    // Find the user message that triggered this response
    const messageIndex = messages.findIndex(m => m.id === message.id)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === 'user') {
        // Remove the agent response
        setMessages(m => m.filter((_, i) => i !== messageIndex))
        
        // Re-trigger the workflow based on the user message
        setTimeout(() => {
          if (userMessage.image) {
            // Re-analyze the X-ray
            toast.success('Regenerating X-ray analysis...')
            // Simulate re-running analysis
            const finalResponse = { 
              role:'agent', 
              agentName:'Image Analysis Agent', 
              text:'✅ **Analysis Complete!**\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔴 **HIGH CONFIDENCE FINDINGS**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Pneumonia (Left Cardiac Shadow)**\n• Confidence: 82.3%\n• Location: Behind left cardiac shadow\n• Severity: Moderate\n• Grad-CAM: Red zone highlighting affected region\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ **NORMAL FINDINGS**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Heart Size**\n• Assessment: Normal\n\n**Aortic Knuckle**\n• Assessment: Normal\n\n**Costo-phrenic Angles**\n• Assessment: Both normal\n\n**Bony Thorax**\n• Assessment: Normal\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 **STRUCTURED ENTITIES EXTRACTED**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Disease: Pneumonia\n• Anatomical Region: Left cardiac shadow\n• Severity: Moderate\n• Other structures: Normal\n\n**Visual Segmentation:**\n• Heatmap overlay generated\n• Hot spots highlight left cardiac shadow opacity\n• Red zones = High probability regions\n\n⏱️ Processing: CheXNet model | 6.8 seconds',
              stream:true,
              image: userMessage.image
            }
            addMessage(finalResponse)
          } else {
            // Regenerate text response
            const responseText = message.displayText || message.text
            addMessage({ 
              role:'agent', 
              agentName: message.agentName || 'AI Assistant', 
              text: responseText,
              stream: true
            })
          }
        }, 500)
      }
    }
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
          
          <div ref={scrollRef} />
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-white" style={{ flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            <label className="p-2.5 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition flex-shrink-0" title="Upload X-ray image or PDF report">
              <Paperclip size={20} className="text-slate-600"/>
              <input ref={fileRef} onChange={handleUpload} type="file" accept="image/*,application/pdf,.pdf" className="hidden" />
            </label>
            <input 
              type="text"
              className="flex-1 px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 bg-white placeholder:text-slate-400" 
              placeholder='Try: "Show all patients with pneumonia" or "Generate report for patient ID NSSH.1215787"' 
              value={input} 
              onChange={(e)=>setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isStreaming}
            />
            
            {isStreaming ? (
              <button 
                onClick={stopStreaming} 
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition flex-shrink-0 text-base font-medium"
                title="Stop generation"
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