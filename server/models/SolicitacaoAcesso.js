import mongoose from 'mongoose';

const solicitacaoAcessoSchema = new mongoose.Schema({
  pacienteId: { type: String, required: true },
  pacienteCpf: { type: String, required: true },
  medicoNome: { type: String, required: true },
  medicoEspecialidade: { type: String },
  dataHora: { type: Date, default: Date.now },
  visualizada: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
});

// Índice para auto-deletar documentos expirados
solicitacaoAcessoSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SolicitacaoAcesso = mongoose.model('SolicitacaoAcesso', solicitacaoAcessoSchema);
export default SolicitacaoAcesso;

