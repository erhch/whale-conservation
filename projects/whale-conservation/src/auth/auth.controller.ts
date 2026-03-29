/**
 * 认证控制器
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';

import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto';
import { User, UserRole } from './entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.authService.login(loginDto, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新令牌' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 200, description: '刷新成功' })
  async refreshToken(@CurrentUser() user: User) {
    return this.authService.refreshToken(user.id);
  }

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改密码' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 200, description: '修改成功' })
  @ApiResponse({ status: 400, description: '当前密码错误或新密码不合规' })
  async changePassword(@CurrentUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取用户列表 (管理员专用)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认 1', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认 10，最大 100', example: 10 })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: '按角色筛选' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: '按激活状态筛选' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '权限不足，仅限管理员' })
  async findAllUsers(
    @Query('page', new ParseIntPipe({ optional: true, defaultValue: 1 })) page: number,
    @Query('limit', new ParseIntPipe({ optional: true, defaultValue: 10 })) limit: number,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean,
  ) {
    const safeLimit = Math.min(limit, 100);
    return this.authService.findAllUsers(page, safeLimit, role, isActive);
  }
}
