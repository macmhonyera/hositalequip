import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { SeederModule } from './database/seeder.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EquipmentModule } from './equipment/equipment.module';
import { LocationsModule } from './locations/locations.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { BreakdownsModule } from './breakdowns/breakdowns.module';
import { CommentsModule } from './comments/comments.module';
import { ReportsModule } from './reports/reports.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProduction = configService.get('NODE_ENV') === 'production';

        const baseConfig = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
          logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };

        if (databaseUrl) {
          return { ...baseConfig, url: databaseUrl };
        }

        return {
          ...baseConfig,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'password'),
          database: configService.get<string>('DB_NAME', 'hospital_equip'),
        };
      },
      inject: [ConfigService],
    }),
    SeederModule,
    AuthModule,
    UsersModule,
    EquipmentModule,
    LocationsModule,
    MaintenanceModule,
    BreakdownsModule,
    CommentsModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
