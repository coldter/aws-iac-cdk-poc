export const CONFIG = {
  tags: {
    Project: "API-Poc",
    ManagedBy: "CDK",
    Owner: "Kuldeep Parmar",
  },
};

export const getStackName = (stackType: string, env: string) =>
  `${env}-api-poc-${stackType}`;
