import { Shell } from "@/components/layout/Shell";
import { MessageSquare, ThumbsUp, CheckSquare, Activity, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const hasData = false;

  return (
    <Shell>
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {hasData ? (
          <>
            {/* Top Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard 
                title="Feedback Count" 
                value="42" 
                icon={<MessageSquare className="w-4 h-4 text-blue-500" />} 
              />
              <StatCard 
                title="Total Upvotes" 
                value="156" 
                icon={<ThumbsUp className="w-4 h-4 text-emerald-500" />} 
              />
              <StatCard 
                title="Action Items" 
                value="12" 
                icon={<CheckSquare className="w-4 h-4 text-amber-500" />} 
              />
              <StatCard 
                title="Completion Rate" 
                value="85%" 
                icon={<Activity className="w-4 h-4 text-indigo-500" />} 
              />
            </div>

            {/* Sprint MVP Banner */}
            <div className="retro-card bg-gradient-to-r from-amber-500/10 via-background to-background p-6 border-amber-500/20">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Trophy className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <div className="text-amber-500 font-semibold text-sm tracking-wider uppercase mb-1">Current Sprint MVP</div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    Alex Chen
                    <span className="flex items-center gap-1 text-sm font-medium bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full border border-amber-500/20">
                      <Zap className="w-3 h-3 fill-amber-500" />
                      3,450 pts
                    </span>
                  </h2>
                </div>
                <div className="ml-auto flex -space-x-2">
                  <Badge title="Feedback Machine" icon="🗣️" />
                  <Badge title="Problem Solver" icon="🔧" />
                  <Badge title="Team Player" icon="🤝" />
                </div>
              </div>
            </div>

            {/* Two Columns */}
            <div className="grid grid-cols-2 gap-8">
              
              {/* Recent Feedback */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Recent Feedback
                </h3>
                <div className="space-y-3">
                  <FeedbackPreview 
                    text="The new CI/CD pipeline is blazing fast. Saved me so much time today."
                    author="Sarah J."
                    type="positive"
                    time="2h ago"
                  />
                  <FeedbackPreview 
                    text="Struggling with the updated staging environment credentials."
                    author="Mike T."
                    type="negative"
                    time="4h ago"
                  />
                  <FeedbackPreview 
                    text="Maybe we could try pair programming for the complex migration tasks?"
                    author="Elena R."
                    type="idea"
                    time="5h ago"
                  />
                </div>
              </div>

              {/* Activity Feed */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Activity Feed
                </h3>
                <div className="retro-card p-4">
                  <div className="space-y-5">
                    <ActivityItem 
                      user="David K." 
                      action="converted a feedback to Action Item" 
                      time="10m ago" 
                    />
                    <ActivityItem 
                      user="Jane D." 
                      action="received 5 upvotes on their idea" 
                      time="1h ago" 
                    />
                    <ActivityItem 
                      user="Alex C." 
                      action="marked an Action Item as Verified" 
                      time="2h ago" 
                    />
                    <ActivityItem 
                      user="Sam L." 
                      action="submitted 3 constructive feedbacks" 
                      time="3h ago" 
                    />
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          <>
            {/* Top Stats Row - Empty State */}
            <div className="retro-card p-12 text-center bg-secondary/10 border-dashed border-2 border-border/50 flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold mb-2">No sprint data yet.</h2>
              <p className="text-muted-foreground mb-6">Set up your first sprint to get started.</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Set Up Sprint &rarr;
              </Button>
            </div>

            {/* Empty Activity State */}
            <div className="retro-card p-12 text-center text-muted-foreground border-border/50 bg-secondary/5">
              Activity will appear here once your team starts submitting feedback.
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="retro-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className="p-2 bg-secondary/50 rounded-md">{icon}</div>
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function Badge({ title, icon }: { title: string, icon: string }) {
  return (
    <div 
      className="w-10 h-10 rounded-full bg-slate-800 border-2 border-background flex items-center justify-center text-lg shadow-sm"
      title={title}
    >
      {icon}
    </div>
  );
}

function FeedbackPreview({
  text,
  author,
  type,
  time,
}: {
  text: string;
  author: string;
  type: "positive" | "negative" | "idea";
  time: string;
}) {
  const typeStyles = {
    positive: "border-left-emerald",
    negative: "border-left-red",
    idea: "border-left-blue",
  };

  return (
    <div className={`retro-card p-4 ${typeStyles[type]}`}>
      <p className="text-sm mb-3 line-clamp-2">{text}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px]">
            {author[0]}
          </div>
          {author}
        </div>
        <div>{time}</div>
      </div>
    </div>
  );
}

function ActivityItem({
  user,
  action,
  time,
}: {
  user: string;
  action: string;
  time: string;
}) {
  return (
    <div className="flex gap-4 items-start relative before:absolute before:left-[15px] before:top-8 before:bottom-[-20px] before:w-px before:bg-border last:before:hidden">
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium shrink-0 z-10 border-2 border-background">
        {user[0]}
      </div>
      <div className="flex-1 pt-1.5 pb-2">
        <p className="text-sm">
          <span className="font-medium text-foreground">{user}</span>{" "}
          <span className="text-muted-foreground">{action}</span>
        </p>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    </div>
  );
}
