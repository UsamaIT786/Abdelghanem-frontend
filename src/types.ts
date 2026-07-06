export type TenantType = 'full_home_renovation' | 'kitchen_renovation' | 'bathroom_renovation' | 'granny_flat' | 'extension' | 'multi_unit' | 'new_luxe_homes' | 'all';

export type UserRole = 'Admin' | 'Operator' | 'Technician' | 'Marketer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: 'Full Home Renovation' | 'Kitchen Renovation' | 'Bathroom Renovation' | 'Granny Flat' | 'Extension' | 'Multi Unit' | 'New Luxe Homes' | 'Administration';
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
  tenant: 'full_home_renovation' | 'kitchen_renovation' | 'bathroom_renovation' | 'granny_flat' | 'extension' | 'multi_unit' | 'new_luxe_homes';
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
  tenant: 'full_home_renovation' | 'kitchen_renovation' | 'bathroom_renovation' | 'granny_flat' | 'extension' | 'multi_unit' | 'new_luxe_homes';
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
