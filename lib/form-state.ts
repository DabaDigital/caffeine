/** What a dashboard Server Action returns when it can't finish. */
export type FormState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export const emptyFormState: FormState = {};
