"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  User,
  Sprint,
  FeedbackItem,
  ActionItem,
  PointEvent,
  FeedbackCategory,
  POINT_VALUES,
} from "@/types"
import {
  MOCK_USERS,
  MOCK_SPRINTS,
  MOCK_FEEDBACK,
  MOCK_ACTION_ITEMS,
  MOCK_POINT_EVENTS,
  CURRENT_USER_ID,
} from "@/data/mock-data"

interface RetroStore {
  users: User[]
  sprints: Sprint[]
  feedback: FeedbackItem[]
  actionItems: ActionItem[]
  pointEvents: PointEvent[]
  currentUserId: string
  activeSprint: Sprint
  selectedSprintId: string
  setSelectedSprintId: (id: string) => void
  currentUser: User
  submitFeedback: (
    category: FeedbackCategory,
    content: string,
    suggestedImprovement: string,
    isAnonymous: boolean
  ) => void
  upvoteFeedback: (feedbackId: string) => void
  createActionItem: (
    feedbackId: string,
    title: string,
    description: string,
    ownerId: string,
    deadline: string
  ) => void
  updateActionItemStatus: (
    actionItemId: string,
    status: ActionItem["status"],
    impactDescription?: string
  ) => void
  getFeedbackByCategory: (category: FeedbackCategory, sprintId?: string) => FeedbackItem[]
  getUserById: (id: string) => User | undefined
  getSprintPoints: (sprintId: string) => PointEvent[]
  getLeaderboard: (sprintId?: string) => { user: User; sprintPoints: number }[]
}

const RetroContext = createContext<RetroStore | null>(null)

export function RetroProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [sprints] = useState<Sprint[]>(MOCK_SPRINTS)
  const [feedback, setFeedback] = useState<FeedbackItem[]>(MOCK_FEEDBACK)
  const [actionItems, setActionItems] = useState<ActionItem[]>(MOCK_ACTION_ITEMS)
  const [pointEvents, setPointEvents] = useState<PointEvent[]>(MOCK_POINT_EVENTS)
  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    MOCK_SPRINTS.find((s) => s.isActive)?.id || MOCK_SPRINTS[MOCK_SPRINTS.length - 1].id
  )

  const activeSprint = sprints.find((s) => s.isActive) || sprints[sprints.length - 1]
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)!

  const addPoints = useCallback(
    (userId: string, action: PointEvent["action"], description: string, sprintId: string) => {
      const points = POINT_VALUES[action]
      const event: PointEvent = {
        id: uuidv4(),
        userId,
        action,
        points,
        description,
        timestamp: new Date().toISOString(),
        sprintId,
      }
      setPointEvents((prev) => [...prev, event])
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, totalPoints: u.totalPoints + points } : u))
      )
    },
    []
  )

  const submitFeedback = useCallback(
    (
      category: FeedbackCategory,
      content: string,
      suggestedImprovement: string,
      isAnonymous: boolean
    ) => {
      const item: FeedbackItem = {
        id: uuidv4(),
        category,
        content,
        suggestedImprovement,
        authorId: CURRENT_USER_ID,
        isAnonymous,
        sprintId: activeSprint.id,
        upvotes: [],
        createdAt: new Date().toISOString(),
      }
      setFeedback((prev) => [item, ...prev])
      addPoints(CURRENT_USER_ID, "submit-feedback", `Submitted feedback: ${content.slice(0, 50)}...`, activeSprint.id)
    },
    [activeSprint.id, addPoints]
  )

  const upvoteFeedback = useCallback(
    (feedbackId: string) => {
      setFeedback((prev) =>
        prev.map((f) => {
          if (f.id !== feedbackId) return f
          if (f.upvotes.includes(CURRENT_USER_ID)) return f
          const newUpvotes = [...f.upvotes, CURRENT_USER_ID]
          if (newUpvotes.length === 3 && f.upvotes.length < 3) {
            addPoints(f.authorId, "feedback-upvoted", `Feedback reached 3+ upvotes`, f.sprintId)
          }
          return { ...f, upvotes: newUpvotes }
        })
      )
    },
    [addPoints]
  )

  const createActionItem = useCallback(
    (
      feedbackId: string,
      title: string,
      description: string,
      ownerId: string,
      deadline: string
    ) => {
      const actionItem: ActionItem = {
        id: uuidv4(),
        title,
        description,
        ownerId,
        feedbackId,
        sprintId: activeSprint.id,
        status: "open",
        deadline,
        createdAt: new Date().toISOString(),
      }
      setActionItems((prev) => [actionItem, ...prev])
      setFeedback((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, actionItemId: actionItem.id } : f))
      )
      addPoints(ownerId, "create-action-item", `Created action: ${title}`, activeSprint.id)
    },
    [activeSprint.id, addPoints]
  )

  const updateActionItemStatus = useCallback(
    (actionItemId: string, status: ActionItem["status"], impactDescription?: string) => {
      setActionItems((prev) =>
        prev.map((a) => {
          if (a.id !== actionItemId) return a
          const updated = {
            ...a,
            status,
            ...(status === "completed" ? { completedAt: new Date().toISOString() } : {}),
            ...(impactDescription ? { impactDescription } : {}),
          }
          if (status === "completed" && a.status !== "completed") {
            addPoints(a.ownerId, "complete-action-item", `Completed: ${a.title}`, a.sprintId)
          }
          if (status === "verified" && a.status !== "verified") {
            addPoints(a.ownerId, "verify-improvement", `Verified improvement: ${a.title}`, a.sprintId)
          }
          return updated
        })
      )
    },
    [addPoints]
  )

  const getFeedbackByCategory = useCallback(
    (category: FeedbackCategory, sprintId?: string) => {
      const sid = sprintId || selectedSprintId
      return feedback
        .filter((f) => f.category === category && f.sprintId === sid)
        .sort((a, b) => b.upvotes.length - a.upvotes.length)
    },
    [feedback, selectedSprintId]
  )

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  )

  const getSprintPoints = useCallback(
    (sprintId: string) => pointEvents.filter((p) => p.sprintId === sprintId),
    [pointEvents]
  )

  const getLeaderboard = useCallback(
    (sprintId?: string) => {
      const sid = sprintId || selectedSprintId
      const sprintPts = pointEvents.filter((p) => p.sprintId === sid)
      const userPoints = new Map<string, number>()
      sprintPts.forEach((p) => {
        userPoints.set(p.userId, (userPoints.get(p.userId) || 0) + p.points)
      })
      return users
        .map((u) => ({ user: u, sprintPoints: userPoints.get(u.id) || 0 }))
        .sort((a, b) => b.sprintPoints - a.sprintPoints)
    },
    [users, pointEvents, selectedSprintId]
  )

  return (
    <RetroContext.Provider
      value={{
        users,
        sprints,
        feedback,
        actionItems,
        pointEvents,
        currentUserId: CURRENT_USER_ID,
        activeSprint,
        selectedSprintId,
        setSelectedSprintId,
        currentUser,
        submitFeedback,
        upvoteFeedback,
        createActionItem,
        updateActionItemStatus,
        getFeedbackByCategory,
        getUserById,
        getSprintPoints,
        getLeaderboard,
      }}
    >
      {children}
    </RetroContext.Provider>
  )
}

export function useRetro() {
  const context = useContext(RetroContext)
  if (!context) throw new Error("useRetro must be used within RetroProvider")
  return context
}
