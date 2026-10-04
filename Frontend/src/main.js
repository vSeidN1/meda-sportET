import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import HomePage from "./views/HomePage.vue";
import NewsPage from "./views/NewsPage.vue";
import HighlightsPage from "./views/HighlightsPage.vue";
import CompetitionPage from "./views/CompetitionPage.vue";
import AdminPage from "./views/AdminPage.vue";
import InfoPage from "./views/InfoPage.vue";
import "./style.css";
import "./refinements.css";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: "/", component: HomePage },
    { path: "/news/:id", component: NewsPage, props: true },
    { path: "/highlights", component: HighlightsPage },
    {
      path: "/highlights/:id",
      component: NewsPage,
      props: true,
      meta: { highlight: true },
    },
    { path: "/competitions/:slug", component: CompetitionPage, props: true },
    { path: "/epl", redirect: "/competitions/epl" },
    { path: "/laliga", redirect: "/competitions/laliga" },
    { path: "/calcio", redirect: "/competitions/calcio" },
    { path: "/bundesliga", redirect: "/competitions/bundesliga" },
    { path: "/ligue1", redirect: "/competitions/ligue1" },
    { path: "/ucl", redirect: "/competitions/ucl" },
    { path: "/uel", redirect: "/competitions/uel" },
    { path: "/admin/dashboard", redirect: "/admin/posts" },
    { path: "/admin/login", redirect: "/admin/posts" },
    { path: "/adminhighlight/login", redirect: "/admin/highlights" },
    {
      path: "/search",
      component: HomePage,
      props: (route) => ({ search: route.query.q || "" }),
    },
    { path: "/about", component: InfoPage, props: { type: "about" } },
    { path: "/contact", component: InfoPage, props: { type: "contact" } },
    { path: "/admin/:section?", component: AdminPage, props: true },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

createApp(App).use(router).mount("#app");
