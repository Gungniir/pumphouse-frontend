<template>
  <v-container fluid class="fill-height">
    <v-row class="fill-height">
      <v-col cols="4" offset="4" align-self="center">
        <v-card outlined :loading="loading" style="border-radius: 10px">
          <div class="logo">
            <v-img :src="require('../assets/logo.png')"/>
          </div>
          <v-card-title class="justify-center mb-6">
            Вход
          </v-card-title>
          <v-card-text class="pr-16 pl-16">
            <v-alert type="error" dismissible v-model="alert">Не удаётся подключиться к серверу</v-alert>
            <v-form v-model="validForm">
              <v-text-field
                  height="56"
                  class="mb-4"
                  label="Логин"
                  v-model="login"
                  placeholder="e.g. admin"
                  outlined
                  :disabled="loading"
                  :rules="[rules.required]"
                  @keyup.enter="$refs['passwordField'].focus()"
              />
              <v-text-field
                  height="56"
                  class="mb-4"
                  label="Пароль"
                  v-model="password"
                  placeholder="Xsw36Fg8jK123"
                  outlined
                  :disabled="loading"
                  :type="passwordType"
                  :append-icon="passwordIcon"
                  :rules="[rules.required]"
                  :error="wrongError"
                  :error-messages="wrongError ? 'Неверный логин или пароль' : ''"
                  ref="passwordField"
                  @click:append="showPassword = !showPassword"
                  @keyup.enter="process"
              />
            </v-form>
            <v-btn color="accent" block large class="mb-16" @click="process" :disabled="!validForm || loading">Войти
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from "@/api";
import Vue from "vue";

export default {
  name: "Auth",
  data: () => ({
    showPassword: false,
    loading: false,
    password: "",
    lastLogin: "",
    lastPassword: "",
    badPassword: false,
    login: "",
    alert: false,
    validForm: false,
    rules: {
      required: value => !!value || 'Обязательное поле',
    }
  }),
  computed: {
    passwordIcon: function () {
      return this.showPassword ? 'mdi-eye-off' : 'mdi-eye'
    },
    passwordType: function () {
      return this.showPassword ? 'text' : 'password'
    },
    wrongError: function () {
      return this.badPassword && this.login === this.lastLogin && this.password === this.lastPassword
    }
  },
  methods: {
    process: async function () {
      this.loading = true

      const result = await api.authLogin(this.login, this.password)

      if (result === null) {
        this.alert = true
      } else if (result === false) {
        this.badPassword = true
        this.lastLogin = this.login
        this.lastPassword = this.password

        Vue.nextTick(() => {
          this.$refs.passwordField.focus()
        })
      } else {
        this.$router.push("/dashboard")
            .catch(() => {
              this.alert = true
            })
      }

      this.loading = false
    }
  }
}
</script>

<style scoped lang="scss">
.logo {
  padding: 16px;
  width: 164px;
}
</style>
