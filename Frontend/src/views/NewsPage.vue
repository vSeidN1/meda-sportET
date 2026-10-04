<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  CalendarDays,
  Eye,
  Heart,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
} from "lucide-vue-next";
import { api } from "../api";

const ETHIOPIA_TIME_ZONE = "Africa/Addis_Ababa";
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: ETHIOPIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: ETHIOPIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

const COMMENT_NAME_KEY = "medasport-comment-name";
const props = defineProps({ id: { type: String, required: true } });
const route = useRoute();
const item = ref(null);
const loading = ref(true);
const error = ref("");
const name = ref("");
const comment = ref("");
const sending = ref(false);
const editingCommentId = ref(null);
const isHighlight = computed(
  () => route.meta.highlight === true || route.path.startsWith("/highlights/"),
);
const currentUserName = computed(() => name.value.trim());
const itemApi = () =>
  isHighlight.value ? api.highlight(props.id) : api.post(props.id);

function persistName() {
  const trimmed = name.value.trim();
  if (trimmed) localStorage.setItem(COMMENT_NAME_KEY, trimmed);
  else localStorage.removeItem(COMMENT_NAME_KEY);
}

function isOwnComment(entry) {
  return Boolean(
    entry &&
    currentUserName.value &&
    entry.name?.trim().toLowerCase() === currentUserName.value.toLowerCase(),
  );
}

function startEditing(entry) {
  editingCommentId.value = entry.id;
  name.value = entry.name;
  comment.value = entry.comment_text;
  persistName();
}

function cancelEditing() {
  editingCommentId.value = null;
  comment.value = "";
}

async function deleteComment(entry) {
  if (!window.confirm("Delete this comment?")) return;
  error.value = "";
  try {
    const requestBody = { name: name.value.trim() };
    if (isHighlight.value) {
      await api.deleteHighlightComment(props.id, entry.id, requestBody);
    } else {
      await api.deletePostComment(props.id, entry.id, requestBody);
    }
    item.value.comments = item.value.comments.filter(
      (itemEntry) => itemEntry.id !== entry.id,
    );
  } catch (err) {
    error.value = err.message;
  }
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    item.value = await itemApi();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const savedName = localStorage.getItem(COMMENT_NAME_KEY) || "";
  if (savedName) name.value = savedName;
  load();
});
watch(() => [props.id, route.meta.highlight], load);
watch(name, () => persistName());

function focusCommentInput() {
  if (route.hash !== "#comment-input") return;
  nextTick(() => {
    const input = document.getElementById("comment-input");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  });
}

watch(() => route.hash, focusCommentInput);
watch(item, focusCommentInput);

const embed = computed(() => {
  const url = item.value?.youtube_link || "";
  if (url.includes("youtube.com/embed/")) return url;
  const id = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
});

async function toggleLike() {
  try {
    const result = isHighlight.value
      ? await api.likeHighlight(props.id)
      : await api.likePost(props.id);
    item.value.likes = result.likes;
    item.value.liked = result.liked;
  } catch (err) {
    error.value = err.message;
  }
}

async function sendComment() {
  const trimmedName = name.value.trim();
  const trimmedComment = comment.value.trim();
  if (!trimmedName) {
    error.value = "Please enter your name.";
    return;
  }
  if (!trimmedComment) {
    error.value = "Please write a comment before posting.";
    return;
  }

  sending.value = true;
  error.value = "";
  try {
    const requestBody = { name: trimmedName, comment_text: trimmedComment };
    if (editingCommentId.value) {
      const result = isHighlight.value
        ? await api.updateHighlightComment(
            props.id,
            editingCommentId.value,
            requestBody,
          )
        : await api.updatePostComment(
            props.id,
            editingCommentId.value,
            requestBody,
          );
      const index = item.value.comments.findIndex(
        (entry) => entry.id === editingCommentId.value,
      );
      if (index >= 0) item.value.comments[index] = result.comment;
      editingCommentId.value = null;
      comment.value = "";
      return;
    }

    const result = isHighlight.value
      ? await api.commentHighlight(props.id, requestBody)
      : await api.commentPost(props.id, requestBody);

    item.value.comments.unshift(result.comment);
    comment.value = "";
  } catch (err) {
    error.value = err.message;
  } finally {
    sending.value = false;
  }
}
</script>
<template>
  <div class="container">
    <div v-if="loading" class="loading">Opening the story…</div>
    <div v-else-if="error && !item" class="error-state">{{ error }}</div>
    <article v-else-if="item" class="detail-layout">
      <iframe
        v-if="isHighlight"
        class="detail-video"
        :src="embed"
        :title="item.title"
        allowfullscreen
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      /><img
        v-else
        class="detail-cover"
        :src="item.image || '/images/meda_sport_pic.jpg'"
        :alt="item.title"
      />
      <div class="detail-panel">
        <span class="story-category">{{
          isHighlight ? "Match highlight" : item.category
        }}</span>
        <h1>{{ item.title }}</h1>
        <div class="detail-actions">
          <span><Eye :size="15" /> {{ item.views || 0 }} views</span
          ><button :class="{ liked: item.liked }" @click="toggleLike">
            <Heart :size="15" :fill="item.liked ? 'currentColor' : 'none'" />
            {{ item.likes || 0 }} likes</button
          ><span
            ><CalendarDays :size="15" /> {{ formatDate(item.created_at) }}</span
          >
        </div>
        <p v-if="!isHighlight" class="detail-copy">{{ item.summary }}</p>
        <p v-else class="detail-copy">{{ item.description }}</p>
        <p v-if="!isHighlight" class="section-subtitle">
          By {{ item.author || "MedaSport Desk" }}
        </p>
        <section class="comment-box">
          <h2 class="section-heading" style="font-size: 22px">
            <MessageCircle :size="20" style="vertical-align: middle" /> Fan
            conversation
            <span class="section-subtitle"
              >({{ item.comments?.length || 0 }})</span
            >
          </h2>
          <form class="comment-form" @submit.prevent="sendComment">
            <input
              v-model.trim="name"
              class="field"
              placeholder="Your name"
              maxlength="100"
              required
            /><textarea
              id="comment-input"
              v-model.trim="comment"
              class="field"
              placeholder="Add something to the conversation…"
              maxlength="3000"
              required
            />
            <p v-if="error" class="notice error">{{ error }}</p>
            <div class="comment-form-actions">
              <button class="button-primary" :disabled="sending">
                <Send :size="14" />
                {{
                  sending
                    ? editingCommentId
                      ? "Updating…"
                      : "Posting…"
                    : editingCommentId
                      ? "Update comment"
                      : "Post comment"
                }}
              </button>
              <button
                v-if="editingCommentId"
                type="button"
                class="button-secondary"
                @click="cancelEditing"
              >
                Cancel
              </button>
            </div>
          </form>
          <div
            v-if="!item.comments?.length"
            class="empty-state"
            style="padding: 25px 10px"
          >
            Be the first to share your thoughts.
          </div>
          <div v-for="entry in item.comments" :key="entry.id" class="comment">
            <div class="comment-header">
              <strong>{{ entry.name }}</strong>
              <div class="comment-actions">
                <small>{{ formatDateTime(entry.created_at) }}</small>
                <div
                  v-if="isOwnComment(entry) && !editingCommentId"
                  class="icon-actions"
                >
                  <button
                    type="button"
                    class="icon-button"
                    @click="startEditing(entry)"
                    aria-label="Edit comment"
                    title="Edit comment"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    type="button"
                    class="icon-button danger"
                    @click="deleteComment(entry)"
                    aria-label="Delete comment"
                    title="Delete comment"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </div>
            <p>{{ entry.comment_text }}</p>
          </div>
        </section>
        <p style="margin-top: 25px">
          <RouterLink
            :to="isHighlight ? '/highlights' : '/'"
            class="button-secondary"
            >← Back to
            {{ isHighlight ? "highlights" : "latest news" }}</RouterLink
          >
        </p>
      </div>
    </article>
  </div>
</template>
