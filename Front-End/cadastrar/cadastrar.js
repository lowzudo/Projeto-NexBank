import { validarSenha, validarCPF } from './validacoes.js';

console.log("Script funcionando")

async function cadastrarUsuario() {
    
    const dados = {
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value,
        nome: document.getElementById('nome').value,
        CPF: document.getElementById('CPF').value,
        confirmarSenha: document.getElementById('confirmar-senha').value
    };

    
    if (!validarCPF(dados.CPF)) {
        alert('CPF inválido!');
        return;
    }

    const validacaoSenha = validarSenha(dados.senha);
    if (!validacaoSenha.valido) {
        alert(validacaoSenha.mensagem);
        return;
    }


    if (dados.senha !== dados.confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }


    try {
        const response = await fetch('http://localhost:5000/api/cadastrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: dados.email,
                senha: dados.senha,
                nome: dados.nome,
                CPF: dados.CPF
            })
        });

        const resultado = await response.json();
        
        if (resultado.sucesso) {
            alert('Cadastro realizado com sucesso!');
            window.location.href = '../login/login.html';
        } else {
            alert(`Erro: ${resultado.mensagem}`);
        }
    } catch (erro) {
        console.error('Erro:', erro);
        alert('Falha na comunicação com o servidor');
    }
}

document.getElementById('formCadastro').addEventListener('submit', (e) => {
    e.preventDefault();
    cadastrarUsuario();
});