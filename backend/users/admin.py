from django.contrib import admin
from .models import User, OTPVerification


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_active', 'is_verified', 'created_at')
    list_filter = ('role', 'is_active', 'is_verified')
    search_fields = ('email', 'full_name', 'mobile_number', 'patient_uuid')
    readonly_fields = ('id', 'patient_uuid', 'created_at', 'updated_at')


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'purpose', 'is_used', 'expires_at', 'created_at')
    list_filter = ('purpose', 'is_used')
    readonly_fields = ('created_at',)

