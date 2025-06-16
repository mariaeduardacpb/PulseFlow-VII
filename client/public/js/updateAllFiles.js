import { API_URL, RESET_PASSWORD_URL } from './config.js';

// Lista de todos os arquivos JavaScript que precisam ser atualizados
const jsFiles = [
  'insonia.js',
  'criseGastriteNova.js',
  'enxaqueca.js',
  'reset-password-form.js',
  'verify-2fa.js',
  'selecao.js',
  'hormonal.js',
  'pressaoArterial.js',
  'visualizacaoCriseGastrite.js',
  'historicoAnotacao.js',
  'menstruacao.js',
  'vizualizarAnotacao.js',
  'reset-password.js',
  'perfilPaciente.js',
  'register.js',
  'historicoCriseGastrite.js',
  'vizualizacaoEventoClinico.js',
  'diabetes.js',
  'criarAnotacao.js',
  'RegistroDoEventoClinico.js',
  'historicoEventoClinico.js',
  'anexoExame.js',
  'criseGastrite.js',
  'login.js'
];

// Lista de todos os arquivos HTML que precisam ser atualizados
const htmlFiles = [
  'login.html',
  'register.html',
  'verify-2fa.html',
  'reset-password.html',
  'reset-password-form.html',
  'homePage.html',
  'selecao.html',
  'perfilMedico.html',
  'perfilPaciente.html',
  'enxaqueca.html',
  'insonia.html',
  'pressaoArterial.html',
  'hormonal.html',
  'diabetes.html',
  'criseGastrite.html',
  'criarAnotacao.html',
  'historicoAnotacao.html',
  'vizualizarAnotacao.html',
  'anexoExame.html',
  'RegistroDoEventoClinico.html',
  'historicoEventoClinico.html',
  'vizualizacaoEventoClinico.html',
  'criseGastriteNova.html',
  'visualizacaoCriseGastrite.html',
  'historicoCriseGastrite.html',
  'menstruacao.html',
  'cicloMenstrual.html'
];

// Função para atualizar um arquivo JavaScript
async function updateJsFile(fileName) {
  try {
    const response = await fetch(`/client/public/js/${fileName}`);
    let content = await response.text();
    
    // Substituir URLs hardcoded
    content = content.replace(/http:\/\/localhost:65432/g, API_URL);
    content = content.replace(/http:\/\/localhost:65432\/client\/views\/reset-password-form\.html/g, RESET_PASSWORD_URL);
    
    // Adicionar import do config.js se não existir
    if (!content.includes('import { API_URL')) {
      content = `import { API_URL, RESET_PASSWORD_URL } from './config.js';\n\n${content}`;
    }
    
    // Atualizar o arquivo
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    const script = document.createElement('script');
    script.type = 'module';
    script.src = url;
    document.head.appendChild(script);
  } catch (error) {
    console.error(`Erro ao atualizar arquivo ${fileName}:`, error);
  }
}

// Função para atualizar um arquivo HTML
async function updateHtmlFile(fileName) {
  try {
    const response = await fetch(`/client/views/${fileName}`);
    let content = await response.text();
    
    // Atualizar scripts para usar type="module"
    content = content.replace(
      /<script src="\.\.\/public\/js\/([^"]+)"><\/script>/g,
      '<script type="module" src="/client/public/js/$1"></script>'
    );
    
    // Atualizar o arquivo
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  } catch (error) {
    console.error(`Erro ao atualizar arquivo ${fileName}:`, error);
  }
}

// Atualizar todos os arquivos
jsFiles.forEach(file => updateJsFile(file));
htmlFiles.forEach(file => updateHtmlFile(file)); 