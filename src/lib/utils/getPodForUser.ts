import UserModel from '@/lib/models/User'

export async function getPodForUser(userId: string): Promise<string> {
  const user = await UserModel.findById(userId).lean()
  return (user as { pod?: string } | null)?.pod ?? ''
}
