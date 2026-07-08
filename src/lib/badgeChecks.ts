import PointEventModel from '@/lib/models/PointEvent'
import FeedbackItemModel from '@/lib/models/FeedbackItem'
import ActionItemModel from '@/lib/models/ActionItem'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function thirtyDaysAgo(): Date {
  return new Date(Date.now() - THIRTY_DAYS_MS)
}

export async function checkFeedbackMachine(userId: string): Promise<boolean> {
  const count = await PointEventModel.countDocuments({
    userId,
    action: 'submit_feedback',
    createdAt: { $gte: thirtyDaysAgo() },
  })
  return count >= 10
}

export async function checkActionTaker(userId: string): Promise<boolean> {
  const count = await PointEventModel.countDocuments({
    userId,
    action: 'complete_action',
    createdAt: { $gte: thirtyDaysAgo() },
  })
  return count >= 3
}

export async function checkInnovator(userId: string): Promise<boolean> {
  const result = await FeedbackItemModel.aggregate([
    { $match: { authorId: userId, category: 'should-try' } },
    { $group: { _id: null, total: { $sum: '$upvotes' } } },
  ])
  const total = result?.[0]?.total ?? 0
  return total >= 20
}

export async function checkProblemSolver(userId: string): Promise<boolean> {
  const items = await ActionItemModel.find({
    ownerId: userId,
    status: { $in: ['completed', 'verified'] },
  })

  for (const item of items) {
    if (!item.sourceFeedbackId) continue
    const feedback = await FeedbackItemModel.findById(item.sourceFeedbackId)
    if (feedback?.category === 'slowed-us-down') {
      return true
    }
  }
  return false
}

export async function checkConsensusBuilder(userId: string): Promise<boolean> {
  const found = await FeedbackItemModel.exists({
    authorId: userId,
    upvotes: { $gte: 10 },
  })
  return Boolean(found)
}
