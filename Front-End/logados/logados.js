console.log('Script Funcionando !')

document.addEventListener('DOMContentLoaded', function() {

    const usuario = JSON.parse(localStorage.getItem('usuarioNexBank'));
    console.log(usuario)
    console.log(usuario.id)
    if (!usuario?.id) {
        alert("⚠️ Faça login primeiro!");
        window.location.href = "../login.html";
        return;
    }
    
    const elementoNome = document.getElementById('nomeUsuario');
    if (elementoNome) elementoNome.textContent = usuario.nome;

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const indicadores = document.querySelectorAll('.indicador');
    const saibaMaisBtns = document.querySelectorAll('.saiba-mais-btn');
    const carrossel = document.querySelector('.carrossel');
    const slides = document.querySelectorAll('.slide');
    const viewStatementBtn = document.getElementById('viewStatement');
    
    let currentIndex = 0;
    let intervalId;
    const slideInterval = 8000; 
    
    function moveToSlide(index) {
        if (index < 0) {
            index = slides.length - 1;
        } else if (index >= slides.length) {
            index = 0;
        }
        
        carrossel.style.transform = `translateX(-${index * 100}%)`;
        currentIndex = index;
        updateIndicators();
        resetInterval();
    }
    
    function updateIndicators() {
        indicadores.forEach((indicador, index) => {
            indicador.classList.toggle('ativo', index === currentIndex);
        });
    }
    
    function nextSlide() {
        moveToSlide(currentIndex + 1);
    }
    
    function prevSlide() {
        moveToSlide(currentIndex - 1);
    }
    
    function startInterval() {
        intervalId = setInterval(nextSlide, slideInterval);
    }
    
    function resetInterval() {
        clearInterval(intervalId);
        startInterval();
    }
    

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
    
    indicadores.forEach((indicador, index) => {
        indicador.addEventListener('click', () => moveToSlide(index));
    });
    
    saibaMaisBtns.forEach(btn => {
        btn.addEventListener('click', (e) => e.stopPropagation());
    });

    startInterval();
    carrossel.addEventListener('mouseenter', () => clearInterval(intervalId));
    carrossel.addEventListener('mouseleave', startInterval);

    let touchStartX = 0;
    carrossel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(intervalId);
    }, {passive: true});
    
    carrossel.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const difference = touchStartX - touchEndX;
        if (difference > 50) nextSlide();
        if (difference < -50) prevSlide();
        startInterval();
    }, {passive: true});

    viewStatementBtn.addEventListener('click', function() {
        alert('Extrato bancário será exibido na página do depósito. Estamos te redirecionando...');
        window.location.href = '../Deposito/deposito.html';

    });
});

document.getElementById('btnLogout').addEventListener('click', () => {
    
    localStorage.removeItem('usuarioNexBank');
    localStorage.removeItem('contaUsuario');

    window.location.href = '../login/login.html';
});
