import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const learnerProgress = sqliteTable('learner_progress', {
  userId: text('user_id').primaryKey(),
  revision: integer('revision').notNull(),
  payload: text('payload').notNull(),
  lastWriteId: text('last_write_id').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const diagnosticCompletions = sqliteTable('diagnostic_completions', {
  userId: text('user_id').notNull(),
  track: text('track').notNull(),
  completedAt: text('completed_at').notNull(),
  attemptId: text('attempt_id').notNull(),
}, table => [
  primaryKey({columns:[table.userId,table.track]}),
  index('idx_diagnostic_completions_user').on(table.userId),
]);

export const studentAccounts = sqliteTable('student_accounts', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('student'),
  region: text('region'),
  regionUpdatedAt: integer('region_updated_at'),
  profileImage: text('profile_image'),
  recoveryHash: text('recovery_hash'),
  recoveryCreatedAt: integer('recovery_created_at'),
  createdAt: integer('created_at').notNull(),
});
export const studentSessions = sqliteTable('student_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  studentId: text('student_id').notNull().references(()=>studentAccounts.id,{onDelete:'cascade'}),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at'),
}, table=>[index('idx_student_sessions_expiry').on(table.expiresAt),index('idx_student_sessions_student').on(table.studentId)]);
export const authAttempts = sqliteTable('auth_attempts', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull(),
},table=>[index('idx_auth_attempts_expiry').on(table.expiresAt)]);

export const questionReports = sqliteTable('question_reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  attemptId: text('attempt_id').notNull(),
  questionId: text('question_id').notNull(),
  questionVersion: integer('question_version').notNull(),
  category: text('category').notNull(),
  note: text('note').notNull().default(''),
  status: text('status').notNull().default('open'),
  createdAt: integer('created_at').notNull(),
  reviewedAt: integer('reviewed_at'),
  reviewedBy: text('reviewed_by'),
  resolutionNote: text('resolution_note').notNull().default(''),
}, table => [
  uniqueIndex('question_reports_unique_item').on(table.userId,table.attemptId,table.questionId,table.questionVersion,table.category),
  index('idx_question_reports_status').on(table.status,table.createdAt),
]);

export const questionSessions = sqliteTable('question_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  mode: text('mode').notNull(),
  track: text('track').notNull(),
  questionIds: text('question_ids').notNull(),
  lastRevealed: integer('last_revealed').notNull().default(-1),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [
  index('idx_question_sessions_user').on(table.userId,table.createdAt),
  index('idx_question_sessions_expiry').on(table.expiresAt),
]);

export const contentReviews = sqliteTable('content_reviews', {
  questionId: text('question_id').notNull(),
  questionVersion: integer('question_version').notNull(),
  status: text('status').notNull().default('unreviewed'),
  note: text('note').notNull().default(''),
  reviewedBy: text('reviewed_by'),
  reviewedAt: integer('reviewed_at'),
}, table => [
  primaryKey({columns:[table.questionId,table.questionVersion]}),
  index('idx_content_reviews_status').on(table.status,table.reviewedAt),
]);
