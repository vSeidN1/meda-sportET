<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { api } from "../api";

const ETHIOPIA_TIME_ZONE = "Africa/Addis_Ababa";
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: ETHIOPIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const props = defineProps({ section: String });
const router = useRouter();
const user = ref(null);
const loading = ref(true);
const busy = ref(false);
const error = ref("");
const notice = ref("");
const active = ref(props.section === "highlights" ? "highlights" : "posts");
const credentials = reactive({ username: "", password: "" });
const posts = ref([]);
const highlights = ref([]);
const editing = ref(null);
const postForm = reactive({
  title: "",
  image: "",
  summary: "",
  category: "Breaking News",
  author: "MedaSport Admin",
});
const highlightForm = reactive({
  title: "",
  youtube_link: "",
  description: "",
});
const categories = [
  "Transfer",
  "Breaking News",
  "Injury Update",
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Champions League",
  "Europa League",
  "Match Review",
  "Pre-match Review",
  "Post-match Review",
  "Other Sports",
];
async function refresh() {
  try {
    if (user.value.type === "posts") posts.value = await api.posts();
    else highlights.value = await api.highlights();
  } catch (err) {
    error.value = err.message;
  }
}
async function initialize() {
  loading.value = true;
  try {
    user.value = await api.adminStatus();
    if (user.value.authenticated) {
      active.value = user.value.type;
      if (props.section && props.section !== user.value.type)
        router.replace(`/admin/${user.value.type}`);
      await refresh();
    }
  } catch {
    user.value = { authenticated: false };
  } finally {
    loading.value = false;
  }
}
onMounted(initialize);
watch(
  () => props.section,
  (section) => {
    if (user.value?.authenticated && section !== user.value.type)
      router.replace(`/admin/${user.value.type}`);
    else if (!user.value?.authenticated && section) active.value = section;
  },
);
async function signIn() {
  error.value = "";
  busy.value = true;
  try {
    user.value = await api.login(active.value, credentials);
    credentials.password = "";
    await router.replace(`/admin/${user.value.type}`);
    await refresh();
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
async function signOut() {
  await api.logout();
  user.value = { authenticated: false };
  router.push("/admin");
}
function editPost(post) {
  editing.value = post.id;
  Object.assign(postForm, {
    title: post.title,
    image: post.image || "",
    summary: post.summary,
    category: post.category || "Breaking News",
    author: post.author || "MedaSport Admin",
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function resetPost() {
  editing.value = null;
  Object.assign(postForm, {
    title: "",
    image: "",
    summary: "",
    category: "Breaking News",
    author: "MedaSport Admin",
  });
}
async function savePost() {
  busy.value = true;
  error.value = "";
  try {
    await api.savePost(editing.value, postForm);
    notice.value = editing.value ? "Article updated." : "Article published.";
    resetPost();
    await refresh();
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
async function removePost(id) {
  if (!confirm("Delete this article?")) return;
  try {
    await api.deletePost(id);
    await refresh();
  } catch (err) {
    error.value = err.message;
  }
}
async function saveHighlight() {
  busy.value = true;
  error.value = "";
  try {
    await api.saveHighlight(highlightForm);
    Object.assign(highlightForm, {
      title: "",
      youtube_link: "",
      description: "",
    });
    notice.value = "Highlight added.";
    await refresh();
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
async function removeHighlight(id) {
  if (!confirm("Delete this highlight?")) return;
  try {
    await api.deleteHighlight(id);
    await refresh();
  } catch (err) {
    error.value = err.message;
  }
}
</script>
<template>
  <div class="container page-section">
    <div class="eyebrow">MedaSport newsroom</div>
    <h1 class="section-heading">Editorial desk</h1>
    <p class="section-subtitle">Manage articles and match highlights.</p>
    <div v-if="loading" class="loading">Checking newsroom access…</div>
    <form
      v-else-if="!user?.authenticated"
      class="form-card"
      style="max-width: 440px; margin: 28px auto"
      @submit.prevent="signIn"
    >
      <h2 class="section-heading" style="font-size: 22px">Staff sign in</h2>
      <p class="section-subtitle" style="margin-bottom: 20px">
        Choose the newsroom account you want to access.
      </p>
      <div class="tab-list">
        <button
          type="button"
          :class="{ active: active === 'posts' }"
          @click="active = 'posts'"
        >
          News desk</button
        ><button
          type="button"
          :class="{ active: active === 'highlights' }"
          @click="active = 'highlights'"
        >
          Highlights desk
        </button>
      </div>
      <label
        >Username<input
          v-model="credentials.username"
          class="field"
          autocomplete="username"
          required /></label
      ><label
        >Password<input
          v-model="credentials.password"
          class="field"
          type="password"
          autocomplete="current-password"
          required
      /></label>
      <p v-if="error" class="notice error">{{ error }}</p>
      <button
        class="button-primary"
        style="width: 100%; margin-top: 14px"
        :disabled="busy"
      >
        {{ busy ? "Signing in…" : "Sign in securely" }}
      </button>
    </form>
    <div v-else class="admin-layout" style="margin-top: 28px">
      <aside class="admin-sidebar">
        <strong style="display: block; padding: 10px 11px 15px">Newsroom</strong
        ><RouterLink
          v-if="user.type === 'posts'"
          to="/admin/posts"
          :class="{ active: active === 'posts' }"
          >News articles</RouterLink
        ><RouterLink
          v-if="user.type === 'highlights'"
          to="/admin/highlights"
          :class="{ active: active === 'highlights' }"
          >Match highlights</RouterLink
        ><button @click="signOut">Sign out</button>
      </aside>
      <section class="admin-main">
        <div class="admin-card">
          <div class="section-row" style="align-items: center">
            <div>
              <h2 class="section-heading" style="font-size: 22px">
                {{
                  active === "posts"
                    ? editing
                      ? "Edit article"
                      : "Publish an article"
                    : "Add match highlight"
                }}
              </h2>
              <p class="section-subtitle">
                {{
                  active === "posts"
                    ? "Write and publish a story for the MedaSport community."
                    : "Add a YouTube highlight to the match library."
                }}
              </p>
            </div>
          </div>
          <form
            v-if="active === 'posts'"
            class="admin-form"
            @submit.prevent="savePost"
          >
            <input
              v-model.trim="postForm.title"
              class="field wide"
              placeholder="Article headline"
              required
              maxlength="240"
            /><input
              v-model="postForm.image"
              class="field wide"
              placeholder="Image URL (optional)"
            /><select v-model="postForm.category" class="field">
              <option v-for="category in categories" :key="category">
                {{ category }}
              </option></select
            ><input
              v-model="postForm.author"
              class="field"
              placeholder="Author"
            /><textarea
              v-model.trim="postForm.summary"
              class="field wide"
              placeholder="Write the full story…"
              required
              maxlength="30000"
            />
            <div class="wide" style="display: flex; gap: 9px">
              <button class="button-primary" :disabled="busy">
                {{
                  busy
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Publish article"
                }}</button
              ><button
                v-if="editing"
                type="button"
                class="button-secondary"
                @click="resetPost"
              >
                Cancel
              </button>
            </div>
          </form>
          <form v-else class="admin-form" @submit.prevent="saveHighlight">
            <input
              v-model.trim="highlightForm.title"
              class="field wide"
              placeholder="Match title"
              required
              maxlength="240"
            /><input
              v-model.trim="highlightForm.youtube_link"
              class="field wide"
              placeholder="YouTube link or embed URL"
              required
            /><textarea
              v-model="highlightForm.description"
              class="field wide"
              placeholder="Short match description"
              maxlength="3000"
            /><button class="button-primary wide" :disabled="busy">
              {{ busy ? "Saving…" : "Add highlight" }}
            </button>
          </form>
          <p v-if="notice" class="notice" style="margin-top: 14px">
            {{ notice }}
          </p>
          <p v-if="error" class="notice error" style="margin-top: 14px">
            {{ error }}
          </p>
        </div>
        <div class="admin-card admin-list">
          <div class="section-row">
            <h2 class="section-heading" style="font-size: 20px">
              {{
                active === "posts" ? "Published articles" : "Recent highlights"
              }}
            </h2>
            <span class="pill"
              >{{
                active === "posts" ? posts.length : highlights.length
              }}
              total</span
            >
          </div>
          <template v-if="active === 'posts'"
            ><div v-for="post in posts" :key="post.id" class="admin-item">
              <div>
                <h4>{{ post.title }}</h4>
                <small>{{ post.category }} · {{ post.author }}</small>
              </div>
              <div class="admin-item-actions">
                <button class="small-button" @click="editPost(post)">
                  Edit</button
                ><button
                  class="small-button danger"
                  @click="removePost(post.id)"
                >
                  Delete
                </button>
              </div>
            </div></template
          ><template v-else
            ><div v-for="item in highlights" :key="item.id" class="admin-item">
              <div>
                <h4>{{ item.title }}</h4>
                <small>{{ formatDate(item.created_at) }}</small>
              </div>
              <button
                class="small-button danger"
                @click="removeHighlight(item.id)"
              >
                Delete
              </button>
            </div></template
          >
          <div
            v-if="(active === 'posts' ? posts : highlights).length === 0"
            class="empty-state"
          >
            Nothing published yet.
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
