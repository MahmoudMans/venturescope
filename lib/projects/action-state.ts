export type CreateProjectState = {
  message?: string;

  errors?: {
    name?: string[];
    industry?: string[];
    currency?: string[];
    startMonth?: string[];
    horizonMonths?: string[];
    revenueMode?: string[];
  };
};

export const initialCreateProjectState: CreateProjectState =
  {};

export type RenameProjectState = {
  message?: string;

  errors?: {
    projectId?: string[];
    name?: string[];
  };
};

export const initialRenameProjectState: RenameProjectState =
  {};
