export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  SALES_MANAGER: "SALES_MANAGER",
  SALESPERSON: "SALESPERSON",
  CAMPAIGN_OPERATOR: "CAMPAIGN_OPERATOR",
};

export const ASE_ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.SALES_MANAGER,
  ROLES.CAMPAIGN_OPERATOR,
];

export const INVITEABLE_ROLES = [
  ROLES.SALESPERSON,
  ROLES.SALES_MANAGER,
  ROLES.CAMPAIGN_OPERATOR,
  ROLES.ORG_ADMIN,
];

export function canOpenAdmin(role) {
  const value = String(role || "").toUpperCase();
  if (value === ROLES.SUPER_ADMIN) return true;
  return ASE_ADMIN_ROLES.includes(value);
}

export function salespersonBlockedFromAdmin(role) {
  return String(role || "").toUpperCase() === ROLES.SALESPERSON && !canOpenAdmin(role);
}
