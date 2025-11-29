"""
SQLAlchemy ORM Models for Radiology Database
Supports vector embeddings via pgvector extension
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector


class Base(DeclarativeBase):
    """Base class for all ORM models"""
    pass


class Patient(Base):
    """Patient demographic and identification information"""
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mrn: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True, 
                                      comment="Medical Record Number")
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True,
                                                          comment="Patient contact number")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    scans: Mapped[List["Scan"]] = relationship("Scan", back_populates="patient", cascade="all, delete-orphan")
    documents: Mapped[List["PatientDocument"]] = relationship("PatientDocument", back_populates="patient", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Patient(id={self.id}, mrn={self.mrn}, name={self.name})>"


class Scan(Base):
    """Medical imaging scan metadata with Cloudinary URL"""
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), 
                                             nullable=False, index=True)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False,
                                           comment="Cloudinary HTTPS URL for X-ray image")
    body_part: Mapped[str] = mapped_column(String(100), nullable=False, 
                                            comment="e.g., CHEST, ABDOMEN, HEAD")
    view_position: Mapped[str] = mapped_column(String(50), default="PA", nullable=False, 
                                                 comment="e.g., PA, AP, LATERAL")
    modality: Mapped[str] = mapped_column(String(10), default="DX", nullable=False, 
                                           comment="DX=Digital Radiography")
    scan_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="scans")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="scan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Scan(id={self.id}, patient_id={self.patient_id}, body_part={self.body_part})>"


class PatientDocument(Base):
    """Patient documents (PDFs, lab reports, etc.) stored in Cloudinary"""
    __tablename__ = "patient_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patients.id", ondelete="CASCADE"),
                                             nullable=False, index=True)
    document_name: Mapped[str] = mapped_column(String(200), nullable=False,
                                                comment="e.g., 'Blood Work 2023', 'MRI Report'")
    document_type: Mapped[str] = mapped_column(String(50), nullable=False,
                                                comment="e.g., 'PDF', 'LAB', 'REPORT'")
    file_url: Mapped[str] = mapped_column(String(500), nullable=False,
                                           comment="Cloudinary HTTPS URL for document")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="documents")

    def __repr__(self):
        return f"<PatientDocument(id={self.id}, patient_id={self.patient_id}, name={self.document_name})>"


class Report(Base):
    """Radiological report with AI-extracted entities and vector embeddings"""
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scan_id: Mapped[int] = mapped_column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), 
                                          nullable=False, index=True)
    radiologist_name: Mapped[str] = mapped_column(String(200), nullable=False)
    radiologist_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True,
                                                               comment="Radiologist contact number")
    full_text: Mapped[str] = mapped_column(Text, nullable=False, 
                                            comment="Complete radiological report")
    impression: Mapped[str] = mapped_column(Text, nullable=False, 
                                             comment="Summary and conclusion")
    ner_tags: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, 
                                                       comment="Named Entity Recognition tags (JSONB)")
    embedding: Mapped[Optional[List[float]]] = mapped_column(Vector(1536), nullable=True, 
                                                               comment="Text embedding for semantic search")

    # Relationships
    scan: Mapped["Scan"] = relationship("Scan", back_populates="reports")

    def __repr__(self):
        return f"<Report(id={self.id}, scan_id={self.scan_id}, radiologist={self.radiologist_name})>"
