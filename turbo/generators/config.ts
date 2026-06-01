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

  const readmePrompt: PlopTypes.PromptQuestion = {
    type: 'confirm',
    name: 'includeReadme',
    message: 'Include a README.md?',
    default: true,
  };

  plop.setGenerator('new-package', {
    description:
      'Scaffold a new @hive domain package with proto, client, and providers',
    prompts: [namePrompt, readmePrompt],
    actions: [
      {
        type: 'addMany',
        destination: 'packages/{{name}}',
        base: 'templates/package',
        templateFiles: 'templates/package/**',
        globOptions: { dot: true },
      },
      {
        type: 'add',
        path: 'packages/{{name}}/README.md',
        templateFile: 'templates/extras/package-README.md.hbs',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: { includeReadme: boolean }) => answers.includeReadme,
      },
    ],
  });

  plop.setGenerator('new-service', {
    description: 'Scaffold a new NestJS microservice app',
    prompts: [namePrompt, readmePrompt],
    actions: [
      {
        type: 'addMany',
        destination: 'apps/{{name}}-service',
        base: 'templates/service',
        templateFiles: 'templates/service/**',
        globOptions: { dot: true },
      },
      {
        type: 'add',
        path: 'apps/{{name}}-service/README.md',
        templateFile: 'templates/extras/service-README.md.hbs',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: { includeReadme: boolean }) => answers.includeReadme,
      },
    ],
  });

  plop.setGenerator('new-domain', {
    description: 'Scaffold both a domain package and microservice app',
    prompts: [namePrompt, readmePrompt],
    actions: [
      {
        type: 'addMany',
        destination: 'packages/{{name}}',
        base: 'templates/package',
        templateFiles: 'templates/package/**',
        globOptions: { dot: true },
      },
      {
        type: 'add',
        path: 'packages/{{name}}/README.md',
        templateFile: 'templates/extras/package-README.md.hbs',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: { includeReadme: boolean }) => answers.includeReadme,
      },
      {
        type: 'addMany',
        destination: 'apps/{{name}}-service',
        base: 'templates/service',
        templateFiles: 'templates/service/**',
        globOptions: { dot: true },
      },
      {
        type: 'add',
        path: 'apps/{{name}}-service/README.md',
        templateFile: 'templates/extras/service-README.md.hbs',
        // @ts-expect-error — plop typings omit `when`
        when: (answers: { includeReadme: boolean }) => answers.includeReadme,
      },
    ],
  });
}
