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
    const href = this.getAttribute("href");
    
    if (href && href.startsWith("#")) {
      event.preventDefault();
      const targetId = href.substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
        
        const mobileMenu = document.getElementById('mainNav');
        const mobileToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
          if (mobileToggle) mobileToggle.classList.remove('active');
        }
      }
    }
  });
});

// Menu hambúrguer para mobile
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mainNav = document.getElementById('mainNav');

if (mobileMenuToggle && mainNav) {
  mobileMenuToggle.addEventListener('click', function() {
    this.classList.toggle('active');
    mainNav.classList.toggle('active');
  });

  // Fechar menu ao clicar fora dele
  document.addEventListener('click', function(event) {
    const isClickInsideNav = mainNav.contains(event.target);
    const isClickOnToggle = mobileMenuToggle.contains(event.target);
    
    if (!isClickInsideNav && !isClickOnToggle && mainNav.classList.contains('active')) {
      mainNav.classList.remove('active');
      mobileMenuToggle.classList.remove('active');
    }
  });
}

// Efeito de scroll no header
const header = document.querySelector('.main-header');
let lastScroll = 0;

window.addEventListener('scroll', function() {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
  
  lastScroll = currentScroll;
});

// Animação de entrada para elementos quando visíveis (Intersection Observer)
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observar elementos que devem animar ao entrar na viewport
document.addEventListener('DOMContentLoaded', function() {
  const animatedElements = document.querySelectorAll('.feature-item, .how-it-works-item, .card, .oncology-section, .feature-card, .benefit-item');
  
  animatedElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(el);
  });

  const legalDropdown = document.getElementById('legalDropdown');
  if (legalDropdown) {
    const dropdownToggle = legalDropdown.querySelector('.nav-dropdown-toggle');
    
    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', function(event) {
        event.preventDefault();
        legalDropdown.classList.toggle('active');
      });
    }

    document.addEventListener('click', function(event) {
      if (!legalDropdown.contains(event.target)) {
        legalDropdown.classList.remove('active');
      }
    });

    const dropdownLinks = legalDropdown.querySelectorAll('.nav-dropdown-link');
    dropdownLinks.forEach(link => {
      link.addEventListener('click', function() {
        legalDropdown.classList.remove('active');
        const mobileMenu = document.getElementById('mainNav');
        const mobileToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
          if (mobileToggle) mobileToggle.classList.remove('active');
        }
      });
    });
  }
});
