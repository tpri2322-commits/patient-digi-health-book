from django.db import models
from django.conf import settings
import uuid
from datetime import timedelta
from django.utils import timezone


class ShareToken(models.Model):
    """Token for sharing medical records"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='share_tokens',
        limit_choices_to={'role': 'PATIENT'}
    )
    
    # Encrypted token data (stored as JSON string)
    encrypted_token = models.TextField()
    
    # Sharing method
    SHARE_METHOD_CHOICES = [
        ('QR_CODE', 'QR Code'),
        ('URL', 'Secure URL'),
    ]
    share_method = models.CharField(max_length=10, choices=SHARE_METHOD_CHOICES)
    
    # Records being shared
    records = models.ManyToManyField('records.MedicalRecord', related_name='share_tokens')
    
    # Expiry and access control
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    max_access_count = models.IntegerField(null=True, blank=True)  # None = unlimited
    current_access_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'share_tokens'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'is_revoked']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Share token for {self.patient.full_name} - {self.share_method}"
    
    def is_valid(self):
        """Check if token is still valid"""
        if self.is_revoked:
            return False
        if timezone.now() > self.expires_at:
            return False
        if self.max_access_count and self.current_access_count >= self.max_access_count:
            return False
        return True
    
    def increment_access(self):
        """Increment access count"""
        self.current_access_count += 1
        self.save(update_fields=['current_access_count'])
    
    def revoke(self):
        """Revoke the share token"""
        self.is_revoked = True
        self.revoked_at = timezone.now()
        self.save()


class AccessLog(models.Model):
    """Log of doctor access to shared records"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    share_token = models.ForeignKey(
        ShareToken,
        on_delete=models.CASCADE,
        related_name='access_logs'
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='access_logs',
        limit_choices_to={'role': 'DOCTOR'}
    )
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_access_logs',
        limit_choices_to={'role': 'PATIENT'}
    )
    
    # Access details
    accessed_records = models.ManyToManyField('records.MedicalRecord', related_name='access_logs')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    # Timestamp
    accessed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'access_logs'
        ordering = ['-accessed_at']
        indexes = [
            models.Index(fields=['doctor', 'accessed_at']),
            models.Index(fields=['patient', 'accessed_at']),
        ]
    
    def __str__(self):
        return f"Access by {self.doctor.full_name} to {self.patient.full_name} - {self.accessed_at}"


class SavedPatient(models.Model):
    """Doctor's saved patient information"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_patients',
        limit_choices_to={'role': 'DOCTOR'}
    )
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_by_doctors',
        limit_choices_to={'role': 'PATIENT'}
    )
    
    # Doctor's private notes
    consultation_notes = models.TextField(null=True, blank=True)
    last_consultation_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    saved_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'saved_patients'
        unique_together = ['doctor', 'patient']
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['doctor', 'saved_at']),
        ]
    
    def __str__(self):
        return f"{self.doctor.full_name} saved {self.patient.full_name}"


class DoctorNote(models.Model):
    """Doctor's notes for a patient"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes_as_doctor',
        limit_choices_to={'role': 'DOCTOR'}
    )
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes_as_patient',
        limit_choices_to={'role': 'PATIENT'}
    )
    
    # Note content
    note_text = models.TextField()
    is_audio_transcript = models.BooleanField(default=False)
    is_shared_with_patient = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'doctor_notes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['doctor', 'patient', 'created_at']),
        ]
    
    def __str__(self):
        return f"Note by {self.doctor.full_name} for {self.patient.full_name}"

