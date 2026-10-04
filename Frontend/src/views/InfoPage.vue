<script setup>
import { reactive, ref } from "vue";
import { Mail, Send } from "lucide-vue-next";
import { api } from "../api";
const props = defineProps({ type: String });
const form = reactive({ name: "", email: "", message: "" });
const sending = ref(false);
const notice = ref("");
const error = ref("");
async function submit() {
  sending.value = true;
  notice.value = "";
  error.value = "";
  try {
    const result = await api.contact(form);
    notice.value =
      result.message ||
      "Thanks for reaching out. Your message has been received.";
    Object.assign(form, { name: "", email: "", message: "" });
  } catch (err) {
    error.value = err.message;
  } finally {
    sending.value = false;
  }
}
</script>
<template>
  <div class="container page-section info-page">
    <div class="eyebrow">
      {{ type === "about" ? "Our story" : "Talk to our team" }}
    </div>
    <h1 class="section-heading">
      {{ type === "about" ? "For the love of the game." : "Get in touch." }}
    </h1>
    <p class="section-subtitle">
      {{
        type === "about"
          ? "Football brings us together. We bring the stories closer."
          : "Have a tip, question or just want to talk football? We’re listening."
      }}
    </p>

    <div v-if="type === 'about'" class="info-copy">
      <p>
        MedaSport is an independent football newsroom built by fans, for fans.
        From the Premier League to the biggest nights in Europe, our goal is to
        make the stories, stats and moments of the game easy to follow and worth
        coming back for.
      </p>
      <p>
        Rooted in Ethiopia and connected to the global game, we cover match
        news, transfers, competition history and highlights with curiosity and a
        fan-first point of view.
      </p>
      <p>
        We believe the game is more than ninety minutes. It is the debate before
        kickoff, the memory of a legendary goal, and the community that follows
        every result.
      </p>
      <div class="info-actions">
        <a
          class="button-primary"
          href="https://t.me/Meda_Sport_Ethiopia"
          target="_blank"
          rel="noreferrer"
          ><Send :size="15" /> Join the conversation</a
        >
        <a class="button-secondary" href="mailto:medasport.support@gmail.com"
          ><Mail :size="15" /> Email MedaSport</a
        >
      </div>
    </div>

    <form v-else class="form-card contact-form" @submit.prevent="submit">
      <p v-if="notice" class="notice">{{ notice }}</p>
      <p v-if="error" class="notice error">{{ error }}</p>
      <label
        >Your name<input
          v-model.trim="form.name"
          class="field"
          required
          maxlength="100"
      /></label>
      <label
        >Email address<input
          v-model.trim="form.email"
          class="field"
          type="email"
          required
          maxlength="254"
      /></label>
      <label
        >Your message<textarea
          v-model.trim="form.message"
          class="field"
          required
          maxlength="5000"
          placeholder="Tell us what’s on your mind…"
        />
      </label>
      <button class="button-primary" :disabled="sending">
        <Send :size="15" /> {{ sending ? "Sending…" : "Send message" }}
      </button>
      <p class="contact-email">
        Or write to
        <a href="mailto:medasport.support@gmail.com"
          >medasport.support@gmail.com</a
        >
      </p>
    </form>
  </div>
</template>
