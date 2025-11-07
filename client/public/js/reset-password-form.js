document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetPasswordForm");
    const senhaInput = document.getElementById("senha");
    const confirmarSenhaInput = document.getElementById("confirmarSenha");
    const senhaError = document.getElementById("senhaError");
    const confirmarSenhaError = document.getElementById("confirmarSenhaError");
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Toggle de visibilidade da senha
    document.querySelectorAll('.password-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
          button.setAttribute('aria-pressed', 'true');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
          button.setAttribute('aria-pressed', 'false');
        }
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Limpa mensagens anteriores
      senhaError.textContent = "";
      confirmarSenhaError.textContent = "";
      
      const senha = senhaInput.value.trim();
      const confirmarSenha = confirmarSenhaInput.value.trim();
      let hasError = false;

      // Validação da senha
      if (!senha || senha.length < 6) {
        senhaError.textContent = "A senha deve ter pelo menos 6 caracteres.";
        hasError = true;
      }

      // Validação da confirmação de senha
      if (!confirmarSenha) {
        confirmarSenhaError.textContent = "Confirme sua senha.";
        hasError = true;
      } else if (senha !== confirmarSenha) {
        confirmarSenhaError.textContent = "As senhas não coincidem.";
        hasError = true;
      }

      if (hasError) return;

      const data = { senha, token };

      try {
        const response = await fetch("http://localhost:65432/api/auth/confirm-reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          Swal.fire({
            title: 'Sucesso!',
            text: 'Senha redefinida com sucesso!',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00324A',
            background: '#FFFFFF',
            customClass: {
              title: 'swal-title-custom',
              content: 'swal-content-custom',
              confirmButton: 'swal-button-custom'
            }
          }).then(() => {
            window.location.href = "/client/views/login.html";
          });
        } else {
          Swal.fire({
            title: 'Erro',
            text: result.message || 'Erro ao redefinir a senha',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00324A',
            background: '#FFFFFF'
          });
        }
      } catch (err) {
        Swal.fire({
          title: 'Erro',
          text: 'Erro na requisição',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#00324A',
          background: '#FFFFFF'
        });
        console.error(err);
      }
    });
  });
  