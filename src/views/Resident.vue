<template>
  <v-container fluid class="fill-height">
    <v-row class="fill-height overflow-hidden">
      <v-col cols="1" class="d-flex flex-column align-center">
        <div style="width: 100%;">
          <v-img
              class="mb-14"
              :src="require('../assets/logo-small.png')"
          />
        </div>
        <v-btn icon large class="mb-10" to="/residents">
          <v-icon>mdi-account-group</v-icon>
        </v-btn>
        <v-btn icon large class="mb-10">
          <v-icon>mdi-file-document</v-icon>
        </v-btn>
        <v-btn icon large class="mb-10">
          <v-icon>mdi-currency-usd</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="10">
        <v-alert color="error" v-if="connectionError">Не удалось подключиться к серверу. Обновите страницу.</v-alert>
        <v-alert color="error" class="d-flex justify-space-between" v-if="authError">
          Вы не авторизованы
          <v-btn color="accent" to="/auth">Войти</v-btn>
        </v-alert>

        <v-row>
          <v-col>
            <v-card v-if="residentLoaded" :loading="saving">
              <v-btn top left absolute icon to="/residents">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-card-text class="pa-16">
                <v-row class="mb-1">
                  <v-col cols="2">
                    <v-avatar :color="resident.fio | colorFromName" width="150" height="150"
                              style="font-size: 80px; color: white">{{ resident.fio | initials }}
                    </v-avatar>
                  </v-col>
                  <v-col cols="10" class="d-flex flex-column justify-end">
                    <v-row class="flex-grow-0">
                      <v-col class="font-weight-light" style="font-size: 32px">{{ resident.fio }}</v-col>
                    </v-row>
                    <v-row class="flex-grow-0">
                      <v-col>
                        <!--                        <v-btn>Добавить аккаунт</v-btn>-->
                        <v-btn
                            v-if="!editorMode"
                            @click="editorMode = true"
                            color="accent"
                        >
                          Изменить
                        </v-btn>
                        <v-btn
                            v-if="editorMode"
                            :disabled="!valid || saving"
                            @click="save"
                            color="red"
                        >
                          Сохранить изменения
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
                <v-row style="height: 1px; background: #BEBEBE"/>
                <v-row class="mt-10">
                  <v-col cols="4">
                    <v-form v-model="valid">
                      <v-text-field v-model="resident.fio"
                                    :readonly="!editorMode"
                                    :disabled="saving"
                                    :rules="[rules.required, rules.atLeastThreeChars]"
                                    type="text"
                                    outlined
                                    label="ФИО"
                      />
                      <v-text-field v-model="resident.area"
                                    :readonly="!editorMode"
                                    :disabled="saving"
                                    :rules="[rules.required]"
                                    type="number"
                                    suffix="соток"
                                    outlined
                                    label="Площадь огорода"
                      />
                      <v-text-field v-model="resident.start_date"
                                    :readonly="!editorMode"
                                    :disabled="saving"
                                    :rules="[rules.required, rules.dateFormat]"
                                    type="text"
                                    outlined
                                    label="Дата подключения"
                                    hint="Формат данных: ГГГГ.ММ.ДД ЧЧ:ММ:СС"
                      />
                    </v-form>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="1">
        <div class="d-flex flex-column align-center fill-height">
          <v-icon x-large color="accent">mdi-account-circle</v-icon>
          <span style="font-size: 13px">Администратор</span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from "@/api";

export default {
  name: "Resident",
  data: () => ({
    authError: false,
    connectionError: false,

    resident: {},
    residentLoaded: false,

    editorMode: false,

    valid: false,

    saving: false,

    rules: {
      dateFormat: value => /20\d{2}\.[0-1]\d.[0-3]\d [0-2]\d(?::[0-5]\d){2}/.test(value) || 'Неверный формат. Ожидается: ГГГГ.ММ.ДД ЧЧ:ММ:СС',
      required: value => !!value || 'Обязательное поле',
      atLeastThreeChars: value => value.length >= 3 || 'Минимум три знака',
    }
  }),
  props: {
    residentID: {
      type: String,
      required: true
    }
  },
  computed: {},
  methods: {
    loadResident: async function () {
      try {
        this.resident = await api.residentView(Number(this.residentID))
        this.residentLoaded = true
      } catch (e) {
        if (e.name === "ConnectionError") {
          this.connectionError = true
        } else if (e.name === "AuthError") {
          this.authError = true
        }
        console.error(e)
      }
    },
    save: async function() {
      this.saving = true

      try {
        await api.residentUpdate(Number(this.resident.id), this.resident.fio, Number(this.resident.area), new Date(this.resident.start_date))
      } catch (e) {
        if (e.name === "ConnectionError") {
          this.connectionError = true
        } else if (e.name === "AuthError") {
          this.authError = true
        }
        console.error(e)
      }

      this.editorMode = false
      this.saving = false
    }

  },
  mounted() {
    this.loadResident()
  },
  filters: {
    initials: function (value) {
      return value.split(' ').slice(0, 2).map(item => item[0].toUpperCase()).join('')
    },
    /**
     * @param {string} value
     */
    colorFromName: function (value) {
      const partLength = Number((value.length / 3).toFixed(0))

      const parts = [value.substr(0, partLength), value.substr(partLength, partLength), value.substr(partLength * 2)]

      const partsNumeric = parts.map(item => {
        let code = 0
        for (const char of item) {
          code += char.charCodeAt(0)
        }
        return 100 + code % 128
      })

      return `rgb(${partsNumeric.join(',')})`
    },
    onlyDate: function (value) {
      const date = new Date(value)

      function leadingZero(a) {
        return (a > 9 ? `` : `0`) + a
      }

      return `${date.getFullYear()}.${leadingZero(date.getMonth() + 1)}.${leadingZero(date.getDate())}`
    }
  },

}
</script>

<style scoped lang="scss">

</style>
