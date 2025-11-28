import axios from 'axios'

const API_BASE = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// X-ray Analysis
export const analyzeXray = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/xray/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const generateXrayReport = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/xray/generate-report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

// PDF Report Upload & NER Extraction
export const uploadReport = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/ner/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

// Patient Management
export const getAllPatients = async () => {
  const res = await api.get('/patients')
  return res.data
}

export const getPatient = async (id) => {
  const res = await api.get(`/patients/${id}`)
  return res.data
}

export const createPatient = async (data) => {
  const res = await api.post('/patients', data)
  return res.data
}

export const updatePatient = async (id, data) => {
  const res = await api.put(`/patients/${id}`, data)
  return res.data
}

export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`)
  return res.data
}

// Reports Management
export const getAllReports = async () => {
  const res = await api.get('/reports')
  return res.data
}

export const getReport = async (id) => {
  const res = await api.get(`/reports/${id}`)
  return res.data
}

export const createReport = async (data) => {
  const res = await api.post('/reports', data)
  return res.data
}

export const deleteReport = async (id) => {
  const res = await api.delete(`/reports/${id}`)
  return res.data
}

export default api
