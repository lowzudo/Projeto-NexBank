console.log("Pix script loaded");


let usuario = JSON.parse(localStorage.getItem('usuarioNexBank'));
console.log("Usuário carregado:", usuario);
let contaUsuario = null;

async function carregarDadosConta() {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/conta/${usuario.id}`);
        if (!response.ok) throw new Error(`Erro: ${response.status}`);

        const data = await response.json();
        if (!data.sucesso) throw new Error(data.mensagem);

        contaUsuario = data.conta;
        localStorage.setItem('contaUsuario', JSON.stringify(contaUsuario));

        document.getElementById('saldo').textContent = contaUsuario.saldo.toFixed(2).replace('.', ',');
    } catch (error) {
        console.error("Erro ao carregar dados da conta:", error);
        alert("Erro ao carregar conta.");
    }
}

async function carregarTransacoesRecentes() {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/extrato/${contaUsuario.id}`);
        const data = await response.json();
        const lista = document.getElementById('listaTransacoes');
        lista.innerHTML = '';

        if (!data.sucesso || data.transacoes.length === 0) {
            lista.innerHTML = `<p class="sem-transacoes">Nenhuma transação encontrada</p>`;
            return;
        }

        data.transacoes.forEach(tx => {
            const item = document.createElement('div');
            item.classList.add('item-transacao');

            const valor = parseFloat(tx.valor).toFixed(2).replace('.', ',');
            const tipo = tx.valor < 0 ? 'debito' : 'credito';

            item.innerHTML = `
                <div class="info-transacao">
                    <div>${tx.descricao || 'Transação PIX'}</div>
                    <div class="data-transacao">${new Date(tx.data).toLocaleString('pt-BR')}</div>
                </div>
                <div class="valor-transacao ${tipo}">${tx.valor < 0 ? '-' : '+'}R$ ${valor}</div>
            `;

            lista.appendChild(item);
        });
    } catch (error) {
        console.error("Erro ao carregar transações:", error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!usuario?.id) {
        window.location.href = '../login.html';
        return;
    }

    await carregarDadosConta();
    await carregarTransacoesRecentes();
});

document.getElementById('formularioPix').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipoPix = document.getElementById('tipoPix').value;
    const chave = document.getElementById('chavePix').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const descricao = document.getElementById('descricao').value.trim();

    if (!tipoPix || !chave || isNaN(valor) || valor <= 0) {
        alert('Preencha todos os campos obrigatórios corretamente.');
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        conta_origem_id: contaUsuario.id,
        chave_destino: chave,
        valor: parseFloat(valor.toFixed(2)),
        descricao
        })
    });


        const data = await response.json();
        if (!data.sucesso) throw new Error(data.mensagem);

        contaUsuario.saldo = parseFloat(data.novo_saldo);
        localStorage.setItem('contaUsuario', JSON.stringify(contaUsuario));

        alert('PIX enviado com sucesso!');
        document.getElementById('saldo').textContent = contaUsuario.saldo.toFixed(2).replace('.', ',');

        document.getElementById('formularioPix').reset();
        await carregarTransacoesRecentes();
    } catch (error) {
        console.error('Erro ao enviar PIX:', error);
        alert(error.message || 'Erro ao enviar PIX');
    }
});
