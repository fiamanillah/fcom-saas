export const authManifest = {
  id: "auth",
  name: "Authentication, Identity & Access Control",
  description:
    "Manages user identity, tenant membership, session security, and role-based permissions to resolve permission chaos and protect sensitive business data.",
  basePath: "/auth",

  entitlements: {
    features: [
      {
        key: "auth:sso",
        name: "Single Sign-On (SAML/OIDC)",
        description: "Enterprise identity provider integration",
      },
      {
        key: "auth:mfa",
        name: "Enforced Multi-Factor Authentication",
        description: "Mandatory 2FA/OTP policies for workspace members",
      },
    ],
    quotas: [
      {
        key: "auth:max_team_members",
        name: "Maximum Workspace Seats",
        unit: "seats",
      },
    ],
  },

  permissions: {
    tenant: [
      { key: "auth:manage_users", label: "Manage Users & Members" },
      { key: "auth:manage_roles", label: "Manage Roles & Scopes" },
      { key: "auth:invite_members", label: "Invite Team Members" },
      { key: "auth:view_audit_logs", label: "View Audit & Security Logs" },
    ],
    platform: [
      { key: "platform:auth_admin", label: "Platform Auth Admin" },
      { key: "platform:impersonate", label: "Platform User Impersonation" },
    ],
  },

  operations: {
    queues: ["auth-events"],
    auditCategory: "AUTH",
    metricsPrefix: "auth_",
  },
} as const;
