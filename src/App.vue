<template>
  <v-app :style="{background: $vuetify.theme.themes[theme].background}">
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>

import api from "@/api";

export default {
  name: 'App',

  data: () => ({
    //
  }),
  computed: {
    theme() {
      return (this.$vuetify.theme.dark) ? 'dark' : 'light'
    }
  },
  async mounted() {
    console.log(await api.authLogin('admin', 'admin'))
  }
};
</script>
