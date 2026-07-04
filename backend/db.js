/**
 * Simple in-memory storage manager that preserves live CRUD objects 
 * for multiple tenants (heating, screed, electrical).
 */
const bcrypt = require('bcryptjs');

const initialUsers = [
  {
    id: 'u-1',
    email: 'admin@abdelghanem.co.uk',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'Admin',
    name: 'Global Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    tenantId: 'all'
  },
  {
    id: 'u-2',
    email: 'dave@heatingworks.co.uk',
    passwordHash: bcrypt.hashSync('dave123', 10),
    role: 'Operator',
    name: 'Dave Miller',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    tenantId: 'heating'
  },
  {
    id: 'u-3',
    email: 'isabella@screedworks.co.uk',
    passwordHash: bcrypt.hashSync('isabella123', 10),
    role: 'Marketer',
    name: 'Isabella Cooper',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    tenantId: 'screed'
  },
  {
    id: 'u-4',
    email: 'john@electricalworks.co.uk',
    passwordHash: bcrypt.hashSync('john123', 10),
    role: 'Technician',
    name: 'John Smith',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    tenantId: 'electrical'
  }
];

const initialContacts = [];

const initialDeals = [];

const initialTasks = [];

const initialDocuments = [];

const initialCampaigns = [];

// Memory Database
const db = {
  users: [...initialUsers],
  contacts: [...initialContacts],
  deals: [...initialDeals],
  tasks: [...initialTasks],
  documents: [...initialDocuments],
  campaigns: [...initialCampaigns]
};

module.exports = db;
