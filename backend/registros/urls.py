from django.urls import path
from . import views

urlpatterns = [
    path('diario-atual/', views.diario_atual, name='diario_atual'),
    path('diario/<int:diario_id>/finalizar/', views.finalizar_diario, name='finalizar_diario'),
    path('ocorrencias/', views.ocorrencias, name='ocorrencias'),
    path('rondas-contador/', views.contador_rondas, name='contador_rondas'),
]