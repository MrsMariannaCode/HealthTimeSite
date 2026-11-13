// 1. Alternância de Abas do Painel Médico
function alternarAba(idAba, botao) {
  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  const abaAlvo = document.getElementById('aba-' + idAba);
  if (abaAlvo) abaAlvo.classList.add('active');
  if (botao) botao.classList.add('active');

  if (idAba === 'prontuario') {
    carregarHistoricoMedico();
  } else if (idAba === 'resumo') {
    carregarResumoPareceres();
  }
}

// 2. Simular Recebimento de Alerta (Taquicardia / Queda / Sem Alteração)
function simularAlertaEmergencia() {
  const btn = document.querySelector('.btn-warning');
  const textoOriginal = '🚨 Simular Recebimento de Alerta e Atualizar';
  if (btn) btn.innerText = '⏳ Gerando e atualizando...';

  fetch('./api/simular_alerta.php')
    .then(res => {
      if (!res.ok) throw new Error('Servidor respondeu com status ' + res.status);
      return res.json();
    })
    .then(data => {
      if (data.status === 'sucesso') {
        carregarHistoricoMedico();
        carregarResumoPareceres();

        if (data.evento) {
          atualizarSinaisVitaisNaTela(data.evento.bpm, data.evento.spo2, data.evento.tipo_evento);
        }

        if (btn) {
          btn.innerText = '✔️ Registro Atualizado!';
          setTimeout(() => { btn.innerText = textoOriginal; }, 2000);
        }
      } else {
        alert('Erro do PHP: ' + JSON.stringify(data));
        if (btn) btn.innerText = textoOriginal;
      }
    })
    .catch(err => {
      console.error('Erro de requisição:', err);
      alert('Erro ao chamar a API: ' + err.message);
      if (btn) btn.innerText = textoOriginal;
    });
}

// Função auxiliar para atualizar os indicadores do topo e da Telemedicina
function atualizarSinaisVitaisNaTela(bpm, spo2, tipoEvento) {
  const isNormal = tipoEvento === 'SEM ALTERAÇÃO';
  const corStatus = isNormal ? '#10b981' : '#f43f5e';

  const vitasResumo = document.getElementById('vitasResumo');
  if (vitasResumo) {
    vitasResumo.innerHTML = `<span style="color: ${corStatus}; font-weight: bold;">${bpm} BPM | SpO₂ ${spo2}% (${tipoEvento})</span>`;
  }

  const teleBpm = document.getElementById('teleBpm');
  const teleSpo2 = document.getElementById('teleSpo2');
  if (teleBpm) {
    teleBpm.innerText = `${bpm} BPM`;
    teleBpm.style.color = corStatus;
  }
  if (teleSpo2) {
    teleSpo2.innerText = `${spo2}%`;
    teleSpo2.style.color = corStatus;
  }
}

// 3. Carregar Histórico de Eventos Cardíacos
function carregarHistoricoMedico() {
  const container = document.getElementById('tabelaHistoricoMedico');
  if (!container) return;

  fetch('./api/listar_historico.php')
    .then(res => res.json())
    .then(dados => {
      if (!dados || dados.length === 0) {
        container.innerHTML = '<p style="font-size: 0.85rem; color: #64748b;">Nenhum evento registrado até o momento. Clique no botão acima para simular.</p>';
        return;
      }

      const maisRecente = dados[0];
      atualizarSinaisVitaisNaTela(maisRecente.bpm, maisRecente.spo2, maisRecente.tipo_evento);

      let html = '';
      dados.forEach(item => {
        const isNormal = item.tipo_evento === 'SEM ALTERAÇÃO';
        const cor = isNormal ? '#10b981' : '#f43f5e';

        html += `
          <div class="med-item" style="border-left: 4px solid ${cor};">
            <div><b style="color: ${cor};">Evento:</b> ${item.tipo_evento} (${item.bpm} BPM | SpO₂: ${item.spo2}%)</div>
            <div style="color: #64748b; margin-top: 2px;">${item.descricao}</div>
            <div class="med-time">📅 ${item.data_hora}</div>
          </div>
        `;
      });

      container.innerHTML = html;
    })
    .catch(() => {
      container.innerHTML = '<p style="font-size: 0.85rem; color: #f43f5e;">Aguardando conexão com o servidor PHP...</p>';
    });
}

// 4. Salvar Parecer no Prontuário
function salvarParecer(e) {
  e.preventDefault();
  const textoInput = document.getElementById('textoParecer');
  const texto = textoInput.value;
  const msg = document.getElementById('msgParecer');

  if (!texto.trim()) {
    msg.style.color = '#f43f5e';
    msg.innerText = 'Por favor, digite uma observação antes de salvar.';
    return;
  }

  msg.style.color = '#64748b';
  msg.innerText = '⏳ Salvando no banco de dados...';

  fetch('./api/salvar_parecer.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: texto })
  })
    .then(async res => {
      const respostaTexto = await res.text();
      try {
        return JSON.parse(respostaTexto);
      } catch {
        throw new Error(`Status ${res.status}: ${respostaTexto.substring(0, 120)}`);
      }
    })
    .then(data => {
      if (data.status === 'sucesso') {
        msg.style.color = '#10b981';
        msg.innerText = '✔️ ' + data.mensagem;
        textoInput.value = '';
        carregarResumoPareceres();
        setTimeout(() => { msg.innerText = ''; }, 4000);
      } else {
        msg.style.color = '#f43f5e';
        msg.innerText = 'Erro: ' + (data.erro || 'Falha ao salvar.');
      }
    })
    .catch(err => {
      console.error('Erro ao salvar parecer:', err);
      msg.style.color = '#f43f5e';
      msg.innerText = 'Falha na requisição: ' + err.message;
    });
}

// Função auxiliar para formatar o texto do estado clínico
function formatarTextoEstado(tipo) {
  if (!tipo) return 'Sem alteração';
  const upper = tipo.trim().toUpperCase();
  if (upper === 'SEM ALTERAÇÃO') return 'Sem alteração';
  if (upper === 'TAQUICARDIA') return 'Taquicardia';
  if (upper === 'QUEDA') return 'Queda';
  return tipo;
}

// 5. Carregar Pareceres e Estado Atual na Aba Resumo dos Pacientes
function carregarResumoPareceres() {
  const container = document.getElementById('listaResumoPareceres');
  if (!container) return;

  Promise.all([
    fetch('./api/listar_pareceres.php').then(res => res.json()),
    fetch('./api/listar_historico.php').then(res => res.json())
  ])
    .then(([pareceres, historico]) => {
      if (!pareceres || pareceres.length === 0) {
        container.innerHTML = '<p style="font-size: 0.85rem; color: #64748b;">Nenhuma anotação médica registrada no prontuário até o momento.</p>';
        return;
      }

      const estadoBruto = (historico && historico.length > 0) ? historico[0].tipo_evento : 'SEM ALTERAÇÃO';
      const estadoFormatado = formatarTextoEstado(estadoBruto);
      const isNormal = estadoBruto.trim().toUpperCase() === 'SEM ALTERAÇÃO';
      const corEstado = isNormal ? '#10b981' : '#f43f5e';

      let html = '';
      pareceres.forEach(item => {
        html += `
          <div class="med-item" style="border-left: 4px solid #0284c7;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span>
                <strong>Paciente:</strong> ${item.paciente_nome}
                <span style="color: #cbd5e1; margin: 0 6px;">|</span>
                <strong>Estado:</strong> <span style="color: ${corEstado}; font-weight: 600;">${estadoFormatado}</span>
              </span>
              <span class="med-time">📅 ${item.data_hora}</span>
            </div>
            <div style="color: #1e293b; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 6px;">
              ${item.texto}
            </div>
            <div style="font-size: 0.78rem; color: #64748b;">
              🩺 <strong>Médico Responsável:</strong> ${item.medico_nome}
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    })
    .catch(() => {
      container.innerHTML = '<p style="font-size: 0.85rem; color: #f43f5e;">Erro ao carregar anotações do banco de dados.</p>';
    });
}

// 6. Controles Interativos da Sala de Telemedicina
function configurarControlesTelemedicina() {
  const botoesTele = document.querySelectorAll('.btn-tele-control');
  botoesTele.forEach(btn => {
    btn.addEventListener('click', () => {
      const texto = btn.innerText;
      if (texto.includes('Mute')) {
        btn.innerText = '🔇 Microfone Mudo';
        btn.style.opacity = '0.75';
      } else if (texto.includes('Microfone Mudo')) {
        btn.innerText = '🎙️ Mute';
        btn.style.opacity = '1';
      } else if (texto.includes('Câmera')) {
        btn.innerText = texto.includes('Desligada') ? '📷 Câmera' : '🚫 Câmera Desligada';
      } else if (texto.includes('Encerrar')) {
        const statusLive = document.querySelector('.pulse-live');
        if (statusLive) {
          statusLive.innerText = '⚫ Teleconsulta Encerrada pelo Médico';
          statusLive.style.color = '#94a3b8';
        }
      }
    });
  });
}

// Inicialização Geral
document.addEventListener('DOMContentLoaded', () => {
  carregarHistoricoMedico();
  carregarResumoPareceres();
  configurarControlesTelemedicina();
  setInterval(carregarHistoricoMedico, 3000);
});
// 5. Carregar Pareceres e Estado Individual na Aba Resumo dos Pacientes
function carregarResumoPareceres() {
  const container = document.getElementById('listaResumoPareceres');
  if (!container) return;

  fetch('./api/listar_pareceres.php')
    .then(res => res.json())
    .then(pareceres => {
      if (!pareceres || pareceres.length === 0) {
        container.innerHTML = '<p style="font-size: 0.85rem; color: #64748b;">Nenhuma anotação médica registrada no prontuário até o momento.</p>';
        return;
      }

      let html = '';
      pareceres.forEach(item => {
        const estadoBruto = item.estado_evento || 'SEM ALTERAÇÃO';
        const estadoFormatado = formatarTextoEstado(estadoBruto);
        const isNormal = estadoBruto.trim().toUpperCase() === 'SEM ALTERAÇÃO';
        const corEstado = isNormal ? '#10b981' : '#f43f5e';

        html += `
          <div class="med-item" style="border-left: 4px solid #0284c7;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span>
                <strong>Paciente:</strong> ${item.paciente_nome}
                <span style="color: #cbd5e1; margin: 0 6px;">|</span>
                <strong>Estado:</strong> <span style="color: ${corEstado}; font-weight: 600;">${estadoFormatado}</span>
              </span>
              <span class="med-time">📅 ${item.data_hora}</span>
            </div>
            <div style="color: #1e293b; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 6px;">
              ${item.texto}
            </div>
            <div style="font-size: 0.78rem; color: #64748b;">
              🩺 <strong>Médico Responsável:</strong> ${item.medico_nome}
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    })
    .catch(() => {
      container.innerHTML = '<p style="font-size: 0.85rem; color: #f43f5e;">Erro ao carregar anotações do banco de dados.</p>';
    });
}