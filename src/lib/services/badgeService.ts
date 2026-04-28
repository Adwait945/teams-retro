import BadgeModel from '@/lib/models/Badge'
import PointEventModel from '@/lib/models/PointEvent'
import FeedbackItemModel from '@/lib/models/FeedbackItem'
import ActionItemModel from '@/lib/models/ActionItem'

async function awardIfNotEarned(userId: string, podId: string, type: string) {
  const exists = await BadgeModel.findOne({ userId, podId, type })
  if (!exists) {
    await BadgeModel.create({ userId, podId, type, earnedAt: new Date() })
  }
}

async function evaluatePodChampion(podId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const totals = await PointEventModel.aggregate([
    { $match: { podId, createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: '$userId', total: { $sum: '$points' }, earliest: { $min: '$createdAt' } } },
    { $sort: { total: -1, earliest: 1 } },
  ])
  if (totals.length === 0) return
  const newChampionId = String(totals[0]._id)
  const current = await BadgeModel.findOne({ podId, type: 'pod_champion' })
  if (current && String(current.userId) === newChampionId) return
  if (current) await BadgeModel.deleteOne({ _id: current._id })
  await BadgeModel.create({ userId: newChampionId, podId, type: 'pod_champion', earnedAt: new Date() })
}

async function checkFeedbackMachine(userId: string, podId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const count = await FeedbackItemModel.countDocuments({
    authorId: userId,
    createdAt: { $gte: thirtyDaysAgo },
  })
  if (count >= 10) {
    await awardIfNotEarned(userId, podId, 'feedback_machine')
  }
}

async function checkActionTaker(userId: string, podId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const count = await ActionItemModel.countDocuments({
    ownerId: userId,
    completedAt: { $gte: thirtyDaysAgo },
  })
  if (count >= 3) {
    await awardIfNotEarned(userId, podId, 'action_taker')
  }
}

async function checkInnovator(userId: string, podId: string) {
  const shouldTryItems = await FeedbackItemModel.find({
    authorId: userId,
    category: 'should-try',
  }).lean()
  const totalUpvotes = shouldTryItems.reduce(
    (sum: number, item: Record<string, unknown>) => sum + ((item.upvotes as number) || 0),
    0
  )
  if (totalUpvotes >= 20) {
    await awardIfNotEarned(userId, podId, 'innovator')
  }
}

async function checkProblemSolver(userId: string, podId: string) {
  const completedActions = await ActionItemModel.find({
    ownerId: userId,
    status: 'completed',
    sourceFeedbackId: { $exists: true, $nin: [null, ''] },
  }).lean()

  for (const action of completedActions) {
    const feedbackId = (action as Record<string, unknown>).sourceFeedbackId as string
    if (!feedbackId) continue
    const feedback = await FeedbackItemModel.findById(feedbackId).lean()
    if (feedback && (feedback as Record<string, unknown>).category === 'slowed-us-down') {
      await awardIfNotEarned(userId, podId, 'problem_solver')
      return
    }
  }
}

async function checkConsensusBuilder(userId: string, podId: string) {
  const highUpvoteItem = await FeedbackItemModel.findOne({
    authorId: userId,
    upvotes: { $gte: 10 },
  }).lean()
  if (highUpvoteItem) {
    await awardIfNotEarned(userId, podId, 'consensus_builder')
  }
}

export async function evaluateBadges(userId: string, podId: string, action: string): Promise<void> {
  try {
    if (action === 'submit_feedback') {
      await checkFeedbackMachine(userId, podId)
    }

    if (action === 'receive_upvote') {
      await checkInnovator(userId, podId)
      await checkConsensusBuilder(userId, podId)
    }

    if (action === 'complete_action') {
      await checkActionTaker(userId, podId)
      await checkProblemSolver(userId, podId)
    }

    await evaluatePodChampion(podId)
  } catch (err) {
    console.error('[BadgeService] evaluateBadges failed:', err)
  }
}
