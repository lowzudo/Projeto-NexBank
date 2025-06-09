console.log("Script Pix Cadastro Funcionando !!!");

let usuario = JSON.parse(localStorage.getItem('usuarioNexBank'));
console.log("Usuário logado:", usuario);
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


    } catch (error) {
        console.error('Erro inicial:', error);
        alert('Erro ao carregar dados');
    }
});

document.getElementById('formPix').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!contaUsuario) {
        alert('Conta não carregada. Recarregue a página.');
        return;
    }

    const numero_conta = document.getElementById('numero_conta').value.trim();
    const tipo_chave = document.getElementById('tipo_chave').value.trim().toLowerCase();
    const chave = document.getElementById('chave').value.trim();

    if (!numero_conta || !tipo_chave || !chave) {
        alert('Preencha todos os campos.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/chaves_pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conta_id: contaUsuario.id, 
                numero_conta,
                tipo_chave,
                chave
            })
        });

        const data = await response.json();

        if (!data.sucesso) throw new Error(data.mensagem);

        alert('Chave Pix cadastrada com sucesso!');
        e.target.reset();

    } catch (error) {
        console.error('Erro ao cadastrar chave Pix:', error);
        alert(error.message || 'Falha ao cadastrar chave Pix');
    }
});
