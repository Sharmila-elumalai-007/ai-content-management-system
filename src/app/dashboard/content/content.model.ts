export enum ContentStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  SCHEDULED = 'SCHEDULED',
}

export interface Content {
  id: string;
  title: string;
  body: string;
  status: ContentStatus;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  publishAt?: string;
  rejectionReason?: string;
  reviewedAt?: string;
}