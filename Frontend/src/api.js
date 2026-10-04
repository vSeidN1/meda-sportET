const request = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
};

export const api = {
  home: (page) => request(`/posts?page=${page || 1}`),
  posts: () => request("/admin/posts"),
  post: (id) => request(`/posts/${id}`),
  likePost: (id) => request(`/posts/${id}/like`, { method: "POST" }),
  commentPost: (id, body) =>
    request(`/posts/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePostComment: (id, commentId, body) =>
    request(`/posts/${id}/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deletePostComment: (id, commentId, body) =>
    request(`/posts/${id}/comments/${commentId}`, {
      method: "DELETE",
      body: JSON.stringify(body),
    }),
  highlights: () => request("/highlights"),
  highlight: (id) => request(`/highlights/${id}`),
  likeHighlight: (id) => request(`/highlights/${id}/like`, { method: "POST" }),
  commentHighlight: (id, body) =>
    request(`/highlights/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateHighlightComment: (id, commentId, body) =>
    request(`/highlights/${id}/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteHighlightComment: (id, commentId, body) =>
    request(`/highlights/${id}/comments/${commentId}`, {
      method: "DELETE",
      body: JSON.stringify(body),
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
