import express from 'express';
import { getCrises, getCrise, createCrise, updateCrise, deleteCrise, buscarCrisesMedico } from '../controllers/criseGastriteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { CriseGastrite } from '../models/criseGastriteModel.js';
import Paciente from '../models/Paciente.js';

const router = express.Router();

// Aplica o middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas para crises de gastrite
router.get('/medico', buscarCrisesMedico);
router.get('/crises/:cpf', getCrises);
router.get('/crises/detalhes/:id', getCrise);
router.post('/crises', createCrise);
router.put('/crises/:id', updateCrise);
router.delete('/crises/:id', deleteCrise);

// Rota para obter detalhes de uma crise específica
router.get('/crises/:cpf/:id', async (req, res) => {
    try {
        const { cpf, id } = req.params;

        // Tentar buscar com CPF limpo primeiro
        let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
        
        // Se não encontrar, tentar com CPF formatado
        if (!paciente) {
            const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            paciente = await Paciente.findOne({ cpf: cpfFormatado });
        }
        
        // Se ainda não encontrar, tentar com o CPF original
        if (!paciente) {
            paciente = await Paciente.findOne({ cpf: cpf });
        }

        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        // Depois, encontrar a crise pelo ID e pelo ID do paciente
        const crise = await CriseGastrite.findOne({
            _id: id,
            paciente: paciente._id
        });

        if (!crise) {
            return res.status(404).json({ message: 'Crise não encontrada' });
        }

        res.json(crise);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar detalhes da crise' });
    }
});

export default router; 