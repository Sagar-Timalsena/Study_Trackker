import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { UserWithStats } from "@shared/schema";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
  school: string;
  major: string;
  dailyGoal: number;
  emailNotifications: boolean;
  friendActivityNotifications: boolean;
  weeklyProgressSummaries: boolean;
  showProgressToFriends: boolean;
  showInLeaderboards: boolean;
}

export default function Profile() {
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    bio: "",
    school: "",
    major: "",
    dailyGoal: 5,
    emailNotifications: true,
    friendActivityNotifications: true,
    weeklyProgressSummaries: false,
    showProgressToFriends: true,
    showInLeaderboards: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  const { data: userStats, isLoading } = useQuery<UserWithStats>({
    queryKey: ["/api/auth/user"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      return apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShareProgress = async () => {
    try {
      await apiRequest("POST", "/api/progress/share", {});
      toast({
        title: "Success",
        description: "Progress report shared successfully!",
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to share progress report.",
        variant: "destructive",
      });
    }
  };

  // Update form data when user data loads
  useEffect(() => {
    if (userStats) {
      setFormData({
        firstName: userStats.firstName || "",
        lastName: userStats.lastName || "",
        bio: userStats.bio || "",
        school: userStats.school || "",
        major: userStats.major || "",
        dailyGoal: userStats.dailyGoal || 5,
        emailNotifications: userStats.emailNotifications ?? true,
        friendActivityNotifications: userStats.friendActivityNotifications ?? true,
        weeklyProgressSummaries: userStats.weeklyProgressSummaries ?? false,
        showProgressToFriends: userStats.showProgressToFriends ?? true,
        showInLeaderboards: userStats.showInLeaderboards ?? true,
      });
    }
  }, [userStats]);

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    if (userStats?.email) {
      return userStats.email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const getDisplayName = () => {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    return fullName || userStats?.email || "User";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Unable to load profile data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account settings and study preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Photo Section */}
                <div className="flex items-center space-x-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={userStats.profileImageUrl || ""} />
                    <AvatarFallback className="bg-primary text-white text-2xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button type="button" variant="outline" disabled>
                      Change Photo
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">Profile photo is managed through your authentication provider.</p>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userStats.email || ""}
                    disabled
                    className="mt-2 bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed directly. Contact support if needed.</p>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself and your study goals..."
                    className="mt-2"
                  />
                </div>

                {/* Education Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="school">School/University</Label>
                    <Input
                      id="school"
                      type="text"
                      value={formData.school}
                      onChange={(e) => handleInputChange("school", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="major">Major/Field</Label>
                    <Input
                      id="major"
                      type="text"
                      value={formData.major}
                      onChange={(e) => handleInputChange("major", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Study Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Study Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Daily Goal */}
                <div>
                  <Label htmlFor="dailyGoal">Daily Study Goal (hours)</Label>
                  <Input
                    id="dailyGoal"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.dailyGoal}
                    onChange={(e) => handleInputChange("dailyGoal", parseInt(e.target.value))}
                    className="mt-2 w-32"
                  />
                </div>

                {/* Notification Preferences */}
                <div>
                  <Label className="text-base font-medium">Notification Preferences</Label>
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="emailNotifications"
                        checked={formData.emailNotifications}
                        onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
                      />
                      <Label htmlFor="emailNotifications" className="text-sm font-normal">
                        Email notifications for daily reports
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="friendActivityNotifications"
                        checked={formData.friendActivityNotifications}
                        onCheckedChange={(checked) => handleInputChange("friendActivityNotifications", checked)}
                      />
                      <Label htmlFor="friendActivityNotifications" className="text-sm font-normal">
                        Friend activity notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="weeklyProgressSummaries"
                        checked={formData.weeklyProgressSummaries}
                        onCheckedChange={(checked) => handleInputChange("weeklyProgressSummaries", checked)}
                      />
                      <Label htmlFor="weeklyProgressSummaries" className="text-sm font-normal">
                        Weekly progress summaries
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div>
                  <Label className="text-base font-medium">Privacy Settings</Label>
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="showProgressToFriends"
                        checked={formData.showProgressToFriends}
                        onCheckedChange={(checked) => handleInputChange("showProgressToFriends", checked)}
                      />
                      <Label htmlFor="showProgressToFriends" className="text-sm font-normal">
                        Allow friends to see my study progress
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="showInLeaderboards"
                        checked={formData.showInLeaderboards}
                        onCheckedChange={(checked) => handleInputChange("showInLeaderboards", checked)}
                      />
                      <Label htmlFor="showInLeaderboards" className="text-sm font-normal">
                        Show me in leaderboards
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Main Stat */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-graduation-cap text-primary text-2xl"></i>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{userStats.totalStudyHours.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Total Study Hours</p>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-secondary">{userStats.activeSubjectsCount}</p>
                    <p className="text-xs text-gray-500">Active Subjects</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-accent">{userStats.currentStreak}</p>
                    <p className="text-xs text-gray-500">Day Streak</p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Member since</p>
                  <p className="font-medium text-gray-900">
                    {userStats.createdAt 
                      ? new Date(userStats.createdAt).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })
                      : "Recently"}
                  </p>
                </div>

                {/* Study Rank */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Study Rank</p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-star text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Study Champion</p>
                      <p className="text-xs text-gray-500">
                        {userStats.totalStudyHours > 100 ? "Top performer!" : "Keep studying!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={handleShareProgress}
                >
                  <i className="fas fa-share mr-2"></i>
                  Share Progress Report
                </Button>
                
                <Button variant="secondary" className="w-full" disabled>
                  <i className="fas fa-download mr-2"></i>
                  Export Study Data
                </Button>
                
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/api/logout"}>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
