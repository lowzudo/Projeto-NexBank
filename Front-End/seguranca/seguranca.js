console.log("Segurança carregada");

function rolarParaSecao() {
    alert("Você será redirecionado para a seção de segurança.");
    const secao = document.querySelector(".corpo_segurancas");
    secao.scrollIntoView({ behavior: "smooth" }); 
}
