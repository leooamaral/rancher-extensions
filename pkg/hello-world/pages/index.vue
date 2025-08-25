<template>
  <div>
    <h2>Clusters</h2>

    <!-- Cluster selection list -->
    <ul class="mb-4">
      <li 
        v-for="c in clusters" 
        :key="c.id"
        @click="selectedClusterId = c.id"
        :class="{'font-bold text-blue-600': selectedClusterId === c.id, 'cursor-pointer': true}"
      >
        {{ c.id }} — 
        <span :class="stateColor(c.metadata?.state)">
          {{ c.metadata?.state?.name || 'unknown' }}
          <span v-if="c.metadata?.state?.message">({{ c.metadata.state.message }})</span>
        </span>
      </li>
    </ul>

    <!-- Nodes for selected cluster -->
    <div v-if="selectedClusterId">
      <h3>Nodes for cluster: {{ selectedClusterId }}</h3>
      <ul v-if="nodesByCluster[selectedClusterId] && nodesByCluster[selectedClusterId].length">
        <li v-for="n in nodesByCluster[selectedClusterId]" :key="n.metadata.name">
          🖥️ <strong>{{ n.metadata.name }}</strong>
          — Ready: {{ isReady(n) ? '✅' : '❌' }}
          <span v-if="n.status.nodeInfo">
            ({{ n.status.nodeInfo.kubeletVersion }})
          </span>
        </li>
      </ul>
      <div v-else class="text-gray-500">
        No nodes found
      </div>
    </div>

    <div v-else class="text-gray-500">
      Select a cluster to see its nodes
    </div>
  </div>
</template>

<script>
import { MANAGEMENT } from '@shell/config/types';

export default {
  data() {
    return {
      clusters: [],
      nodesByCluster: {},
      selectedClusterId: null
    }
  },
  async created() {
    try {
      const res = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.CLUSTER
      });
      this.clusters = res || [];

      for (const cluster of this.clusters) {
        try {
          const res = await this.$store.dispatch('management/request', {
            url: `/k8s/clusters/${cluster.id}/v1/nodes`
          });
          const nodes = res?.data || [];
          this.nodesByCluster = { ...this.nodesByCluster, [cluster.id]: nodes };
        } catch (err) {
          console.error(`Failed to fetch nodes for cluster ${cluster.id}`, err);
          this.nodesByCluster = { ...this.nodesByCluster, [cluster.id]: [] };
        }
      }

    } catch (err) {
      console.error('Failed to load clusters', err);
    }
  },
  methods: {
    stateColor(state) {
      if (!state) return 'text-gray-600';
      if (state.name === 'active' && !state.error) return 'text-green-600';
      if (state.transitioning) return 'text-yellow-600';
      if (state.error) return 'text-red-600';
      return 'text-gray-600';
    },
    isReady(node) {
      const cond = node.status?.conditions?.find(c => c.type === "Ready");
      return cond?.status === "True";
    }
  }
};
</script>
