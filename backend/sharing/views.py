from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import HttpResponse
from .models import ShareToken, AccessLog, SavedPatient, DoctorNote
from .serializers import (
    ShareTokenSerializer, CreateShareTokenSerializer, AccessLogSerializer,
    SavedPatientSerializer, DoctorNoteSerializer
)
from .utils import (
    create_share_token_data, encrypt_with_rsa, decrypt_with_rsa,
    generate_qr_code, create_share_url
)
from records.models import MedicalRecord
from django.conf import settings
from django.utils import timezone
from datetime import timedelta, datetime
import json


class IsPatient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'PATIENT'


class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'DOCTOR'


class ShareTokenListCreateView(generics.ListCreateAPIView):
    """List and create share tokens"""
    permission_classes = [IsPatient]
    
    def get_queryset(self):
        return ShareToken.objects.filter(patient=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateShareTokenSerializer
        return ShareTokenSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = CreateShareTokenSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            
            record_ids = serializer.validated_data['record_ids']
            share_method = serializer.validated_data['share_method']
            expiry_hours = serializer.validated_data.get('expiry_hours', settings.QR_CODE_EXPIRY_HOURS)
            max_access_count = serializer.validated_data.get('max_access_count')
            
            # Verify records exist and belong to patient
            records = MedicalRecord.objects.filter(
                id__in=record_ids,
                patient=request.user,
                is_deleted=False
            )
            
            if records.count() != len(record_ids):
                return Response(
                    {'error': 'Some records not found or don\'t belong to you.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Ensure patient_uuid exists
            if not request.user.patient_uuid:
                # This should not happen, but handle it gracefully
                return Response(
                    {'error': 'Patient UUID not found. Please contact support.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create token data
            token_data = create_share_token_data(
                request.user.patient_uuid,
                record_ids,
                expiry_hours
            )
            
            # Encrypt token data with RSA (with AES fallback)
            try:
                encrypted_token = encrypt_with_rsa(json.dumps(token_data))
            except Exception as e:
                import traceback
                print(f"RSA encryption error: {str(e)}")
                print(traceback.format_exc())
                # Fallback to AES encryption if RSA fails
                try:
                    from .utils import encrypt_data
                    encrypted_token = encrypt_data(json.dumps(token_data))
                    print("Using AES encryption fallback")
                except Exception as aes_error:
                    print(f"AES encryption also failed: {str(aes_error)}")
                    return Response(
                        {'error': f'Failed to encrypt token: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            # Create share token
            share_token = ShareToken.objects.create(
                patient=request.user,
                encrypted_token=encrypted_token,
                share_method=share_method,
                expires_at=timezone.now() + timedelta(hours=expiry_hours),
                max_access_count=max_access_count
            )
            
            # Add records to token
            share_token.records.set(records)
            
            # Generate response
            response_data = ShareTokenSerializer(share_token, context={'request': request}).data
            
            # Generate QR code if method is QR_CODE
            if share_method == 'QR_CODE':
                try:
                    qr_buffer = generate_qr_code(encrypted_token)
                    import base64
                    response_data['qr_code_image'] = f"data:image/png;base64,{base64.b64encode(qr_buffer.getvalue()).decode()}"
                except Exception as e:
                    import traceback
                    print(f"QR code generation error: {str(e)}")
                    print(traceback.format_exc())
                    # Continue without QR code image if generation fails
                    response_data['qr_code_error'] = f'QR code generation failed: {str(e)}'
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            print(f"Share token creation error: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': f'Failed to create share token: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ShareTokenDetailView(generics.RetrieveDestroyAPIView):
    """Retrieve or revoke share token"""
    permission_classes = [IsPatient]
    serializer_class = ShareTokenSerializer
    
    def get_queryset(self):
        return ShareToken.objects.filter(patient=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Revoke the share token"""
        instance = self.get_object()
        instance.revoke()
        return Response({'message': 'Share token revoked successfully.'})


@api_view(['GET'])
@permission_classes([IsPatient])
def get_qr_code_image(request, token_id):
    """Get QR code image for a share token"""
    try:
        share_token = ShareToken.objects.get(
            id=token_id,
            patient=request.user,
            share_method='QR_CODE'
        )
        
        qr_buffer = generate_qr_code(share_token.encrypted_token)
        
        response = HttpResponse(qr_buffer.getvalue(), content_type='image/png')
        response['Content-Disposition'] = f'attachment; filename="qr_code_{token_id}.png"'
        return response
    except ShareToken.DoesNotExist:
        return Response(
            {'error': 'Share token not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsDoctor])
def scan_qr_code(request):
    """Scan and validate QR code"""
    encrypted_token = request.data.get('encrypted_token')
    
    if not encrypted_token:
        return Response(
            {'error': 'Encrypted token is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Decrypt token
        # Try RSA decryption first, fallback to AES if needed
        try:
            token_data = json.loads(decrypt_with_rsa(encrypted_token))
        except Exception as rsa_error:
            # Fallback to AES decryption
            from .utils import decrypt_data
            token_data = decrypt_data(encrypted_token)
        patient_uuid = token_data.get('patient_uuid')
        record_ids = token_data.get('record_ids')
        expires_at = token_data.get('expires_at')
        
        # Check expiry
        expires_at_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        if expires_at_dt < timezone.now():
            return Response(
                {'error': 'Share token has expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find share token
        share_token = ShareToken.objects.filter(
            encrypted_token=encrypted_token,
            is_revoked=False
        ).first()
        
        if not share_token:
            return Response(
                {'error': 'Invalid share token.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not share_token.is_valid():
            return Response(
                {'error': 'Share token is no longer valid.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get patient and records
        from users.models import User
        patient = User.objects.get(patient_uuid=patient_uuid, role='PATIENT')
        records = MedicalRecord.objects.filter(id__in=record_ids, is_deleted=False)
        
        # Create access log
        access_log = AccessLog.objects.create(
            share_token=share_token,
            doctor=request.user,
            patient=patient,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        access_log.accessed_records.set(records)
        
        # Increment access count
        share_token.increment_access()
        
        # Return records
        from records.serializers import MedicalRecordSerializer
        return Response({
            'patient': UserProfileSerializer(patient).data,
            'records': MedicalRecordSerializer(records, many=True, context={'request': request}).data,
            'access_log_id': str(access_log.id)
        })
    
    except Exception as e:
        return Response(
            {'error': f'Invalid QR code: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsDoctor])
def access_via_url(request, token_id):
    """Access records via secure URL"""
    try:
        share_token = ShareToken.objects.get(
            id=token_id,
            share_method='URL',
            is_revoked=False
        )
        
        if not share_token.is_valid():
            return Response(
                {'error': 'Share token is no longer valid.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decrypt token (try RSA first, fallback to AES)
        try:
            token_data = json.loads(decrypt_with_rsa(share_token.encrypted_token))
        except Exception as rsa_error:
            # Fallback to AES decryption
            from .utils import decrypt_data
            token_data = decrypt_data(share_token.encrypted_token)
        patient_uuid = token_data.get('patient_uuid')
        record_ids = token_data.get('record_ids')
        
        # Get patient and records
        patient = User.objects.get(patient_uuid=patient_uuid, role='PATIENT')
        records = MedicalRecord.objects.filter(id__in=record_ids, is_deleted=False)
        
        # Create access log
        access_log = AccessLog.objects.create(
            share_token=share_token,
            doctor=request.user,
            patient=patient,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        access_log.accessed_records.set(records)
        
        # Increment access count
        share_token.increment_access()
        
        # Return records
        from records.serializers import MedicalRecordSerializer
        return Response({
            'patient': UserProfileSerializer(patient).data,
            'records': MedicalRecordSerializer(records, many=True, context={'request': request}).data,
            'access_log_id': str(access_log.id)
        })
    
    except ShareToken.DoesNotExist:
        return Response(
            {'error': 'Share token not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


class SavedPatientListCreateView(generics.ListCreateAPIView):
    """List and create saved patients"""
    permission_classes = [IsDoctor]
    serializer_class = SavedPatientSerializer
    filter_fields = ['patient']
    search_fields = ['patient__full_name', 'patient__patient_uuid']
    
    def get_queryset(self):
        return SavedPatient.objects.filter(doctor=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class SavedPatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete saved patient"""
    permission_classes = [IsDoctor]
    serializer_class = SavedPatientSerializer
    
    def get_queryset(self):
        return SavedPatient.objects.filter(doctor=self.request.user)


class DoctorNoteListCreateView(generics.ListCreateAPIView):
    """List and create doctor notes"""
    permission_classes = [IsDoctor]
    serializer_class = DoctorNoteSerializer
    filter_fields = ['patient']
    
    def get_queryset(self):
        return DoctorNote.objects.filter(doctor=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class DoctorNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete doctor note"""
    permission_classes = [IsDoctor]
    serializer_class = DoctorNoteSerializer
    
    def get_queryset(self):
        return DoctorNote.objects.filter(doctor=self.request.user)


class AccessLogListView(generics.ListAPIView):
    """List access logs for doctor"""
    permission_classes = [IsDoctor]
    serializer_class = AccessLogSerializer
    
    def get_queryset(self):
        return AccessLog.objects.filter(doctor=self.request.user)

