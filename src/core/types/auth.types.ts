export const AuthMethodsOptions = ['BEARER_TOKEN'] as const;
export type TAuthMethods = (typeof AuthMethodsOptions)[number];

export type TAuthUser = {
  authMethod: TAuthMethods;
  id: string;
  email: string;
  name: string;
};
