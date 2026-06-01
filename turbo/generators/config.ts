import type { PlopTypes } from '@turbo/gen';

type Answers = {
  name: string;
  includeGrpc: boolean;
  includeDatabase: boolean;
  includeSeed: boolean;
  includeReadme: boolean;
};

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  const namePrompt: PlopTypes.PromptQuestion = {
    type: 'input',
    name: 'name',
    message: 'Service name in kebab-case (e.g. catalog):',
    validate: (input: string) =>
      /^[a-z][a-z0-9-]*$/.test(input) ||
      'Must be kebab-case: lowercase letters, numbers, and hyphens only',
  };

  const includeGrpcPrompt: PlopTypes.PromptQuestion = {
    type: 'confirm',
    name: 'includeGrpc',
    message: 'Include gRPC (proto definitions, client, server config)?',
    default: true,
  };

  const includeDatabasePrompt: PlopTypes.PromptQuestion = {
    type: 'confirm',
    name: 'includeDatabase',
    message: 'Include database (Prisma + PostgreSQL)?',
    default: true,
  };

  const includeSeedPrompt: PlopTypes.PromptQuestion = {
    type: 'confirm',
    name: 'includeSeed',
    message: 'Include database seed script (prisma/seed.ts)?',
    default: true,
    when: (answers: Answers) => answers.includeDatabase,
  };

  const readmePrompt: PlopTypes.PromptQuestion = {
    type: 'confirm',
    name: 'includeReadme',
    message: 'Include a README.md?',
    default: true,
  };

  plop.setGenerator('new-package', {
    description:
      'Scaffold a new @hive domain package with proto, client, and providers',
    prompts: [namePrompt, includeGrpcPrompt, readmePrompt],
    actions: [
      {
        type: 'addMany',
        destination: 'packages/{{name}}',
        base: 'templates/package',
        templateFiles: 'templates/package/**',
        globOptions: { dot: true },
      },
      {
        type: 'addMany',
        destination: 'packages/{{name}}',
        base: 'templates/package-grpc',
        templateFiles: 'templates/package-grpc/**',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeGrpc,
      },
      {
        type: 'add',
        path: 'packages/{{name}}/README.md',
        templateFile: 'templates/extras/package-README.md.hbs',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeReadme,
      },
    ],
  });

  plop.setGenerator('new-service', {
    description: 'Scaffold a new NestJS microservice app',
    prompts: [
      namePrompt,
      includeGrpcPrompt,
      includeDatabasePrompt,
      includeSeedPrompt,
      readmePrompt,
    ],
    actions: [
      {
        type: 'addMany',
        destination: 'apps/{{name}}-service',
        base: 'templates/service',
        templateFiles: 'templates/service/**',
        globOptions: { dot: true },
      },
      {
        type: 'addMany',
        destination: 'apps/{{name}}-service',
        base: 'templates/service-database',
        templateFiles: 'templates/service-database/**',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeDatabase,
      },
      {
        type: 'addMany',
        destination: 'apps/{{name}}-service',
        base: 'templates/service-seed',
        templateFiles: 'templates/service-seed/**',
        globOptions: { dot: true },
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeSeed,
      },
      {
        type: 'add',
        path: 'apps/{{name}}-service/README.md',
        templateFile: 'templates/extras/service-README.md.hbs',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeReadme,
      },
    ],
  });

  plop.setGenerator('new-domain', {
    description: 'Scaffold both a domain package and microservice app',
    prompts: [
      namePrompt,
      includeGrpcPrompt,
      includeDatabasePrompt,
      includeSeedPrompt,
      readmePrompt,
    ],
    actions: [
      // Package
      {
        type: 'addMany',
        destination: 'packages/{{name}}',
        base: 'templates/package',
        templateFiles: 'templates/package/**',
        globOptions: { dot: true },
      },
      {
        type: 'addMany',
        destination: 'packages/{{name}}',
        base: 'templates/package-grpc',
        templateFiles: 'templates/package-grpc/**',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeGrpc,
      },
      {
        type: 'add',
        path: 'packages/{{name}}/README.md',
        templateFile: 'templates/extras/package-README.md.hbs',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeReadme,
      },
      // Service
      {
        type: 'addMany',
        destination: 'apps/{{name}}-service',
        base: 'templates/service',
        templateFiles: 'templates/service/**',
        globOptions: { dot: true },
      },
      {
        type: 'addMany',
        destination: 'apps/{{name}}-service',
        base: 'templates/service-database',
        templateFiles: 'templates/service-database/**',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeDatabase,
      },
      {
        type: 'addMany',
        destination: 'apps/{{name}}-service',
        base: 'templates/service-seed',
        templateFiles: 'templates/service-seed/**',
        globOptions: { dot: true },
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeSeed,
      },
      {
        type: 'add',
        path: 'apps/{{name}}-service/README.md',
        templateFile: 'templates/extras/service-README.md.hbs',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: Answers) => answers.includeReadme,
      },
    ],
  });
}
