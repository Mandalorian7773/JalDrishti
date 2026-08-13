from django.urls import path

from . import views

urlpatterns = [
    path('summary/', views.summary),
    path('stations/', views.stations),
    path('stations/<str:code>/', views.station_detail),
    path('states/', views.states),
    path('alerts/', views.alerts),
]
