import { repl } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * @description Only ╰─ npm run start -- --entryFile repl  will run this file
 */
async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
