<template>
  <div/>
</template>

<script>
  export default {
    name: 'Home',
    beforeMount() {
      this.$router.push('/auth')
    }
  }
</script>
