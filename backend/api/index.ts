import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { RolesService } from '../src/roles/roles.service';
import { UsersService } from '../src/users/users.service';

let app: NestExpressApplication;

async function bootstrap() {
    if (!app) {
        app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

        app.enableCors({
            origin: [
                'https://ams.otec-kw.com',
                'https://frontend-two-liart-58.vercel.app',
                'https://frontend-sureshs-projects-d6d2993b.vercel.app',
                'http://localhost:3001',
                /\.vercel\.app$/
            ],
            credentials: true,
        });

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        app.useGlobalFilters(new AllExceptionsFilter());

        // Seed roles and admin user during bootstrap
        // This ensures the database is initialized even on serverless cold starts
        const rolesService = app.get(RolesService);
        await rolesService.seedRoles();

        const usersService = app.get(UsersService);
        await usersService.seedAdminUser();

        await app.init();
    }
    return app.getHttpAdapter().getInstance();
}

export default async function (req: any, res: any) {
    try {
        const instance = await bootstrap();
        return instance(req, res);
    } catch (err) {
        console.error('BOOTSTRAP ERROR:', err);
        return res.status(500).json({
            error: 'Serverless Bootstrap Error',
            message: err.message,
            stack: err.stack,
            postgres_url_present: !!process.env.POSTGRES_URL,
            db_host_present: !!process.env.DB_HOST
        });
    }
}
