<template>
  <div>
    <h2>Clusters</h2>
    <pre>{{ clusters }}</pre>
  </div>
</template>

<script>
export default {
  data() {
    return {
      clusters: []
    }
  },
  async created() {
    try {
      const res = await this.$store.dispatch('steve/findAll', { type: 'cluster' });
      this.clusters = res;
      console.log('Clusters:', res);
    } catch (err) {
      console.error('Failed to load clusters', err);
    }
  }
}
</script>
