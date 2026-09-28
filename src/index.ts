import { api, authApi } from 'aws-blocks';
import { AccountMenuBar, AuthenticatedContent } from '@aws-blocks/blocks/ui';
import { html, render } from 'lit-html';

const menuBarEl = document.getElementById('menu-bar')!;
menuBarEl.appendChild(AccountMenuBar(authApi));

const signInMessage = document.createElement('p');
signInMessage.textContent = 'Sign in to get started.';

document.getElementById('app')!.appendChild(
  AuthenticatedContent(authApi, () => {
    const container = document.createElement('div');

    type Bookmark = {
      bookmarkId: string;
      url: string;
      title: string;
      tag: string;
      createdAt: number;
    };

    let bookmarks: Bookmark[] = [];

    async function load() {
      try {
        bookmarks = await api.listBookmarks();
        redraw();
      } catch (error) {
        console.error(error);
      }
    }

    function redraw() {
      render(html`
        <h2>Personal Bookmark Manager</h2>

        <div style="display:flex;flex-direction:column;gap:8px;max-width:600px;margin-bottom:20px">
          <input
            id="bookmark-url"
            type="url"
            placeholder="URL"
          />

          <input
            id="bookmark-title"
            type="text"
            placeholder="Title"
          />

          <input
            id="bookmark-tag"
            type="text"
            placeholder="Tag"
          />

          <button @click=${addBookmark}>
            Add Bookmark
          </button>
        </div>

        <h3>My Bookmarks</h3>

        ${
          bookmarks.length === 0
            ? html`<p>No bookmarks yet.</p>`
            : html`
                <ul>
                  ${bookmarks.map(
                    (bookmark) => html`
                      <li style="margin-bottom:12px">
                        <div>
                          <strong>${bookmark.title}</strong>
                        </div>

                        <div>
                          <a
                            href=${bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ${bookmark.url}
                          </a>
                        </div>

                        <div>
                          Tag: ${bookmark.tag || 'No tag'}
                        </div>

                        <button
                          @click=${() => removeBookmark(bookmark.bookmarkId)}
                        >
                          Delete
                        </button>
                      </li>
                    `
                  )}
                </ul>
              `
        }
      `, container);
    }

    async function addBookmark() {
      const urlInput =
        container.querySelector('#bookmark-url') as HTMLInputElement;

      const titleInput =
        container.querySelector('#bookmark-title') as HTMLInputElement;

      const tagInput =
        container.querySelector('#bookmark-tag') as HTMLInputElement;

      const url = urlInput.value.trim();
      const title = titleInput.value.trim();
      const tag = tagInput.value.trim();

      if (!url) {
        alert('Please enter a URL.');
        return;
      }

      if (!title) {
        alert('Please enter a title.');
        return;
      }

      try {
        await api.createBookmark({
          url,
          title,
          tag,
        });

        urlInput.value = '';
        titleInput.value = '';
        tagInput.value = '';

        await load();
      } catch (error) {
        console.error(error);
        alert('Failed to create bookmark.');
      }
    }

    async function removeBookmark(bookmarkId: string) {
      try {
        await api.deleteBookmark(bookmarkId);
        await load();
      } catch (error) {
        console.error(error);
        alert('Failed to delete bookmark.');
      }
    }

    load();

    return container;
  }, signInMessage)
);