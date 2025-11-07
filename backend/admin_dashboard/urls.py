from django.urls import path
from .views import (
    dashboard_statistics, UserListView, UserDetailView,
    activate_user, reset_user_password, patient_records,
    AccessLogListView, audit_trail, export_access_logs
)

urlpatterns = [
    path('statistics/', dashboard_statistics, name='admin-statistics'),
    path('users/', UserListView.as_view(), name='admin-user-list'),
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='admin-user-detail'),
    path('users/<uuid:user_id>/activate/', activate_user, name='admin-activate-user'),
    path('users/<uuid:user_id>/reset-password/', reset_user_password, name='admin-reset-password'),
    path('users/<uuid:patient_id>/records/', patient_records, name='admin-patient-records'),
    path('access-logs/', AccessLogListView.as_view(), name='admin-access-logs'),
    path('audit-trail/<uuid:patient_uuid>/', audit_trail, name='admin-audit-trail'),
    path('export-logs/', export_access_logs, name='admin-export-logs'),
]

