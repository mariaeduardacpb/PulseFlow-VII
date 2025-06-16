const fs = require('fs');
const path = require('path');

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
function updateJsFile(fileName) {
  const filePath = path.join(__dirname, 'client', 'public', 'js', fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Substituir URLs hardcoded
  content = content.replace(/http:\/\/localhost:65432/g, '${API_URL}');
  content = content.replace(/http:\/\/localhost:65432\/client\/views\/reset-password-form\.html/g, '${RESET_PASSWORD_URL}');
  
  // Adicionar import do config.js se não existir
  if (!content.includes('import { API_URL')) {
    content = `import { API_URL, RESET_PASSWORD_URL } from './config.js';\n\n${content}`;
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Atualizado: ${fileName}`);
}

// Função para atualizar um arquivo HTML
function updateHtmlFile(fileName) {
  const filePath = path.join(__dirname, 'client', 'views', fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Atualizar scripts para usar type="module"
  content = content.replace(
    /<script src="\.\.\/public\/js\/([^"]+)"><\/script>/g,
    '<script type="module" src="/client/public/js/$1"></script>'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Atualizado: ${fileName}`);
}

// Atualizar todos os arquivos
console.log('🚀 Iniciando atualização dos arquivos...\n');

jsFiles.forEach(file => {
  try {
    updateJsFile(file);
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${file}:`, error.message);
  }
});

htmlFiles.forEach(file => {
  try {
    updateHtmlFile(file);
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${file}:`, error.message);
  }
});

console.log('\n✨ Atualização concluída!'); 