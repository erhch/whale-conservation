/**
 * 鲸类保护管理系统 - 主入口
 * Whale Conservation Management System
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
import * as compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 获取配置
  const configService = app.get(ConfigService);

  // 安全中间件
  app.use(helmet());
  app.use(compression());

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());

  // 全局前缀
  app.setGlobalPrefix('api/v1');

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 启用 CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('鲸类保护管理系统 API')
    .setDescription('鲸类保护公益组织管理系统 - RESTful API 接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '用户认证')
    .addTag('auth', '用户认证')
    .addTag('species', '物种管理')
    .addTag('whales', '鲸鱼个体管理')
    .addTag('sightings', '观测记录')
    .addTag('stations', '监测站点')
    .addTag('stats', '统计分析')
    .addTag('health', '健康检查')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  
  console.log(`🐋 鲸类保护管理系统已启动`);
  console.log(`📚 API 文档：http://localhost:${port}/api/docs`);
  console.log(`🔗 API 端点：http://localhost:${port}/api/v1`);
}

bootstrap();
