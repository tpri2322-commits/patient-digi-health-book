from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid


class UserManager(BaseUserManager):
    """Custom user manager"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPER_ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model"""
    
    ROLE_CHOICES = [
        ('PATIENT', 'Patient'),
        ('DOCTOR', 'Doctor'),
        ('SUPER_ADMIN', 'Super Admin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    mobile_number = models.CharField(max_length=15, unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    # Patient-specific fields
    patient_uuid = models.UUIDField(null=True, blank=True, unique=True, editable=False)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    blood_group = models.CharField(max_length=5, null=True, blank=True)
    allergies = models.TextField(null=True, blank=True)
    chronic_conditions = models.TextField(null=True, blank=True)
    
    # Doctor-specific fields
    specialization = models.CharField(max_length=255, null=True, blank=True)
    license_number = models.CharField(max_length=100, null=True, blank=True)
    
    # Account status
    is_active = models.BooleanField(default=False)  # Requires email verification
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'mobile_number', 'role']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    def save(self, *args, **kwargs):
        # Auto-generate patient UUID for patients
        if self.role == 'PATIENT' and not self.patient_uuid:
            self.patient_uuid = uuid.uuid4()
        super().save(*args, **kwargs)


class OTPVerification(models.Model):
    """OTP verification model"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_verifications')
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=50)  # 'REGISTRATION', 'PASSWORD_RESET'
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'otp_verifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP for {self.user.email} - {self.purpose}"

