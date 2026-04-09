import { Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Registration() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[480px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Hexagon className="w-7 h-7 text-primary fill-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">RetroBoard</h1>
        </div>

        {/* Main Card */}
        <Card className="retro-card border-border/50">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl">Welcome to RetroBoard</CardTitle>
            <CardDescription>Set up your identity to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Jane Doe" 
                  className="bg-secondary/50 border-destructive focus-visible:ring-destructive"
                  defaultValue="Jane Doe"
                />
                {/* Static Error State */}
                <p className="text-[13px] font-medium text-destructive mt-1.5 animate-in fade-in">
                  This name is already taken in Pod 1.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pod">Pod</Label>
                <Select defaultValue="pod1">
                  <SelectTrigger id="pod" className="bg-secondary/50">
                    <SelectValue placeholder="Select a pod" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pod1">Pod 1</SelectItem>
                    <SelectItem value="pod2">Pod 2</SelectItem>
                    <SelectItem value="pod3">Pod 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 space-y-4">
              <Button className="w-full h-11 text-base font-semibold">
                Join RetroBoard
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                Your name and pod are saved locally. No account required.
              </p>
            </div>
            
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}