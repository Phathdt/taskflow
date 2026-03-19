import { Global, Module } from '@nestjs/common'

import { CustomConfigService } from './custom-config.service'

@Global()
@Module({
  providers: [
    {
      provide: CustomConfigService,
      useFactory: () => new CustomConfigService(),
    },
  ],
  exports: [CustomConfigService],
})
export class CustomConfigModule {}
