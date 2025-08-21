import { RegistryClientService } from '@hive/registry';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly registryClient: RegistryClientService) {}
  onModuleInit() {
    const service = this.registryClient.getRegistrycService();
    firstValueFrom(service.listServices({ metadata: {}, tags: [] })).then(
      (services) => {
        console.log(
          '----------Registered services-------------',
          JSON.stringify(services, null, 2),
        );
      },
    );
  }
  getHello(): string {
    return 'Hello World!';
  }
}
