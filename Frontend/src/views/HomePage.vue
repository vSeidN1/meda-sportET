<script setup>
import { onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  ArrowRight,
  ArrowUpRight,
  Flame,
  Heart,
  Eye,
  MessageCircle,
} from "lucide-vue-next";
import { api } from "../api";

const route = useRoute();
const data = ref({ featured: [], posts: [], page: 1, totalPages: 1 });
const searchResults = ref(null);
const loading = ref(true);
const error = ref("");
const actionError = ref("");
const likingPostIds = ref(new Set());
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const query = route.query.q;
    if (query) searchResults.value = await api.search(query);
    else {
      searchResults.value = null;
      data.value = await api.home(route.query.page);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(() => route.query, load);
const excerpt = (text) =>
  text?.length > 125 ? `${text.slice(0, 125)}…` : text;

async function toggleCardLike(post) {
  if (likingPostIds.value.has(post.id)) return;
  actionError.value = "";
  likingPostIds.value = new Set(likingPostIds.value).add(post.id);
  try {
    const result = await api.likePost(post.id);
    post.likes = result.likes;
    post.liked = result.liked;
  } catch (err) {
    actionError.value = err.message;
  } finally {
    const pending = new Set(likingPostIds.value);
    pending.delete(post.id);
    likingPostIds.value = pending;
  }
}
</script>

<template>
  <div class="container">
    <section class="hero hero-centered">
      <div class="hero-content">
        <div class="hero-kicker">
          <Flame :size="14" /> Football, without the noise
        </div>
        <h1>The game never stops.<br /><em>Neither do we.</em></h1>
        <p class="hero-copy">
          The latest stories, sharp match analysis and unforgettable moments
          from the world’s biggest competitions — all in one place.
        </p>
        <div class="hero-actions">
          <RouterLink to="/highlights" class="button-primary"
            >Watch highlights <ArrowRight :size="16"
          /></RouterLink>
          <a href="#latest" class="button-secondary">Explore the latest</a>
        </div>
        <div class="hero-footnote">
          <span class="hero-footnote-ball">⚽</span> Your football desk, from
          Addis Ababa to the world <span>🇪🇹</span>
        </div>
      </div>
    </section>

    <section
      v-if="!route.query.q && data.featured?.length"
      class="page-section"
      style="padding-top: 15px"
    >
      <div class="section-row">
        <div>
          <div class="eyebrow">In the spotlight</div>
          <h2 class="section-heading">The big stories</h2>
        </div>
        <RouterLink to="/" class="button-secondary"
          >All news <ArrowUpRight :size="15"
        /></RouterLink>
      </div>
      <div class="featured-grid">
        <div
          v-for="post in data.featured.slice(0, 3)"
          :key="post.id"
          class="featured-card"
        >
          <RouterLink :to="`/news/${post.id}`" class="featured-card-link">
            <img
              :src="post.image || '/images/meda_sport_pic.jpg'"
              :alt="post.title"
            />
            <div class="featured-overlay">
              <span class="story-category">{{
                post.category || "Football"
              }}</span>
              <h3>{{ post.title }}</h3>
              <p>
                {{ post.author || "MedaSport Desk" }} ·
                {{ post.views || 0 }} reads
              </p>
            </div>
          </RouterLink>
          <div class="featured-actions">
            <button
              type="button"
              class="card-icon-action"
              :class="{ liked: post.liked }"
              :disabled="likingPostIds.has(post.id)"
              :aria-label="post.liked ? 'Unlike story' : 'Like story'"
              :aria-pressed="Boolean(post.liked)"
              @click="toggleCardLike(post)"
            >
              <Heart :size="14" :fill="post.liked ? 'currentColor' : 'none'" />
              {{ post.likes || 0 }}
            </button>
            <RouterLink
              class="card-icon-action"
              :to="`/news/${post.id}#comment-input`"
              :aria-label="`Write a comment on ${post.title}`"
              title="Write a comment"
            >
              <MessageCircle :size="14" /> {{ post.comments_count || 0 }}
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section id="latest" class="page-section">
      <div class="section-row">
        <div>
          <div class="eyebrow">
            {{ route.query.q ? "Search desk" : "Fresh from the pitch" }}
          </div>
          <h2 class="section-heading">
            {{
              route.query.q ? `Results for “${route.query.q}”` : "Latest news"
            }}
          </h2>
          <p class="section-subtitle">
            {{
              route.query.q
                ? "Stories and highlights matching your search."
                : "Reporting, reaction and stories worth your time."
            }}
          </p>
        </div>
      </div>
      <p v-if="actionError" class="notice error">{{ actionError }}</p>
      <div v-if="loading" class="loading">
        Loading the latest from the pitch…
      </div>
      <div v-else-if="error" class="error-state">
        {{ error }}
        <p>Check your database settings and start the backend API.</p>
      </div>
      <template v-else>
        <template v-if="searchResults"
          ><div
            v-if="
              !searchResults.news?.length && !searchResults.highlights?.length
            "
            class="empty-state"
          >
            No matching stories yet. Try a different search.
          </div>
          <div v-if="searchResults.news?.length" class="card-grid">
            <article
              v-for="post in searchResults.news"
              :key="post.id"
              class="story-card"
            >
              <img
                class="story-image"
                :src="post.image || '/images/meda_sport_pic.jpg'"
                :alt="post.title"
              />
              <div class="story-body">
                <span class="story-category">{{ post.category }}</span>
                <h3 class="story-title">{{ post.title }}</h3>
                <p class="story-excerpt">{{ excerpt(post.summary) }}</p>
                <div class="story-meta">
                  <span><Eye :size="13" /> {{ post.views || 0 }}</span
                  ><button
                    type="button"
                    class="card-icon-action"
                    :class="{ liked: post.liked }"
                    :disabled="likingPostIds.has(post.id)"
                    :aria-label="post.liked ? 'Unlike story' : 'Like story'"
                    :aria-pressed="Boolean(post.liked)"
                    @click="toggleCardLike(post)"
                  >
                    <Heart
                      :size="13"
                      :fill="post.liked ? 'currentColor' : 'none'"
                    />
                    {{ post.likes || 0 }}
                  </button>
                  ><RouterLink
                    class="card-icon-action"
                    :to="`/news/${post.id}#comment-input`"
                    :aria-label="`Go to comments on ${post.title}`"
                    title="Go to comments"
                  >
                    <MessageCircle :size="13" />
                    {{ post.comments_count || 0 }}
                  </RouterLink>
                  ><RouterLink class="read-link" :to="`/news/${post.id}`"
                    >Read story ↗</RouterLink
                  >
                </div>
              </div>
            </article>
          </div>
          <div
            v-if="searchResults.highlights?.length"
            class="search-highlight-list"
          >
            <h3
              class="section-heading"
              style="font-size: 22px; margin-top: 36px"
            >
              Match highlights
            </h3>
            <RouterLink
              v-for="item in searchResults.highlights"
              :key="item.id"
              :to="`/highlights/${item.id}`"
              class="search-highlight"
              ><span class="play-mark">▶</span
              ><span
                ><strong>{{ item.title }}</strong
                ><small>{{ excerpt(item.description) }}</small></span
              ><ArrowUpRight :size="16"
            /></RouterLink></div
        ></template>
        <div v-else-if="!data.posts?.length" class="empty-state">
          No articles have been published yet. Check back soon.
        </div>
        <div v-else class="card-grid">
          <article v-for="post in data.posts" :key="post.id" class="story-card">
            <img
              class="story-image"
              :src="post.image || '/images/meda_sport_pic.jpg'"
              :alt="post.title"
              loading="lazy"
            />
            <div class="story-body">
              <span class="story-category">{{ post.category }}</span>
              <h3 class="story-title">{{ post.title }}</h3>
              <p class="story-excerpt">{{ excerpt(post.summary) }}</p>
              <div class="story-meta">
                <span><Eye :size="13" /> {{ post.views || 0 }}</span
                ><button
                  type="button"
                  class="card-icon-action"
                  :class="{ liked: post.liked }"
                  :disabled="likingPostIds.has(post.id)"
                  :aria-label="post.liked ? 'Unlike story' : 'Like story'"
                  :aria-pressed="Boolean(post.liked)"
                  @click="toggleCardLike(post)"
                >
                  <Heart
                    :size="13"
                    :fill="post.liked ? 'currentColor' : 'none'"
                  />
                  {{ post.likes || 0 }}
                </button>
                ><RouterLink
                  class="card-icon-action"
                  :to="`/news/${post.id}#comment-input`"
                  :aria-label="`Go to comments on ${post.title}`"
                  title="Go to comments"
                >
                  <MessageCircle :size="13" />
                  {{ post.comments_count || 0 }}
                </RouterLink>
                ><RouterLink class="read-link" :to="`/news/${post.id}`"
                  >Read story ↗</RouterLink
                >
              </div>
            </div>
          </article>
        </div>
        <div
          v-if="!route.query.q && data.totalPages > 1"
          class="pagination-row"
        >
          <RouterLink
            v-for="page in data.totalPages"
            :key="page"
            :to="`/?page=${page}#latest`"
            :class="[
              'pagination-link',
              { selected: Number(route.query.page || 1) === page },
            ]"
            >{{ page }}</RouterLink
          >
        </div>
      </template>
    </section>
  </div>
</template>
