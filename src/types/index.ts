export type FeedbackCategory = "slowed-us-down" | "should-try" | "went-well"

export interface User {
  id: string
  name: string
  avatar: string
  totalPoints: number
  badges: Badge[]
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt?: string
  threshold: number
}

export interface FeedbackItem {
  id: string
  category: FeedbackCategory
  content: string
  suggestedImprovement: string
  authorId: string
  isAnonymous: boolean
  sprintId: string
  upvotes: string[] // user IDs who upvoted
  createdAt: string
  actionItemId?: string
}

export interface ActionItem {
  id: string
  title: string
  description: string
  ownerId: string
  feedbackId: string
  sprintId: string
  status: "open" | "in-progress" | "completed" | "verified"
  deadline: string
  createdAt: string
  completedAt?: string
  impactDescription?: string
}

export interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export interface PointEvent {
  id: string
  userId: string
  action: PointAction
  points: number
  description: string
  timestamp: string
  sprintId: string
}

export type PointAction =
  | "submit-feedback"
  | "feedback-upvoted"
  | "create-action-item"
  | "complete-action-item"
  | "verify-improvement"

export const POINT_VALUES: Record<PointAction, number> = {
  "submit-feedback": 5,
  "feedback-upvoted": 10,
  "create-action-item": 20,
  "complete-action-item": 30,
  "verify-improvement": 50,
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

export const BADGES: Badge[] = [
  {
    id: "first-feedback",
    name: "First Voice",
    description: "Submit your first feedback item",
    icon: "MessageSquare",
    threshold: 5,
  },
  {
    id: "process-improver",
    name: "Process Improver",
    description: "Earn 200 points",
    icon: "Wrench",
    threshold: 200,
  },
  {
    id: "action-hero",
    name: "Action Hero",
    description: "Complete 5 action items",
    icon: "Zap",
    threshold: 150,
  },
  {
    id: "team-catalyst",
    name: "Team Catalyst",
    description: "Earn 500 points",
    icon: "Flame",
    threshold: 500,
  },
  {
    id: "retro-legend",
    name: "Retro Legend",
    description: "Earn 1000 points",
    icon: "Trophy",
    threshold: 1000,
  },
]
