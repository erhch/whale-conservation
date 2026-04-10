/**
 * 认证服务
 */

import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto';

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
    user.lastLoginIp = ip || '';
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
   * 修改密码
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证当前密码
    if (!(await user.validatePassword(currentPassword))) {
      throw new BadRequestException('当前密码错误');
    }

    // 检查新密码是否与旧密码相同
    if (currentPassword === newPassword) {
      throw new BadRequestException('新密码不能与当前密码相同');
    }

    // 更新密码 (会自动哈希)
    user.password = newPassword;
    await this.userRepository.save(user);

    return { message: '密码修改成功' };
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
   * 获取用户列表 (管理员专用)
   */
  async findAllUsers(page: number = 1, limit: number = 10, role?: UserRole, isActive?: boolean) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // 筛选条件
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // 分页
    queryBuilder.orderBy('user.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users.map((user) => this.sanitizeUser(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 清理敏感信息
   */
  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
