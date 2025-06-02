console.log("Script Cartões Funcionando !!!");

// Pegando dados do usuário logado
let usuario = JSON.parse(localStorage.getItem('usuarioNexBank'));
console.log("Usuário verificado com sucesso", usuario, "Id:", usuario.id);

// Função para buscar conta pelo ID na API
async function obterContaDoUsuario(usuario_id) {
    try {
        const resposta = await fetch(`http://localhost:5000/api/conta/${usuario_id}`)
        const dados = await resposta.json();

        if (dados.sucesso) {
            return dados.conta;
        } else {
            throw new Error(dados.mensagem);
        }
    } catch (erro) {
        console.error("Erro ao obter conta:", erro);
        alert("Erro ao buscar conta.");
    }
}

// Gerar número aleatório do cartão
function gerarNumeroCartao() {
    let numero = "";
    for (let i = 0; i < 16; i++) {
        numero += Math.floor(Math.random() * 10);
        if ((i + 1) % 4 === 0 && i !== 15) {
            numero += " ";
        }
    }
    return numero;
}

// Gerar validade (mês/ano até 2035)
function gerarValidade() {
    const mes = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const ano = Math.floor(Math.random() * (2035 - 2025 + 1)) + 2025;
    return `${mes}/${String(ano).slice(-2)}`;
}

// Gerar CVV aleatório
function gerarCVV() {
    return String(Math.floor(100 + Math.random() * 900));
}

// Função principal que gera o cartão e exibe com saldo
async function gerarCartao(divId) {
    const conta = await obterContaDoUsuario(usuario.id);

    if (!conta) {
        alert("Conta não encontrada.");
        return;
    }

    const numero = gerarNumeroCartao();
    const validade = gerarValidade();
    const cvv = gerarCVV();
    const saldoFormatado = conta.saldo.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });

    const cartaoDiv = document.getElementById(divId);
    cartaoDiv.innerHTML = `
        <div class="card">
            <h2>Cartão de Débito</h2>
            <p><strong>Número:</strong> ${numero}</p>
            <p><strong>Validade:</strong> ${validade}</p>
            <p><strong>CVV:</strong> ${cvv}</p>
            <p><strong>Saldo:</strong> ${saldoFormatado}</p>
        </div>
    `;
}
