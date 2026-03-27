/**
 * 认证服务
 */

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto) {
    const { username, email, password, nickname } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('用户名或邮箱已被注册');
    }

    // 创建用户
    const user = this.userRepository.create({
      username,
      email,
      password, // 会自动通过 BeforeInsert 哈希
      nickname,
      role: UserRole.PUBLIC,
      isActive: true,
    });

    await this.userRepository.save(user);

    // 生成 token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto, ip?: string) {
    const { username, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user || !(await user.validatePassword(password))) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 更新登录信息
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await this.userRepository.save(user);

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * 刷新 token
   */
  async refreshToken(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    const token = this.generateToken(user);

    return { token };
  }

  /**
   * 获取用户信息
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return this.sanitizeUser(user);
  }

  /**
   * 生成 JWT token
   */
  private generateToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
  }

  /**
   * 验证用户 (用于本地策略)
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user || !(await user.validatePassword(password))) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    return user;
  }

  /**
   * 清理敏感信息
   */
  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
