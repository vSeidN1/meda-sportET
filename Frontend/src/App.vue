<script setup>
import { computed, ref } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import {
  Search,
  Menu,
  X,
  Sun,
  Moon,
  Trophy,
  House,
  Play,
  Info,
  ChevronDown,
  ArrowUpRight,
  Mail,
} from "lucide-vue-next";

const ETHIOPIA_TIME_ZONE = "Africa/Addis_Ababa";
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: ETHIOPIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const route = useRoute();
const searchText = ref("");
const menuOpen = ref(false);
const mobileCompetitionsOpen = ref(false);
const dark = ref(localStorage.getItem("meda-theme") !== "light");
const leagues = [
  { name: "Premier League", slug: "epl", logo: "/images/logos/epl.png" },
  { name: "La Liga", slug: "laliga", logo: "/images/logos/laliga.png" },
  { name: "Serie A", slug: "calcio", logo: "/images/logos/serie a.webp" },
  {
    name: "Bundesliga",
    slug: "bundesliga",
    logo: "/images/logos/bundesliga.png",
  },
  { name: "Ligue 1", slug: "ligue1", logo: "/images/logos/ligue1.png" },
  { name: "Champions League", slug: "ucl", logo: "/images/logos/ucl.png" },
  { name: "Europa League", slug: "uel", logo: "/images/logos/uel.png" },
];
const activeLeague = computed(() =>
  leagues.find((item) => item.slug === route.params.slug),
);
function toggleTheme() {
  dark.value = !dark.value;
  localStorage.setItem("meda-theme", dark.value ? "dark" : "light");
  document.documentElement.dataset.theme = dark.value ? "dark" : "light";
}
document.documentElement.dataset.theme = dark.value ? "dark" : "light";
function submitSearch() {
  const q = searchText.value.trim();
  if (q) {
    location.href = `/search?q=${encodeURIComponent(q)}`;
    menuOpen.value = false;
  }
}
</script>

<template>
  <div class="site-shell">
    <div class="topline">
      <div class="container topline-inner">
        <span><span class="live-dot"></span> THE HOME OF FOOTBALL</span
        ><span class="topline-right"
          >Independent coverage · Addis Ababa, Ethiopia 🇪🇹</span
        >
      </div>
    </div>
    <header class="header transition-colors duration-200">
      <div class="container header-inner">
        <RouterLink to="/" class="brand" aria-label="MedaSport home"
          ><img src="/images/meda_sport_pic.jpg" alt="" /><span
            >MEDA<span class="brand-accent">SPORT</span
            ><small>THE BEAUTIFUL GAME, CLOSER</small></span
          ></RouterLink
        >
        <nav class="desktop-nav" aria-label="Main navigation">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <div class="league-nav">
            <button class="nav-link league-trigger">
              <Trophy :size="15" /> Competitions <ChevronDown :size="14" />
            </button>
            <div class="league-menu">
              <RouterLink
                v-for="league in leagues"
                :key="league.slug"
                :to="`/competitions/${league.slug}`"
                ><img :src="league.logo" alt="" />{{ league.name }}</RouterLink
              >
            </div>
          </div>
          <RouterLink to="/highlights" class="nav-link">Highlights</RouterLink>
          <RouterLink to="/about" class="nav-link">About</RouterLink>
          <RouterLink to="/contact" class="nav-link">Contact</RouterLink>
        </nav>
        <form class="search-form" @submit.prevent="submitSearch">
          <input
            v-model="searchText"
            aria-label="Search"
            placeholder="Search stories..."
          /><button aria-label="Submit search"><Search :size="17" /></button>
        </form>
        <button
          class="icon-button theme-button"
          aria-label="Toggle color theme"
          @click="toggleTheme"
        >
          <Sun v-if="dark" :size="18" /><Moon v-else :size="18" />
        </button>
        <button
          class="icon-button mobile-menu-button"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" /><Menu v-else />
        </button>
      </div>
      <div v-if="menuOpen" class="mobile-menu">
        <RouterLink @click="menuOpen = false" to="/"
          ><House :size="15" />Home</RouterLink
        >
        <RouterLink @click="menuOpen = false" to="/highlights"
          ><Play :size="15" />Highlights</RouterLink
        >
        <div class="mobile-competitions">
          <button
            class="mobile-competitions-trigger"
            :aria-expanded="mobileCompetitionsOpen"
            @click="mobileCompetitionsOpen = !mobileCompetitionsOpen"
          >
            <span><Trophy :size="15" /> Competitions</span>
            <ChevronDown
              :size="15"
              :class="{ 'chevron-open': mobileCompetitionsOpen }"
            />
          </button>
          <div v-if="mobileCompetitionsOpen" class="mobile-league-menu">
            <RouterLink
              v-for="league in leagues"
              :key="league.slug"
              @click="menuOpen = false"
              :to="`/competitions/${league.slug}`"
              ><img :src="league.logo" alt="" />{{ league.name }}</RouterLink
            >
          </div>
        </div>
        <RouterLink @click="menuOpen = false" to="/about"
          ><Info :size="15" />About</RouterLink
        >
        <RouterLink @click="menuOpen = false" to="/contact"
          ><Mail :size="15" />Contact</RouterLink
        >
      </div>
    </header>
    <div v-if="activeLeague" class="competition-strip">
      <div class="container strip-inner">
        <img :src="activeLeague.logo" alt="" /><span>COMPETITION</span
        ><strong>{{ activeLeague.name }}</strong
        ><ArrowUpRight :size="16" />
      </div>
    </div>
    <main><RouterView /></main>
    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <RouterLink to="/" class="brand footer-brand"
            ><img src="/images/meda_sport_pic.jpg" alt="" /><span
              >MEDA<span class="brand-accent">SPORT</span
              ><small>THE BEAUTIFUL GAME, CLOSER</small></span
            ></RouterLink
          >
          <p>
            Independent football journalism for fans who never stop watching.
          </p>
        </div>
        <div>
          <h4>EXPLORE</h4>
          <RouterLink to="/">Latest news</RouterLink
          ><RouterLink to="/highlights">Match highlights</RouterLink
          ><RouterLink to="/about">Our story</RouterLink>
        </div>
        <div>
          <h4>COMPETITIONS</h4>
          <RouterLink
            v-for="league in leagues"
            :key="league.slug"
            :to="`/competitions/${league.slug}`"
            >{{ league.name }}</RouterLink
          >
        </div>
        <div>
          <h4>FOLLOW THE GAME</h4>
          <div class="social-links">
            <a
              class="social-link"
              href="https://t.me/Meda_Sport_Ethiopia"
              target="_blank"
              rel="noreferrer"
              aria-label="MedaSport on Telegram"
              title="Telegram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M21.9 4.6 18.7 20c-.2 1.1-.8 1.4-1.7.9l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9 8.9-8c.4-.4-.1-.6-.6-.2L6.6 14 1.9 12.5c-1-.3-1-.9.2-1.4L20.5 3.9c.9-.3 1.7.2 1.4.7Z"
                />
              </svg>
            </a>
            <a
              class="social-link"
              href="https://m.facebook.com/meda_sport_ethiopia"
              target="_blank"
              rel="noreferrer"
              aria-label="MedaSport on Facebook"
              title="Facebook"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M13.4 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.2v3.2H10V21h3.4Z"
                />
              </svg>
            </a>
            <a
              class="social-link"
              href="mailto:medasport.support@gmail.com"
              aria-label="Email MedaSport"
              title="Email"
              ><Mail class="social-outline-icon" :size="18" :stroke-width="1.8"
            /></a>
          </div>
        </div>
      </div>
      <div class="container footer-bottom">
        <span
          >© {{ new Date().getFullYear() }} MedaSport Ethiopia. All rights
          reserved.</span
        ><span>Made for the love of football ⚽</span>
      </div>
    </footer>
  </div>
</template>
