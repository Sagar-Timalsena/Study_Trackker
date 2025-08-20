import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import InviteModal from "@/components/InviteModal";
import type { FriendWithStats, Friendship, User } from "@shared/schema";

interface LeaderboardEntry {
  user: User;
  weeklyHours: number;
  rank: number;
}

interface FriendRequest extends Friendship {
  requester: User;
}

export default function Friends() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: friends = [], isLoading: friendsLoading } = useQuery<FriendWithStats[]>({
    queryKey: ["/api/friends"],
  });

  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friends/requests"],
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/dashboard/leaderboard"],
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("POST", `/api/friends/requests/${requestId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/leaderboard"] });
      toast({
        title: "Success",
        description: "Friend request accepted!",
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
        description: "Failed to accept friend request.",
        variant: "destructive",
      });
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("POST", `/api/friends/requests/${requestId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({
        title: "Success",
        description: "Friend request declined.",
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
        description: "Failed to decline friend request.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (user: User) => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const getUserDisplayName = (user: User) => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return user.email || "Unknown User";
  };

  const formatLastSeen = (isOnline: boolean) => {
    return isOnline ? "Online now" : "Offline";
  };

  if (friendsLoading || requestsLoading || leaderboardLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends</h1>
          <p className="text-gray-600">Connect with study buddies and track progress together.</p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <i className="fas fa-user-plus mr-2"></i>
          Invite Friend
        </Button>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-user-clock mr-2"></i>
              Pending Friend Requests ({friendRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {friendRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarImage src={request.requester.profileImageUrl || ""} />
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {getInitials(request.requester)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{getUserDisplayName(request.requester)}</p>
                      <p className="text-sm text-gray-500">{request.requester.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => acceptRequestMutation.mutate(request.id)}
                      disabled={acceptRequestMutation.isPending}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineRequestMutation.mutate(request.id)}
                      disabled={declineRequestMutation.isPending}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Friends List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Study Buddies ({friends.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-users text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
                  <p className="text-gray-500 mb-4">Invite friends to start studying together!</p>
                  <Button onClick={() => setIsInviteModalOpen(true)}>
                    <i className="fas fa-user-plus mr-2"></i>
                    Invite Your First Friend
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <Avatar className="w-10 h-10 mr-3">
                          <AvatarImage src={friend.profileImageUrl || ""} />
                          <AvatarFallback className="bg-primary text-white text-sm">
                            {getInitials(friend)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{getUserDisplayName(friend)}</p>
                          <p className="text-sm text-gray-500">{formatLastSeen(friend.isOnline)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${friend.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-500">{friend.todayHours.toFixed(1)}h today</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Friends Progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Friends Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Weekly Leaderboard */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-700 mb-4">This Week's Top Performers</h4>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-trophy text-4xl mb-4"></i>
                    <p>No leaderboard data available yet.</p>
                    <p className="text-sm mt-2">Start studying to see rankings!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div 
                        key={entry.user.id} 
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' : 
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                          }`}>
                            {entry.rank}
                          </div>
                          <Avatar className="w-10 h-10 mr-3">
                            <AvatarImage src={entry.user.profileImageUrl || ""} />
                            <AvatarFallback className="bg-primary text-white text-sm">
                              {getInitials(entry.user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{getUserDisplayName(entry.user)}</p>
                            <p className="text-sm text-gray-600">
                              {index === 0 ? 'Top performer this week!' : 
                               index === 1 ? 'Great progress this week' :
                               index === 2 ? 'Consistent study habits' :
                               'Keep up the good work!'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            index === 0 ? 'text-yellow-600' :
                            index === 1 ? 'text-gray-600' :
                            index === 2 ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            {entry.weeklyHours.toFixed(1)}h
                          </p>
                          <p className="text-sm text-gray-500">this week</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Study Progress Comparison */}
              {friends.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-4">Weekly Study Hours Comparison</h4>
                  <div className="space-y-3">
                    {friends.slice(0, 3).map((friend) => (
                      <div key={friend.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <Avatar className="w-8 h-8 mr-3">
                              <AvatarImage src={friend.profileImageUrl || ""} />
                              <AvatarFallback className="bg-primary text-white text-xs">
                                {getInitials(friend)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-900">{getUserDisplayName(friend)}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{friend.weeklyHours.toFixed(1)}h</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((friend.weeklyHours / Math.max(...friends.map(f => f.weeklyHours), 1)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
