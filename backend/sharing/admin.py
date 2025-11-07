from django.contrib import admin
from .models import ShareToken, AccessLog, SavedPatient, DoctorNote


@admin.register(ShareToken)
class ShareTokenAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'share_method', 'expires_at', 'is_revoked', 'created_at')
    list_filter = ('share_method', 'is_revoked', 'created_at')
    search_fields = ('patient__full_name', 'patient__email')
    readonly_fields = ('id', 'created_at', 'revoked_at')


@admin.register(AccessLog)
class AccessLogAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'patient', 'accessed_at', 'ip_address')
    list_filter = ('accessed_at',)
    search_fields = ('doctor__full_name', 'patient__full_name', 'patient__patient_uuid')
    readonly_fields = ('id', 'accessed_at')


@admin.register(SavedPatient)
class SavedPatientAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'patient', 'saved_at', 'updated_at')
    list_filter = ('saved_at',)
    search_fields = ('doctor__full_name', 'patient__full_name', 'patient__patient_uuid')
    readonly_fields = ('id', 'saved_at', 'updated_at')


@admin.register(DoctorNote)
class DoctorNoteAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'patient', 'created_at', 'is_shared_with_patient')
    list_filter = ('is_shared_with_patient', 'created_at')
    search_fields = ('doctor__full_name', 'patient__full_name', 'note_text')
    readonly_fields = ('id', 'created_at', 'updated_at')

