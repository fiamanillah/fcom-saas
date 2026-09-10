export const authManifest = {
  id: "auth",
  name: "Authentication & Identity",
  basePath: "/auth",

  entitlements: {
    features: [],
    quotas: [],
  },

  permissions: {
    tenant: [{ key: "auth:manage_users", label: "Manage Users" }],
    platform: [{ key: "platform:auth_admin", label: "Platform Auth Admin" }],
  },

  operations: {
    queues: ["auth-events"],
    auditCategory: "AUTH",
    metricsPrefix: "auth_",
  },
} as const;
