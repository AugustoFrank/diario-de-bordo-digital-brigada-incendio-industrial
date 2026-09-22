from django.contrib import admin
from .models import Diario, Ocorrencia
# Register your models here.

class OcorrenciaInline(admin.TabularInline):
    model = Ocorrencia
    extra = 0
    readonly_fields = ('modulo', 'dados', 'criado_em')


@admin.register(Diario)
class DiarioAdmin(admin.ModelAdmin):
    list_display = ('nome', 'equipe', 'data', 'criado_em', 'finalizado_em')
    list_filter = ('equipe', 'data')
    search_fields = ('nome',)
    inlines = [OcorrenciaInline]


@admin.register(Ocorrencia)
class OcorrenciaAdmin(admin.ModelAdmin):
    list_display = ('diario', 'modulo', 'criado_em')
    list_filter = ('modulo',)