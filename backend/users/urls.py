from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, VerifyOTPView, LoginView, profile_view,
    change_password, request_password_reset, reset_password, logout_view, resend_otp
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', resend_otp, name='resend-otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', profile_view, name='profile'),
    path('change-password/', change_password, name='change-password'),
    path('password-reset/request/', request_password_reset, name='password-reset-request'),
    path('password-reset/', reset_password, name='password-reset'),
    path('logout/', logout_view, name='logout'),
]

