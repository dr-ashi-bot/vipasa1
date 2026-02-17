import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: Number(config.get<string>('POSTGRES_PORT', '5432')),
        username: config.get<string>('POSTGRES_USER', 'vipasa'),
        password: config.get<string>('POSTGRES_PASSWORD', 'vipasa'),
        database: config.get<string>('POSTGRES_DB', 'vipasa'),
        autoLoadEntities: true,
        synchronize: config.get<string>('TYPEORM_SYNCHRONIZE', 'true') === 'true',
        logging: config.get<string>('TYPEORM_LOGGING', 'false') === 'true',
      }),
    }),
  ],
})
export class PostgresDatabaseModule {}
