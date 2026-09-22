from django.db import models

class Diario(models.Model):
    """
    Um diário por bombeiro por dia de plantão.
    'data' é fixada no momento em que o diário é aberto (regra anti-fraude) —
    mesmo que 'finalizado_em' aconteça em outro dia.
    """
    data = models.DateField()
    nome = models.CharField(max_length=120)
    equipe = models.CharField(max_length=50)
    criado_em = models.DateTimeField(auto_now_add=True)
    finalizado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-data', '-criado_em']

    def __str__(self):
        status = 'finalizado' if self.finalizado_em else 'em aberto'
        return f'{self.nome} — {self.data} ({status})'


class Ocorrencia(models.Model):
    """
    Cada card confirmado num modal vira uma Ocorrencia, salva imediatamente
    (não espera o 'Finalizar' do diário) — é o que permite o contador
    coletivo de Rondas em tempo real entre bombeiros diferentes.
    """
    MODULO_CHOICES = [
        ('dds', 'DDS'),
        ('ronda', 'Ronda'),
        ('vtr', 'VTR'),
        ('emergencia', 'Emergência'),
        ('avaliacao', 'Avaliação'),
        ('glp', 'Batedor de GLP'),
        ('fonte_radioativa', 'Fonte Radioativa'),
        ('inspecao_mensal', 'Inspeção Mensal'),
        ('trabalho_quente', 'Acompanhamento Trabalho a Quente'),
        ('treinamento', 'Treinamento'),
        ('caminhoes_combate', 'Caminhões de Combate'),
    ]

    diario = models.ForeignKey(Diario, on_delete=models.CASCADE, related_name='ocorrencias')
    modulo = models.CharField(max_length=30, choices=MODULO_CHOICES)
    dados = models.JSONField()
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['criado_em']

    def __str__(self):
        return f'{self.get_modulo_display()} — {self.diario.nome} ({self.diario.data})'