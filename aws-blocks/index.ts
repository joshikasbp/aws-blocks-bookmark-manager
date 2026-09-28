import { ApiNamespace, Scope, AuthBasic, DistributedTable } from '@aws-blocks/blocks';
import { z } from 'zod';

const scope = new Scope('bookmark-app');

// Authentication
const auth = new AuthBasic(scope, 'auth', {
  passwordPolicy: { minLength: 8 },
  crossDomain: process.env.BLOCKS_SANDBOX === 'true',
});

export const authApi = auth.createApi();

// Bookmark data model
const bookmarkSchema = z.object({
  userId: z.string(),
  bookmarkId: z.string(),
  url: z.string(),
  title: z.string(),
  tag: z.string(),
  createdAt: z.number(),
});

const bookmarks = new DistributedTable(scope, 'bookmarks', {
  schema: bookmarkSchema,
  key: {
    partitionKey: 'userId',
    sortKey: 'bookmarkId',
  },
});

// API
export const api = new ApiNamespace(scope, 'api', (context) => ({

  // Create a bookmark
  async createBookmark(input: {
    url: string;
    title: string;
    tag: string;
  }) {
    const user = await auth.requireAuth(context);

    if (!input.url.trim()) {
      throw new Error('URL is required');
    }

    if (!input.title.trim()) {
      throw new Error('Title is required');
    }

    const bookmarkId =
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const bookmark = {
      userId: user.username,
      bookmarkId,
      url: input.url.trim(),
      title: input.title.trim(),
      tag: input.tag.trim(),
      createdAt: Date.now(),
    };

    await bookmarks.put(bookmark);

    return bookmark;
  },

  // List only the current user's bookmarks
  async listBookmarks() {
    const user = await auth.requireAuth(context);

    return await Array.fromAsync(
      bookmarks.query({
        where: {
          userId: {
            equals: user.username,
          },
        },
      })
    );
  },

  // Delete only the current user's bookmark
  async deleteBookmark(bookmarkId: string) {
    const user = await auth.requireAuth(context);

    await bookmarks.delete({
      userId: user.username,
      bookmarkId,
    });

    return { success: true };
  },
}));