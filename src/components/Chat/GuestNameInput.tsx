import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

interface GuestNameInputProps {
  onSubmit: (name: string) => void;
}

const GuestNameInput = ({ onSubmit }: GuestNameInputProps) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <CardTitle>Join the Chat</CardTitle>
          </div>
          <CardDescription>
            Enter your display name to start chatting. This name will only be temporary and won't be saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              required
            />
            <Button type="submit" className="w-full" disabled={!name.trim()}>
              Join Chat
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestNameInput;