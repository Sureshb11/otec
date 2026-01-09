import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*', // Allow all origins in production
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve static files from frontend build (in production)
  // In development, frontend runs separately on port 3001
  if (process.env.NODE_ENV === 'production') {
    const publicPath = join(__dirname, '..', 'public');
    
    // Serve static assets (JS, CSS, images, etc.)
    app.useStaticAssets(publicPath, {
      prefix: '/',
      index: false, // Don't serve index.html automatically
    });
    
    // Handle React Router (SPA) - serve index.html for all non-API routes
    // This runs after NestJS routes, so API routes are handled first
    app.use((req, res, next) => {
      // Skip API routes - let NestJS controllers handle them
      if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/health') {
        return next();
      }
      // Skip if it's a file request (has extension like .js, .css, .png, etc.)
      if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
        return next();
      }
      // For all other routes, serve index.html (React Router will handle routing)
      res.sendFile(join(publicPath, 'index.html'), (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          next(err);
        }
      });
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Serving static files from: ${join(__dirname, '..', 'public')}`);
  }
}
bootstrap();

