import {
  users,
  subjects,
  studySessions,
  friendships,
  friendInvitations,
  type User,
  type UpsertUser,
  type Subject,
  type InsertSubject,
  type StudySession,
  type InsertStudySession,
  type Friendship,
  type InsertFriendship,
  type FriendInvitation,
  type InsertFriendInvitation,
  type UserWithStats,
  type SubjectWithStats,
  type FriendWithStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, sum, count, gte, lte, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithStats(id: string): Promise<UserWithStats | undefined>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;

  // Subject operations
  getUserSubjects(userId: string): Promise<SubjectWithStats[]>;
  getSubject(id: string, userId: string): Promise<Subject | undefined>;
  createSubject(userId: string, subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, userId: string, data: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: string, userId: string): Promise<void>;

  // Study session operations
  createStudySession(userId: string, session: InsertStudySession): Promise<StudySession>;
  getUserStudySessions(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    subjectId?: string
  ): Promise<StudySession[]>;
  getStudySessionsWithSubjects(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<(StudySession & { subject: Subject })[]>;

  // Friend operations
  getUserFriends(userId: string): Promise<FriendWithStats[]>;
  getFriendship(userId1: string, userId2: string): Promise<Friendship | undefined>;
  createFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  acceptFriendRequest(friendshipId: string, userId: string): Promise<Friendship>;
  declineFriendRequest(friendshipId: string, userId: string): Promise<void>;
  getPendingFriendRequests(userId: string): Promise<(Friendship & { requester: User })[]>;

  // Friend invitation operations
  createFriendInvitation(userId: string, invitation: InsertFriendInvitation): Promise<FriendInvitation>;
  getFriendInvitation(token: string): Promise<FriendInvitation | undefined>;
  acceptFriendInvitation(token: string, userId: string): Promise<void>;

  // Statistics operations
  getDashboardStats(userId: string): Promise<{
    totalStudyHours: number;
    activeSubjectsCount: number;
    currentStreak: number;
    activeFriendsCount: number;
    weeklyProgress: { day: string; hours: number }[];
    subjectDistribution: { name: string; percentage: number; color: string }[];
  }>;

  getWeeklyLeaderboard(userId: string): Promise<{
    user: User;
    weeklyHours: number;
    rank: number;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithStats(id: string): Promise<UserWithStats | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    // Get total study hours
    const totalHoursResult = await db
      .select({ total: sum(studySessions.duration) })
      .from(studySessions)
      .where(eq(studySessions.userId, id));

    // Get active subjects count
    const activeSubjectsResult = await db
      .select({ count: count() })
      .from(subjects)
      .where(and(eq(subjects.userId, id), eq(subjects.isActive, true)));

    // Get weekly hours
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyHoursResult = await db
      .select({ total: sum(studySessions.duration) })
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, id),
          gte(studySessions.sessionDate, startOfWeek)
        )
      );

    // Calculate current streak (simplified - days with study sessions)
    const recentSessions = await db
      .select({
        date: sql<string>`DATE(${studySessions.sessionDate})`,
      })
      .from(studySessions)
      .where(eq(studySessions.userId, id))
      .groupBy(sql`DATE(${studySessions.sessionDate})`)
      .orderBy(desc(sql`DATE(${studySessions.sessionDate})`))
      .limit(30);

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();

    for (const session of recentSessions) {
      const sessionDate = session.date;
      const expectedDate = checkDate.toISOString().split('T')[0];
      
      if (sessionDate === expectedDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      ...user,
      totalStudyHours: Number(totalHoursResult[0]?.total || 0),
      activeSubjectsCount: activeSubjectsResult[0]?.count || 0,
      currentStreak,
      weeklyHours: Number(weeklyHoursResult[0]?.total || 0),
    };
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserSubjects(userId: string): Promise<SubjectWithStats[]> {
    const userSubjects = await db
      .select()
      .from(subjects)
      .where(eq(subjects.userId, userId))
      .orderBy(desc(subjects.updatedAt));

    const subjectsWithStats = await Promise.all(
      userSubjects.map(async (subject) => {
        // Get total hours for this subject
        const totalHoursResult = await db
          .select({ total: sum(studySessions.duration) })
          .from(studySessions)
          .where(eq(studySessions.subjectId, subject.id));

        // Get sessions count
        const sessionsCountResult = await db
          .select({ count: count() })
          .from(studySessions)
          .where(eq(studySessions.subjectId, subject.id));

        // Get last study date
        const lastSessionResult = await db
          .select({ date: studySessions.sessionDate })
          .from(studySessions)
          .where(eq(studySessions.subjectId, subject.id))
          .orderBy(desc(studySessions.sessionDate))
          .limit(1);

        // Get weekly progress
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const weeklyHoursResult = await db
          .select({ total: sum(studySessions.duration) })
          .from(studySessions)
          .where(
            and(
              eq(studySessions.subjectId, subject.id),
              gte(studySessions.sessionDate, startOfWeek)
            )
          );

        const weeklyHours = Number(weeklyHoursResult[0]?.total || 0);
        const weeklyGoal = Number(subject.weeklyGoal);
        const weeklyProgress = weeklyGoal > 0 ? (weeklyHours / weeklyGoal) * 100 : 0;

        return {
          ...subject,
          totalHours: Number(totalHoursResult[0]?.total || 0),
          sessionsCount: sessionsCountResult[0]?.count || 0,
          lastStudyDate: lastSessionResult[0]?.date || null,
          weeklyProgress: Math.min(weeklyProgress, 100),
        };
      })
    );

    return subjectsWithStats;
  }

  async getSubject(id: string, userId: string): Promise<Subject | undefined> {
    const [subject] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.userId, userId)));
    return subject;
  }

  async createSubject(userId: string, subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db
      .insert(subjects)
      .values({ ...subject, userId })
      .returning();
    return newSubject;
  }

  async updateSubject(id: string, userId: string, data: Partial<InsertSubject>): Promise<Subject> {
    const [subject] = await db
      .update(subjects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
      .returning();
    return subject;
  }

  async deleteSubject(id: string, userId: string): Promise<void> {
    await db
      .delete(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.userId, userId)));
  }

  async createStudySession(userId: string, session: InsertStudySession): Promise<StudySession> {
    const [newSession] = await db
      .insert(studySessions)
      .values({ ...session, userId })
      .returning();
    return newSession;
  }

  async getUserStudySessions(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    subjectId?: string
  ): Promise<StudySession[]> {
    let query = db.select().from(studySessions).where(eq(studySessions.userId, userId));

    const conditions = [eq(studySessions.userId, userId)];
    
    if (startDate) {
      conditions.push(gte(studySessions.sessionDate, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(studySessions.sessionDate, endDate));
    }
    
    if (subjectId) {
      conditions.push(eq(studySessions.subjectId, subjectId));
    }

    const sessions = await db
      .select()
      .from(studySessions)
      .where(and(...conditions))
      .orderBy(desc(studySessions.sessionDate));

    return sessions;
  }

  async getStudySessionsWithSubjects(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<(StudySession & { subject: Subject })[]> {
    const conditions = [eq(studySessions.userId, userId)];
    
    if (startDate) {
      conditions.push(gte(studySessions.sessionDate, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(studySessions.sessionDate, endDate));
    }

    const sessions = await db
      .select({
        session: studySessions,
        subject: subjects,
      })
      .from(studySessions)
      .innerJoin(subjects, eq(studySessions.subjectId, subjects.id))
      .where(and(...conditions))
      .orderBy(desc(studySessions.sessionDate));

    return sessions.map(({ session, subject }) => ({
      ...session,
      subject,
    }));
  }

  async getUserFriends(userId: string): Promise<FriendWithStats[]> {
    // Get accepted friendships where user is either requester or addressee
    const friendshipsResult = await db
      .select()
      .from(friendships)
      .innerJoin(users, sql`
        CASE 
          WHEN ${friendships.requesterId} = ${userId} THEN ${users.id} = ${friendships.addresseeId}
          WHEN ${friendships.addresseeId} = ${userId} THEN ${users.id} = ${friendships.requesterId}
          ELSE FALSE
        END
      `)
      .where(
        and(
          eq(friendships.status, "accepted"),
          sql`(${friendships.requesterId} = ${userId} OR ${friendships.addresseeId} = ${userId})`
        )
      );

    const friendsWithStats = await Promise.all(
      friendshipsResult.map(async ({ users: friend, friendships: friendship }) => {
        // Get today's hours
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayHoursResult = await db
          .select({ total: sum(studySessions.duration) })
          .from(studySessions)
          .where(
            and(
              eq(studySessions.userId, friend.id),
              gte(studySessions.sessionDate, today),
              lte(studySessions.sessionDate, tomorrow)
            )
          );

        // Get weekly hours
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const weeklyHoursResult = await db
          .select({ total: sum(studySessions.duration) })
          .from(studySessions)
          .where(
            and(
              eq(studySessions.userId, friend.id),
              gte(studySessions.sessionDate, startOfWeek)
            )
          );

        return {
          ...friend,
          todayHours: Number(todayHoursResult[0]?.total || 0),
          weeklyHours: Number(weeklyHoursResult[0]?.total || 0),
          isOnline: Math.random() > 0.5, // Simple online status simulation
          friendship,
        };
      })
    );

    return friendsWithStats;
  }

  async getFriendship(userId1: string, userId2: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        sql`
          (${friendships.requesterId} = ${userId1} AND ${friendships.addresseeId} = ${userId2}) 
          OR 
          (${friendships.requesterId} = ${userId2} AND ${friendships.addresseeId} = ${userId1})
        `
      );
    return friendship;
  }

  async createFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({ requesterId, addresseeId })
      .returning();
    return friendship;
  }

  async acceptFriendRequest(friendshipId: string, userId: string): Promise<Friendship> {
    const [friendship] = await db
      .update(friendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(
        and(
          eq(friendships.id, friendshipId),
          eq(friendships.addresseeId, userId)
        )
      )
      .returning();
    return friendship;
  }

  async declineFriendRequest(friendshipId: string, userId: string): Promise<void> {
    await db
      .update(friendships)
      .set({ status: "declined", updatedAt: new Date() })
      .where(
        and(
          eq(friendships.id, friendshipId),
          eq(friendships.addresseeId, userId)
        )
      );
  }

  async getPendingFriendRequests(userId: string): Promise<(Friendship & { requester: User })[]> {
    const requests = await db
      .select({
        friendship: friendships,
        requester: users,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.requesterId, users.id))
      .where(
        and(
          eq(friendships.addresseeId, userId),
          eq(friendships.status, "pending")
        )
      );

    return requests.map(({ friendship, requester }) => ({
      ...friendship,
      requester,
    }));
  }

  async createFriendInvitation(userId: string, invitation: InsertFriendInvitation): Promise<FriendInvitation> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const [friendInvitation] = await db
      .insert(friendInvitations)
      .values({
        ...invitation,
        inviterUserId: userId,
        token,
        expiresAt,
      })
      .returning();

    return friendInvitation;
  }

  async getFriendInvitation(token: string): Promise<FriendInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(friendInvitations)
      .where(eq(friendInvitations.token, token));
    return invitation;
  }

  async acceptFriendInvitation(token: string, userId: string): Promise<void> {
    const invitation = await this.getFriendInvitation(token);
    if (!invitation || invitation.status !== "pending" || new Date() > invitation.expiresAt) {
      throw new Error("Invalid or expired invitation");
    }

    // Mark invitation as accepted
    await db
      .update(friendInvitations)
      .set({ status: "accepted" })
      .where(eq(friendInvitations.token, token));

    // Create friendship
    await this.createFriendRequest(invitation.inviterUserId, userId);
  }

  async getDashboardStats(userId: string): Promise<{
    totalStudyHours: number;
    activeSubjectsCount: number;
    currentStreak: number;
    activeFriendsCount: number;
    weeklyProgress: { day: string; hours: number }[];
    subjectDistribution: { name: string; percentage: number; color: string }[];
  }> {
    const userWithStats = await this.getUserWithStats(userId);
    if (!userWithStats) {
      throw new Error("User not found");
    }

    // Get active friends count
    const friendsCount = await db
      .select({ count: count() })
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          sql`(${friendships.requesterId} = ${userId} OR ${friendships.addresseeId} = ${userId})`
        )
      );

    // Get weekly progress (last 7 days)
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dayHoursResult = await db
        .select({ total: sum(studySessions.duration) })
        .from(studySessions)
        .where(
          and(
            eq(studySessions.userId, userId),
            gte(studySessions.sessionDate, startOfDay),
            lte(studySessions.sessionDate, endOfDay)
          )
        );

      weeklyProgress.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: Number(dayHoursResult[0]?.total || 0),
      });
    }

    // Get subject distribution
    const subjectStats = await db
      .select({
        name: subjects.name,
        color: subjects.color,
        total: sum(studySessions.duration),
      })
      .from(subjects)
      .leftJoin(studySessions, eq(subjects.id, studySessions.subjectId))
      .where(eq(subjects.userId, userId))
      .groupBy(subjects.id, subjects.name, subjects.color);

    const totalHours = subjectStats.reduce((acc, s) => acc + Number(s.total || 0), 0);
    const subjectDistribution = subjectStats.map(s => ({
      name: s.name,
      color: s.color,
      percentage: totalHours > 0 ? Math.round((Number(s.total || 0) / totalHours) * 100) : 0,
    }));

    return {
      totalStudyHours: userWithStats.totalStudyHours,
      activeSubjectsCount: userWithStats.activeSubjectsCount,
      currentStreak: userWithStats.currentStreak,
      activeFriendsCount: friendsCount[0]?.count || 0,
      weeklyProgress,
      subjectDistribution,
    };
  }

  async getWeeklyLeaderboard(userId: string): Promise<{
    user: User;
    weeklyHours: number;
    rank: number;
  }[]> {
    // Get user's friends
    const friends = await this.getUserFriends(userId);
    const friendIds = friends.map(f => f.id);
    const allUserIds = [userId, ...friendIds];

    // Get weekly hours for all users
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyStats = await db
      .select({
        userId: studySessions.userId,
        totalHours: sum(studySessions.duration),
      })
      .from(studySessions)
      .where(
        and(
          inArray(studySessions.userId, allUserIds),
          gte(studySessions.sessionDate, startOfWeek)
        )
      )
      .groupBy(studySessions.userId);

    // Get user details
    const usersData = await db
      .select()
      .from(users)
      .where(inArray(users.id, allUserIds));

    // Combine data and rank
    const leaderboard = usersData
      .map(user => {
        const stats = weeklyStats.find(s => s.userId === user.id);
        return {
          user,
          weeklyHours: Number(stats?.totalHours || 0),
          rank: 0, // Will be set after sorting
        };
      })
      .sort((a, b) => b.weeklyHours - a.weeklyHours)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return leaderboard;
  }
}

export const storage = new DatabaseStorage();
