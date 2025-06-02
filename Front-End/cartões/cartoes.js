console.log("Script Cartões Funcionando !!!");

let usuario = JSON.parse(localStorage.getItem('usuarioNexBank'));
console.log("Usuário verificado com sucesso", usuario, "Id:", usuario.id);

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

function gerarValidade() {
    const mes = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const ano = Math.floor(Math.random() * (2035 - 2025 + 1)) + 2025;
    return `${mes}/${String(ano).slice(-2)}`;
}

function gerarCVV() {
    return String(Math.floor(100 + Math.random() * 900));
}

function dataHojeString() {
    const hoje = new Date();
    return hoje.toISOString().slice(0, 10); 
}

async function gerarCartao(divId) {
    const ultimaData = localStorage.getItem(`ultimoCartao_${usuario.id}`);
    const hojeStr = dataHojeString();

    if (ultimaData === hojeStr) {
        alert("Você só pode gerar 1 cartão por dia. Tente novamente amanhã.");
        return;
    }

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

    localStorage.setItem(`ultimoCartao_${usuario.id}`, hojeStr);
}
