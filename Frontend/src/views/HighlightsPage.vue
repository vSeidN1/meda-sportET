<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { ArrowUpRight, Eye, Heart, Play } from "lucide-vue-next";
import { api } from "../api";
const items = ref([]);
const loading = ref(true);
const error = ref("");
onMounted(async () => {
  try {
    items.value = await api.highlights();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
function embedUrl(url = "") {
  if (url.includes("youtube.com/embed/")) return url;
  const id = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}
</script>
<template>
  <div class="container page-section">
    <div class="section-row">
      <div>
        <div class="eyebrow">Relive the moments</div>
        <h1 class="section-heading">Match highlights</h1>
        <p class="section-subtitle">
          The goals, the drama and the moments that make football.
        </p>
      </div>
      <span class="pill">{{ items.length }} videos</span>
    </div>
    <div v-if="loading" class="loading">Loading highlights…</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else-if="!items.length" class="empty-state">
      No highlights published yet. Check back after the next matchday.
    </div>
    <div v-else class="card-grid">
      <article v-for="item in items" :key="item.id" class="highlight-card">
        <RouterLink :to="`/highlights/${item.id}`"
          ><iframe
            class="video-frame"
            :src="embedUrl(item.youtube_link)"
            :title="item.title"
            loading="lazy"
            allow="
              accelerometer;
              autoplay;
              clipboard-write;
              encrypted-media;
              gyroscope;
              picture-in-picture;
              web-share;
            "
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
        /></RouterLink>
        <div class="story-body">
          <span class="story-category">Match replay</span>
          <h2 class="story-title">{{ item.title }}</h2>
          <p class="story-excerpt">
            {{
              item.description ||
              "Catch up on the action and join the conversation."
            }}
          </p>
          <div class="story-meta">
            <span><Eye :size="13" /> {{ item.views || 0 }}</span
            ><span><Heart :size="13" /> {{ item.likes || 0 }}</span
            ><RouterLink class="read-link" :to="`/highlights/${item.id}`"
              >Discuss <ArrowUpRight :size="12"
            /></RouterLink>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
