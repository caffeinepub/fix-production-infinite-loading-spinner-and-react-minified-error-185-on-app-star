import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Building2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

export default function ProfileSetupPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const saveProfile = useSaveCallerUserProfile();
  const {
    data: existingProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  useEffect(() => {
    if (!identity) {
      navigate({ to: "/login" });
      return;
    }

    // If profile already exists, redirect to home
    if (isFetched && existingProfile) {
      navigate({ to: "/" });
    }
  }, [identity, existingProfile, isFetched, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !restaurantName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        restaurantName: restaurantName.trim(),
      });
      toast.success("Profile created successfully!");
      navigate({ to: "/" });
    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast.error("Failed to create profile. Please try again.");
    }
  };

  if (profileLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Tell us a bit about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="restaurantName"
                  placeholder="Enter your restaurant name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Creating Profile...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
