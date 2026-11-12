// 1. Alternância de Abas do Painel Médico
function alternarAba(idAba, botao) {
  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  document.getElementById('aba-' + idAba).classList.add('active');
  botao.classList.add('active');

  if (idAba === 'prontuario' || idAba === 'alertas') {
    carregarHistoricoMedico();
  }
}

// 2. Simular Recebimento de Alerta (Grava no SQLite local)
function simularAlertaEmergencia() {
  const btn = document.querySelector('.btn-warning');
  if (btn) btn.innerText = '⏳ Gerando alerta...';

  fetch('./api/simular_alerta.php')
    .then(res => {
      if (!res.ok) throw new Error('Servidor respondeu com status ' + res.status);
      return res.json();
    })
    .then(data => {
      if (data.status === 'sucesso') {
        carregarHistoricoMedico();

        const vitasResumo = document.getElementById('vitasResumo');
        if (vitasResumo && data.evento) {
          vitasResumo.innerHTML = `<span style="color: #f43f5e; font-weight: bold;">${data.evento.bpm} BPM | SpO₂ ${data.evento.spo2}% (${data.evento.tipo_evento})</span>`;
        }

        if (btn) {
          btn.innerText = '✔️ Alerta Criado!';
          setTimeout(() => { btn.innerText = '🚨 Simular Recebimento de Alerta'; }, 2000);
        }
      } else {
        alert('Erro do PHP: ' + JSON.stringify(data));
        if (btn) btn.innerText = '🚨 Simular Recebimento de Alerta';
      }
    })
    .catch(err => {
      console.error('Erro de requisição:', err);
      alert('Erro ao chamar a API: ' + err.message);
      if (btn) btn.innerText = '🚨 Simular Recebimento de Alerta';
    });
}

// 3. Carregar Histórico do Banco de Dados
function carregarHistoricoMedico() {
  const container = document.getElementById('tabelaHistoricoMedico');
  const containerAlertas = document.getElementById('listaCentralAlertas');

  fetch('api/listar_historico.php')
    .then(res => res.json())
    .then(dados => {
      if (!dados || dados.length === 0) {
        const vazio = '<p style="font-size: 0.8rem; color: #64748b;">Nenhum evento registrado até o momento. Clique em "Simular Recebimento de Alerta" para testar.</p>';
        if (container) container.innerHTML = vazio;
        if (containerAlertas) containerAlertas.innerHTML = vazio;
        return;
      }

      let html = '';
      dados.forEach(item => {
        html += `
          <div class="med-item">
            <div><b>Evento:</b> ${item.tipo_evento} (${item.bpm} BPM | SpO₂: ${item.spo2}%)</div>
            <div style="color: #64748b; margin-top: 2px;">${item.descricao}</div>
            <div class="med-time">📅 ${item.data_hora}</div>
          </div>
        `;
      });

      if (container) container.innerHTML = html;
      if (containerAlertas) containerAlertas.innerHTML = html;
    })
    .catch(() => {
      if (container) container.innerHTML = '<p style="font-size: 0.8rem; color: #f43f5e;">Aguardando conexão com o servidor PHP...</p>';
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

  fetch('api/salvar_parecer.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: texto })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'sucesso') {
        msg.style.color = '#10b981';
        msg.innerText = '✔️ ' + data.mensagem;
        textoInput.value = '';
        setTimeout(() => { msg.innerText = ''; }, 4000);
      } else {
        msg.style.color = '#f43f5e';
        msg.innerText = 'Erro: ' + (data.erro || 'Falha ao salvar.');
      }
    })
    .catch(() => {
      msg.style.color = '#f43f5e';
      msg.innerText = 'Erro ao se comunicar com o servidor da UBS.';
    });
}

// Inicialização e atualização automática a cada 3 segundos
document.addEventListener('DOMContentLoaded', () => {
  carregarHistoricoMedico();
  setInterval(carregarHistoricoMedico, 3000);
});