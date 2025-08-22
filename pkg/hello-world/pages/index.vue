<template>
  <div>
    <h2>Install Ollama to a Cluster</h2>

    <label for="cluster">Select Cluster:</label>
    <select v-model="selectedClusterId" @change="loadNodes">
      <option v-for="cluster in clusters" :key="cluster.id" :value="cluster.id">
        {{ cluster.nameDisplay || cluster.id }}
      </option>
    </select>

    <br /><br />

    <label v-if="nodes.length > 0" for="node">Select Node:</label>
    <select v-if="nodes.length > 0" v-model="selectedNodeName">
      <option v-for="node in nodes" :key="node.id" :value="node.metadata.name">
        {{ node.metadata.name }}
      </option>
    </select>

    <br /><br />
    <button :disabled="!selectedNodeName || !selectedClusterId" @click="installOllama">
      Install Ollama
    </button>
  </div>
</template>

<script setup>
import { inject, onMounted, ref } from 'vue';

const $store = inject('$store');

const clusters = ref([]);
const nodes = ref([]);
const selectedClusterId = ref('');
const selectedNodeName = ref('');

onMounted(async () => {
  // Fetch all clusters from management
  clusters.value = await $store.dispatch('management/findAll', { type: 'cluster' });

  if (clusters.value.length > 0) {
    selectedClusterId.value = clusters.value[0].id;
    await loadNodes();
  }
});

async function loadNodes() {
  if (!selectedClusterId.value) return;

  // Use the cluster context to fetch nodes
  const clusterStore = $store.getters['cluster/byId'](selectedClusterId.value);

  if (!clusterStore) {
    console.error('Cluster store not found');
    return;
  }

  nodes.value = await clusterStore.dispatch('cluster/findAll', { type: 'node' });

  if (nodes.value.length > 0) {
    selectedNodeName.value = nodes.value[0].metadata.name;
  }
}

async function installOllama() {
  if (!selectedClusterId.value || !selectedNodeName.value) return;

  const chartName = `ollama-${selectedNodeName.value}`;

  const helmValues = {
    nodeSelector: {
      'kubernetes.io/hostname': selectedNodeName.value
    }
  };

  const clusterStore = $store.getters['cluster/byId'](selectedClusterId.value);

  await clusterStore.dispatch('cluster/create', {
    type: 'helm.cattle.io.clusterhelmchart',
    metadata: {
      name: chartName,
      namespace: 'cattle-system',
    },
    spec: {
      chart: 'ollama',
      repoName: 'myrepo',
      version: '1.0.0',
      targetNamespace: 'ollama',
      values: helmValues,
    }
  });

  alert(`Ollama installation triggered on node "${selectedNodeName.value}" in cluster "${selectedClusterId.value}".`);
}
</script>
