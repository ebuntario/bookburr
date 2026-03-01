export interface ConfirmableVenue {
  id: string;
  name: string;
  compositeScore: number;
  location?: unknown;
  voteCount: number;
}

export interface ConfirmableDateOption {
  id: string;
  date: string;
  dateScore: number;
  stronglyPrefer: number;
  canDo: number;
  unavailable: number;
}
