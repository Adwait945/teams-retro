export type FeedbackCategory = "slowed-us-down" | "should-try" | "went-well"

export interface User {
  _id: string
  name: string
  username: string
  avatar: string
  pod: string
  isAdmin: boolean
  totalPoints: number
  createdAt: string
}

export interface Badge {
  _id: string
  userId: string
  podId: string
  type: BadgeType
  earnedAt: string
}

export interface FeedbackItem {
  _id: string
  category: FeedbackCategory
  content: string
  suggestion: string
  authorId: string
  isAnonymous: boolean
  upvotedBy: string[]
  upvotes: number
  createdAt: string
  actionItemIds: string[]
}

export interface ActionItem {
  _id: string
  title: string
  description: string
  ownerId: string
  sourceFeedbackId?: string
  sourceQuote?: string
  status: "open" | "in-progress" | "completed" | "verified"
  dueDate: string
  createdAt: string
  completedAt?: string
  impactNote?: string
}

export interface PointEvent {
  _id: string
  userId: string
  podId: string
  action: PointAction
  points: number
  referenceId?: string
  createdAt: string
}

export type PointAction =
  | "submit_feedback"
  | "receive_upvote"
  | "remove_upvote"
  | "convert_action"
  | "complete_action"
  | "verify_action"

export const POINT_VALUES: Record<PointAction, number> = {
  submit_feedback: 10,
  receive_upvote: 5,
  remove_upvote: -5,
  convert_action: 50,
  complete_action: 100,
  verify_action: 150,
}

export const CATEGORY_CONFIG: Record<
  FeedbackCategory,
  { label: string; prompt: string; color: string; bgColor: string; borderColor: string }
> = {
  "slowed-us-down": {
    label: "What slowed us down?",
    prompt: "Process friction, blockers, tooling issues — must include a suggested improvement",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  "should-try": {
    label: "What should we try?",
    prompt: "Experiments, new approaches, ideas for the next sprint",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  "went-well": {
    label: "What went well?",
    prompt: "Celebrate wins — what worked and should continue",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
}

export type BadgeType =
  | "feedback_machine"
  | "action_taker"
  | "innovator"
  | "problem_solver"
  | "consensus_builder"
  | "pod_champion"

export interface BadgeCatalogEntry {
  type: BadgeType
  label: string
  icon: string
  lifecycle: "permanent" | "living"
  earnCondition: string
}

export const BADGE_CATALOG: BadgeCatalogEntry[] = [
  { type: "feedback_machine",  label: "Feedback Machine",  icon: "🗣️", lifecycle: "permanent", earnCondition: "Submit 10+ feedback items in any 30-day window" },
  { type: "action_taker",      label: "Action Taker",      icon: "🏃", lifecycle: "permanent", earnCondition: "Complete 3+ action items in any 30-day window" },
  { type: "innovator",         label: "Innovator",         icon: "💡", lifecycle: "permanent", earnCondition: "Receive 20+ upvotes on Should Try feedback (all-time)" },
  { type: "problem_solver",    label: "Problem Solver",    icon: "🔧", lifecycle: "permanent", earnCondition: "Own and complete an action item from Slowed Us Down feedback" },
  { type: "consensus_builder", label: "Consensus Builder", icon: "🤝", lifecycle: "permanent", earnCondition: "Have a feedback item reach 10+ upvotes" },
  { type: "pod_champion",      label: "Pod Champion",      icon: "👑", lifecycle: "living",    earnCondition: "Currently #1 on the pod leaderboard (30-day window)" },
]
