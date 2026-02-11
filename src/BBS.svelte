<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';

  let posts = [];
  let username = 'Anonymous';
  let newComment = '';
  let isLoading = true;

  // State for inline editing
  let editingPostId = null;
  let editText = '';

  const apiUrl = '/api_v2/bbs'; // Use relative URL for Firebase Hosting rewrite

  onMount(async () => {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      posts = data.sort((a, b) => {
        const dateA = a.createdAt?._seconds || a.createdAt;
        const dateB = b.createdAt?._seconds || b.createdAt;
        return new Date(dateB * 1000) - new Date(dateA * 1000);
      });
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  });

  async function handleSubmit() {
    if (!newComment.trim()) return;
    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newPost = {
      id: tempId,
      username: username.trim() || 'Anonymous',
      content: newComment.trim(),
      createdAt: { _seconds: Math.floor(Date.now() / 1000) } // Mock timestamp
    };
    posts = [newPost, ...posts];
    const commentToSubmit = newComment;
    newComment = '';
    
    try {
      const res = await fetch(apiUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ content: commentToSubmit, username: username.trim() || 'Anonymous' }) 
      });
      const savedPost = await res.json();
      // Replace temporary post with the real one from the server
      posts = posts.map(p => p.id === tempId ? savedPost : p);
    } catch (err) {
      console.error("Submit Error:", err);
      // Rollback on error
      posts = posts.filter(p => p.id !== tempId);
    }
  }

  function startEditing(post) {
    editingPostId = post.id;
    editText = post.content;
  }

  function cancelEditing() {
    editingPostId = null;
    editText = '';
  }

  async function handleUpdate(postId) {
    if (!editText.trim()) return;
    const originalPosts = [...posts];
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    // Optimistic UI update
    posts[postIndex] = { ...posts[postIndex], content: editText };
    const newText = editText;
    cancelEditing();

    try {
      await fetch(`${apiUrl}/${postId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newText }) });
    } catch (err) {
      console.error("Update Error:", err);
      posts = originalPosts; // Rollback on error
    }
  }

  async function handleDelete(postId) {
    const originalPosts = [...posts];
    posts = posts.filter(p => p.id !== postId);
    try {
      await fetch(`${apiUrl}/${postId}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Delete Error:", err);
      posts = originalPosts; // Rollback on error
    }
  }

</script>

<main class="main-container">
    <a href="/" class="back-link">&larr; Back to Rankings</a>
    <div class="grid-container">
        <!-- Submission Card -->
        <div class="card form-card">
            <textarea bind:value={newComment} class="textarea-field" placeholder="Share something simple..."></textarea>
            <div class="form-footer">
                <button on:click={handleSubmit} class="submit-btn" disabled={!newComment.trim()}>Post</button>
            </div>
        </div>

        <!-- Post Cards -->
        {#if isLoading}
            <div class="card"><p>Loading posts...</p></div>
        {/if}
        {#each posts.slice(0, 15) as post (post.id)}
            <div animate:flip={{duration: 500}} class="card">
                {#if editingPostId === post.id}
                    <div class="edit-view">
                        <textarea bind:value={editText} class="textarea-field edit-area"></textarea>
                        <div class="edit-actions">
                            <button on:click={() => handleUpdate(post.id)} class="edit-btn save">Save</button>
                            <button on:click={cancelEditing} class="edit-btn cancel">Cancel</button>
                        </div>
                    </div>
                {:else}
                    <p class="card-content">{post.content}</p>
                    <div class="card-footer">
                        <span>{post.username}</span>
                        <div class="card-actions">
                            <button on:click={() => startEditing(post)} class="action-btn">Edit</button>
                            <button on:click={() => handleDelete(post.id)} class="action-btn delete">Delete</button>
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</main>

<style>
  :global(body) { background-color: #0F0F0F; color: #e5e5e5; font-family: 'Inter', sans-serif; }
  .main-container { padding: 2rem; }
  .back-link { position: fixed; top: 1rem; left: 1rem; color: #6b7280; text-decoration: none; font-size: 0.875rem; z-index: 10; background: rgba(15,15,15,0.8); padding: 0.5rem 1rem; border-radius: 99px; backdrop-filter: blur(8px); }
  .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; max-width: 1600px; margin: 3rem auto; }

  .card { background: #1C1C1C; border: 1px solid #333; border-radius: 1rem; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; aspect-ratio: 1 / 1; transition: all 0.2s ease-out; position: relative; }
  .card:hover { transform: translateY(-4px); border-color: #555; }
  
  .card-content { margin: 0; font-size: 1rem; line-height: 1.6; white-space: pre-wrap; overflow-y: auto; flex-grow: 1; }
  .card-footer { font-size: 0.8rem; color: #888; padding-top: 1rem; border-top: 1px solid #333; margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; }
  
  .form-card { border-color: #4A90E2; display: flex; flex-direction: column; }
  .textarea-field { width: 100%; background: transparent; border: none; color: white; font-size: 1rem; resize: none; flex-grow: 1; }
  .textarea-field:focus { outline: none; }
  .form-footer { border: none; padding: 0; margin-top: 1rem; }
  .submit-btn { width: 100%; padding: 0.75rem; background: #4A90E2; color: white; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; transition: background 0.2s; }
  .submit-btn:disabled { background: #333; cursor: not-allowed; }

  /* Edit/Delete Actions */
  .action-btn { background: none; border: 1px solid #444; color: #888; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
  .action-btn:hover { color: white; border-color: #666; }
  .action-btn.delete:hover { color: #ff5e5e; border-color: #ff5e5e; }
  .card-actions { display: flex; gap: 0.5rem; opacity: 0; transition: opacity 0.2s; }
  .card:hover .card-actions { opacity: 1; }

  /* Edit View */
  .edit-view { display: flex; flex-direction: column; height: 100%; }
  .edit-area { flex-grow: 1; margin-bottom: 1rem; }
  .edit-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
  .edit-btn { padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; font-weight: bold; cursor: pointer; }
  .edit-btn.save { background: #34A853; color: white; }
  .edit-btn.cancel { background: #555; color: #ddd; }
</style>