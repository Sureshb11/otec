import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });

  // Serve static files from frontend build (in production)
  // In development, frontend runs separately on port 3001
  if (process.env.NODE_ENV === 'production') {
    // Serve static assets (JS, CSS, images, etc.)
    app.useStaticAssets(join(__dirname, '..', 'public'));
    
    // Handle React Router (SPA) - serve index.html for all non-API routes
    app.use((req, res, next) => {
      // Don't interfere with API routes
      if (req.path.startsWith('/api')) {
        return next();
      }
      // For all other routes, serve index.html (React Router will handle routing)
      res.sendFile(join(__dirname, '..', 'public', 'index.html'));
    });
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

