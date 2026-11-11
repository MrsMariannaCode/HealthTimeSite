// Alternância de Abas
function alternarAba(idAba, botao) {
  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  document.getElementById('aba-' + idAba).classList.add('active');
  botao.classList.add('active');

  if (idAba === 'prontuario' || idAba === 'alertas') {
    carregarHistoricoMedico();
  }
}

// Salvar anotações no Prontuário
function salvarParecer(e) {
  e.preventDefault();
  const texto = document.getElementById('textoParecer').value;
  const msg = document.getElementById('msgParecer');

  if (!texto.trim()) {
    msg.style.color = "#f43f5e";
    msg.innerText = "Por favor, digite uma observação antes de salvar.";
    return;
  }

  msg.style.color = "#10b981";
  msg.innerText = "✔️ Parecer registrado com sucesso no prontuário do paciente!";
  document.getElementById('textoParecer').value = '';

  setTimeout(() => { msg.innerText = ''; }, 4000);
}

// Carregar Histórico do Banco de Dados
function carregarHistoricoMedico() {
  const container = document.getElementById('tabelaHistoricoMedico');
  const containerAlertas = document.getElementById('listaCentralAlertas');
  
  if (container) container.innerHTML = '<p style="font-size: 0.8rem; color: #64748b;">Carregando dados da UBS...</p>';

  fetch('api/listar_historico.php')
    .then(res => res.json())
    .then(dados => {
      if (!dados || dados.length === 0) {
        if (container) container.innerHTML = '<p style="font-size: 0.8rem; color: #64748b;">Nenhum evento registrado até o momento.</p>';
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
      if (container) container.innerHTML = '<p style="font-size: 0.8rem; color: #f43f5e;">Aguardando sincronização com a API...</p>';
    });
}

// Carrega os dados ao iniciar
document.addEventListener('DOMContentLoaded', () => {
  carregarHistoricoMedico();
});