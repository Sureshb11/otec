import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) { }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const connectionString = this.configService.get<string>('POSTGRES_URL') ||
      this.configService.get<string>('DATABASE_URL');

    if (connectionString) {
      console.log('📡 Using database connection string');
      return {
        type: 'postgres',
        url: connectionString,
        autoLoadEntities: true,
        synchronize: this.configService.get<string>('DB_SYNC') === 'true',
        logging: this.configService.get<string>('NODE_ENV') === 'development',
        ssl: {
          rejectUnauthorized: false,
        },
        extra: {
          connectionTimeoutMillis: 5000,
        },
      };
    }

    const host = this.configService.get<string>('DB_HOST', 'localhost');
    const isSSLRequired = host.includes('database.azure.com') || host.includes('neon.tech') || host.includes('vercel-storage.com');

    return {
      type: 'postgres',
      host: host,
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_DATABASE', 'otec_db'),
      autoLoadEntities: true,
      synchronize: this.configService.get<string>('NODE_ENV') === 'development' || this.configService.get<string>('DB_SYNC') === 'true',
      logging: this.configService.get<string>('NODE_ENV') === 'development',
      ssl: isSSLRequired ? {
        rejectUnauthorized: false,
      } : false,
      extra: {
        connectionTimeoutMillis: 5000,
        keepAlive: true,
      },
    };
  }
}

