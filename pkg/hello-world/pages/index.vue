<template>
  <div>
    <h2 class="mb-2">Clusters</h2>

    <div v-if="loading">
      Loading clusters...
    </div>

    <div v-else-if="error">
      <p class="text-red-500">Failed to load clusters: {{ error }}</p>
    </div>

    <ul v-else class="space-y-2">
      <li v-for="c in clusters" :key="c.id" class="p-2 border rounded">
        <strong>{{ c.spec?.displayName || c.id }}</strong>
        <span class="ml-2 text-sm"
              :class="statusColor(c)">
          {{ clusterStatus(c) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'ClusterList',
  data() {
    return {
      clusters: [],
      loading: true,
      error: null
    };
  },
  async created() {
    try {
      // Initial fetch
      const res = await this.$store.dispatch('steve/findAll', {
        type: 'management.cattle.io.cluster'
      });

      this.clusters = res || [];
      this.loading = false;

      // Watch for live updates
      this.$store.dispatch('steve/watch', {
        type: 'management.cattle.io.cluster',
        watch: (event) => {
          const obj = event.object;
          if (!obj?.id) return;

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
    } catch (err) {
      this.error = err.message || 'Unknown error';
      this.loading = false;
    }
  },
  beforeDestroy() {
    this.$store.dispatch('steve/forgetType', 'management.cattle.io.cluster');
  },
  methods: {
    clusterStatus(cluster) {
      return cluster?.status?.phase || 'Unknown';
    },
    statusColor(cluster) {
      const phase = cluster?.status?.phase || '';
      if (phase === 'Active') return 'text-green-600';
      if (phase === 'Provisioning') return 'text-yellow-600';
      if (phase === 'Error' || phase === 'Unavailable') return 'text-red-600';
      return 'text-gray-600';
    }
  }
};
</script>
