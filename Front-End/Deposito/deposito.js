console.log("Script Depósito Funcionando !!!");

let usuario = JSON.parse(localStorage.getItem('usuarioNexBank'));
console.log("Usuário verificado com sucesso ", usuario, "Id: ", usuario.id)
let contaUsuario = null;

async function carregarDadosConta() {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/conta/${usuario.id}`);
        if (!response.ok) throw new Error(`Erro: ${response.status}`);

        const data = await response.json();
        if (!data.sucesso) throw new Error(data.mensagem);

        contaUsuario = data.conta;
        localStorage.setItem('contaUsuario', JSON.stringify(contaUsuario));
        return true;
    } catch (error) {
        console.error('Falha ao carregar conta:', error);
        return false;
    }
}

async function carregarExtrato() {
    if (!contaUsuario) return;

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/extrato/${contaUsuario.id}`);
        if (!response.ok) throw new Error(`Erro ao buscar extrato: ${response.status}`);

        const data = await response.json();
        if (!data.sucesso) throw new Error(data.mensagem);

        const listaExtrato = document.getElementById('listaExtrato');
        listaExtrato.innerHTML = '';

        if (data.transacoes.length === 0) {
            listaExtrato.innerHTML = `<p class="sem-transacoes">Nenhuma transação encontrada</p>`;
            return;
        }

        data.transacoes.forEach(transacao => {
            const item = document.createElement('div');
            item.classList.add('extrato-item');

            const valorFormatado = parseFloat(transacao.valor).toFixed(2).replace('.', ',');
            const valorTexto = (transacao.valor > 0 ? '+' : '') + `R$ ${valorFormatado}`;

            item.innerHTML = `
                <span class="tipo-transacao">${transacao.tipo}</span>
                <span class="data-transacao">${new Date(transacao.data).toLocaleString('pt-BR')}</span>
                <span class="valor-transacao ${transacao.valor > 0 ? 'credito' : 'debito'}">${valorTexto}</span>
            `;
            listaExtrato.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar extrato:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        usuario = JSON.parse(localStorage.getItem('usuarioNexBank'));
        if (!usuario?.id) {
            window.location.href = "../login.html";
            return;
        }

        const contaSalva = localStorage.getItem('contaUsuario');
        if (contaSalva) contaUsuario = JSON.parse(contaSalva);

        if (!await carregarDadosConta()) {
            alert('Erro ao carregar conta. Tente novamente.');
            return;
        }

        document.getElementById('nomeUsuario').textContent = usuario.nome;
        document.getElementById('numeroConta').textContent = contaUsuario.numero;
        document.getElementById('saldoConta').textContent = `R$ ${contaUsuario.saldo.toFixed(2).replace('.', ',')}`;

        await carregarExtrato();

    } catch (error) {
        console.error('Erro inicial:', error);
        alert('Erro ao carregar dados');
    }
});

document.getElementById('formDeposito').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!contaUsuario) {
        alert('Conta não carregada. Recarregue a página.');
        return;
    }

    const valor = parseFloat(document.getElementById('valorDeposito').value);
    if (isNaN(valor) || valor <= 5) {
        alert('Valor inválido (Minimo 5 reais)');
        return;
    }

    if (valor > 10000) {
        alert('Valor máximo para saque é R$ 10.000,00');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/deposito', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conta_id: contaUsuario.id,
                valor: valor.toFixed(2)
            })
        });

        const data = await response.json();
        if (!data.sucesso) throw new Error(data.mensagem);

        contaUsuario.saldo = parseFloat(data.novo_saldo);
        localStorage.setItem('contaUsuario', JSON.stringify(contaUsuario));

        alert('Depósito realizado!');
        console.log("Depósito realizado com Sucesso !");
        document.getElementById('valorDeposito').value = '';
        document.getElementById('saldoConta').textContent = `R$ ${contaUsuario.saldo.toFixed(2).replace('.', ',')}`;

        await carregarExtrato();

    } catch (error) {
        console.error('Erro no depósito:', error);
        alert(error.message || 'Falha no depósito');
    }
});

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('usuarioNexBank');
    localStorage.removeItem('contaUsuario');
    window.location.href = '../login/login.html';
});
