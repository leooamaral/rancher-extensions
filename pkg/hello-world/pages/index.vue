<template>
  <div>
    <h2>Clusters & Nodes</h2>

    <!-- Cluster dropdown -->
    <div class="mb-4">
      <label for="clusterSelect">Select Cluster:</label>
      <select id="clusterSelect" v-model="selectedClusterId" class="border rounded p-1 ml-2">
        <option disabled value="">Select a cluster</option>
        <option v-for="c in clusters" :key="c.id" :value="c.id">
          {{ c.id }} — {{ c.metadata?.state?.name || 'unknown' }}
        </option>
      </select>
    </div>

    <!-- Node dropdown -->
    <div v-if="selectedClusterId" class="mb-4">
      <label for="nodeSelect">Select Node:</label>
      <select id="nodeSelect" v-model="selectedNodeName" class="border rounded p-1 ml-2">
        <option disabled value="">Select a node</option>
        <option 
          v-for="n in nodesByCluster[selectedClusterId]" 
          :key="n.metadata.name" 
          :value="n.metadata.name"
        >
          {{ n.metadata.name }} — Ready: {{ isReady(n) ? '✅' : '❌' }}
        </option>
      </select>
    </div>

    <!-- Selected node details -->
    <div v-if="selectedNodeName">
      <h3>Details for node: {{ selectedNodeName }}</h3>
      <ul>
        <li v-for="n in nodesByCluster[selectedClusterId]" 
            v-if="n.metadata.name === selectedNodeName"
            :key="n.metadata.name">
          🖥️ <strong>{{ n.metadata.name }}</strong>
          — Ready: {{ isReady(n) ? '✅' : '❌' }}
          <span v-if="n.status.nodeInfo">
            ({{ n.status.nodeInfo.kubeletVersion }})
          </span>
        </li>
      </ul>
    </div>

    <div v-else-if="selectedClusterId && (!nodesByCluster[selectedClusterId] || !nodesByCluster[selectedClusterId].length)">
      No nodes found
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
      selectedClusterId: "",
      selectedNodeName: ""
    }
  },
  async created() {
    try {
      const res = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.CLUSTER
      });
      this.clusters = res || [];

      // fetch nodes for all clusters
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
  watch: {
    selectedClusterId() {
      // Reset selected node when cluster changes
      this.selectedNodeName = "";
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
