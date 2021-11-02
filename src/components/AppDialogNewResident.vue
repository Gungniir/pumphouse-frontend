<template>
    <v-card :loading="loading">
      <v-btn
          absolute
          top
          right
          icon
          @click="$emit('close')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-card-title class="d-flex align-center justify-center mb-10 pt-10">Новый дачник</v-card-title>
      <v-card-text class="pb-10">
        <v-form v-model="valid" ref="resident-form">
          <v-text-field
              label="ФИО"
              outlined
              placeholder="Иванов Иван Иванович"
              v-model="fio"
              :disabled="loading"
              :rules="[rules.required]"
          ></v-text-field>
          <v-text-field
              label="Площадь огорода (в сотках)"
              outlined
              placeholder="30.2"
              v-model="area"
              type="number"
              :disabled="loading"
              :rules="[rules.required, rules.greaterThanZero]"
          ></v-text-field>
        </v-form>
        <v-btn large block color="accent" @click="addResident"
               :disabled="loading || !valid">Добавить
        </v-btn>
      </v-card-text>
    </v-card>
</template>

<script>
import api from "@/api";

export default {
  name: "AppDialogNewResident",
  data: () => ({
    fio: "",
    area: 0,
    loading: false,
    valid: false,

    rules: {
      required: value => !!value || 'Обязательное поле',
      greaterThanZero: value => value > 0 || 'Число должно быть положительным',
    }
  }),
  methods: {
    addResident: async function () {
      this.loading = true

      const response = await api.residentsStore(this.fio, this.area)

      if (response === null) {
        this.$store.state.connectionError = true
      } else if (response === false) {
        this.$store.state.authError = true
      }

      this.$refs["resident-form"].reset()
      this.loading = false
      this.$emit('close')
    },
  }
}
</script>

<style scoped>

</style>
