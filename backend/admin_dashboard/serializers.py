from rest_framework import serializers
from users.models import User
from records.models import MedicalRecord
from sharing.models import ShareToken, AccessLog
from users.serializers import UserProfileSerializer
from records.serializers import MedicalRecordListSerializer


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin serializer for user management"""
    medical_records_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'mobile_number', 'full_name', 'role',
            'patient_uuid', 'date_of_birth', 'gender', 'blood_group',
            'specialization', 'license_number', 'is_active', 'is_verified',
            'created_at', 'updated_at', 'medical_records_count'
        )
        read_only_fields = ('id', 'patient_uuid', 'created_at', 'updated_at')
    
    def get_medical_records_count(self, obj):
        if obj.role == 'PATIENT':
            return MedicalRecord.objects.filter(patient=obj, is_deleted=False).count()
        return 0


class AdminStatisticsSerializer(serializers.Serializer):
    """Serializer for admin dashboard statistics"""
    total_users = serializers.IntegerField()
    total_patients = serializers.IntegerField()
    total_doctors = serializers.IntegerField()
    active_patients = serializers.IntegerField()
    active_doctors = serializers.IntegerField()
    total_uploads = serializers.IntegerField()
    total_storage_mb = serializers.FloatField()
    total_share_tokens = serializers.IntegerField()
    active_share_tokens = serializers.IntegerField()
    total_access_logs = serializers.IntegerField()


class AdminAccessLogSerializer(serializers.ModelSerializer):
    """Admin serializer for access logs"""
    doctor_info = UserProfileSerializer(source='doctor', read_only=True)
    patient_info = UserProfileSerializer(source='patient', read_only=True)
    records_info = MedicalRecordListSerializer(source='accessed_records', many=True, read_only=True)
    
    class Meta:
        model = AccessLog
        fields = (
            'id', 'doctor', 'doctor_info', 'patient', 'patient_info',
            'accessed_records', 'records_info', 'ip_address', 'user_agent',
            'accessed_at', 'share_token'
        )
        read_only_fields = ('id', 'accessed_at')

