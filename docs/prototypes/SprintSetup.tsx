import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

export default function SprintSetup() {
  return (
    <Shell>
      <div className="max-w-[600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-0 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Set Up Sprint</h1>
          <p className="text-muted-foreground mt-2">
            Configure your retro session before your team joins.
          </p>
        </div>

        <div className="retro-card p-8 space-y-8">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Sprint Name</Label>
              <Input 
                id="sprint-name" 
                placeholder="e.g. Sprint 42" 
                defaultValue="Sprint 42"
                className="bg-secondary/50 border-border/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sprint-goal">Sprint Goal</Label>
              <Textarea 
                id="sprint-goal" 
                placeholder="What was this sprint trying to achieve?" 
                rows={2}
                defaultValue="Complete the new checkout flow and migrate the legacy user database."
                className="bg-secondary/50 border-border/50 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input 
                  id="start-date" 
                  type="date"
                  defaultValue="2023-10-24"
                  className="bg-secondary/50 border-border/50 text-slate-300 block w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input 
                  id="end-date" 
                  type="date"
                  defaultValue="2023-11-06"
                  className="bg-secondary/50 border-border/50 text-slate-300 block w-full"
                />
              </div>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* Retro Status */}
          <div className="space-y-3">
            <Label>Retro Status</Label>
            <RadioGroup defaultValue="open" className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-md border border-border/50">
                <RadioGroupItem value="open" id="status-open" className="border-emerald-500 text-emerald-500" />
                <Label htmlFor="status-open" className="font-medium cursor-pointer flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Open
                  <span className="text-xs font-normal text-muted-foreground ml-2">Team can submit feedback</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3">
                <RadioGroupItem value="closed" id="status-closed" className="border-slate-500 text-slate-500" />
                <Label htmlFor="status-closed" className="font-medium cursor-pointer flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Closed
                  <span className="text-xs font-normal text-muted-foreground ml-2">Read-only mode</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <hr className="border-border/50" />

          {/* Team Members */}
          <div className="space-y-4">
            <Label>Team Members</Label>
            
            <div className="space-y-2">
              {/* Member 1 */}
              <div className="flex items-center justify-between p-3 rounded-md bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-foreground border border-border">
                    JD
                  </div>
                  <div>
                    <div className="text-sm font-medium">Jane Doe</div>
                    <div className="text-xs text-muted-foreground">Pod 1</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Member 2 */}
              <div className="flex items-center justify-between p-3 rounded-md bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-foreground border border-border">
                    AC
                  </div>
                  <div>
                    <div className="text-sm font-medium">Alex Chen</div>
                    <div className="text-xs text-muted-foreground">Pod 1</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Member 3 */}
              <div className="flex items-center justify-between p-3 rounded-md bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-foreground border border-border">
                    SK
                  </div>
                  <div>
                    <div className="text-sm font-medium">Sarah K.</div>
                    <div className="text-xs text-muted-foreground">Pod 2</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add Member Form */}
            <div className="flex items-center gap-2 mt-4 p-3 bg-secondary/10 rounded-md border border-dashed border-border/50">
              <Input 
                placeholder="Enter name..." 
                className="bg-secondary/50 border-border/50 h-9 flex-1"
              />
              <Select defaultValue="pod1">
                <SelectTrigger className="bg-secondary/50 border-border/50 h-9 w-[120px]">
                  <SelectValue placeholder="Select Pod" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pod1">Pod 1</SelectItem>
                  <SelectItem value="pod2">Pod 2</SelectItem>
                  <SelectItem value="pod3">Pod 3</SelectItem>
                </SelectContent>
              </Select>
              <Button className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                + Add Member
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="border-border/50">Cancel</Button>
            <Button className="bg-primary text-primary-foreground font-semibold">Save & Open Retro</Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}