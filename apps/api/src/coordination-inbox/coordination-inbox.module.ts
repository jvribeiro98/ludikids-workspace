import { Module } from '@nestjs/common';
import { CoordinationInboxService } from './coordination-inbox.service';
import { CoordinationInboxController } from './coordination-inbox.controller';

@Module({
  providers: [CoordinationInboxService],
  controllers: [CoordinationInboxController],
  exports: [CoordinationInboxService],
})
export class CoordinationInboxModule {}
