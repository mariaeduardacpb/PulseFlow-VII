// Redireciona para a tela de login ao clicar no botão Entrar
const btn = document.getElementById('entrarBtn');
if (btn) {
  btn.addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '../views/login.html';
  });
}

// Navegação suave ao clicar nos links de navegação
const navLinks = document.querySelectorAll(".nav-link");
navLinks.forEach(link => {
  link.addEventListener("click", function(event) {
    event.preventDefault();
    const targetId = this.getAttribute("href").substring(1);
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  });
});