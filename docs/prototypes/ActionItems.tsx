import { Shell } from "@/components/layout/Shell";
import { CheckCircle2, Clock, CheckSquare, ShieldCheck, ClipboardList, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ActionItems() {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const hasData = false;

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Action Items</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Track improvements generated from sprint feedback.
            </p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Action Item
          </Button>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border">
          <StatusPill label="Open" count={hasData ? 2 : 0} color="bg-slate-500" />
          <StatusPill label="In Progress" count={hasData ? 4 : 0} color="bg-blue-500" />
          <StatusPill label="Completed" count={hasData ? 3 : 0} color="bg-amber-500" />
          <StatusPill label="Verified" count={hasData ? 1 : 0} color="bg-emerald-500" />
        </div>

        {/* Action Items List */}
        {hasData ? (
          <div className="space-y-4">
            <ActionCard
              title="Implement 'No Meeting Thursday'"
              description="Block out calendars across the engineering team on Thursdays to allow for uninterrupted deep work. Inform product owners."
              status="In Progress"
              owner="Alex C."
              sourceQuote="Adopt a 'No Meeting Thursday' policy to allow for deep work sessions."
              dueDate="This Sprint"
            />

            <ActionCard
              title="Rollback Auth Service"
              description="Revert the staging environment auth service to version 2.4.1 while we investigate the memory leak."
              status="Open"
              owner="Sarah J."
              sourceQuote="We need to rollback to previous auth version until the memory leak is patched."
              dueDate="Today"
            />

            <ActionCard
              title="Update Staging Credentials Doc"
              description="Move all staging environment credentials to the central engineering wiki."
              status="Completed"
              owner="Mike T."
              sourceQuote="Struggling with the updated staging environment credentials."
              dueDate="Yesterday"
              onAdvance={() => setShowVerifyModal(true)}
            />

            <ActionCard
              title="Fix Staging Environment Performance"
              description="Investigate and resolve the root causes of slow deployment times in the staging environment."
              status="Completed"
              owner="Jane D."
              sourceQuote="Struggling with the updated staging environment slowing down deployments."
              dueDate="Yesterday"
              onAdvance={() => setShowVerifyModal(true)}
            />

            {/* Verified Improvement Card */}
            <div className="retro-card border-emerald-500/30 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium flex items-center gap-1.5 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Due last sprint
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-medium">
                      DK
                    </div>
                    <span className="text-sm font-medium">David K.</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">
                  Automate DB Migration Scripts
                </h3>
                <p className="text-sm text-slate-300 mb-6">
                  Create automated runner for migration scripts to prevent manual
                  errors during deployment.
                </p>

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 flex gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">
                      Verified Impact
                    </div>
                    <p className="text-sm text-emerald-100/80 italic">
                      "Pair programming on the database migration worked
                      perfectly. Zero downtime! The new automated scripts saved us
                      at least 2 hours this sprint."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="retro-card py-16 px-6 flex flex-col items-center justify-center text-center bg-secondary/5 border-dashed border-2 border-border/50">
            <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-4 border border-border/50">
              <ClipboardList className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">No action items yet.</h2>
            <p className="text-muted-foreground mb-8">Convert feedback from the Feedback Board, or add one directly.</p>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="border-border/50">
                Go to Feedback Board
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Action Item
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Action Item Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-background/95 backdrop-blur-sm shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle>New Action Item</DialogTitle>
            <DialogDescription className="hidden">
              Create a new action item
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Add automated test coverage" 
                className="bg-secondary/50 border-border/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="What needs to be done and why?" 
                rows={3}
                className="bg-secondary/50 border-border/50 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jane">Jane Doe</SelectItem>
                    <SelectItem value="alex">Alex Chen</SelectItem>
                    <SelectItem value="sarah">Sarah K.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input 
                  id="due-date" 
                  type="date"
                  className="bg-secondary/50 border-border/50 text-slate-300 block w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source">Source (optional)</Label>
              <Input 
                id="source" 
                placeholder="Link to feedback item (optional)" 
                className="bg-secondary/50 border-border/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border/50" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowCreateModal(false)}>Create Action Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Static "Verify Impact" Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-[480px] border-border/50 bg-background/95 backdrop-blur-sm shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Verify Impact</DialogTitle>
            <DialogDescription>
              Describe how this action improved the team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea 
              placeholder="e.g. Saved 2 hours of deployment time this sprint..." 
              className="bg-secondary/50 border-border/50 min-h-[120px] resize-none"
            />
            <div className="text-right text-xs text-muted-foreground">
              0 / 300
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border/50" onClick={() => setShowVerifyModal(false)}>Cancel</Button>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setShowVerifyModal(false)}>Confirm Verified</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function StatusPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
      <span className="ml-1 text-muted-foreground bg-secondary px-1.5 rounded text-xs">
        {count}
      </span>
    </div>
  );
}

function ActionCard({
  title,
  description,
  status,
  owner,
  sourceQuote,
  dueDate,
  onAdvance,
}: any) {
  const isProgress = status === "In Progress";
  const statusColor = 
    status === "Completed" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
    isProgress ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
    "bg-slate-500/10 text-slate-300 border-slate-500/20";
  
  const StatusIcon = status === "Completed" ? CheckCircle2 : (isProgress ? Clock : CheckSquare);

  return (
    <div className="retro-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${statusColor}`}
          >
            <StatusIcon className="w-3.5 h-3.5" /> {status}
          </div>
          <span className="text-xs text-muted-foreground">Due {dueDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-medium">
            {owner[0]}
          </div>
          <span className="text-sm font-medium">{owner}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-300 mb-4">{description}</p>

      <div className="bg-secondary/40 border border-border/50 rounded p-3 mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Source Feedback
        </div>
        <p className="text-xs text-slate-400 italic">"{sourceQuote}"</p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="font-medium" onClick={onAdvance}>
          Advance Status
        </Button>
      </div>
    </div>
  );
}