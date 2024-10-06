export default defineNuxtConfig({
  srcDir: "src",
  modules: ["@nuxt/ui", "nuxt-tiptap-editor", "@vueuse/nuxt"],
  compatibilityDate: "2024-10-05",
  tailwindcss: { config: { content: ["./src/**/*.vue"] } },
  runtimeConfig: {
    googleCloudClientId: "",
    googleCloudClientSecret: ""
  }
});
