import { Shell } from "@/components/layout/Shell";
import { Plus, ThumbsUp, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FeedbackBoard() {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const hasData = false;

  return (
    <Shell>
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-0">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Feedback Board
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Review, vote, and convert feedback to action.
            </p>
          </div>
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4"
            onClick={() => setShowSubmitModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Submit Feedback
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
          {/* Column 1: Slowed Down */}
          <div className="flex flex-col bg-secondary/20 rounded-xl border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-secondary/40 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-red-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                What Slowed Us Down?
              </h2>
              <span className="text-xs font-medium bg-secondary px-2 py-1 rounded text-muted-foreground">
                {hasData ? 3 : 0}
              </span>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {hasData ? (
                <>
                  <FeedbackCard
                    text="The new auth service deployment caused multiple staging environment crashes on Tuesday."
                    author="Sarah J."
                    upvotes={8}
                    category="red"
                    suggestion="We need to rollback to previous auth version until the memory leak is patched."
                  />
                  <FeedbackCard
                    text="Too many context switches this sprint due to urgent ad-hoc requests."
                    author="Anonymous"
                    upvotes={5}
                    category="red"
                  />
                  <FeedbackCard
                    text="Figma designs were not finalized when development started, leading to rework."
                    author="Mike T."
                    upvotes={4}
                    category="red"
                  />
                </>
              ) : (
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center text-sm text-muted-foreground bg-secondary/10 min-h-[120px] flex items-center justify-center">
                  No blockers reported yet. Be the first to share.
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Ideas */}
          <div className="flex flex-col bg-secondary/20 rounded-xl border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-secondary/40 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-blue-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                What Should We Try?
              </h2>
              <span className="text-xs font-medium bg-secondary px-2 py-1 rounded text-muted-foreground">
                {hasData ? 2 : 0}
              </span>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {hasData ? (
                <>
                  <FeedbackCard
                    text="Adopt a 'No Meeting Thursday' policy to allow for deep work sessions."
                    author="Alex C."
                    upvotes={12}
                    category="blue"
                    highVoted
                    onConvert={() => setShowActionModal(true)}
                  />
                  <FeedbackCard
                    text="Switch from Jest to Vitest for faster unit test execution."
                    author="Elena R."
                    upvotes={3}
                    category="blue"
                  />
                </>
              ) : (
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center text-sm text-muted-foreground bg-secondary/10 min-h-[120px] flex items-center justify-center">
                  No suggestions yet. What would help the team?
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Went Well */}
          <div className="flex flex-col bg-secondary/20 rounded-xl border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-secondary/40 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-emerald-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                What Went Well?
              </h2>
              <span className="text-xs font-medium bg-secondary px-2 py-1 rounded text-muted-foreground">
                {hasData ? 2 : 0}
              </span>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {hasData ? (
                <>
                  <FeedbackCard
                    text="Pair programming on the database migration worked perfectly. Zero downtime!"
                    author="David K."
                    upvotes={7}
                    category="emerald"
                  />
                  <FeedbackCard
                    text="The new onboarding documentation helped the new hires get up to speed in half the time."
                    author="Jane D."
                    upvotes={6}
                    category="emerald"
                  />
                </>
              ) : (
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center text-sm text-muted-foreground bg-secondary/10 min-h-[120px] flex items-center justify-center">
                  Nothing logged yet. Share a win!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* "Submit Feedback" Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="sm:max-w-[520px] border-border/50 bg-background/95 backdrop-blur-sm shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
            <DialogDescription>
              Share your thoughts on the recent sprint.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-3">
            <div className="space-y-3">
              <Label>Category</Label>
              <RadioGroup defaultValue="slowed" className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2 bg-secondary/30 p-2 rounded-md border border-border/50">
                  <RadioGroupItem value="slowed" id="r1" className="border-red-500 text-red-500" />
                  <Label htmlFor="r1" className="text-red-500 font-medium cursor-pointer">🔴 What Slowed Us Down?</Label>
                </div>
                <div className="flex items-center space-x-2 p-2">
                  <RadioGroupItem value="try" id="r2" className="border-blue-500 text-blue-500" />
                  <Label htmlFor="r2" className="text-blue-500 font-medium cursor-pointer">💡 What Should We Try?</Label>
                </div>
                <div className="flex items-center space-x-2 p-2">
                  <RadioGroupItem value="well" id="r3" className="border-emerald-500 text-emerald-500" />
                  <Label htmlFor="r3" className="text-emerald-500 font-medium cursor-pointer">✅ What Went Well?</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content" 
                placeholder="What happened?" 
                className="bg-secondary/50 border-border/50 min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestion" className="flex items-center justify-between">
                Suggested Improvement
                <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded">Reframe Rule: Required</span>
              </Label>
              <Textarea 
                id="suggestion" 
                placeholder="How could we fix or improve this?" 
                className="bg-secondary/50 border-red-500/40 min-h-[60px] resize-none focus-visible:ring-red-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox id="anonymous" className="border-muted-foreground" />
              <Label htmlFor="anonymous" className="text-sm font-normal text-muted-foreground cursor-pointer">
                Submit anonymously
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border/50" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground font-semibold" onClick={() => setShowSubmitModal(false)}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* "Convert to Action Item" Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent 
          className="sm:max-w-[520px] border-border/50 bg-background/95 backdrop-blur-sm shadow-2xl rounded-xl"
        >
          <DialogHeader>
            <DialogTitle>Convert to Action Item</DialogTitle>
            <DialogDescription>
              Create an action item from this high-voted feedback.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 my-2 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500 before:rounded-l-lg">
            <p className="text-sm text-slate-300 italic pl-2">"Adopt a 'No Meeting Thursday' policy to allow for deep work sessions."</p>
          </div>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                defaultValue="Implement 'No Meeting Thursday'" 
                className="bg-secondary/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea 
                id="desc" 
                placeholder="Details on how to implement this..." 
                className="bg-secondary/50 border-border/50 min-h-[80px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select defaultValue="alex">
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alex">Alex C.</SelectItem>
                    <SelectItem value="sarah">Sarah J.</SelectItem>
                    <SelectItem value="david">David K.</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due">Due Date</Label>
                <Input 
                  id="due" 
                  type="date" 
                  className="bg-secondary/50 border-border/50 text-slate-300"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border/50" onClick={() => setShowActionModal(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground font-semibold" onClick={() => setShowActionModal(false)}>Create Action Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function FeedbackCard({
  text,
  author,
  upvotes,
  category,
  suggestion,
  highVoted,
  onConvert
}: {
  text: string;
  author: string;
  upvotes: number;
  category: "red" | "blue" | "emerald";
  suggestion?: string;
  highVoted?: boolean;
  onConvert?: () => void;
}) {
  const categoryStyles = {
    red: "border-left-red",
    blue: "border-left-blue",
    emerald: "border-left-emerald",
  };

  return (
    <div className={`retro-card p-4 ${categoryStyles[category]} group`}>
      <p className="text-sm leading-relaxed mb-4 text-slate-200">{text}</p>

      {suggestion && (
        <div className="mb-4 bg-secondary/50 rounded p-3 border border-border/50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Suggested Improvement
          </div>
          <p className="text-xs text-slate-300 italic">"{suggestion}"</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {author === "Anonymous" ? (
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center border border-border">
              <User className="w-3 h-3 opacity-50" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center border border-border text-[10px] font-medium text-foreground">
              {author[0]}
            </div>
          )}
          {author}
        </div>

        <div className="flex items-center gap-2">
          {highVoted && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onConvert}
            >
              Action <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
          <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-xs font-medium transition-colors">
            <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground" />
            {upvotes}
          </button>
        </div>
      </div>
    </div>
  );
}