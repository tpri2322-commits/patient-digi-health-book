from rest_framework import serializers
from .models import ShareToken, AccessLog, SavedPatient, DoctorNote
from records.serializers import MedicalRecordListSerializer
from users.serializers import UserProfileSerializer
from django.conf import settings
from datetime import timedelta
from django.utils import timezone


class ShareTokenSerializer(serializers.ModelSerializer):
    """Serializer for share tokens"""
    patient_info = UserProfileSerializer(source='patient', read_only=True)
    records_info = MedicalRecordListSerializer(source='records', many=True, read_only=True)
    qr_code_data = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = ShareToken
        fields = (
            'id', 'patient', 'patient_info', 'share_method', 'records', 'records_info',
            'expires_at', 'is_revoked', 'max_access_count', 'current_access_count',
            'qr_code_data', 'share_url', 'is_valid', 'created_at', 'revoked_at'
        )
        read_only_fields = ('id', 'current_access_count', 'created_at', 'revoked_at')
    
    def get_qr_code_data(self, obj):
        """Return QR code data if method is QR_CODE"""
        if obj.share_method == 'QR_CODE':
            # Return the encrypted token for QR code generation
            return obj.encrypted_token
        return None
    
    def get_share_url(self, obj):
        """Return share URL if method is URL"""
        if obj.share_method == 'URL':
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/sharing/access/{obj.id}/')
            return f'/api/sharing/access/{obj.id}/'
        return None
    
    def get_is_valid(self, obj):
        """Check if token is still valid"""
        return obj.is_valid()


class CreateShareTokenSerializer(serializers.Serializer):
    """Serializer for creating share tokens"""
    record_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        required=True
    )
    share_method = serializers.ChoiceField(
        choices=['QR_CODE', 'URL'],
        required=True
    )
    expiry_hours = serializers.IntegerField(
        min_value=1,
        max_value=168,  # 7 days max
        default=settings.QR_CODE_EXPIRY_HOURS,
        required=False
    )
    max_access_count = serializers.IntegerField(
        min_value=1,
        allow_null=True,
        required=False
    )
    
    def validate_record_ids(self, value):
        """Validate that records belong to the patient"""
        from records.models import MedicalRecord
        
        patient = self.context['request'].user
        records = MedicalRecord.objects.filter(
            id__in=value,
            patient=patient,
            is_deleted=False
        )
        
        if records.count() != len(value):
            raise serializers.ValidationError("Some records not found or don't belong to you.")
        
        return value


class AccessLogSerializer(serializers.ModelSerializer):
    """Serializer for access logs"""
    doctor_info = UserProfileSerializer(source='doctor', read_only=True)
    patient_info = UserProfileSerializer(source='patient', read_only=True)
    records_info = MedicalRecordListSerializer(source='accessed_records', many=True, read_only=True)
    
    class Meta:
        model = AccessLog
        fields = (
            'id', 'doctor', 'doctor_info', 'patient', 'patient_info',
            'accessed_records', 'records_info', 'ip_address', 'user_agent',
            'accessed_at'
        )
        read_only_fields = ('id', 'accessed_at')


class SavedPatientSerializer(serializers.ModelSerializer):
    """Serializer for saved patients"""
    patient_info = UserProfileSerializer(source='patient', read_only=True)
    
    class Meta:
        model = SavedPatient
        fields = (
            'id', 'patient', 'patient_info', 'consultation_notes',
            'last_consultation_date', 'saved_at', 'updated_at'
        )
        read_only_fields = ('id', 'saved_at', 'updated_at')


class DoctorNoteSerializer(serializers.ModelSerializer):
    """Serializer for doctor notes"""
    doctor_info = UserProfileSerializer(source='doctor', read_only=True)
    patient_info = UserProfileSerializer(source='patient', read_only=True)
    
    class Meta:
        model = DoctorNote
        fields = (
            'id', 'doctor', 'doctor_info', 'patient', 'patient_info',
            'note_text', 'is_audio_transcript', 'is_shared_with_patient',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'doctor', 'created_at', 'updated_at')

