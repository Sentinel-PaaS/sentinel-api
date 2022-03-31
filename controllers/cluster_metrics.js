// don't rename the service anything else but "node-exporter"

const AXIOS = require('axios');
const HTTPS = require('https');

async function getClusterMetrics(managerIP) {
  const agent = new HTTPS.Agent({  
    rejectUnauthorized: false
  });

let nodes = await AXIOS.get(`http://${managerIP}:2375/nodes`);
let nodeSwarmSample = nodes.data;

nodes = nodes.data.map(node => {
  return {
    Role: node.Spec.Role,
    Availability: node.Spec.Availability,
    // internal address does not correspond to service address given by node exporter
    // if we named the nodes themselves, we might be able to match this up
    InternalAddr: node.Status.Addr,
    NodeID: node.ID
  };
});

let metrics = [];

let data = await AXIOS.get(`http://prometheus-2.michaelfatigati.com/api/v1/query`, {
  params: {
    query: "node_filesystem_avail_bytes"
  },
  httpsAgent: agent
});
let nodeExpSample = data.data;
let diskBytesFree = data.data.data.result.map(record => {
  return {
    instance: record.metric.instance,
    diskBytesFree: record.value[1]
  }
});
metrics = diskBytesFree;

data = await AXIOS.get(`http://prometheus-2.michaelfatigati.com/api/v1/query`, {
  params: {
    query: "node_filesystem_size_bytes"
  },
  httpsAgent: agent
});
let diskBytesTotal = data.data.data.result.map(record => {
  return {
    instance: record.metric.instance,
    diskBytesTotal: record.value[1]
  }
});

metrics.map(record1 => {
  diskBytesTotal.forEach(record2 => {
    if (record1.instance === record2.instance) {
      record1.diskBytesTotal = record2.diskBytesTotal;
    }
  })
})

data = await AXIOS.get(`http://prometheus-2.michaelfatigati.com/api/v1/query`, {
  params: {
    // query: "sum(rate(node_cpu{mode!=\"idle\",mode!=\"iowait\",mode!~\"^(?:guest.*)$\"}[5m])) BY (instance)"
    query: "sum by (instance) (irate(node_cpu_seconds_total{mode!=\"idle\",mode!=\"iowait\"}[10m]) * 100)"
  },
  httpsAgent: agent
});
let cpuUsage = data.data.data.result.map(record => {
  return {
    instance: record.metric.instance,
    cpuUsagePercentage: Number(record.value[1]).toFixed(2) + "%"
  }
})
metrics.map(record1 => {
  cpuUsage.forEach(record2 => {
    if (record1.instance === record2.instance) {
      record1.cpuUsagePercentage = record2.cpuUsagePercentage;
    }
  })
})

// could calculate the percentage memory free in one query with `100 - (100 * node_memory_MemFree_bytes / node_memory_MemTotal_bytes)`

data = await AXIOS.get(`http://prometheus-2.michaelfatigati.com/api/v1/query`, {
  params: {
    query: "node_memory_MemTotal_bytes"
  },
  httpsAgent: agent
});
let memoryBytesTotal = data.data.data.result.map(record => {
  return {
    instance: record.metric.instance,
    memoryBytesTotal: record.value[1]
  }
})
metrics.map(record1 => {
  memoryBytesTotal.forEach(record2 => {
    if (record1.instance === record2.instance) {
      record1.memoryBytesTotal = record2.memoryBytesTotal;
    }
  })
})

data = await AXIOS.get(`http://prometheus-2.michaelfatigati.com/api/v1/query`, {
  params: {
    query: "node_memory_MemFree_bytes"
  },
  httpsAgent: agent
});
let memoryBytesFree = data.data.data.result.map(record => {
  return {
    instance: record.metric.instance,
    memoryBytesFree: record.value[1]
  }
})
metrics.map(record1 => {
  memoryBytesFree.forEach(record2 => {
    if (record1.instance === record2.instance) {
      record1.memoryBytesFree = record2.memoryBytesFree;
    }
  })
})

function convertBytesToGB(bytesValue) {
  let gbValue = (Number(bytesValue) / (1000 * 1000 * 1000)).toFixed(2);
  return gbValue;
}

metrics = metrics.map(record => {return {
  instance: record.instance,
  cpuUsagePercentage: record.cpuUsagePercentage,
  diskSpace: `${convertBytesToGB(record.diskBytesFree)}GB free out of ${convertBytesToGB(record.diskBytesTotal)}GB`,
  memorySpace: `${convertBytesToGB(record.memoryBytesFree)}GB free out of ${convertBytesToGB(record.memoryBytesTotal)}GB`
}}
)

let tasks = await AXIOS.get(`http://${managerIP}:2375/tasks`);
tasks = tasks.data.filter(record => record.Spec.Networks[0].Aliases[0] === "node-exporter");
tasks = tasks.map(record => {
  return {
    NodeID: record.NodeID,
    TaskAddress: record.NetworksAttachments[1].Addresses[0]
  }
})

// able to correlate node ids via the tasks address, and the instance associated with each node-exporter metric

metrics.forEach(record => {
  tasks.forEach(task => {
    let regex = /.*(?=[/:])/
    //console.log(task.TaskAddress.match(regex)[0], record.instance.match(regex)[0]);
    if (task.TaskAddress.match(regex)[0] === record.instance.match(regex)[0]) {
      record.NodeID = task.NodeID
    }
  })
});

// console.log(nodes);
// console.log(metrics);

nodes.forEach(node => {
  metrics.forEach(metric => {
    if (metric.NodeID === node.NodeID) {
      node.diskSpace = metric.diskSpace,
      node.memorySpace = metric.memorySpace,
      node.cpuUsageAvgLast10Minutes = metric.cpuUsagePercentage
    }
  })
})

nodes = nodes.map(node => {
  return {
    Role: node.Role,
    Availability: node.Availability,
    NodeID: node.NodeID,
    DiskSpace: node.diskSpace,
    MemorySpace: node.memorySpace,
    cpuUsageAvgLast10Minutes: node.cpuUsageAvgLast10Minutes
  }
})
return nodes;
}

module.exports = {
  getClusterMetrics
}