<template>
  <div>
    <h2>Clusters</h2>

    <ul>
      <li v-for="c in clusters" :key="c.id">
        <strong>{{ c.id }}</strong> — 
        <span :class="stateColor(c)">
          {{ clusterState(c).name }}
          <span v-if="clusterState(c).message">({{ clusterState(c).message }})</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
import { MANAGEMENT } from '@shell/config/types';

export default {
  data() {
    return {
      clusters: []
    }
  },
  async created() {
    try {
      const res = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
      this.clusters = res || [];

      // watch for live updates
      this.$store.dispatch('management/watch', {
        type: 'cluster',
        watch: (event) => {
          const obj = event.object || event;
          if (!obj?.id) return;

          const idx = this.clusters.findIndex(c => c.id === obj.id);
          if (event.type === 'ADDED' || event.type === 'MODIFIED') {
            if (idx >= 0) this.$set(this.clusters, idx, obj);
            else this.clusters.push(obj);
          } else if (event.type === 'DELETED' && idx >= 0) {
            this.clusters.splice(idx, 1);
          }
        }
      });
    } catch (err) {
      console.error('Failed to load clusters', err);
    }
  },
  beforeDestroy() {
    this.$store.dispatch('management/forgetType', 'cluster');
  },
  methods: {
    // derive cluster state from Ready condition
    clusterState(cluster) {
      const ready = cluster?.status?.conditions?.find(c => c.type === 'Ready');
      if (!ready) return { name: 'unknown', message: '', error: false, transitioning: false };

      return {
        name: ready.status.toLowerCase() === 'true' ? 'active' : 'error',
        message: ready.message || 'Resource is not ready',
        error: ready.status.toLowerCase() !== 'true',
        transitioning: ready.status.toLowerCase() === 'unknown'
      };
    },

    stateColor(cluster) {
      const s = this.clusterState(cluster);
      if (s.name === 'active' && !s.error) return 'text-green-600';
      if (s.transitioning) return 'text-yellow-600';
      if (s.error) return 'text-red-600';
      return 'text-gray-600';
    }
  }
};
</script>
