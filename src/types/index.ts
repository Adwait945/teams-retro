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

export interface PointEvent {
  _id: string
  userId: string
  podId: string
  action: PointAction
  points: number
  relatedId?: string
  createdAt: string
}

export type BadgeType =
  | "feedback_machine"
  | "action_taker"
  | "innovator"
  | "problem_solver"
  | "consensus_builder"
  | "pod_champion"

export interface Badge {
  _id: string
  userId: string
  podId: string
  type: BadgeType
  earnedAt: string
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

export const BADGE_DEFINITIONS: Record<
  BadgeType,
  { name: string; icon: string; description: string; kind: "permanent" | "living" }
> = {
  feedback_machine: {
    name: "Feedback Machine",
    icon: "MessageSquare",
    description: "Submit 10 or more feedback items within a trailing 30-day window",
    kind: "permanent",
  },
  action_taker: {
    name: "Action Taker",
    icon: "Zap",
    description: "Complete 3 or more action items within a trailing 30-day window",
    kind: "permanent",
  },
  innovator: {
    name: "Innovator",
    icon: "Lightbulb",
    description: "Earn 20 or more total upvotes across your \"should try\" feedback items",
    kind: "permanent",
  },
  problem_solver: {
    name: "Problem Solver",
    icon: "Wrench",
    description: "Complete or verify an action item sourced from a \"slowed us down\" item",
    kind: "permanent",
  },
  consensus_builder: {
    name: "Consensus Builder",
    icon: "Users",
    description: "Author a feedback item that receives 10 or more upvotes",
    kind: "permanent",
  },
  pod_champion: {
    name: "Pod Champion",
    icon: "Crown",
    description: "Currently ranked #1 in your pod for the trailing 30-day window",
    kind: "living",
  },
}
