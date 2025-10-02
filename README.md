# AWS IAC CDK POC

Infrastructure as Code using AWS CDK to deploy a serverless API with persistent storage on EFS.

## CDK Stacks

### StatefulStack
Creates foundational infrastructure with long-lived resources:
- VPC with isolated subnets across 2 availability zones
- EFS file system with encryption and lifecycle policies
- Security groups for Lambda and EFS communication
- EFS access point for Lambda file system access

### ApiLambdaStack
Deploys the API and compute layer:
- Node.js 22 Lambda function with Hono framework
- HTTP API Gateway with CORS configuration
- CloudWatch log groups for Lambda and API Gateway
- Lambda connected to VPC and EFS mount

## Lambda Handler

The handler uses Hono web framework with SQLite database on EFS. On cold start, it runs Drizzle ORM migrations and initializes the database. The handler supports automatic documentation via Scalar API reference.

## Prerequisites

- Bun runtime
- AWS CLI configured with credentials
- AWS CDK CLI installed

## Deployment

```bash
cd infrastructure
bun run cdk deploy --all
```

## Local Development

```bash
cd apps/server
bun run dev
```