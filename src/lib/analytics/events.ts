/** Product analytics event names (PostHog) — keep stable for dashboards */

export const AnalyticsEvents = {
  SIGNUP: 'signup',
  DECK_CREATED: 'deck_created',
  DECK_IMPORTED: 'deck_imported',
  AI_ANALYSIS_RUN: 'ai_analysis_run',
  AI_BUILDER_USED: 'ai_builder_used',
  PLAYTEST_STARTED: 'playtest_started',
  CARD_SEARCHED: 'card_searched',
  BLOG_POST_READ: 'blog_post_read',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  PROFILE_VISITED: 'profile_visited',
  NPS_SUBMITTED: 'nps_submitted',
  ONBOARDING_ANSWERED: 'onboarding_answered',
  DECK_COMMENTED: 'deck_commented',
  DECK_LIKED: 'deck_liked',
  FOLLOW_CREATED: 'follow_created',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
