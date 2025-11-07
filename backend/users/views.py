from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.conf import settings
from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer, PasswordChangeSerializer,
    OTPVerificationSerializer, PasswordResetRequestSerializer, PasswordResetSerializer
)
from .models import OTPVerification
import random
from datetime import timedelta
from django.utils import timezone

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'Registration successful. Please verify your email with OTP.',
            'user_id': str(user.id),
            'email': user.email
        }, status=status.HTTP_201_CREATED)


class VerifyOTPView(generics.GenericAPIView):
    """Verify OTP for email verification"""
    serializer_class = OTPVerificationSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']
        otp_obj = serializer.validated_data['otp_obj']
        
        # Mark OTP as used
        otp_obj.is_used = True
        otp_obj.save()
        
        # Activate user account
        if serializer.validated_data['purpose'] == 'REGISTRATION':
            # If user is already verified, just return success with tokens
            if user.is_verified and user.is_active:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': 'Email already verified. Logging you in.',
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserProfileSerializer(user).data
                }, status=status.HTTP_200_OK)
            
            user.is_active = True
            user.is_verified = True
            user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Email verified successfully.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'OTP verified successfully.'
        }, status=status.HTTP_200_OK)


class LoginView(TokenObtainPairView):
    """Custom login view"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            user = User.objects.get(email=request.data.get('email'))
            if not user.is_active:
                return Response({
                    'error': 'Account is not active. Please verify your email.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            response.data['user'] = UserProfileSerializer(user).data
        
        return response


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """Get or update user profile"""
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Wrong password.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully.'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    """Request password reset OTP"""
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        user = User.objects.get(email=serializer.validated_data['email'])
        
        # Generate static 6-digit OTP
        otp = str(random.randint(100000, 999999))
        OTPVerification.objects.create(
            user=user,
            otp_code=otp,
            purpose='PASSWORD_RESET',
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # TODO: Send OTP via email/SMS
        
        return Response({
            'message': 'Password reset OTP sent to your email.'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    """Reset password with OTP"""
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = User.objects.get(email=serializer.validated_data['email'])
        except User.DoesNotExist:
            return Response(
                {'email': 'User not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        otp_obj = OTPVerification.objects.filter(
            user=user,
            purpose='PASSWORD_RESET',
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()
        
        if not otp_obj or otp_obj.otp_code != serializer.validated_data['otp_code']:
            return Response(
                {'otp_code': 'Invalid or expired OTP.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark OTP as used and reset password
        otp_obj.is_used = True
        otp_obj.save()
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password reset successfully.'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout user (invalidate refresh token)"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logged out successfully.'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def resend_otp(request):
    """Resend OTP for email verification"""
    email = request.data.get('email')
    purpose = request.data.get('purpose', 'REGISTRATION')
    
    if not email:
        return Response(
            {'error': 'Email is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generate new OTP
    otp = str(random.randint(100000, 999999))
    OTPVerification.objects.create(
        user=user,
        otp_code=otp,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=10)
    )
    
    response_data = {
        'message': f'New OTP sent to {email}.',
    }
    
    # In development, include OTP in response
    if settings.DEBUG:
        response_data['otp_code'] = otp
        response_data['debug_note'] = 'OTP shown only in DEBUG mode.'
    
    # TODO: Send OTP via email/SMS
    
    return Response(response_data, status=status.HTTP_200_OK)

