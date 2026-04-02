import express from 'express';
import { getRewards, createReward, deleteReward, redeemReward, updateRedemptionStatus, getMyRedemptions } from '../controllers/RewardController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getRewards);
router.post('/', createReward);
router.delete('/:id', deleteReward);

router.get('/my-redemptions', getMyRedemptions);
router.post('/:id/redeem', redeemReward);
router.patch('/redemptions/:id/status', updateRedemptionStatus);

export default router;
