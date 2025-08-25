<template>
  <div>
    <h2 class="mb-2">Clusters</h2>
    <ul>
      <li v-for="c in clusters" :key="c.id">
        {{ c.spec.displayName || c.id }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'ClusterList',
  data() {
    return {
      clusters: []
    };
  },
  created() {
    // Start watching clusters
    this.$store.dispatch('steve/watch', {
      type: 'management.cattle.io.cluster',
      watch: (event) => {
        const obj = event.object;

        if (!obj?.id) {
          return;
        }

        // Apply change locally
        const existing = this.clusters.findIndex(c => c.id === obj.id);

        if (event.type === 'ADDED' || event.type === 'MODIFIED') {
          if (existing >= 0) {
            this.$set(this.clusters, existing, obj);
          } else {
            this.clusters.push(obj);
          }
        } else if (event.type === 'DELETED' && existing >= 0) {
          this.clusters.splice(existing, 1);
        }
      }
    });
  },
  beforeDestroy() {
    // Stop watching when component is destroyed
    this.$store.dispatch('steve/forgetType', 'management.cattle.io.cluster');
  }
};
</script>
