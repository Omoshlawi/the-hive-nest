import type { PlopTypes } from '@turbo/gen';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  const namePrompt: PlopTypes.PromptQuestion = {
    type: 'input',
    name: 'name',
    message: 'Service name in kebab-case (e.g. catalog):',
    validate: (input: string) =>
      /^[a-z][a-z0-9-]*$/.test(input) ||
      'Must be kebab-case: lowercase letters, numbers, and hyphens only',
  };

  plop.setGenerator('new-package', {
    description:
      'Scaffold a new @hive domain package with proto, client, and providers',
    prompts: [namePrompt],
    actions: [
      {
        type: 'addMany',
        destination: 'packages/{{name}}',
        base: 'templates/package',
        templateFiles: 'templates/package/**',
        globOptions: { dot: true },
      },
    ],
  });

  plop.setGenerator('new-service', {
    description: 'Scaffold a new NestJS microservice app',
    prompts: [namePrompt],
    actions: [
      {
        type: 'addMany',
        destination: 'apps/{{name}}-service',
        base: 'templates/service',
        templateFiles: 'templates/service/**',
        globOptions: { dot: true },
      },
    ],
  });

  plop.setGenerator('new-domain', {
    description: 'Scaffold both a domain package and microservice app',
    prompts: [namePrompt],
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
        destination: 'apps/{{name}}-service',
        base: 'templates/service',
        templateFiles: 'templates/service/**',
        globOptions: { dot: true },
      },
    ],
  });
}
