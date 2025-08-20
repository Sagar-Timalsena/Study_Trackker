import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { emailService } from "./services/emailService";
import { insertSubjectSchema, insertStudySessionSchema, insertFriendInvitationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithStats(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leaderboard = await storage.getWeeklyLeaderboard(userId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Subject routes
  app.get('/api/subjects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subjects = await storage.getUserSubjects(userId);
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post('/api/subjects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(userId, validatedData);
      res.status(201).json(subject);
    } catch (error) {
      console.error("Error creating subject:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid subject data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create subject" });
      }
    }
  });

  app.put('/api/subjects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subjectId = req.params.id;
      const validatedData = insertSubjectSchema.partial().parse(req.body);
      const subject = await storage.updateSubject(subjectId, userId, validatedData);
      res.json(subject);
    } catch (error) {
      console.error("Error updating subject:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid subject data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update subject" });
      }
    }
  });

  app.delete('/api/subjects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subjectId = req.params.id;
      await storage.deleteSubject(subjectId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });

  // Study session routes
  app.post('/api/study-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertStudySessionSchema.parse(req.body);
      const session = await storage.createStudySession(userId, validatedData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating study session:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid study session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create study session" });
      }
    }
  });

  app.get('/api/study-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, subjectId } = req.query;
      
      const sessions = await storage.getStudySessionsWithSubjects(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching study sessions:", error);
      res.status(500).json({ message: "Failed to fetch study sessions" });
    }
  });

  // Friend routes
  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get('/api/friends/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getPendingFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post('/api/friends/requests/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = req.params.id;
      const friendship = await storage.acceptFriendRequest(requestId, userId);
      res.json(friendship);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post('/api/friends/requests/:id/decline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = req.params.id;
      await storage.declineFriendRequest(requestId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error declining friend request:", error);
      res.status(500).json({ message: "Failed to decline friend request" });
    }
  });

  // Friend invitation routes
  app.post('/api/friends/invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertFriendInvitationSchema.parse(req.body);
      const invitation = await storage.createFriendInvitation(userId, validatedData);
      
      // Send invitation email
      const inviteUrl = `${req.protocol}://${req.hostname}/accept-invite/${invitation.token}`;
      const inviterName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'A friend';
      
      const emailSent = await emailService.sendFriendInvitation(
        inviterName,
        user.email || '',
        validatedData.email,
        inviteUrl,
        validatedData.message || undefined
      );

      if (!emailSent) {
        console.warn(`Failed to send invitation email to ${validatedData.email}`);
      }
      
      res.status(201).json({ message: "Invitation sent successfully" });
    } catch (error) {
      console.error("Error sending friend invitation:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid invitation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to send invitation" });
      }
    }
  });

  app.post('/api/friends/invite/:token/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const token = req.params.token;
      await storage.acceptFriendInvitation(token, userId);
      res.json({ message: "Invitation accepted successfully" });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(400).json({ message: "Invalid or expired invitation" });
    }
  });

  // Profile routes
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        bio: z.string().optional(),
        school: z.string().optional(),
        major: z.string().optional(),
        dailyGoal: z.number().min(1).max(12).optional(),
        emailNotifications: z.boolean().optional(),
        friendActivityNotifications: z.boolean().optional(),
        weeklyProgressSummaries: z.boolean().optional(),
        showProgressToFriends: z.boolean().optional(),
        showInLeaderboards: z.boolean().optional(),
      }).parse(req.body);

      const user = await storage.updateUserProfile(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  });

  // Progress sharing routes
  app.post('/api/progress/share', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email } = z.object({
        email: z.string().email().optional(),
      }).parse(req.body);

      const user = await storage.getUserWithStats(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stats = await storage.getDashboardStats(userId);
      const subjects = await storage.getUserSubjects(userId);
      
      // Get today's sessions for detailed report
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaySessions = await storage.getStudySessionsWithSubjects(userId, today, tomorrow);
      
      const todaySubjects = todaySessions.reduce((acc, session) => {
        const existingSubject = acc.find(s => s.name === session.subject.name);
        if (existingSubject) {
          existingSubject.hours += Number(session.duration);
        } else {
          acc.push({
            name: session.subject.name,
            hours: Number(session.duration),
            color: session.subject.color || '#3B82F6',
          });
        }
        return acc;
      }, [] as Array<{ name: string; hours: number; color: string }>);

      const reportData = {
        date: today.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        totalHours: todaySessions.reduce((acc, session) => acc + Number(session.duration), 0),
        sessionsCount: todaySessions.length,
        subjects: todaySubjects,
        streak: user.currentStreak,
        weeklyGoal: (user.dailyGoal || 5) * 7,
        weeklyProgress: Math.round((user.weeklyHours / ((user.dailyGoal || 5) * 7)) * 100),
      };

      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Study Tracker User';
      
      const emailSent = await emailService.sendDailyProgressReport(
        user.email || '',
        userName,
        reportData,
        email
      );

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send progress report" });
      }
      
      res.json({ message: "Progress report shared successfully" });
    } catch (error) {
      console.error("Error sharing progress:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to share progress report" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
