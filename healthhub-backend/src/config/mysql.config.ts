import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const mysqlConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3308,
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123456',
  database: process.env.MYSQL_DATABASE || process.env.MYSQL_DB || 'healthhub',
  autoLoadEntities: true,
  synchronize: true,
  timezone: 'Z',
};
