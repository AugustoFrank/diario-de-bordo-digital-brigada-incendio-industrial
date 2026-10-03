from django.shortcuts import render

# Create your views here.
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db.models import Count  
import os

from .models import Diario, Ocorrencia


EXTENSOES_EVIDENCIA = {'.jpg', '.jpeg', '.png', '.webp'}
TIPOS_EVIDENCIA = {'image/jpeg', 'image/png', 'image/webp'}
TAMANHO_MAX_EVIDENCIA = 8 * 1024 * 1024  # 8 MB

def diario_para_json(diario):
    return {
        'id': diario.id,
        'data': diario.data.isoformat(),
        'nome': diario.nome,
        'equipe': diario.equipe,
        'criado_em': diario.criado_em.isoformat(),
        'finalizado_em': diario.finalizado_em.isoformat() if diario.finalizado_em else None,
    }


def ocorrencia_para_json(ocorrencia):
    return {
        'id': ocorrencia.id,
        'diario_id': ocorrencia.diario_id,
        'modulo': ocorrencia.modulo,
        'modulo_label': ocorrencia.get_modulo_display(),
        'dados': ocorrencia.dados,
        'evidencia_url': ocorrencia.evidencia.url if ocorrencia.evidencia else None,
        'criado_em': ocorrencia.criado_em.isoformat(),
    }


@csrf_exempt
@require_http_methods(['GET'])
def diario_atual(request):
    """
    Retorna o diário em aberto (não finalizado) mais recente do bombeiro.
    Se não existir nenhum, cria um novo com a data de hoje (servidor decide
    a data, nunca o relógio do aparelho do bombeiro).
    Se o diário em aberto for de um dia anterior, volta com 'pendente': true
    — o front-end deve bloquear a criação de diário novo nesse caso e pedir
    pra finalizar o atrasado primeiro.
    """
    nome = request.GET.get('nome', '').strip()
    equipe = request.GET.get('equipe', '').strip()
    trocar_equipe = request.GET.get('trocar_equipe') == '1'

    if not nome or not equipe:
        return JsonResponse({'erro': 'Parâmetros nome e equipe são obrigatórios.'}, status=400)

    hoje = timezone.localdate()

    diario_aberto = (
        Diario.objects
        .filter(nome=nome, finalizado_em__isnull=True)
        .order_by('-data')
        .first()
    )

    if diario_aberto:
        if trocar_equipe and diario_aberto.equipe != equipe and diario_aberto.data == hoje:
            diario_aberto.equipe = equipe
            diario_aberto.save(update_fields=['equipe'])
        pendente = diario_aberto.data < hoje
        return JsonResponse({
            'diario': diario_para_json(diario_aberto),
            'pendente': pendente,
        })

    

    novo = Diario.objects.create(data=hoje, nome=nome, equipe=equipe)
    return JsonResponse({'diario': diario_para_json(novo), 'pendente': False})


@csrf_exempt
@require_http_methods(['POST'])
def finalizar_diario(request, diario_id):
    try:
        diario = Diario.objects.get(id=diario_id)
    except Diario.DoesNotExist:
        return JsonResponse({'erro': 'Diário não encontrado.'}, status=404)

    if diario.finalizado_em:
        return JsonResponse({'erro': 'Esse diário já foi finalizado.'}, status=400)

    diario.finalizado_em = timezone.now()
    diario.save(update_fields=['finalizado_em'])
    return JsonResponse({'diario': diario_para_json(diario)})


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def ocorrencias(request):
    if request.method == 'POST':
        arquivo = None

        if request.content_type and request.content_type.startswith('multipart/form-data'):
            diario_id = request.POST.get('diario_id')
            modulo = request.POST.get('modulo')
            dados_raw = request.POST.get('dados')
            try:
                dados = json.loads(dados_raw) if dados_raw else None
            except json.JSONDecodeError:
                return JsonResponse({'erro': 'Campo dados inválido (JSON mal formado).'}, status=400)
            arquivo = request.FILES.get('evidencia')
        else:
            try:
                body = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'erro': 'JSON inválido.'}, status=400)
            diario_id = body.get('diario_id')
            modulo = body.get('modulo')
            dados = body.get('dados')

        if not diario_id or not modulo or dados is None:
            return JsonResponse({'erro': 'diario_id, modulo e dados são obrigatórios.'}, status=400)

        try:
            diario = Diario.objects.get(id=diario_id)
        except Diario.DoesNotExist:
            return JsonResponse({'erro': 'Diário não encontrado.'}, status=404)

        if diario.finalizado_em:
            return JsonResponse({'erro': 'Esse diário já foi finalizado, não é possível adicionar ocorrências.'}, status=400)

        if modulo not in dict(Ocorrencia.MODULO_CHOICES):
            return JsonResponse({'erro': 'Módulo inválido.'}, status=400)

        if arquivo:
            extensao = os.path.splitext(arquivo.name)[1].lower()
            if extensao not in EXTENSOES_EVIDENCIA or arquivo.content_type not in TIPOS_EVIDENCIA:
                return JsonResponse({'erro': 'Arquivo inválido. Envie uma imagem JPG, PNG ou WEBP.'}, status=400)
            if arquivo.size > TAMANHO_MAX_EVIDENCIA:
                return JsonResponse({'erro': 'Imagem muito grande. O limite é 8 MB.'}, status=400)

        ocorrencia = Ocorrencia.objects.create(diario=diario, modulo=modulo, dados=dados, evidencia=arquivo)
        return JsonResponse({'ocorrencia': ocorrencia_para_json(ocorrencia)}, status=201)

    # GET: lista as ocorrências de um diário (o "carrinho") — ?diario_id=
    diario_id = request.GET.get('diario_id')
    if not diario_id:
        return JsonResponse({'erro': 'Parâmetro diario_id é obrigatório.'}, status=400)

    lista = Ocorrencia.objects.filter(diario_id=diario_id)
    return JsonResponse({'ocorrencias': [ocorrencia_para_json(o) for o in lista]})


@csrf_exempt
@require_http_methods(['GET'])
def contador_rondas(request):
    """
    Meta coletiva de Rondas do turno: conta quantas Ocorrencias do tipo
    'ronda' existem para a data informada, somando todos os bombeiros
    (a ocorrência já conta assim que é confirmada, não precisa finalizar).
    """
    data_str = request.GET.get('data') or timezone.localdate().isoformat()
    total = Ocorrencia.objects.filter(modulo='ronda', diario__data=data_str).count()
    return JsonResponse({'data': data_str, 'rondas_realizadas': total, 'meta': 3})

@csrf_exempt
@require_http_methods(['GET'])
def listar_diarios(request):
    diarios = Diario.objects.prefetch_related('ocorrencias').filter(finalizado_em__isnull=False).order_by('-data', '-finalizado_em', '-id')
    resultado = []
    for d in diarios:
        item = diario_para_json(d)
        item['ocorrencias'] = [ocorrencia_para_json(o) for o in d.ocorrencias.all()]
        resultado.append(item)
    return JsonResponse({'diarios': resultado})


@csrf_exempt
@require_http_methods(['POST'])
def excluir_diario(request, diario_id):
    try:
        diario = Diario.objects.get(id=diario_id)
    except Diario.DoesNotExist:
        return JsonResponse({'erro': 'Diário não encontrado.'}, status=404)
    diario.delete()
    return JsonResponse({'ok': True})


EQUIPES_CONHECIDAS = ['ADM', 'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ESTRUTURA']


@csrf_exempt
@require_http_methods(['GET'])
def estatisticas(request):
    inicio = request.GET.get('inicio')
    fim = request.GET.get('fim')

    if not inicio or not fim:
        return JsonResponse({'erro': 'Parâmetros inicio e fim são obrigatórios.'}, status=400)

    diarios_periodo = Diario.objects.filter(
        finalizado_em__isnull=False,
        data__gte=inicio,
        data__lte=fim,
    )

    # contagem por módulo (todos os 11, mesmo com 0)
    contagem_bruta = (
        Ocorrencia.objects
        .filter(diario__in=diarios_periodo)
        .values('modulo')
        .annotate(total=Count('id'))
    )
    por_modulo = {c['modulo']: c['total'] for c in contagem_bruta}
    modulos = {chave: por_modulo.get(chave, 0) for chave, _ in Ocorrencia.MODULO_CHOICES}

    # diários por equipe (todas as 6, mesmo com 0)
    diarios_bruto = dict(
        diarios_periodo.values_list('equipe').annotate(total=Count('id'))
    )
    diarios_por_equipe = [
        {'equipe': eq, 'total': diarios_bruto.get(eq, 0)} for eq in EQUIPES_CONHECIDAS
    ]

    # diários por colaborador, agrupado por equipe (só quem tem registro — zero-fill fica pro front)
    diarios_por_colaborador = list(
        diarios_periodo
        .values('equipe', 'nome')
        .annotate(total=Count('id'))
        .order_by('equipe', '-total')
    )

    # rondas por equipe (todas as 6, mesmo com 0)
    rondas_bruto = dict(
        Ocorrencia.objects
        .filter(diario__in=diarios_periodo, modulo='ronda')
        .values_list('diario__equipe')
        .annotate(total=Count('id'))
    )
    rondas_por_equipe = [
        {'equipe': eq, 'total': rondas_bruto.get(eq, 0)} for eq in EQUIPES_CONHECIDAS
    ]

    return JsonResponse({
        'inicio': inicio,
        'fim': fim,
        'modulos': modulos,
        'diarios_por_equipe': diarios_por_equipe,
        'diarios_por_colaborador': diarios_por_colaborador,
        'rondas_por_equipe': rondas_por_equipe,
    })