export type TenantType = 'heating' | 'screed' | 'electrical' | 'all';

export type UserRole = 'Admin' | 'Operator' | 'Technician' | 'Marketer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: 'Heating' | 'Screed' | 'Electrical' | 'Administration';
  avatar: string;
  status: 'Active' | 'Inactive';
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'Lead' | 'Contacted' | 'Proposal' | 'Contract' | 'Won';
  revenue: number;
  tenant: TenantType;
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: 'Leads' | 'Contacted' | 'Proposal' | 'Contract' | 'Won';
  tenant: TenantType;
  date: string;
}

export interface TechnicianTask {
  id: string;
  technician: string;
  client: string;
  phone: string;
  type: 'Installation' | 'Maintenance' | 'Inspection' | 'Repair';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Pending';
  time: string; // "09:00 - 11:00" etc
  tenant: 'heating' | 'screed' | 'electrical';
}

export interface SmartPDFAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'Parsed' | 'Pending' | 'Error';
  extractedData: {
    clientName?: string;
    address?: string;
    totalAmount?: string;
    items?: string[];
    confidence: number;
    boilerModel?: string; // For heating
    screedThickness?: string; // For screed
    wiringStandard?: string; // For electrical
  };
}

export interface AdCampaign {
  id: string;
  title: string;
  platform: 'Facebook' | 'Instagram' | 'Meta' | 'Google' | 'Email' | 'SEO Blog' | 'WordPress';
  generatedCopy: string;
  hashtags: string[];
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Published' | 'Live';
  createdAt: string;
  tenant: 'heating' | 'screed' | 'electrical';
  // Scenario A: Meta/Social fields
  mediaUrl?: string;
  destinationLink?: string;
  // Scenario B: SEO Blog fields
  blogTags?: string[];
  // Scenario C: Google Ads fields
  budget?: number;
  targetCountry?: string;
}

export interface SystemLog {
  id: string;
  service: string;
  event: string;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
  payloadSize: string;
}
