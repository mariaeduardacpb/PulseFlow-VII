import { API_URL, RESET_PASSWORD_URL } from './config.js';

// Função para substituir URLs em um arquivo
async function updateFile(filePath) {
  try {
    const response = await fetch(filePath);
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
    console.error(`Erro ao atualizar arquivo ${filePath}:`, error);
  }
}

// Lista de arquivos para atualizar
const files = [
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
  'criseGastrite.js'
];

// Atualizar todos os arquivos
files.forEach(file => updateFile(`/client/public/js/${file}`)); 