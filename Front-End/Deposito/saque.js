console.log("Script Saque funcionando!");

document.getElementById('formSaque').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!contaUsuario) {
        alert('Conta não carregada. Recarregue a página.');
        return;
    }

    const valor = parseFloat(document.getElementById('valorSaque').value);
    if (isNaN(valor) || valor <= 5) {
        alert('Valor inválido (Minimo 5 reais)');
        return;
    }

    if (valor > 10000) {
        alert('Valor máximo para saque é R$ 10.000,00');
        return;
    }

    if (valor > contaUsuario.saldo) {
        alert('Saldo insuficiente para saque');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/saque', {
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

        alert('Saque realizado com sucesso!');
        document.getElementById('valorSaque').value = '';
        document.getElementById('saldoConta').textContent =
            `R$ ${contaUsuario.saldo.toFixed(2).replace('.', ',')}`;

    } catch (error) {
        console.error('Erro no saque:', error);
        alert(error.message || 'Falha no saque');
    }
});
