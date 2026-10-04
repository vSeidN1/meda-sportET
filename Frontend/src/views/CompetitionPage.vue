<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api";
const props = defineProps({ slug: String });
const route = useRoute();
const payload = ref(null);
const loading = ref(true);
const error = ref("");
const active = ref("titles");
const statTabs = [
  {
    key: "titles",
    label: "Most titles",
    metric: "titles",
    unit: "titles",
    name: "club_name",
  },
  {
    key: "standings",
    label: "Standings",
    metric: "points",
    unit: "pts",
    name: "club_name",
  },
  {
    key: "scorers",
    label: "Top scorers",
    metric: "goals",
    unit: "goals",
    name: "player_name",
  },
  {
    key: "assists",
    label: "Top assists",
    metric: "assists",
    unit: "assists",
    name: "player_name",
  },
  {
    key: "hattricks",
    label: "Hat-trick leaders",
    metric: "hattricks",
    unit: "hat-tricks",
    name: "player_name",
  },
  {
    key: "freekicks",
    label: "Free-kick leaders",
    metric: "freekick_goals",
    unit: "free-kick goals",
    name: "player_name",
  },
  {
    key: "keepers",
    label: "Clean-sheet leaders",
    metric: "clean_sheets",
    unit: "clean sheets",
    name: "player_name",
  },
];
const current = computed(() =>
  statTabs.find((tab) => tab.key === active.value),
);
const rows = computed(() => payload.value?.[active.value] || []);
const getShortName = (value) => {
  if (!value) return "--";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};
async function load() {
  loading.value = true;
  error.value = "";
  try {
    payload.value = await api.competition(props.slug);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(
  () => props.slug,
  () => {
    active.value = "titles";
    load();
  },
);
</script>
<template>
  <div class="container page-section">
    <div v-if="loading" class="loading">Loading competition history…</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <template v-else-if="payload"
      ><div class="eyebrow">Competition history</div>
      <h1 class="section-heading">{{ payload.league }}</h1>
      <p class="section-subtitle">
        League history, iconic records and the clubs that defined the
        competition.
      </p>
      <div class="tab-list" style="margin-top: 28px">
        <button
          v-for="tab in statTabs"
          :key="tab.key"
          :class="{ active: active === tab.key }"
          @click="active = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="coming-soon-card">
        <div class="coming-soon-badge">Coming Soon</div>
        <h3>Competition records will be published soon</h3>
        <p>
          The league dashboard is being prepared. Fresh standings, titles and
          top performers will appear here in the next update.
        </p>
      </div>
    </template>
    <div v-else class="empty-state">Competition not found.</div>
  </div>
</template>
