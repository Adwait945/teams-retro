import mongoose from 'mongoose'

declare global {
  var mongoose: { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null }
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null }
}

export async function connectDB(): Promise<typeof import('mongoose')> {
  if (global.mongoose.conn) {
    return global.mongoose.conn
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(process.env.MONGODB_URI!)
  }

  global.mongoose.conn = await global.mongoose.promise
  return global.mongoose.conn
}
