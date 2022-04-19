const dockerAPIResponseServices = [
  {
      "ID": "c0whxa9cmyxewqmiotu13b5lx",
      "Version": {
          "Index": 34
      },
      "CreatedAt": "2022-04-16T20:58:36.548632457Z",
      "UpdatedAt": "2022-04-16T20:58:36.550104348Z",
      "Spec": {
          "Name": "traefik_traefik",
          "Labels": {
              "com.docker.stack.image": "traefik:2.6",
              "com.docker.stack.namespace": "traefik",
              "traefik.enable": "true",
              "traefik.http.middlewares.monitor-auth.basicauth.users": "admin:password",
              "traefik.http.routers.traefik.entrypoints": "websecure",
              "traefik.http.routers.traefik.middlewares": "monitor-auth",
              "traefik.http.routers.traefik.rule": "Host(`traefik.default.com`)",
              "traefik.http.routers.traefik.service": "api@internal",
              "traefik.http.routers.traefik.tls": "true",
              "traefik.http.routers.traefik.tls.certresolver": "myresolver",
              "traefik.http.services.traefik.loadbalancer.server.port": "8080"
          },
          "TaskTemplate": {
              "ContainerSpec": {
                  "Image": "traefik:2.6@sha256:126443503c12ced877f806cad0c7bd82ea1fce5d5ff7ac8663c99cede85e961f",
                  "Labels": {
                      "com.docker.stack.namespace": "traefik"
                  },
                  "Privileges": {
                      "CredentialSpec": null,
                      "SELinuxContext": null
                  },
                  "Mounts": [
                      {
                          "Type": "bind",
                          "Source": "/var/run/docker.sock",
                          "Target": "/var/run/docker.sock"
                      },
                      {
                          "Type": "bind",
                          "Source": "/conf.d",
                          "Target": "/conf.d"
                      },
                      {
                          "Type": "bind",
                          "Source": "/letsencrypt/acme.json",
                          "Target": "/assets/letsencrypt/acme.json"
                      }
                  ],
                  "Configs": [
                      {
                          "File": {
                              "Name": "/etc/traefik/traefik.yaml",
                              "UID": "0",
                              "GID": "0",
                              "Mode": 292
                          },
                          "ConfigID": "du55mfskmag1747uj3xf40yg5",
                          "ConfigName": "traefik-config"
                      }
                  ],
                  "Isolation": "default"
              },
              "Resources": {},
              "RestartPolicy": {
                  "Condition": "any",
                  "MaxAttempts": 0
              },
              "Placement": {
                  "Constraints": [
                      "node.role == manager"
                  ],
                  "Platforms": [
                      {
                          "Architecture": "amd64",
                          "OS": "linux"
                      },
                      {
                          "OS": "linux"
                      },
                      {
                          "Architecture": "arm64",
                          "OS": "linux"
                      },
                      {
                          "Architecture": "s390x",
                          "OS": "linux"
                      }
                  ]
              },
              "Networks": [
                  {
                      "Target": "jjoyiujk80720lsy2kpmatv1t",
                      "Aliases": [
                          "traefik"
                      ]
                  }
              ],
              "ForceUpdate": 0,
              "Runtime": "container"
          },
          "Mode": {
              "Replicated": {
                  "Replicas": 1
              }
          },
          "EndpointSpec": {
              "Mode": "vip",
              "Ports": [
                  {
                      "Protocol": "tcp",
                      "TargetPort": 80,
                      "PublishedPort": 80,
                      "PublishMode": "ingress"
                  },
                  {
                      "Protocol": "tcp",
                      "TargetPort": 443,
                      "PublishedPort": 443,
                      "PublishMode": "ingress"
                  },
                  {
                      "Protocol": "tcp",
                      "TargetPort": 8080,
                      "PublishedPort": 8080,
                      "PublishMode": "ingress"
                  }
              ]
          }
      },
      "Endpoint": {
          "Spec": {
              "Mode": "vip",
              "Ports": [
                  {
                      "Protocol": "tcp",
                      "TargetPort": 80,
                      "PublishedPort": 80,
                      "PublishMode": "ingress"
                  },
                  {
                      "Protocol": "tcp",
                      "TargetPort": 443,
                      "PublishedPort": 443,
                      "PublishMode": "ingress"
                  },
                  {
                      "Protocol": "tcp",
                      "TargetPort": 8080,
                      "PublishedPort": 8080,
                      "PublishMode": "ingress"
                  }
              ]
          },
          "Ports": [
              {
                  "Protocol": "tcp",
                  "TargetPort": 80,
                  "PublishedPort": 80,
                  "PublishMode": "ingress"
              },
              {
                  "Protocol": "tcp",
                  "TargetPort": 443,
                  "PublishedPort": 443,
                  "PublishMode": "ingress"
              },
              {
                  "Protocol": "tcp",
                  "TargetPort": 8080,
                  "PublishedPort": 8080,
                  "PublishMode": "ingress"
              }
          ],
          "VirtualIPs": [
              {
                  "NetworkID": "qolwr72o1pay123jgzkx1mqbi",
                  "Addr": "10.0.0.7/24"
              },
              {
                  "NetworkID": "jjoyiujk80720lsy2kpmatv1t",
                  "Addr": "10.0.1.9/24"
              }
          ]
      }
  },
  {
      "ID": "o7zajwddijtctr3iyh76q6kpi",
      "Version": {
          "Index": 22
      },
      "CreatedAt": "2022-04-16T20:58:35.923400945Z",
      "UpdatedAt": "2022-04-16T20:58:35.926112132Z",
      "Spec": {
          "Name": "traefik_node-exporter",
          "Labels": {
              "com.docker.stack.image": "prom/node-exporter",
              "com.docker.stack.namespace": "traefik",
              "traefik.http.services.node-exporter.loadbalancer.server.port": "9100"
          },
          "TaskTemplate": {
              "ContainerSpec": {
                  "Image": "prom/node-exporter:latest@sha256:f2269e73124dd0f60a7d19a2ce1264d33d08a985aed0ee6b0b89d0be470592cd",
                  "Labels": {
                      "com.docker.stack.namespace": "traefik"
                  },
                  "Args": [
                      "--path.procfs=/host/proc",
                      "--path.sysfs=/host/sys",
                      "--collector.filesystem.ignored-mount-points",
                      "^/(sys|proc|dev|host|etc|rootfs/var/lib/docker/containers|rootfs/var/lib/docker/overlay2|rootfs/run/docker/netns|rootfs/var/lib/docker/aufs)($|/)"
                  ],
                  "Privileges": {
                      "CredentialSpec": null,
                      "SELinuxContext": null
                  },
                  "Mounts": [
                      {
                          "Type": "bind",
                          "Source": "/proc",
                          "Target": "/host/proc",
                          "ReadOnly": true
                      },
                      {
                          "Type": "bind",
                          "Source": "/sys",
                          "Target": "/host/sys",
                          "ReadOnly": true
                      },
                      {
                          "Type": "bind",
                          "Source": "/",
                          "Target": "/rootfs",
                          "ReadOnly": true
                      }
                  ],
                  "Isolation": "default"
              },
              "Resources": {},
              "RestartPolicy": {
                  "Condition": "on-failure",
                  "MaxAttempts": 0
              },
              "Placement": {
                  "Platforms": [
                      {
                          "Architecture": "amd64",
                          "OS": "linux"
                      },
                      {
                          "Architecture": "arm64",
                          "OS": "linux"
                      },
                      {
                          "OS": "linux"
                      },
                      {
                          "Architecture": "ppc64le",
                          "OS": "linux"
                      },
                      {
                          "Architecture": "s390x",
                          "OS": "linux"
                      }
                  ]
              },
              "Networks": [
                  {
                      "Target": "jjoyiujk80720lsy2kpmatv1t",
                      "Aliases": [
                          "node-exporter"
                      ]
                  }
              ],
              "ForceUpdate": 0,
              "Runtime": "container"
          },
          "Mode": {
              "Global": {}
          },
          "EndpointSpec": {
              "Mode": "vip",
              "Ports": [
                  {
                      "Protocol": "tcp",
                      "TargetPort": 9100,
                      "PublishedPort": 9100,
                      "PublishMode": "ingress"
                  }
              ]
          }
      },
      "Endpoint": {
          "Spec": {
              "Mode": "vip",
              "Ports": [
                  {
                      "Protocol": "tcp",
                      "TargetPort": 9100,
                      "PublishedPort": 9100,
                      "PublishMode": "ingress"
                  }
              ]
          },
          "Ports": [
              {
                  "Protocol": "tcp",
                  "TargetPort": 9100,
                  "PublishedPort": 9100,
                  "PublishMode": "ingress"
              }
          ],
          "VirtualIPs": [
              {
                  "NetworkID": "qolwr72o1pay123jgzkx1mqbi",
                  "Addr": "10.0.0.5/24"
              },
              {
                  "NetworkID": "jjoyiujk80720lsy2kpmatv1t",
                  "Addr": "10.0.1.5/24"
              }
          ]
      }
  },
  {
      "ID": "rj9omgwt5mqrpzuyetykdehbu",
      "Version": {
          "Index": 15
      },
      "CreatedAt": "2022-04-16T20:58:35.620725334Z",
      "UpdatedAt": "2022-04-16T20:58:35.621972239Z",
      "Spec": {
          "Name": "traefik_prometheus",
          "Labels": {
              "com.docker.stack.image": "prom/prometheus:v2.22.1",
              "com.docker.stack.namespace": "traefik",
              "traefik.docker.network": "traefik-public",
              "traefik.http.middlewares.monitor-auth.basicauth.users": "admin:password",
              "traefik.http.routers.prometheus.entrypoints": "websecure",
              "traefik.http.routers.prometheus.middlewares": "monitor-auth",
              "traefik.http.routers.prometheus.rule": "Host(`prometheus.default.com`)",
              "traefik.http.routers.prometheus.service": "prometheus",
              "traefik.http.routers.prometheus.tls": "true",
              "traefik.http.routers.prometheus.tls.certresolver": "myresolver",
              "traefik.http.services.prometheus.loadbalancer.server.port": "9090"
          },
          "TaskTemplate": {
              "ContainerSpec": {
                  "Image": "prom/prometheus:v2.22.1@sha256:b899dbd1b9017b9a379f76ce5b40eead01a62762c4f2057eacef945c3c22d210",
                  "Labels": {
                      "com.docker.stack.namespace": "traefik"
                  },
                  "Args": [
                      "--config.file=/etc/prometheus/prometheus.yml",
                      "--storage.tsdb.path=/prometheus",
                      "--web.console.libraries=/usr/share/prometheus/console_libraries",
                      "--web.console.templates=/usr/share/prometheus/consoles"
                  ],
                  "Privileges": {
                      "CredentialSpec": null,
                      "SELinuxContext": null
                  },
                  "Mounts": [
                      {
                          "Type": "bind",
                          "Source": "/prometheus",
                          "Target": "/etc/prometheus/"
                      },
                      {
                          "Type": "volume",
                          "Source": "traefik_prometheus_data",
                          "Target": "/prometheus",
                          "VolumeOptions": {
                              "Labels": {
                                  "com.docker.stack.namespace": "traefik"
                              }
                          }
                      }
                  ],
                  "Isolation": "default"
              },
              "Resources": {},
              "RestartPolicy": {
                  "Condition": "on-failure",
                  "MaxAttempts": 0
              },
              "Placement": {
                  "Constraints": [
                      "node.role==manager"
                  ],
                  "Platforms": [
                      {
                          "Architecture": "amd64",
                          "OS": "linux"
                      },
                      {
                          "Architecture": "arm64",
                          "OS": "linux"
                      },
                      {
                          "OS": "linux"
                      },
                      {
                          "Architecture": "ppc64le",
                          "OS": "linux"
                      },
                      {
                          "Architecture": "s390x",
                          "OS": "linux"
                      }
                  ]
              },
              "Networks": [
                  {
                      "Target": "jjoyiujk80720lsy2kpmatv1t",
                      "Aliases": [
                          "prometheus"
                      ]
                  }
              ],
              "ForceUpdate": 0,
              "Runtime": "container"
          },
          "Mode": {
              "Replicated": {
                  "Replicas": 1
              }
          },
          "EndpointSpec": {
              "Mode": "vip",
              "Ports": [
                  {
                      "Protocol": "tcp",
                      "TargetPort": 9090,
                      "PublishedPort": 9090,
                      "PublishMode": "ingress"
                  }
              ]
          }
      },
      "Endpoint": {
          "Spec": {
              "Mode": "vip",
              "Ports": [
                  {
                      "Protocol": "tcp",
                      "TargetPort": 9090,
                      "PublishedPort": 9090,
                      "PublishMode": "ingress"
                  }
              ]
          },
          "Ports": [
              {
                  "Protocol": "tcp",
                  "TargetPort": 9090,
                  "PublishedPort": 9090,
                  "PublishMode": "ingress"
              }
          ],
          "VirtualIPs": [
              {
                  "NetworkID": "qolwr72o1pay123jgzkx1mqbi",
                  "Addr": "10.0.0.3/24"
              },
              {
                  "NetworkID": "jjoyiujk80720lsy2kpmatv1t",
                  "Addr": "10.0.1.2/24"
              }
          ]
      }
  },
  {
      "ID": "yb8msdgfwcs0s1h12cup0tvv6",
      "Version": {
          "Index": 55
      },
      "CreatedAt": "2022-04-16T21:02:09.588927298Z",
      "UpdatedAt": "2022-04-16T21:03:43.937694763Z",
      "Spec": {
          "Name": "catnip_production",
          "Labels": {
              "com.docker.stack.image": "appsrus/cat-production",
              "com.docker.stack.namespace": "catnip",
              "traefik.enable": "true",
              "traefik.http.routers.catnip_production_rtr.entrypoints": "websecure",
              "traefik.http.routers.catnip_production_rtr.rule": "Host(`app1.michaelfatigati.com`)",
              "traefik.http.routers.catnip_production_rtr.tls": "true",
              "traefik.http.routers.catnip_production_rtr.tls.certresolver": "myresolver",
              "traefik.http.services.catnip_production_svc.loadbalancer.server.port": "5000"
          },
          "TaskTemplate": {
              "ContainerSpec": {
                  "Image": "appsrus/cat-production:latest@sha256:1d1f9135c3d06d778160248a6d0f60d747a287218a7c4df68b527acc56005fcf",
                  "Labels": {
                      "com.docker.stack.namespace": "catnip"
                  },
                  "Privileges": {
                      "CredentialSpec": null,
                      "SELinuxContext": null
                  },
                  "Isolation": "default"
              },
              "Resources": {},
              "RestartPolicy": {
                  "Condition": "on-failure",
                  "Delay": 5000000000,
                  "MaxAttempts": 5
              },
              "Placement": {
                  "Platforms": [
                      {
                          "Architecture": "amd64",
                          "OS": "linux"
                      }
                  ]
              },
              "Networks": [
                  {
                      "Target": "jjoyiujk80720lsy2kpmatv1t",
                      "Aliases": [
                          "production"
                      ]
                  }
              ],
              "ForceUpdate": 0,
              "Runtime": "container"
          },
          "Mode": {
              "Replicated": {
                  "Replicas": 2
              }
          },
          "UpdateConfig": {
              "Parallelism": 1,
              "Delay": 5000000000,
              "FailureAction": "rollback",
              "MaxFailureRatio": 0,
              "Order": "stop-first"
          },
          "EndpointSpec": {
              "Mode": "vip"
          }
      },
      "PreviousSpec": {
          "Name": "catnip_production",
          "Labels": {
              "com.docker.stack.image": "appsrus/cat-production",
              "com.docker.stack.namespace": "catnip",
              "traefik.enable": "true",
              "traefik.http.routers.catnip_production_rtr.entrypoints": "websecure",
              "traefik.http.routers.catnip_production_rtr.rule": "Host(`app1.michaelfatigati.com`)",
              "traefik.http.routers.catnip_production_rtr.tls": "true",
              "traefik.http.routers.catnip_production_rtr.tls.certresolver": "myresolver",
              "traefik.http.services.catnip_production_svc.loadbalancer.server.port": "5000"
          },
          "TaskTemplate": {
              "ContainerSpec": {
                  "Image": "appsrus/cat-production:latest@sha256:1d1f9135c3d06d778160248a6d0f60d747a287218a7c4df68b527acc56005fcf",
                  "Labels": {
                      "com.docker.stack.namespace": "catnip"
                  },
                  "Privileges": {
                      "CredentialSpec": null,
                      "SELinuxContext": null
                  },
                  "Isolation": "default"
              },
              "Resources": {},
              "RestartPolicy": {
                  "Condition": "on-failure",
                  "Delay": 5000000000,
                  "MaxAttempts": 5
              },
              "Placement": {
                  "Platforms": [
                      {
                          "Architecture": "amd64",
                          "OS": "linux"
                      }
                  ]
              },
              "Networks": [
                  {
                      "Target": "jjoyiujk80720lsy2kpmatv1t",
                      "Aliases": [
                          "production"
                      ]
                  }
              ],
              "ForceUpdate": 0,
              "Runtime": "container"
          },
          "Mode": {
              "Replicated": {
                  "Replicas": 1
              }
          },
          "UpdateConfig": {
              "Parallelism": 1,
              "Delay": 5000000000,
              "FailureAction": "rollback",
              "MaxFailureRatio": 0,
              "Order": "stop-first"
          },
          "EndpointSpec": {
              "Mode": "vip"
          }
      },
      "Endpoint": {
          "Spec": {
              "Mode": "vip"
          },
          "VirtualIPs": [
              {
                  "NetworkID": "jjoyiujk80720lsy2kpmatv1t",
                  "Addr": "10.0.1.11/24"
              }
          ]
      }
  },
  {
      "ID": "zgyprzckrcakw4k6yhr7w5g6m",
      "Version": {
          "Index": 28
      },
      "CreatedAt": "2022-04-16T20:58:36.220803732Z",
      "UpdatedAt": "2022-04-16T20:58:36.229976825Z",
      "Spec": {
          "Name": "traefik_grafana",
          "Labels": {
              "com.docker.stack.image": "grafana/grafana:7.3.1",
              "com.docker.stack.namespace": "traefik",
              "traefik.docker.network": "traefik-public",
              "traefik.http.middlewares.monitor-auth.basicauth.users": "admin:password",
              "traefik.http.routers.grafana.entrypoints": "websecure",
              "traefik.http.routers.grafana.middlewares": "monitor-auth",
              "traefik.http.routers.grafana.rule": "Host(`grafana.default.com`)",
              "traefik.http.routers.grafana.service": "grafana",
              "traefik.http.routers.grafana.tls": "true",
              "traefik.http.routers.grafana.tls.certresolver": "myresolver",
              "traefik.http.services.grafana.loadbalancer.server.port": "3000"
          },
          "TaskTemplate": {
              "ContainerSpec": {
                  "Image": "grafana/grafana:7.3.1@sha256:9f43d0ac1fdecdd08a47bce4038fa5c9c67cc84fc025df78b87ae7b7b076aee9",
                  "Labels": {
                      "com.docker.stack.namespace": "traefik"
                  },
                  "Env": [
                      "GF_AUTH_ANONYMOUS_ENABLED=true",
                      "GF_AUTH_ANONYMOUS_ORG_NAME=Main Org.",
                      "GF_AUTH_ANONYMOUS_ORG_ROLE=Admin",
                      "GF_AUTH_BASIC_ENABLED=false",
                      "GF_AUTH_DISABLE_LOGIN_FORM=true",
                      "GF_INSTALL_PLUGINS=grafana-piechart-panel",
                      "GF_SECURITY_ADMIN_PASSWORD=foobar",
                      "GF_USERS_ALLOW_SIGN_UP=false"
                  ],
                  "User": "104",
                  "Privileges": {
                      "CredentialSpec": null,
                      "SELinuxContext": null
                  },
                  "Mounts": [
                      {
                          "Type": "volume",
                          "Source": "traefik_grafana_data",
                          "Target": "/var/lib/grafana",
                          "VolumeOptions": {
                              "Labels": {
                                  "com.docker.stack.namespace": "traefik"
                              }
                          }
                      },
                      {
                          "Type": "bind",
                          "Source": "/grafana/provisioning",
                          "Target": "/etc/grafana/provisioning/"
                      }
                  ],
                  "Isolation": "default"
              },
              "Resources": {},
              "RestartPolicy": {
                  "Condition": "on-failure",
                  "MaxAttempts": 0
              },
              "Placement": {
                  "Constraints": [
                      "node.role == manager"
                  ],
                  "Platforms": [
                      {
                          "Architecture": "amd64",
                          "OS": "linux"
                      },
                      {
                          "Architecture": "arm64",
                          "OS": "linux"
                      },
                      {
                          "OS": "linux"
                      }
                  ]
              },
              "Networks": [
                  {
                      "Target": "jjoyiujk80720lsy2kpmatv1t",
                      "Aliases": [
                          "grafana"
                      ]
                  }
              ],
              "ForceUpdate": 0,
              "Runtime": "container"
          },
          "Mode": {
              "Replicated": {
                  "Replicas": 1
              }
          },
          "EndpointSpec": {
              "Mode": "vip"
          }
      },
      "Endpoint": {
          "Spec": {
              "Mode": "vip"
          },
          "VirtualIPs": [
              {
                  "NetworkID": "jjoyiujk80720lsy2kpmatv1t",
                  "Addr": "10.0.1.7/24"
              }
          ]
      }
  }
]

module.exports = {
  dockerAPIResponseServices
}