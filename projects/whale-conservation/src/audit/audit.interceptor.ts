/**
 * 审计拦截器
 * Phase 5: 自动审计 — 拦截 POST/PUT/PATCH/DELETE 请求并记录变更
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';

import { AuditService, AuditEntry } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

export const AUDIT_SKIP_KEY = 'audit:skip';
export const SkipAudit = () => (target: any, key?: string, descriptor?: any) => {
  if (descriptor) {
    Reflector.createDecorator<boolean>();
  }
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // 只拦截写操作
    const actionMap: Record<string, AuditAction> = {
      POST: AuditAction.CREATE,
      PUT: AuditAction.UPDATE,
      PATCH: AuditAction.UPDATE,
      DELETE: AuditAction.DELETE,
    };

    const action = actionMap[method];
    if (!action) return next.handle();

    // 检查是否跳过审计
    const skipAudit = this.reflector.get<boolean>(AUDIT_SKIP_KEY, context.getHandler());
    if (skipAudit) return next.handle();

    const userId = request.user?.id || request.user?.sub;
    const entityType = this.extractEntityType(context);

    const oldValue = method !== 'POST' ? { ...request.body } : undefined;

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const entry: AuditEntry = {
            userId,
            action,
            entityType,
            entityId: response?.id || request.params.id,
            oldValue: action === AuditAction.CREATE ? undefined : oldValue,
            newValue: response ? this.sanitizeForAudit(response) : undefined,
          };
          await this.auditService.log(entry);
        } catch (e) {
          // 审计失败不影响主流程
          console.error('Audit log failed:', e.message);
        }
      }),
    );
  }

  /** 从路由中提取实体类型 */
  private extractEntityType(context: ExecutionContext): string {
    const handler = context.getHandler();
    const className = context.getClass().name;
    // 从控制器名推断实体类型 (e.g., WhalesController -> Whale)
    return className.replace('Controller', '');
  }

  /** 清理敏感字段 */
  private sanitizeForAudit(obj: any): object {
    if (!obj) return obj;
    const { password, passwordHash, token, ...safe } = obj;
    return safe;
  }
}
