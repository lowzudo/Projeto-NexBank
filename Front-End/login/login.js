console.log("Script de login carregado"); 

document.querySelector('.form').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    
    console.log("Iniciando login..."); // Debug 1
    
    const dados = {
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value
    };

    console.log("Dados capturados:", dados); 

    try {
        console.log("Enviando requisição...");
        
        const resposta = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });

        console.log("Status da resposta:", resposta.status); 
        
        const resultado = await resposta.json();
        console.log("Resposta completa:", resultado); 

        if (!resposta.ok) throw new Error(resultado.mensagem || 'Erro desconhecido');

        console.log("Chegou !")
        if (resultado.sucesso) {
            console.log("Armazenou !")
            localStorage.setItem('usuarioNexBank', JSON.stringify(resultado.usuario)); 
            console.log(resultado.usuario)
            alert(`Bem-vindo, ${resultado.usuario.nome}!`);
            window.location.href = '../logados/logados.html';
        }

        else if (resultado.erro) {
            alert(resultado.erro);
        } else {
            alert("Erro, usuário ou senha inválidos");
        }

    } catch (erro) {
        console.error("Erro completo:", erro);
        alert(erro.message || "Falha na comunicação com o servidor");
    }
});