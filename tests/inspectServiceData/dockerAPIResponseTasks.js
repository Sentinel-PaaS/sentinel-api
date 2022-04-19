const dockerAPIResponseTasks = [
  {
      "ID": "2ltllw1ebkg6w8jy2q3iiaqj4",
      "Version": {
          "Index": 45
      },
      "CreatedAt": "2022-04-16T20:58:35.624951806Z",
      "UpdatedAt": "2022-04-16T20:58:54.804117966Z",
      "Labels": {},
      "Spec": {
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
          "ForceUpdate": 0
      },
      "ServiceID": "rj9omgwt5mqrpzuyetykdehbu",
      "Slot": 1,
      "NodeID": "t2pybidwzwklnq4jpkyvkxiuo",
      "Status": {
          "Timestamp": "2022-04-16T20:58:54.780479056Z",
          "State": "running",
          "Message": "started",
          "ContainerStatus": {
              "ContainerID": "35bbdde93462e8a0e28740c25d5b3c7cdb26179b37bda3f348583ea0234c01de",
              "PID": 12179,
              "ExitCode": 0
          },
          "PortStatus": {}
      },
      "DesiredState": "running",
      "NetworksAttachments": [
          {
              "Network": {
                  "ID": "qolwr72o1pay123jgzkx1mqbi",
                  "Version": {
                      "Index": 6
                  },
                  "CreatedAt": "2022-04-16T20:57:02.044338497Z",
                  "UpdatedAt": "2022-04-16T20:57:02.078262469Z",
                  "Spec": {
                      "Name": "ingress",
                      "Labels": {},
                      "DriverConfiguration": {},
                      "Ingress": true,
                      "IPAMOptions": {
                          "Driver": {}
                      },
                      "Scope": "swarm"
                  },
                  "DriverState": {
                      "Name": "overlay",
                      "Options": {
                          "com.docker.network.driver.overlay.vxlanid_list": "4096"
                      }
                  },
                  "IPAMOptions": {
                      "Driver": {
                          "Name": "default"
                      },
                      "Configs": [
                          {
                              "Subnet": "10.0.0.0/24",
                              "Gateway": "10.0.0.1"
                          }
                      ]
                  }
              },
              "Addresses": [
                  "10.0.0.4/24"
              ]
          },
          {
              "Network": {
                  "ID": "jjoyiujk80720lsy2kpmatv1t",
                  "Version": {
                      "Index": 12
                  },
                  "CreatedAt": "2022-04-16T20:58:35.273259935Z",
                  "UpdatedAt": "2022-04-16T20:58:35.275009689Z",
                  "Spec": {
                      "Name": "traefik-public",
                      "Labels": {
                          "com.docker.stack.namespace": "traefik"
                      },
                      "DriverConfiguration": {
                          "Name": "overlay"
                      },
                      "Attachable": true,
                      "Scope": "swarm"
                  },
                  "DriverState": {
                      "Name": "overlay",
                      "Options": {
                          "com.docker.network.driver.overlay.vxlanid_list": "4097"
                      }
                  },
                  "IPAMOptions": {
                      "Driver": {
                          "Name": "default"
                      },
                      "Configs": [
                          {
                              "Subnet": "10.0.1.0/24",
                              "Gateway": "10.0.1.1"
                          }
                      ]
                  }
              },
              "Addresses": [
                  "10.0.1.3/24"
              ]
          }
      ]
  },
  {
      "ID": "9rl4rjd4dq0ct2zczqatja3eq",
      "Version": {
          "Index": 43
      },
      "CreatedAt": "2022-04-16T20:58:36.56446142Z",
      "UpdatedAt": "2022-04-16T20:58:53.083979056Z",
      "Labels": {},
      "Spec": {
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
          "ForceUpdate": 0
      },
      "ServiceID": "c0whxa9cmyxewqmiotu13b5lx",
      "Slot": 1,
      "NodeID": "t2pybidwzwklnq4jpkyvkxiuo",
      "Status": {
          "Timestamp": "2022-04-16T20:58:52.992616055Z",
          "State": "running",
          "Message": "started",
          "ContainerStatus": {
              "ContainerID": "09719b46888512ef521a31ea4aa5d2c41a648c78aeb3f082d784a136bca1effc",
              "PID": 11932,
              "ExitCode": 0
          },
          "PortStatus": {}
      },
      "DesiredState": "running",
      "NetworksAttachments": [
          {
              "Network": {
                  "ID": "qolwr72o1pay123jgzkx1mqbi",
                  "Version": {
                      "Index": 6
                  },
                  "CreatedAt": "2022-04-16T20:57:02.044338497Z",
                  "UpdatedAt": "2022-04-16T20:57:02.078262469Z",
                  "Spec": {
                      "Name": "ingress",
                      "Labels": {},
                      "DriverConfiguration": {},
                      "Ingress": true,
                      "IPAMOptions": {
                          "Driver": {}
                      },
                      "Scope": "swarm"
                  },
                  "DriverState": {
                      "Name": "overlay",
                      "Options": {
                          "com.docker.network.driver.overlay.vxlanid_list": "4096"
                      }
                  },
                  "IPAMOptions": {
                      "Driver": {
                          "Name": "default"
                      },
                      "Configs": [
                          {
                              "Subnet": "10.0.0.0/24",
                              "Gateway": "10.0.0.1"
                          }
                      ]
                  }
              },
              "Addresses": [
                  "10.0.0.8/24"
              ]
          },
          {
              "Network": {
                  "ID": "jjoyiujk80720lsy2kpmatv1t",
                  "Version": {
                      "Index": 12
                  },
                  "CreatedAt": "2022-04-16T20:58:35.273259935Z",
                  "UpdatedAt": "2022-04-16T20:58:35.275009689Z",
                  "Spec": {
                      "Name": "traefik-public",
                      "Labels": {
                          "com.docker.stack.namespace": "traefik"
                      },
                      "DriverConfiguration": {
                          "Name": "overlay"
                      },
                      "Attachable": true,
                      "Scope": "swarm"
                  },
                  "DriverState": {
                      "Name": "overlay",
                      "Options": {
                          "com.docker.network.driver.overlay.vxlanid_list": "4097"
                      }
                  },
                  "IPAMOptions": {
                      "Driver": {
                          "Name": "default"
                      },
                      "Configs": [
                          {
                              "Subnet": "10.0.1.0/24",
                              "Gateway": "10.0.1.1"
                          }
                      ]
                  }
              },
              "Addresses": [
                  "10.0.1.10/24"
              ]
          }
      ]
  },
  {
      "ID": "qsf25p3sl6em6u1758yxug1ts",
      "Version": {
          "Index": 60
      },
      "CreatedAt": "2022-04-16T21:03:43.939577306Z",
      "UpdatedAt": "2022-04-16T21:03:45.015545633Z",
      "Labels": {},
      "Spec": {
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
          "ForceUpdate": 0
      },
      "ServiceID": "yb8msdgfwcs0s1h12cup0tvv6",
      "Slot": 2,
      "NodeID": "t2pybidwzwklnq4jpkyvkxiuo",
      "Status": {
          "Timestamp": "2022-04-16T21:03:44.927208932Z",
          "State": "running",
          "Message": "started",
          "ContainerStatus": {
              "ContainerID": "895ba20e18848a8ad8de424e2dc795891b1ecc7df48858ba55f12d12288eb8ab",
              "PID": 13953,
              "ExitCode": 0
          },
          "PortStatus": {}
      },
      "DesiredState": "running",
      "NetworksAttachments": [
          {
              "Network": {
                  "ID": "jjoyiujk80720lsy2kpmatv1t",
                  "Version": {
                      "Index": 12
                  },
                  "CreatedAt": "2022-04-16T20:58:35.273259935Z",
                  "UpdatedAt": "2022-04-16T20:58:35.275009689Z",
                  "Spec": {
                      "Name": "traefik-public",
                      "Labels": {
                          "com.docker.stack.namespace": "traefik"
                      },
                      "DriverConfiguration": {
                          "Name": "overlay"
                      },
                      "Attachable": true,
                      "Scope": "swarm"
                  },
                  "DriverState": {
                      "Name": "overlay",
                      "Options": {
                          "com.docker.network.driver.overlay.vxlanid_list": "4097"
                      }
                  },
                  "IPAMOptions": {
                      "Driver": {
                          "Name": "default"
                      },
                      "Configs": [
                          {
                              "Subnet": "10.0.1.0/24",
                              "Gateway": "10.0.1.1"
                          }
                      ]
                  }
              },
              "Addresses": [
                  "10.0.1.13/24"
              ]
          }
      ]
  },
  {
      "ID": "rql25w0lki5i1hecbgb4pgow4",
      "Version": {
          "Index": 40
      },
      "CreatedAt": "2022-04-16T20:58:35.929105618Z",
      "UpdatedAt": "2022-04-16T20:58:43.583319642Z",
      "Labels": {},
      "Spec": {
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
          "ForceUpdate": 0
      },
      "ServiceID": "o7zajwddijtctr3iyh76q6kpi",
      "NodeID": "t2pybidwzwklnq4jpkyvkxiuo",
      "Status": {
          "Timestamp": "2022-04-16T20:58:43.478878565Z",
          "State": "running",
          "Message": "started",
          "ContainerStatus": {
              "ContainerID": "d090c0613eb8611eb4c99a8dd9256c039f3b93edbf0e58c2b48f1089bf4a25b3",
              "PID": 11668,
              "ExitCode": 0
          },
          "PortStatus": {}
      },
      "DesiredState": "running",
      "NetworksAttachments": [
          {
              "Network": {
                  "ID": "qolwr72o1pay123jgzkx1mqbi",
                  "Version": {
                      "Index": 6
                  },
                  "CreatedAt": "2022-04-16T20:57:02.044338497Z",
                  "UpdatedAt": "2022-04-16T20:57:02.078262469Z",
                  "Spec": {
                      "Name": "ingress",
                      "Labels": {},
                      "DriverConfiguration": {},
                      "Ingress": true,
                      "IPAMOptions": {
                          "Driver": {}
                      },
                      "Scope": "swarm"
                  },
                  "DriverState": {
                      "Name": "overlay",
                      "Options": {
                          "com.docker.network.driver.overlay.vxlanid_list": "4096"
                      }
                  },
                  "IPAMOptions": {
                      "Driver": {
                          "Name": "default"
                      },
                      "Configs": [
                          {
                              "Subnet": "10.0.0.0/24",
                              "Gateway": "10.0.0.1"
                          }
                      ]
                  }
              },
              "Addresses": [
                  "10.0.0.6/24"
              ]
          },
          {
              "Network": {
                  "ID": "jjoyiujk80720lsy2kpmatv1t",
                  "Version": {
                      "Index": 12
                  },
                  "CreatedAt": "2022-04-16T20:58:35.273259935Z",
                  "UpdatedAt": "2022-04-16T20:58:35.275009689Z",
                  "Spec": {
                      "Name": "traefik-public",
                      "Labels": {
                          "com.docker.stack.namespace": "traefik"
                      },
                      "DriverConfiguration": {
                          "Name": "overlay"
                      },
                      "Attachable": true,
                      "Scope": "swarm"
                  },
                  "DriverState": {
                      "Name": "overlay",
                      "Options": {
                          "com.docker.network.driver.overlay.vxlanid_list": "4097"
                      }
                  },
                  "IPAMOptions": {
                      "Driver": {
                          "Name": "default"
                      },
                      "Configs": [
                          {
                              "Subnet": "10.0.1.0/24",
                              "Gateway": "10.0.1.1"
                          }
                      ]
                  }
              },
              "Addresses": [
                  "10.0.1.6/24"
              ]
          }
      ]
  },
  {
      "ID": "vny4yzxm45ngi61umz2q1mgoy",
      "Version": {
          "Index": 54
      },
      "CreatedAt": "2022-04-16T21:02:09.594468952Z",
      "UpdatedAt": "2022-04-16T21:02:41.2761611Z",
      "Labels": {},
      "Spec": {
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
          "ForceUpdate": 0
      },
      "ServiceID": "yb8msdgfwcs0s1h12cup0tvv6",
      "Slot": 1,
      "NodeID": "t2pybidwzwklnq4jpkyvkxiuo",
      "Status": {
          "Timestamp": "2022-04-16T21:02:41.224651007Z",
          "State": "running",
          "Message": "started",
          "ContainerStatus": {
              "ContainerID": "65e0e9fb5dede69c9878ae5b1f8ce92ce9a7e176666437b26b5ad9369a861ae7",
              "PID": 13459,
              "ExitCode": 0
          },
          "PortStatus": {}
      },
      "DesiredState": "running",
      "NetworksAttachments": [
          {
              "Network": {
                  "ID": "jjoyiujk80720lsy2kpmatv1t",
                  "Version": {
                      "Index": 12
                  },
                  "CreatedAt": "2022-04-16T20:58:35.273259935Z",
                  "UpdatedAt": "2022-04-16T20:58:35.275009689Z",
                  "Spec": {
                      "Name": "traefik-public",
                      "Labels": {
                          "com.docker.stack.namespace": "traefik"
                      },
                      "DriverConfiguration": {
                          "Name": "overlay"
                      },
                      "Attachable": true,
                      "Scope": "swarm"
                  },
                  "DriverState": {
                      "Name": "overlay",
                      "Options": {
                          "com.docker.network.driver.overlay.vxlanid_list": "4097"
                      }
                  },
                  "IPAMOptions": {
                      "Driver": {
                          "Name": "default"
                      },
                      "Configs": [
                          {
                              "Subnet": "10.0.1.0/24",
                              "Gateway": "10.0.1.1"
                          }
                      ]
                  }
              },
              "Addresses": [
                  "10.0.1.12/24"
              ]
          }
      ]
  },
  {
      "ID": "z3mh8mbmx351m0ydw0g7zk14p",
      "Version": {
          "Index": 46
      },
      "CreatedAt": "2022-04-16T20:58:36.231748895Z",
      "UpdatedAt": "2022-04-16T20:58:55.006797125Z",
      "Labels": {},
      "Spec": {
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
          "ForceUpdate": 0
      },
      "ServiceID": "zgyprzckrcakw4k6yhr7w5g6m",
      "Slot": 1,
      "NodeID": "t2pybidwzwklnq4jpkyvkxiuo",
      "Status": {
          "Timestamp": "2022-04-16T20:58:54.957072434Z",
          "State": "running",
          "Message": "started",
          "ContainerStatus": {
              "ContainerID": "3e99ae76ba1b4fc43383132261bde6218918b6113eebda9623bd25a1f8a3548c",
              "PID": 12272,
              "ExitCode": 0
          },
          "PortStatus": {}
      },
      "DesiredState": "running",
      "NetworksAttachments": [
          {
              "Network": {
                  "ID": "jjoyiujk80720lsy2kpmatv1t",
                  "Version": {
                      "Index": 12
                  },
                  "CreatedAt": "2022-04-16T20:58:35.273259935Z",
                  "UpdatedAt": "2022-04-16T20:58:35.275009689Z",
                  "Spec": {
                      "Name": "traefik-public",
                      "Labels": {
                          "com.docker.stack.namespace": "traefik"
                      },
                      "DriverConfiguration": {
                          "Name": "overlay"
                      },
                      "Attachable": true,
                      "Scope": "swarm"
                  },
                  "DriverState": {
                      "Name": "overlay",
                      "Options": {
                          "com.docker.network.driver.overlay.vxlanid_list": "4097"
                      }
                  },
                  "IPAMOptions": {
                      "Driver": {
                          "Name": "default"
                      },
                      "Configs": [
                          {
                              "Subnet": "10.0.1.0/24",
                              "Gateway": "10.0.1.1"
                          }
                      ]
                  }
              },
              "Addresses": [
                  "10.0.1.8/24"
              ]
          }
      ]
  }
]

module.exports = {
  dockerAPIResponseTasks
}