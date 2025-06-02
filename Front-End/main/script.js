console.log("Script funcionando");

const cards = document.querySelectorAll('.corpo_cards_mercado, .corpo_cards_investimento, .corpo_cards_vantagens');
let cardAberto = null;

// Cria o overlay
const overlay = document.createElement('div');
overlay.className = 'card-overlay';
document.body.appendChild(overlay);

// Funções para abrir/fechar
function abrirModal(detalhes) {
    if (cardAberto) fecharModal();
    detalhes.style.display = 'block';
    overlay.style.display = 'block';
    document.body.classList.add('body-blur');
    cardAberto = detalhes;
}

function fecharModal() {
    if (cardAberto) {
        cardAberto.style.display = 'none';
        overlay.style.display = 'none';
        document.body.classList.remove('body-blur');
        cardAberto = null;
    }
}

// Adiciona eventos
cards.forEach(card => {
    card.addEventListener('click', function(e) {
        // Impede que cliques nos filhos do card fechem o modal
        if (e.target.closest('.card-detalhes')) return;
        
        const detalhes = this.querySelector('.card-detalhes');
        if (!detalhes) return;
        
        if (cardAberto === detalhes) {
            fecharModal();
        } else {
            abrirModal(detalhes);
        }
    });
});

// Fecha ao clicar no overlay
overlay.addEventListener('click', fecharModal);

// Impede que o modal feche ao clicar nele
document.querySelectorAll('.card-detalhes').forEach(modal => {
    modal.addEventListener('click', (e) => e.stopPropagation());
});