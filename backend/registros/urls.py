from django.urls import path
from . import views
from registros import views

urlpatterns = [
    path('diario-atual/', views.diario_atual, name='diario_atual'),
    path('diario/<int:diario_id>/finalizar/', views.finalizar_diario, name='finalizar_diario'),
    path('ocorrencias/', views.ocorrencias, name='ocorrencias'),
    path('rondas-contador/', views.contador_rondas, name='contador_rondas'),
    path('diarios/', views.listar_diarios, name='listar_diarios'),
    path('diario/<int:diario_id>/excluir/', views.excluir_diario, name='excluir_diario'),
]