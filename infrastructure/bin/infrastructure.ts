#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CONFIG } from "../lib/constants/const";
import { ApiLambdaStack } from "../lib/stacks/api-lambda-stack";
import { StatefulStack } from "../lib/stacks/stateful-stack";

const app = new cdk.App();

const statefulStack = new StatefulStack(app, "StatefulStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: "Stateful resources: VPC, EFS, Security Groups",
  tags: CONFIG.tags,
});

const apiLambdaStack = new ApiLambdaStack(app, "ApiLambdaStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: "API Lambda Stack with HTTP API Gateway",
  tags: CONFIG.tags,
  vpc: statefulStack.vpc,
  accessPoint: statefulStack.accessPoint,
  lambdaSecurityGroup: statefulStack.lambdaSecurityGroup,
});

apiLambdaStack.addDependency(statefulStack);
