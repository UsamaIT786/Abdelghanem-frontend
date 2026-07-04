const db = require('../db');

/**
 * Filter list helper for tenant isolation
 */
const filterByTenant = (list, tenantId) => {
  if (tenantId === 'all') return list;
  return list.filter(item => item.tenant === tenantId);
};

// ==========================================
// CONTACT OPERATIONS
// ==========================================

exports.getContacts = (req, res) => {
  try {
    const list = filterByTenant(db.contacts, req.tenantId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts collection: ' + err.message });
  }
};

exports.createContact = (req, res) => {
  try {
    const { name, company, email, phone, status, revenue, tenant } = req.body;
    
    const newContact = {
      id: `c-${Date.now()}`,
      name: name || 'Generic Client',
      company: company || 'Independent Developer',
      email: email || 'contact@client.co.uk',
      phone: phone || '07700 900550',
      status: status || 'Leads',
      revenue: parseFloat(revenue) || 1200,
      tenant: tenant || req.tenantId,
      createdAt: new Date().toISOString()
    };

    db.contacts.unshift(newContact);

    // Broadcast to the respective Tenant Room
    const io = req.app.get('io');
    if (io) {
      io.to(newContact.tenant).emit('CONTACT_CREATED', newContact);
      io.to('all').emit('CONTACT_CREATED', newContact);
    }

    res.status(201).json(newContact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save contact CRM record: ' + err.message });
  }
};

exports.updateContact = (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.contacts.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Contact CRM record not found with ID: ' + id });
    }

    const updated = { ...db.contacts[idx], ...req.body };
    db.contacts[idx] = updated;

    const io = req.app.get('io');
    if (io) {
      io.to(updated.tenant).emit('CONTACT_UPDATED', updated);
      io.to('all').emit('CONTACT_UPDATED', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error modifying contact: ' + err.message });
  }
};

exports.deleteContact = (req, res) => {
  try {
    const { id } = req.params;
    const target = db.contacts.find(c => c.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    db.contacts = db.contacts.filter(c => c.id !== id);

    const io = req.app.get('io');
    if (io) {
      io.to(target.tenant).emit('CONTACT_DELETED', { id });
      io.to('all').emit('CONTACT_DELETED', { id });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to drop CRM entity: ' + err.message });
  }
};

// ==========================================
// DEAL OPERATIONS
// ==========================================

exports.getDeals = (req, res) => {
  try {
    const list = filterByTenant(db.deals, req.tenantId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load pipeline: ' + err.message });
  }
};

exports.createDeal = (req, res) => {
  try {
    const { title, company, value, stage, tenant } = req.body;
    
    const newDeal = {
      id: `d-${Date.now()}`,
      title: title || 'New Sales Opportunity',
      company: company || 'Unknown Company',
      value: parseFloat(value) || 0,
      stage: stage || 'Leads',
      tenant: tenant || req.tenantId,
      date: 'Just Now'
    };

    db.deals.unshift(newDeal);

    const io = req.app.get('io');
    if (io) {
      io.to(newDeal.tenant).emit('DEAL_CREATED', newDeal);
      io.to('all').emit('DEAL_CREATED', newDeal);
    }

    res.status(201).json(newDeal);
  } catch (err) {
    res.status(500).json({ error: 'Could not forge sales route: ' + err.message });
  }
};

exports.updateDeal = (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.deals.findIndex(d => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Pipelline deal signature not found' });
    }

    const updated = { ...db.deals[idx], ...req.body };
    db.deals[idx] = updated;

    const io = req.app.get('io');
    if (io) {
      io.to(updated.tenant).emit('DEAL_UPDATED', updated);
      io.to('all').emit('DEAL_UPDATED', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed updating transaction: ' + err.message });
  }
};

exports.deleteDeal = (req, res) => {
  try {
    const { id } = req.params;
    const target = db.deals.find(d => d.id === id);
    if (!target) return res.status(404).json({ error: 'Deal not found' });

    db.deals = db.deals.filter(d => d.id !== id);

    const io = req.app.get('io');
    if (io) {
      io.to(target.tenant).emit('DEAL_DELETED', { id });
      io.to('all').emit('DEAL_DELETED', { id });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Could not purge deal asset: ' + err.message });
  }
};

// ==========================================
// TECHNICIAN TASKS & LIVE DISPATCH GRID
// ==========================================

exports.getTasks = (req, res) => {
  try {
    const list = filterByTenant(db.tasks, req.tenantId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read tasks grid: ' + err.message });
  }
};

exports.createTask = (req, res) => {
  try {
    const { technician, client, phone, type, status, time, tenant } = req.body;

    const newTask = {
      id: `task-${Date.now()}`,
      technician: technician || 'Dave Miller',
      client: client || 'Private Site Address',
      phone: phone || '07700 900350',
      type: type || 'Installation works',
      status: status || 'Scheduled',
      time: time || '09:00 - 11:00',
      tenant: tenant || req.tenantId
    };

    db.tasks.push(newTask);

    const io = req.app.get('io');
    if (io) {
      io.to(newTask.tenant).emit('TASK_CREATED', newTask);
      io.to('all').emit('TASK_CREATED', newTask);
      
      // Also broadcast the vital 'scheduling_updated' event requested in design spec
      io.to(newTask.tenant).emit('scheduling_updated', {
        action: 'CREATED',
        task: newTask
      });
    }

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to dispatch workflow: ' + err.message });
  }
};

exports.updateTask = (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.tasks.findIndex(t => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Dispatch task code not recognized' });
    }

    const previousTask = db.tasks[idx];
    const updated = { ...previousTask, ...req.body };
    db.tasks[idx] = updated;

    const io = req.app.get('io');
    if (io) {
      io.to(updated.tenant).emit('TASK_UPDATED', updated);
      io.to('all').emit('TASK_UPDATED', updated);

      // Instantly trigger live scheduling broadcast to active monitors
      io.to(updated.tenant).emit('scheduling_updated', {
        action: 'UPDATED',
        id: id,
        previousStatus: previousTask.status,
        newStatus: updated.status,
        task: updated
      });
      io.to('all').emit('scheduling_updated', {
        action: 'UPDATED',
        id: id,
        previousStatus: previousTask.status,
        newStatus: updated.status,
        task: updated
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed updating dispatch grid block: ' + err.message });
  }
};

exports.deleteTask = (req, res) => {
  try {
    const { id } = req.params;
    const target = db.tasks.find(t => t.id === id);
    if (!target) return res.status(404).json({ error: 'Task not found' });

    db.tasks = db.tasks.filter(t => t.id !== id);

    const io = req.app.get('io');
    if (io) {
      io.to(target.tenant).emit('TASK_DELETED', { id });
      io.to('all').emit('TASK_DELETED', { id });
      
      io.to(target.tenant).emit('scheduling_updated', {
        action: 'DELETED',
        id: id
      });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to erase scheduling entry: ' + err.message });
  }
};
