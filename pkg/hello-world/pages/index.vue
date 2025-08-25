<script>
import { STEVE } from '@rancher/shell/plugins/steve';

export default {
  name: 'ClusterList',

  data() {
    return {
      clusters: []
    };
  },

  created() {
    // Start watching clusters
    this.$store.dispatch(`${STEVE}/watch`, {
      type: 'management.cattle.io.cluster',
      watch: (event) => {
        // event has: { type: 'ADDED'|'MODIFIED'|'DELETED', data: clusterObj }
        if (event.type === 'ADDED') {
          this.clusters.push(event.data);
        } else if (event.type === 'MODIFIED') {
          this.clusters = this.clusters.map(c =>
            c.id === event.data.id ? event.data : c
          );
        } else if (event.type === 'DELETED') {
          this.clusters = this.clusters.filter(c => c.id !== event.data.id);
        }
      }
    });
  },

  computed: {
    activeClusters() {
      return this.clusters.filter(c => {
        // ✅ Keep local + downstream clusters
        // Only show Active/Ready
        if (c?.status?.phase) {
          return c.status.phase.toLowerCase() === 'active';
        }

        const readyCondition = c?.status?.conditions?.find(
          cond => cond.type === 'Ready'
        );
        return readyCondition?.status === 'True';
      });
    }
  }
};
</script>

<template>
  <div>
    <h2>Active Clusters (Live)</h2>
    <ul>
      <li v-for="c in activeClusters" :key="c.id">
        {{ c.spec?.displayName || c.metadata?.name }}
      </li>
    </ul>
  </div>
</template>
