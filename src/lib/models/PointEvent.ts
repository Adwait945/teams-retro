import mongoose, { Schema, Document } from 'mongoose'

export interface IPointEvent extends Document {
  userId: string
  podId: string
  action: string
  points: number
  referenceId?: string
  createdAt: Date
}

const PointEventSchema = new Schema<IPointEvent>(
  {
    userId:      { type: String, required: true },
    podId:       { type: String, required: true },
    action:      { type: String, required: true },
    points:      { type: Number, required: true },
    referenceId: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true, versionKey: false, transform: (_, ret) => { const { _id, ...rest } = ret; return rest } },
  }
)

PointEventSchema.index({ podId: 1, createdAt: -1 })
PointEventSchema.index({ userId: 1, podId: 1, createdAt: -1 })

export default mongoose.models.PointEvent || mongoose.model<IPointEvent>('PointEvent', PointEventSchema)
