const request = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
};

function commenterHeaders() {
  let commenterId = sessionStorage.getItem("medasport-commenter-id");
  if (!commenterId) {
    if (crypto.randomUUID) {
      commenterId = crypto.randomUUID();
    } else {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      commenterId = [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
      ].join("-");
    }
    sessionStorage.setItem("medasport-commenter-id", commenterId);
  }
  return { "X-Commenter-Id": commenterId };
}

export const api = {
  home: (page) => request(`/posts?page=${page || 1}`),
  posts: () => request("/admin/posts"),
  post: (id) => request(`/posts/${id}`, { headers: commenterHeaders() }),
  likePost: (id) => request(`/posts/${id}/like`, { method: "POST" }),
  commentPost: (id, body) =>
    request(`/posts/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: commenterHeaders(),
    }),
  updatePostComment: (id, commentId, body) =>
    request(`/posts/${id}/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: commenterHeaders(),
    }),
  deletePostComment: (id, commentId) =>
    request(`/posts/${id}/comments/${commentId}`, {
      method: "DELETE",
      headers: commenterHeaders(),
    }),
  highlights: () => request("/highlights"),
  highlight: (id) =>
    request(`/highlights/${id}`, { headers: commenterHeaders() }),
  likeHighlight: (id) => request(`/highlights/${id}/like`, { method: "POST" }),
  commentHighlight: (id, body) =>
    request(`/highlights/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: commenterHeaders(),
    }),
  updateHighlightComment: (id, commentId, body) =>
    request(`/highlights/${id}/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: commenterHeaders(),
    }),
  deleteHighlightComment: (id, commentId) =>
    request(`/highlights/${id}/comments/${commentId}`, {
      method: "DELETE",
      headers: commenterHeaders(),
    }),
  competition: (slug) => request(`/competitions/${slug}`),
  search: (query) => request(`/search?q=${encodeURIComponent(query)}`),
  adminStatus: () => request("/admin/me"),
  login: (type, credentials) =>
    request("/admin/login", {
      method: "POST",
      body: JSON.stringify({ type, ...credentials }),
    }),
  logout: () => request("/admin/logout", { method: "POST" }),
  savePost: (id, post) =>
    request(id ? `/admin/posts/${id}` : "/admin/posts", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(post),
    }),
  deletePost: (id) => request(`/admin/posts/${id}`, { method: "DELETE" }),
  saveHighlight: (highlight) =>
    request("/admin/highlights", {
      method: "POST",
      body: JSON.stringify(highlight),
    }),
  deleteHighlight: (id) =>
    request(`/admin/highlights/${id}`, { method: "DELETE" }),
  contact: (body) =>
    request("/contact", { method: "POST", body: JSON.stringify(body) }),
};
