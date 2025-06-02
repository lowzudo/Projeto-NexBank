export function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '') return false;
    return cpf.length === 11;
}

export function validarSenha(senha) {
    if (senha.length < 8) return { valido: false, mensagem: 'A senha deve ter pelo menos 8 caracteres' };
    if (!/[A-Z]/.test(senha)) return { valido: false, mensagem: 'A senha deve conter pelo menos uma letra maiúscula' };
    if (!/[a-z]/.test(senha)) return { valido: false, mensagem: 'A senha deve conter pelo menos uma letra minúscula' };
    if (!/[0-9]/.test(senha)) return { valido: false, mensagem: 'A senha deve conter pelo menos um número' };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) return { valido: false, mensagem: 'A senha deve conter pelo menos um caractere especial' };
    if (/\s/.test(senha)) return { valido: false, mensagem: 'A senha não pode conter espaços' };
    return { valido: true, mensagem: 'Senha válida' };
}
