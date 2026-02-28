// PO Status → Ant Design Tag color + label + icon
export const PO_STATUS_CONFIG = {
  CREATED:   { color: 'default',    label: 'Draft',            icon: '📝' },
  PENDING:   { color: 'warning',    label: 'Pending Approval', icon: '⏳' },
  APPROVED:  { color: 'success',    label: 'Approved',         icon: '✅' },
  RECEIVED:  { color: 'processing', label: 'Received',         icon: '📦' },
  REJECTED:  { color: 'error',      label: 'Rejected',         icon: '❌' },
  CANCELLED: { color: 'default',    label: 'Cancelled',        icon: '🚫' },
};


// VendorCategory → Display label
export const VENDOR_CATEGORY_LABELS = {
  DOMESTIC: 'Domestic (Domestic)',
  FOREIGN:  'Foreign (Foreign)',
  ONE_TIME: 'One-time (One-time)',
  SERVICE:  'Service Provider',
};

// MaterialType → Display label (SAP-style material types)
export const MATERIAL_TYPE_LABELS = {
  ROH:  'ROH — Raw Materials',
  HALB: 'HALB — Semifinished',
  FERT: 'FERT — Finished Goods',
  HAWA: 'HAWA — Trading Goods',
  DIEN: 'DIEN — Services',
  NLAG: 'NLAG — Non-stock',
};

// Role constants matching Spring Security role names
export const ROLES = {
  ADMIN:    'ROLE_ADMIN',
  MANAGER:  'ROLE_MANAGER',
  EMPLOYEE: 'ROLE_EMPLOYEE',
};
