import type { ApplicationStatus, Outcome, ProviderType } from "@/lib/constants";
import type { MatchResult, MatchRule, MatchStatus } from "@/lib/matching/types";

/** Scholarship as sent to the client (dates as ISO strings, lists parsed). */
export interface ScholarshipDTO {
  id: string;
  slug: string;
  title: string;
  provider: string;
  providerType: ProviderType;
  description: string;
  amountInr: number;
  amountLabel: string | null;
  deadline: string;
  applyUrl: string;
  documents: string[];
  benefits: string[];
  tags: string[];
  featured: boolean;
  isActive: boolean;
  lastVerifiedAt: string | null;
  rule: MatchRule | null;
}

export interface MatchSummary {
  score: number;
  status: MatchStatus;
  reasons: string[];
  missing: string[];
}

export interface ScholarshipListItem extends ScholarshipDTO {
  match: MatchSummary | null;
  saved: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApplicationDTO {
  id: string;
  status: ApplicationStatus;
  outcome: Outcome | null;
  notes: string | null;
  updatedAt: string;
  scholarship: ScholarshipDTO;
}

export type FullMatch = MatchResult;

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
