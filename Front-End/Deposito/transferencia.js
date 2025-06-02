console.log("Script Transferência funcionando!");

async function carregarContaUsuario() {
    const contaSalva = localStorage.getItem('contaUsuario');
    if (contaSalva) contaUsuario = JSON.parse(contaSalva);
}

document.addEventListener('DOMContentLoaded', async () => {
    await carregarContaUsuario();

    if (!contaUsuario) {
        alert("Conta do usuário não carregada. Recarregue a página.");
        return;
    }

    document.getElementById('numeroConta').textContent = contaUsuario.numero;
    document.getElementById('saldoConta').textContent = `R$ ${contaUsuario.saldo.toFixed(2).replace('.', ',')}`;
});

document.getElementById('formTransferencia').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!contaUsuario) {
        alert('Conta não carregada. Recarregue a página.');
        return;
    }

    const numeroDestino = document.getElementById('contaDestino').value.trim();
    const valor = parseFloat(document.getElementById('valorTransferencia').value);

    if (!numeroDestino) {
        alert('Informe o número da conta destino.');
        return;
    }

    if (isNaN(valor) || valor <= 5) {
        alert('Valor inválido (mínimo 5 reais)');
        return;
    }

    if (valor > contaUsuario.saldo) {
        alert('Saldo insuficiente para transferência');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/transferencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conta_origem_id: contaUsuario.id,
                conta_destino_numero: numeroDestino,
                valor: valor.toFixed(2),
            })
        });

        const data = await response.json();

        if (!data.sucesso) throw new Error(data.mensagem);

        // Atualiza saldo local e mostra pro usuário
        contaUsuario.saldo = parseFloat(data.novo_saldo);
        localStorage.setItem('contaUsuario', JSON.stringify(contaUsuario));

        alert('Transferência realizada com sucesso!');
        document.getElementById('valorTransferencia').value = '';
        document.getElementById('contaDestino').value = '';
        document.getElementById('saldoConta').textContent = `R$ ${contaUsuario.saldo.toFixed(2).replace('.', ',')}`;

    } catch (error) {
        console.error('Erro na transferência:', error);
        alert(error.message || 'Falha na transferência');
    }
});
