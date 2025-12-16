import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AuthorizationGuard } from './guards/authorization.guard';
import { UsersService } from './users/users.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('BACKEND_PORT') || 4000;
  const frontendUrl = config.get<string>('FRONTEND_URL');

  // Bật CORS để Next.js gọi được
  app.enableCors({
    origin: [
      frontendUrl, // Cho phép link Ngrok (từ .env)
      'http://localhost:3000', // Cho phép Localhost (để bạn code)
    ],
    credentials: true,
  });
  // app.enableCors({
  //   origin: '*',
  //   credentials: true,
  // });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(port);
}
bootstrap();
