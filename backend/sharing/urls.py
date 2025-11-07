from django.urls import path
from .views import (
    ShareTokenListCreateView, ShareTokenDetailView, get_qr_code_image,
    scan_qr_code, access_via_url, SavedPatientListCreateView, SavedPatientDetailView,
    DoctorNoteListCreateView, DoctorNoteDetailView, AccessLogListView
)

urlpatterns = [
    # Share tokens
    path('tokens/', ShareTokenListCreateView.as_view(), name='share-token-list-create'),
    path('tokens/<uuid:pk>/', ShareTokenDetailView.as_view(), name='share-token-detail'),
    path('tokens/<uuid:token_id>/qr-code/', get_qr_code_image, name='get-qr-code'),
    
    # QR code scanning
    path('scan/', scan_qr_code, name='scan-qr-code'),
    path('access/<uuid:token_id>/', access_via_url, name='access-via-url'),
    
    # Saved patients
    path('saved-patients/', SavedPatientListCreateView.as_view(), name='saved-patient-list-create'),
    path('saved-patients/<uuid:pk>/', SavedPatientDetailView.as_view(), name='saved-patient-detail'),
    
    # Doctor notes
    path('notes/', DoctorNoteListCreateView.as_view(), name='doctor-note-list-create'),
    path('notes/<uuid:pk>/', DoctorNoteDetailView.as_view(), name='doctor-note-detail'),
    
    # Access logs
    path('access-logs/', AccessLogListView.as_view(), name='access-log-list'),
]

