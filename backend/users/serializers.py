from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, OTPVerification
import random
from datetime import datetime, timedelta
from django.utils import timezone


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'mobile_number', 'full_name', 'role', 'password', 'password_confirm')
        extra_kwargs = {
            'email': {'required': True},
            'mobile_number': {'required': True},
            'full_name': {'required': True},
            'role': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check email uniqueness
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
        
        # Check mobile uniqueness
        if User.objects.filter(mobile_number=attrs['mobile_number']).exists():
            raise serializers.ValidationError({"mobile_number": "A user with this mobile number already exists."})
        
        # Validate role
        if attrs['role'] not in ['PATIENT', 'DOCTOR']:
            raise serializers.ValidationError({"role": "Invalid role. Must be PATIENT or DOCTOR."})
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        
        # Generate static 6-digit OTP for email verification
        otp = str(random.randint(100000, 999999))
        OTPVerification.objects.create(
            user=user,
            otp_code=otp,
            purpose='REGISTRATION',
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # TODO: Send OTP via email/SMS
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'mobile_number', 'full_name', 'role',
            'date_of_birth', 'gender', 'blood_group', 'allergies', 'chronic_conditions',
            'specialization', 'license_number', 'patient_uuid', 'is_verified',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'email', 'role', 'patient_uuid', 'is_verified', 'created_at', 'updated_at')


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs


class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(max_length=6, required=True)
    purpose = serializers.CharField(required=True)
    
    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User not found."})
        
        otp_obj = OTPVerification.objects.filter(
            user=user,
            purpose=attrs['purpose'],
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()
        
        if not otp_obj:
            # Check if there are any OTPs (even expired/used) to give better error message
            any_otp = OTPVerification.objects.filter(
                user=user,
                purpose=attrs['purpose']
            ).order_by('-created_at').first()
            
            if any_otp:
                if any_otp.is_used:
                    raise serializers.ValidationError({
                        "otp_code": "This OTP has already been used. Please request a new OTP."
                    })
                elif timezone.now() > any_otp.expires_at:
                    raise serializers.ValidationError({
                        "otp_code": "OTP has expired. Please request a new OTP."
                    })
            
            raise serializers.ValidationError({
                "otp_code": "Invalid or expired OTP. Please check your code or request a new one."
            })
        
        if otp_obj.otp_code != attrs['otp_code']:
            raise serializers.ValidationError({
                "otp_code": "Invalid OTP code. Please check the code and try again."
            })
        
        attrs['user'] = user
        attrs['otp_obj'] = otp_obj
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(max_length=6, required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

