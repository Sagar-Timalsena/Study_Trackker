import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  school: varchar("school"),
  major: varchar("major"),
  dailyGoal: integer("daily_goal").default(5),
  emailNotifications: boolean("email_notifications").default(true),
  friendActivityNotifications: boolean("friend_activity_notifications").default(true),
  weeklyProgressSummaries: boolean("weekly_progress_summaries").default(false),
  showProgressToFriends: boolean("show_progress_to_friends").default(true),
  showInLeaderboards: boolean("show_in_leaderboards").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  weeklyGoal: decimal("weekly_goal", { precision: 4, scale: 1 }).default("10.0"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  icon: varchar("icon", { length: 50 }).default("fas fa-book"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Study sessions table
export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  duration: decimal("duration", { precision: 4, scale: 1 }).notNull(), // in hours
  notes: text("notes"),
  sessionDate: timestamp("session_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friendships table
export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: varchar("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { enum: ["pending", "accepted", "declined"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friend invitations table (for email invites)
export const friendInvitations = pgTable("friend_invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  inviterUserId: varchar("inviter_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  message: text("message"),
  token: varchar("token").notNull().unique(),
  status: varchar("status", { enum: ["pending", "accepted", "expired"] }).default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  subjects: many(subjects),
  studySessions: many(studySessions),
  sentFriendRequests: many(friendships, { relationName: "requester" }),
  receivedFriendRequests: many(friendships, { relationName: "addressee" }),
  sentInvitations: many(friendInvitations),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  user: one(users, {
    fields: [subjects.userId],
    references: [users.id],
  }),
  studySessions: many(studySessions),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [studySessions.subjectId],
    references: [subjects.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, {
    fields: [friendships.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  addressee: one(users, {
    fields: [friendships.addresseeId],
    references: [users.id],
    relationName: "addressee",
  }),
}));

export const friendInvitationsRelations = relations(friendInvitations, ({ one }) => ({
  inviter: one(users, {
    fields: [friendInvitations.inviterUserId],
    references: [users.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export const insertStudySessionSchema = createInsertSchema(studySessions, {
  sessionDate: z.string().transform((str) => new Date(str)),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

export const insertFriendInvitationSchema = createInsertSchema(friendInvitations).omit({
  id: true,
  inviterUserId: true,
  token: true,
  expiresAt: true,
  createdAt: true,
});
export type InsertFriendInvitation = z.infer<typeof insertFriendInvitationSchema>;
export type FriendInvitation = typeof friendInvitations.$inferSelect;

export type UserWithStats = User & {
  totalStudyHours: number;
  activeSubjectsCount: number;
  currentStreak: number;
  weeklyHours: number;
};

export type SubjectWithStats = Subject & {
  totalHours: number;
  sessionsCount: number;
  lastStudyDate: Date | null;
  weeklyProgress: number;
};

export type FriendWithStats = User & {
  todayHours: number;
  weeklyHours: number;
  isOnline: boolean;
  friendship: Friendship;
};
