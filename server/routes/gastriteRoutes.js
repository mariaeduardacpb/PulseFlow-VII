import express from 'express';
import { getCrises, getCrise, createCrise, updateCrise, deleteCrise } from '../controllers/criseGastriteController.js';
import { auth } from '../middleware/authMiddleware.js';
import { CriseGastrite } from '../models/criseGastriteModel.js';

const router = express.Router();

// Aplica o middleware de autenticação em todas as rotas
router.use(auth);

// Rotas para crises de gastrite
router.get('/crises/:cpf', getCrises);
router.get('/crises/detalhes/:id', getCrise);
router.post('/crises', createCrise);
router.put('/crises/:id', updateCrise);
router.delete('/crises/:id', deleteCrise);

// Rota para obter detalhes de uma crise específica
router.get('/crises/:cpf/:id', async (req, res) => {
    try {
        const { cpf, id } = req.params;

        const crise = await CriseGastrite.findOne({
            cpfPaciente: cpf,
            _id: id
        });

        if (!crise) {
            return res.status(404).json({ message: 'Crise não encontrada' });
        }

        res.json(crise);
    } catch (error) {
        console.error('Erro ao buscar detalhes da crise:', error);
        res.status(500).json({ message: 'Erro ao buscar detalhes da crise' });
    }
});

export default router; 