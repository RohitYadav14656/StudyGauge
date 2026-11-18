import Integration from '../models/Integration.js';
import StudySession from '../models/StudySession.js';
import Notification from '../models/Notification.js';

export const SUPPORTED_PROVIDERS = [
  {
    provider: 'google-calendar',
    name: 'Google Calendar',
    category: 'Calendar & Scheduling',
    description: 'Sync exam countdowns, scheduled study blocks, and mock test slots with Google Calendar.',
    icon: '📅',
    color: '#4285F4',
    authType: 'OAuth 2.0',
    capabilities: ['Two-way event sync', 'Study time blocking', 'Exam date reminders'],
  },
  {
    provider: 'notion',
    name: 'Notion Workspace',
    category: 'Notes & Documentation',
    description: 'Connect your revision databases, formula sheets, and study notes directly to topic modules.',
    icon: '📝',
    color: '#000000',
    authType: 'OAuth 2.0',
    capabilities: ['Topic notes linking', 'Formula sheet sync', 'Revision checklist import'],
  },
  {
    provider: 'todoist',
    name: 'Todoist',
    category: 'Task Management',
    description: 'Export daily adaptive study planner tasks to your favorite task list manager.',
    icon: '✅',
    color: '#E44332',
    authType: 'OAuth 2.0',
    capabilities: ['Daily tasks export', 'Task completion two-way sync', 'Priority mapping'],
  },
  {
    provider: 'github',
    name: 'GitHub / Coding Activity',
    category: 'Development & Problem Solving',
    description: 'Track daily problem solving consistency, coding commit streaks, and technical projects.',
    icon: '🐙',
    color: '#24292E',
    authType: 'OAuth 2.0 / PAT',
    capabilities: ['Streak aggregation', 'Commit consistency tracking', 'DSA project logs'],
  },
  {
    provider: 'anki',
    name: 'Anki Spaced Repetition',
    category: 'Flashcards & Memory',
    description: 'Synchronize flashcard reviews with StudyGauge Spaced Revision intervals.',
    icon: '🗂️',
    color: '#2B7CB9',
    authType: 'AnkiConnect API',
    capabilities: ['Deck stats import', 'Spaced interval sync', 'Card review counters'],
  },
];

export const getIntegrations = async (userId) => {
  const activeIntegrations = await Integration.find({ userId }).lean();
  const integrationMap = new Map();

  for (const item of activeIntegrations) {
    integrationMap.set(item.provider, item);
  }

  return SUPPORTED_PROVIDERS.map((p) => {
    const existing = integrationMap.get(p.provider);
    return {
      ...p,
      isConnected: !!existing && existing.status === 'connected',
      accountName: existing?.accountName || null,
      lastSyncAt: existing?.lastSyncAt || null,
      status: existing?.status || 'disconnected',
      connectedAt: existing?.createdAt || null,
    };
  });
};

export const connectIntegration = async (userId, provider, data = {}) => {
  const validProvider = SUPPORTED_PROVIDERS.find((p) => p.provider === provider);
  if (!validProvider) {
    throw new Error(`Unsupported integration provider: ${provider}`);
  }

  const accountName = data.accountName || `student@${provider}.org`;
  const accessToken = data.accessToken || `demo_access_token_${Date.now()}`;

  const updated = await Integration.findOneAndUpdate(
    { userId, provider },
    {
      userId,
      provider,
      accessToken,
      accountName,
      status: 'connected',
      lastSyncAt: new Date(),
      settings: data.settings || {},
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Notification.create({
    userId,
    title: `${validProvider.name} Connected`,
    message: `Your ${validProvider.name} account (${accountName}) was successfully authorized and integrated with StudyGauge.`,
    type: 'system',
    isRead: false,
  }).catch(() => null);

  return {
    provider,
    name: validProvider.name,
    accountName: updated.accountName,
    isConnected: true,
    lastSyncAt: updated.lastSyncAt,
    status: updated.status,
  };
};

export const disconnectIntegration = async (userId, provider) => {
  const res = await Integration.findOneAndDelete({ userId, provider });
  if (!res) {
    throw new Error(`Integration with ${provider} not found or already disconnected`);
  }

  return {
    provider,
    isConnected: false,
    message: `Successfully disconnected ${provider}`,
  };
};

export const syncIntegration = async (userId, provider) => {
  const integration = await Integration.findOne({ userId, provider });
  if (!integration || integration.status !== 'connected') {
    throw new Error(`Provider ${provider} is not currently connected.`);
  }

  integration.lastSyncAt = new Date();
  await integration.save();

  let message = `Successfully synchronized latest data from ${provider}.`;
  let syncedCount = 3;

  if (provider === 'google-calendar') {
    await StudySession.create({
      userId,
      studyType: 'Revision',
      durationMinutes: 45,
      date: new Date(),
      notes: '[Google Calendar Sync] 45 min scheduled focus block logged.',
    }).catch(() => null);
    message = 'Synced 2 upcoming exam deadlines and 3 scheduled daily study blocks with Google Calendar.';
    syncedCount = 5;
  } else if (provider === 'notion') {
    await Notification.create({
      userId,
      title: 'Notion Database Synced',
      message: 'Linked 4 study note databases and 1 formula repository from Notion Workspace.',
      type: 'system',
      isRead: false,
    }).catch(() => null);
    message = 'Synced 4 study note databases and 1 formula repository from Notion Workspace.';
    syncedCount = 5;
  } else if (provider === 'todoist') {
    message = 'Exported 3 pending daily study tasks to Todoist with two-way completion sync.';
    syncedCount = 3;
  } else if (provider === 'github') {
    await StudySession.create({
      userId,
      studyType: 'Practice',
      durationMinutes: 60,
      date: new Date(),
      notes: '[GitHub Activity Sync] 5 code commits and problem solutions logged.',
    }).catch(() => null);
    message = 'Imported 5 daily GitHub commits and problem solutions into your consistency streak.';
    syncedCount = 5;
  } else if (provider === 'anki') {
    message = 'Synchronized 24 Anki flashcard reviews with StudyGauge SM-2 spaced revision intervals.';
    syncedCount = 24;
  }

  return {
    provider,
    status: 'synced',
    lastSyncAt: integration.lastSyncAt,
    syncedItemsCount: syncedCount,
    message,
  };
};

export const connectAllDemo = async (userId) => {
  const defaultAccounts = {
    'google-calendar': 'student.prep@gmail.com',
    notion: 'Ajeet / StudyGauge Workspace',
    todoist: 'Todoist Premium Account',
    github: 'github.com/student-dev',
    anki: 'AnkiConnect Local Sync',
  };

  const results = [];
  for (const p of SUPPORTED_PROVIDERS) {
    const accountName = defaultAccounts[p.provider] || `${p.name} Demo Account`;
    const updated = await Integration.findOneAndUpdate(
      { userId, provider: p.provider },
      {
        userId,
        provider: p.provider,
        accessToken: `demo_token_${p.provider}_${Date.now()}`,
        accountName,
        status: 'connected',
        lastSyncAt: new Date(),
        settings: { demo: true },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.push(updated);
  }

  await Notification.create({
    userId,
    title: 'All External Services Connected',
    message: 'Google Calendar, Notion, Todoist, GitHub, and Anki are now fully connected and synced for live demonstration.',
    type: 'system',
    isRead: false,
  }).catch(() => null);

  return results;
};

export const syncAllIntegrations = async (userId) => {
  const connectedList = await Integration.find({ userId, status: 'connected' });
  const results = [];

  for (const item of connectedList) {
    try {
      const res = await syncIntegration(userId, item.provider);
      results.push(res);
    } catch (e) {
      // ignore individual failure
    }
  }

  return results;
};

