from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import AdminUserSerializer, AdminStatisticsSerializer, AdminAccessLogSerializer
from users.models import User
from records.models import MedicalRecord
from sharing.models import ShareToken, AccessLog

User = get_user_model()


class IsSuperAdmin(permissions.BasePermission):
    """Permission check for super admin role"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user.role == 'SUPER_ADMIN')
        )


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def dashboard_statistics(request):
    """Get dashboard statistics"""
    total_users = User.objects.count()
    total_patients = User.objects.filter(role='PATIENT').count()
    total_doctors = User.objects.filter(role='DOCTOR').count()
    active_patients = User.objects.filter(role='PATIENT', is_active=True).count()
    active_doctors = User.objects.filter(role='DOCTOR', is_active=True).count()
    
    total_uploads = MedicalRecord.objects.filter(is_deleted=False).count()
    total_storage = MedicalRecord.objects.filter(is_deleted=False).aggregate(
        total=Sum('file_size')
    )['total'] or 0
    total_storage_mb = round(total_storage / (1024 * 1024), 2)
    
    total_share_tokens = ShareToken.objects.count()
    active_share_tokens = ShareToken.objects.filter(
        is_revoked=False,
        expires_at__gt=timezone.now()
    ).count()
    
    total_access_logs = AccessLog.objects.count()
    
    data = {
        'total_users': total_users,
        'total_patients': total_patients,
        'total_doctors': total_doctors,
        'active_patients': active_patients,
        'active_doctors': active_doctors,
        'total_uploads': total_uploads,
        'total_storage_mb': total_storage_mb,
        'total_share_tokens': total_share_tokens,
        'active_share_tokens': active_share_tokens,
        'total_access_logs': total_access_logs,
    }
    
    serializer = AdminStatisticsSerializer(data)
    return Response(serializer.data)


class UserListView(generics.ListAPIView):
    """List all users"""
    permission_classes = [IsSuperAdmin]
    serializer_class = AdminUserSerializer
    filter_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['email', 'full_name', 'mobile_number', 'patient_uuid']
    
    def get_queryset(self):
        return User.objects.all().order_by('-created_at')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete user"""
    permission_classes = [IsSuperAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete user"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'message': 'User deactivated successfully.'})


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def activate_user(request, user_id):
    """Activate a user"""
    try:
        user = User.objects.get(id=user_id)
        user.is_active = True
        user.save()
        return Response({'message': 'User activated successfully.'})
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def reset_user_password(request, user_id):
    """Reset user password"""
    try:
        user = User.objects.get(id=user_id)
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response(
                {'error': 'New password is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        # TODO: Send password reset email
        
        return Response({'message': 'Password reset successfully.'})
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def patient_records(request, patient_id):
    """Get all records for a patient"""
    try:
        patient = User.objects.get(id=patient_id, role='PATIENT')
        records = MedicalRecord.objects.filter(patient=patient, is_deleted=False)
        
        from records.serializers import MedicalRecordSerializer
        serializer = MedicalRecordSerializer(records, many=True, context={'request': request})
        return Response({
            'patient': AdminUserSerializer(patient).data,
            'records': serializer.data,
            'total_records': records.count()
        })
    except User.DoesNotExist:
        return Response(
            {'error': 'Patient not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


class AccessLogListView(generics.ListAPIView):
    """List all access logs"""
    permission_classes = [IsSuperAdmin]
    serializer_class = AdminAccessLogSerializer
    filter_fields = ['doctor', 'patient']
    search_fields = ['doctor__full_name', 'patient__full_name', 'patient__patient_uuid']
    
    def get_queryset(self):
        return AccessLog.objects.all().order_by('-accessed_at')


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def audit_trail(request, patient_uuid):
    """Get audit trail for a patient UUID"""
    try:
        patient = User.objects.get(patient_uuid=patient_uuid, role='PATIENT')
        
        # Get all share tokens for this patient
        share_tokens = ShareToken.objects.filter(patient=patient)
        
        # Get all access logs for this patient
        access_logs = AccessLog.objects.filter(patient=patient)
        
        return Response({
            'patient': AdminUserSerializer(patient).data,
            'share_tokens_count': share_tokens.count(),
            'share_tokens': [
                {
                    'id': str(token.id),
                    'share_method': token.share_method,
                    'created_at': token.created_at,
                    'expires_at': token.expires_at,
                    'is_revoked': token.is_revoked,
                    'access_count': token.current_access_count,
                }
                for token in share_tokens
            ],
            'access_logs_count': access_logs.count(),
            'access_logs': AdminAccessLogSerializer(access_logs, many=True, context={'request': request}).data
        })
    except User.DoesNotExist:
        return Response(
            {'error': 'Patient not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def export_access_logs(request):
    """Export access logs (placeholder for CSV/PDF export)"""
    logs = AccessLog.objects.all().order_by('-accessed_at')
    serializer = AdminAccessLogSerializer(logs, many=True, context={'request': request})
    
    # TODO: Implement CSV/PDF export
    return Response({
        'message': 'Export functionality to be implemented',
        'logs': serializer.data,
        'total': logs.count()
    })

