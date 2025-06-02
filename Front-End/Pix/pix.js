document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const nomeUsuario = document.getElementById('nomeUsuario');
    const saldoConta = document.getElementById('saldoConta');
    const chavePix = document.getElementById('chavePix');
    const formEnviarPix = document.getElementById('formEnviarPix');
    const btnGenerateQr = document.getElementById('btnGenerateQr');
    const btnCopyPix = document.getElementById('btnCopyPix');
    const btnShowKeys = document.getElementById('btnShowKeys');
    const pixKeysPanel = document.getElementById('pixKeysPanel');
    const btnAddKey = document.getElementById('btnAddKey');
    const listaExtrato = document.getElementById('listaExtrato');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const confirmationModal = document.getElementById('confirmationModal');
    const addKeyModal = document.getElementById('addKeyModal');
    const btnLogout = document.getElementById('btnLogout');
    
    let usuario = JSON.parse(localStorage.getItem('usuarioNexBank'));
    
    if (!usuario) {
        alert("Usuário não encontrado. Por favor, faça login novamente.");
        window.location.href = '../login/login.html';
        return;
    }
    
    let currentFilter = "all";
    

    function init() {

        loadUserData();
        
        if (!usuario.extratoPix) {
            usuario.extratoPix = [];
            saveUserData();
        }
        loadExtrato();
        
        if (!usuario.chavesPix) {
            usuario.chavesPix = [
                { 
                    tipo: "email", 
                    valor: usuario.email, 
                    principal: true 
                }
            ];
            usuario.chavePixPrincipal = usuario.email;
            saveUserData();
        }
        loadPixKeys();
        
        setupEventListeners();
    }
    
    function loadUserData() {
        nomeUsuario.textContent = usuario.nome;
        saldoConta.textContent = formatCurrency(contaUsuario.saldo);
        document.getElementById('chavePixCopy').value = usuario.chavePixPrincipal;
        chavePix.textContent = usuario.chavePixPrincipal;
    }
    
    function loadExtrato() {
        const filteredExtrato = filterExtrato(usuario.extratoPix, currentFilter);
        
        if (filteredExtrato.length === 0) {
            listaExtrato.innerHTML = '<p class="sem-transacoes">Nenhuma transação PIX encontrada</p>';
            return;
        }
        
        listaExtrato.innerHTML = '';
        
        filteredExtrato.forEach(transacao => {
            const item = document.createElement('div');
            item.className = 'extrato-item';
            
            const isRecebido = transacao.tipo === "recebido";
            const valorClass = isRecebido ? 'credito' : 'debito';
            const valorPrefix = isRecebido ? '+' : '-';
            
            const infoRemetenteDestinatario = isRecebido 
                ? `De: ${transacao.remetente}`
                : `Para: ${transacao.destinatario}`;
            
            item.innerHTML = `
                <div class="extrato-info">
                    <span class="extrato-tipo">PIX ${isRecebido ? 'Recebido' : 'Enviado'}</span>
                    <span class="extrato-descricao">${transacao.descricao}</span>
                    <span class="extrato-data">${formatDate(transacao.data)} - ${infoRemetenteDestinatario}</span>
                </div>
                <span class="extrato-valor ${valorClass}">${valorPrefix}${formatCurrency(transacao.valor)}</span>
            `;
            
            listaExtrato.appendChild(item);
        });
    }
    
    function filterExtrato(extrato, filter) {
        if (filter === "all") return extrato;
        if (filter === "sent") return extrato.filter(t => t.tipo === "enviado");
        if (filter === "received") return extrato.filter(t => t.tipo === "recebido");
        return extrato;
    }
    
    function loadPixKeys() {
        const pixKeysList = document.getElementById('pixKeysList');
        pixKeysList.innerHTML = '';
        
        usuario.chavesPix.forEach(chave => {
            const li = document.createElement('li');
            
            const typeMap = {
                "cpf": "CPF",
                "email": "E-mail",
                "celular": "Celular",
                "aleatoria": "Chave Aleatória"
            };
            
            li.innerHTML = `
                <div>
                    <span class="key-type">${typeMap[chave.tipo]}</span>
                    <span class="key-value">${chave.valor}</span>
                </div>
                ${chave.principal ? '<span class="key-primary">PRINCIPAL</span>' : ''}
            `;
            
            pixKeysList.appendChild(li);
        });
    }
    
    function saveUserData() {
        localStorage.setItem('usuario', JSON.stringify(usuario));
    }
    
    function setupEventListeners() {
        // Enviar PIX
        formEnviarPix.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const tipoChave = document.getElementById('tipoChave').value;
            const chaveDestino = document.getElementById('chaveDestino').value;
            const valor = parseFloat(document.getElementById('valorPix').value);
            const descricao = document.getElementById('descricaoPix').value;
            
            // Validações
            if (valor > usuario.saldo) {
                showAlert("Saldo insuficiente para realizar a transação.");
                return;
            }
            
            if (!tipoChave || !chaveDestino || !valor) {
                showAlert("Por favor, preencha todos os campos obrigatórios.");
                return;
            }
            
            // Mostra modal de confirmação
            showConfirmationModal(tipoChave, chaveDestino, valor, descricao);
        });
        
        // Gerar QR Code
        btnGenerateQr.addEventListener('click', function() {
            const valor = document.getElementById('valorQrCode').value;
            generateQrCode(valor || null);
        });
        
        // Copiar chave PIX
        btnCopyPix.addEventListener('click', function() {
            const chaveInput = document.getElementById('chavePixCopy');
            chaveInput.select();
            document.execCommand('copy');
            
            // Feedback visual
            const originalText = btnCopyPix.innerHTML;
            btnCopyPix.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            setTimeout(() => {
                btnCopyPix.innerHTML = originalText;
            }, 2000);
        });
        
        // Mostrar/ocultar chaves PIX
        btnShowKeys.addEventListener('click', function() {
            pixKeysPanel.classList.toggle('hidden');
            btnShowKeys.innerHTML = pixKeysPanel.classList.contains('hidden') 
                ? '<i class="fas fa-key"></i>'
                : '<i class="fas fa-eye-slash"></i>';
        });
        
        // Adicionar chave PIX
        btnAddKey.addEventListener('click', function() {
            showAddKeyModal();
        });
        
        // Filtros do extrato
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                loadExtrato();
            });
        });
        
        // Modal de confirmação
        document.getElementById('btnConfirmPix').addEventListener('click', confirmPix);
        document.getElementById('btnCancelPix').addEventListener('click', closeModal);
        
        // Modal de adicionar chave
        document.getElementById('formAddKey').addEventListener('submit', function(e) {
            e.preventDefault();
            addPixKey();
        });
        
        btnLogout.addEventListener('click', function() {
            window.location.href = '../login/login.html';
        });
        
        // Fechar modais ao clicar no X
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Fechar modais ao clicar fora
        [confirmationModal, addKeyModal].forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
        });
    }
    
    function showConfirmationModal(tipoChave, chaveDestino, valor, descricao) {
        const typeMap = {
            "cpf": "CPF",
            "email": "E-mail",
            "celular": "Celular",
            "aleatoria": "Chave Aleatória"
        };
        
        document.getElementById('modalTitle').textContent = "Confirmar Transação PIX";
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="modal-details">
                <p><strong>Tipo de chave:</strong> ${typeMap[tipoChave]}</p>
                <p><strong>Chave destino:</strong> ${chaveDestino}</p>
                <p><strong>Valor:</strong> ${formatCurrency(valor)}</p>
                ${descricao ? `<p><strong>Descrição:</strong> ${descricao}</p>` : ''}
            </div>
            <p class="modal-warning"><i class="fas fa-exclamation-circle"></i> Esta operação não pode ser desfeita.</p>
        `;
        
        confirmationModal.classList.add('active');
    }
    
    function showAddKeyModal() {
        addKeyModal.classList.add('active');
    }
    
    function closeModal() {
        confirmationModal.classList.remove('active');
        addKeyModal.classList.remove('active');
    }
    
    function confirmPix() {
        const tipoChave = document.getElementById('tipoChave').value;
        const chaveDestino = document.getElementById('chaveDestino').value;
        const valor = parseFloat(document.getElementById('valorPix').value);
        const descricao = document.getElementById('descricaoPix').value;
        
        // Atualiza o saldo
        usuario.saldo -= valor;
        saldoConta.textContent = formatCurrency(usuario.saldo);
        
        // Adiciona ao extrato
        const novaTransacao = {
            id: usuario.extratoPix.length + 1,
            tipo: "enviado",
            valor: valor,
            destinatario: chaveDestino,
            descricao: descricao || "Transação PIX",
            data: new Date().toISOString()
        };
        
        usuario.extratoPix.unshift(novaTransacao);
        
        // Salva no LocalStorage
        saveUserData();
        
        // Atualiza a interface
        loadExtrato();
        
        // Feedback ao usuário
        showAlert(`PIX de ${formatCurrency(valor)} enviado com sucesso!`, 'success');
        
        // Limpa o formulário
        formEnviarPix.reset();
        
        // Fecha o modal
        closeModal();
    }
    
    function addPixKey() {
        const keyType = document.getElementById('keyType').value;
        const keyValue = document.getElementById('keyValue').value;
        
        // Validações
        if (!keyType || !keyValue) {
            showAlert("Por favor, preencha todos os campos.");
            return;
        }
        
        if (keyType === "cpf" && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(keyValue)) {
            showAlert("Por favor, insira um CPF válido no formato 123.456.789-00");
            return;
        }
        
        if (keyType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(keyValue)) {
            showAlert("Por favor, insira um e-mail válido");
            return;
        }
        
        if (keyType === "celular" && !/^\+55 \d{2} \d{5}-\d{4}$/.test(keyValue)) {
            showAlert("Por favor, insira um celular válido no formato +55 11 98765-4321");
            return;
        }
        
        // Verifica se a chave já existe
        if (usuario.chavesPix.some(chave => chave.valor === keyValue)) {
            showAlert("Esta chave PIX já está cadastrada.");
            return;
        }
        
        // Adiciona a nova chave
        usuario.chavesPix.push({
            tipo: keyType,
            valor: keyValue,
            principal: false
        });
        
        // Salva no LocalStorage
        saveUserData();
        
        // Atualiza a lista
        loadPixKeys();
        
        // Feedback ao usuário
        showAlert("Chave PIX adicionada com sucesso!", 'success');
        
        // Limpa e fecha o modal
        document.getElementById('formAddKey').reset();
        closeModal();
    }
    
    function generateQrCode(valor) {
        const qrCodePlaceholder = document.getElementById('qrCodePlaceholder');
        const qrCodeCanvas = document.getElementById('qrCodeCanvas');
        
        // Dados para o QR Code (formato PIX)
        const qrData = `pix:${usuario.chavePixPrincipal}${valor ? `?amount=${valor}` : ''}`;
        
        // Gera o QR Code
        QRCode.toCanvas(qrCodeCanvas, qrData, { width: 200 }, (error) => {
            if (error) {
                console.error(error);
                showAlert("Erro ao gerar QR Code. Tente novamente.");
                return;
            }
            
            // Mostra o QR Code gerado
            qrCodePlaceholder.classList.add('hidden');
            qrCodeCanvas.classList.remove('hidden');
        });
    }
    
    function showAlert(message, type = 'error') {
        // Remove alertas existentes
        const existingAlert = document.querySelector('.alert-message');
        if (existingAlert) existingAlert.remove();
        
        // Cria o elemento do alerta
        const alert = document.createElement('div');
        alert.className = `alert-message ${type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Adiciona ao corpo do documento
        document.body.appendChild(alert);
        
        // Mostra o alerta
        setTimeout(() => {
            alert.classList.add('show');
        }, 10);
        
        // Remove após alguns segundos
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    }
    
    // Funções utilitárias
    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(value);
    }
    
    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Inicializa a aplicação
    init();
    
    // Adiciona estilo dinâmico para o alerta
    const style = document.createElement('style');
    style.textContent = `
        .alert-message {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .alert-message.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .alert-message.error {
            border-left: 4px solid var(--vermelho);
        }
        
        .alert-message.success {
            border-left: 4px solid var(--verde-nexbank);
        }
        
        .alert-message i {
            font-size: 1.2rem;
        }
        
        .alert-message.error i {
            color: var(--vermelho);
        }
        
        .alert-message.success i {
            color: var(--verde-nexbank);
        }
    `;
    document.head.appendChild(style);
});