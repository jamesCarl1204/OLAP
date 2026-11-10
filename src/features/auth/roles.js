export const ROLES = {
  Administrator: {
    label: 'Admin',
    footerLabel: 'Administrator Portal',
    desc: 'Access system configuration, user role management, audit logs, and global parish parameters.',
  },
  'Parish Staff': {
    label: 'Staff',
    footerLabel: 'Parish Staff Access',
    desc: 'Manage certificate requests, update baptismal and marriage registries, and handle daily queues.',
  },
  'Parish Priest': {
    label: 'Priest',
    footerLabel: 'Parish Priest Portal',
    desc: 'Review analytics, approve sacramental records, schedule appointments, and review mass intentions.',
  },
  Parishioner: {
    label: 'Parishioner',
    footerLabel: 'Parishioner Account',
    desc: 'Submit certificate applications, book marriages, request mass intentions, and track request status.',
  },
};

export const ROLE_NAMES = Object.keys(ROLES);
