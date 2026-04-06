import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/prisma';
import { sendPushNotification } from '../services/notificationService';

// GET /api/rewards (Parents see their created rewards; Children see rewards from their parent)
export const getRewards = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    let parentId = req.user?.id;

    if (role === 'child') {
      const child = await prisma.child.findUnique({ where: { id: req.user?.id } });
      if (!child) {
        res.status(404).json({ error: 'Child not found' });
        return;
      }
      parentId = child.parent_id;
    }

    if (!parentId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const rewards = await prisma.reward.findMany({
      where: { parent_id: parentId },
      include: {
        redemptions: role === 'parent' ? {
          include: { child: { select: { name: true } } },
          orderBy: { created_at: 'desc' }
        } : false
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(rewards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/rewards (Parent only)
export const createReward = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'parent') {
      res.status(403).json({ error: 'Only parents can create rewards' });
      return;
    }

    const parentId = req.user.id;
    const { name, description, cost_in_xp, max_redeems } = req.body;

    if (!name || cost_in_xp === undefined) {
      res.status(400).json({ error: 'Missing name or cost_in_xp' });
      return;
    }

    const reward = await prisma.reward.create({
      data: {
        parent_id: parentId,
        name,
        description,
        cost_in_xp: Number(cost_in_xp),
        max_redeems: max_redeems ? Number(max_redeems) : null,
      }
    });

    res.status(201).json(reward);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /api/rewards/:id (Parent only)
export const deleteReward = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'parent') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const rewardId = req.params.id as string;

    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || reward.parent_id !== req.user.id) {
      res.status(404).json({ error: 'Reward not found or unauthorized' });
      return;
    }

    // Use transaction to delete associated redemptions first
    await prisma.$transaction([
      prisma.rewardRedemption.deleteMany({
        where: { reward_id: rewardId }
      }),
      prisma.reward.delete({
        where: { id: rewardId }
      })
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/rewards/:id/redeem (Child only)
export const redeemReward = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'child') {
      res.status(403).json({ error: 'Only children can redeem rewards' });
      return;
    }

    const childId = req.user.id;
    const rewardId = req.params.id as string;

    const child = await prisma.child.findUnique({ where: { id: childId } });
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });

    if (!child || !reward || reward.parent_id !== child.parent_id) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    // Checking max_redeems limit
    if (reward.max_redeems !== null) {
      const pastRedemptions = await prisma.rewardRedemption.count({
        where: { reward_id: reward.id, child_id: childId }
      });
      if (pastRedemptions >= reward.max_redeems) {
        res.status(400).json({ error: 'Limit reached for this reward' });
        return;
      }
    }

    // Creating redemption
    const redemption = await prisma.rewardRedemption.create({
      data: {
        reward_id: reward.id,
        child_id: child.id,
        cost: reward.cost_in_xp,
      }
    });

    // Notify Parent
    const parent = await prisma.parent.findUnique({
      where: { id: reward.parent_id },
      select: { expo_push_token: true }
    });
    if (parent?.expo_push_token) {
      await sendPushNotification(
        parent.expo_push_token,
        'Prêmio Resgatado! 🎁',
        `${child.name} deseja resgatar o prêmio: ${reward.name}. Aprove!`
      );
    }

    res.status(201).json(redemption);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PATCH /api/rewards/redemptions/:id/status (Parent only)
export const updateRedemptionStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'parent') {
      res.status(403).json({ error: 'Only parents can approve redemptions' });
      return;
    }

    const redemptionId = req.params.id as string;
    const { status } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id: redemptionId },
      include: { reward: true, child: true }
    });

    if (!redemption || redemption.reward.parent_id !== req.user.id) {
      res.status(404).json({ error: 'Redemption not found' });
      return;
    }

    const updated = await prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: { status }
    });

    // Notify Child
    if (redemption.child?.expo_push_token) {
      const title = status === 'approved' ? 'Prêmio Liberado! 🎉' : 'Resgate Cancelado ❌';
      const body = status === 'approved'
        ? `Seu prêmio "${redemption.reward.name}" foi aprovado!`
        : `O resgate de "${redemption.reward.name}" foi negado.`;
      await sendPushNotification(redemption.child.expo_push_token, title, body);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/rewards/my-redemptions (Child only)
export const getMyRedemptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'child') {
      res.status(403).json({ error: 'Only children can see their own redemptions' });
      return;
    }
    const redemptions = await prisma.rewardRedemption.findMany({
      where: { child_id: req.user.id },
      include: { reward: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(redemptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
