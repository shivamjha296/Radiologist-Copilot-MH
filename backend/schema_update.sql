-- Database Schema Updates for WhatsApp Integration
-- Run this to add phone number support and chat history

USE medical_ner;

-- Add phone number and timestamp to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add report content and WhatsApp tracking to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS report_content TEXT,
ADD COLUMN IF NOT EXISTS sent_via_whatsapp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create WhatsApp chat history table
CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    patient_id INT,
    message_from VARCHAR(10) NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_phone (phone_number),
    INDEX idx_created (created_at)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patient_phone ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_report_sent ON reports(sent_via_whatsapp, created_at);

-- Display success message
SELECT 'Database schema updated successfully for WhatsApp integration!' as status;
SELECT 'Tables updated: patients, reports' as info;
SELECT 'New table created: whatsapp_chats' as info;
