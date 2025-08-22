<template>
  <div>
    <h2>Install Ollama</h2>

    <label for="node">Choose Node:</label>
    <select v-model="selectedNode" id="node">
      <option v-for="node in nodes" :key="node.id" :value="node.metadata.name">
        {{ node.metadata.name }}
      </option>
    </select>

    <br><br>
    <button @click="installOllama">Install Ollama</button>
  </div>
</template>

<script setup>
import { inject, onMounted, ref } from 'vue';

// Rancher injects $store globally into extensions
const $store = inject('$store');

const selectedNode = ref('');
const nodes = ref([]);

onMounted(async () => {
  // Fetch all nodes from Rancher's management store
  const res = await $store.dispatch('management/findAll', { type: 'node' });
  nodes.value = res;
  if (res.length > 0) {
    selectedNode.value = res[0].metadata.name;
  }
});

async function installOllama() {
  try {
    const helmValues = {
      nodeSelector: {
        'kubernetes.io/hostname': selectedNode.value
      }
    };

    // Create a Helm release using Rancher's ClusterHelmChart resource
    await $store.dispatch('management/create', {
      type: 'helm.cattle.io.clusterhelmchart',
      metadata: {
        name: `ollama-${selectedNode.value}`,
        namespace: 'cattle-system'
      },
      spec: {
        chart: 'ollama',           // Make sure this chart is available
        repoName: 'myrepo',        // This repo must be added to Rancher
        version: '1.0.0',          // Use the correct version
        targetNamespace: 'ollama', // Where the app will be installed
        values: helmValues
      }
    });

    alert('Ollama installation triggered.');
  } catch (err) {
    console.error('Failed to install Ollama:', err);
    alert('Installation failed — see console for details.');
  }
}
</script>
