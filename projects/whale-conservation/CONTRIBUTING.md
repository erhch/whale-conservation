# 🤝 贡献指南

感谢你对生物鲸创管理系统的关注！我们欢迎所有形式的贡献，无论是代码、文档、问题报告还是功能建议。

## 📋 目录

- [行为准则](#行为准则)
- [我能贡献什么](#我能贡献什么)
- [开发环境设置](#开发环境设置)
- [提交代码流程](#提交代码流程)
- [代码规范](#代码规范)
- [提交信息规范](#提交信息规范)
- [测试要求](#测试要求)
- [常见问题](#常见问题)

---

## 行为准则

本项目采用 [贡献者公约](https://www.contributor-covenant.org/) 行为准则。请确保：

- 🌟 保持友好和包容的交流
- 🤝 尊重不同观点和经验
- 💡 建设性地接受批评
- 🎯 关注对社区最有利的事情
- ❤️ 对其他社区成员表示同理心

---

## 我能贡献什么

### 代码开发

- 🐛 修复 Bug
- ✨ 实现新功能
- 🚀 性能优化
- 🔒 安全加固

### 文档改进

- 📖 完善 API 文档
- 📝 编写使用教程
- 🌍 翻译文档（多语言支持）
- ❓ 补充常见问题

### 其他贡献

- 🐞 报告问题（GitHub Issues）
- 💡 提出功能建议
- 🎨 UI/UX 改进建议
- 📢 推广项目

---

## 开发环境设置

### 1. Fork 并克隆仓库

```bash
# Fork 项目到你的 GitHub 账号
# 然后克隆到本地
git clone https://github.com/YOUR_USERNAME/whale-conservation.git
cd whale-conservation

# 添加上游仓库（保持同步）
git remote add upstream https://github.com/erhch/whale-conservation.git
```

### 2. 安装依赖

```bash
# 进入后端目录
cd src

# 安装 Node.js 依赖
npm install
```

### 3. 启动开发环境

```bash
# 返回项目根目录
cd ..

# 启动 Docker 服务（PostgreSQL, Redis, MinIO）
./scripts/start-dev.sh

# 初始化数据库
./scripts/init-db.sh
```

### 4. 启动开发服务器

```bash
cd src

# 复制环境配置
cp .env.example .env

# 启动开发服务器（热重载）
npm run start:dev
```

访问：
- **API**: http://localhost:3000/api/v1
- **Swagger**: http://localhost:3000/api/docs

---

## 提交代码流程

### 1. 创建分支

```bash
# 保持主分支最新
git checkout main
git pull upstream main

# 创建特性分支
git checkout -b feature/your-feature-name
# 或修复 bug
git checkout -b fix/issue-123
```

**分支命名规范：**

| 类型 | 格式 | 示例 |
|------|------|------|
| 新功能 | `feature/description` | `feature/whale-migration-tracking` |
| Bug 修复 | `fix/issue-number` | `fix/issue-123` |
| 文档 | `docs/description` | `docs/api-examples` |
| 重构 | `refactor/description` | `refactor/auth-module` |
| 测试 | `test/description` | `test/species-api` |

### 2. 进行修改

- 编写代码
- 添加/更新测试
- 更新文档

### 3. 提交更改

```bash
# 添加文件
git add .

# 提交（遵循提交信息规范）
git commit -m "feat: add whale migration tracking API"
```

### 4. 推送到远程

```bash
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

1. 访问你的 Fork 仓库
2. 点击 "Compare & pull request"
3. 填写 PR 描述（参考 PR 模板）
4. 等待代码审查

### 6. 代码审查

- 维护者会审查你的代码
- 可能需要根据反馈进行修改
- 审查通过后合并到主分支

---

## 代码规范

### TypeScript/JavaScript

遵循项目中的 ESLint 和 Prettier 配置：

```bash
# 检查代码风格
npm run lint

# 自动格式化代码
npm run format
```

**核心规则：**

- 使用 2 空格缩进
- 字符串使用单引号
- 行尾不加分号（除非必要）
- 最大行宽 100 字符
- 使用 TypeScript 类型注解

### 命名规范

```typescript
// 类和接口：PascalCase
class WhaleService {}
interface WhaleData {}

// 变量和函数：camelCase
const whaleCount = 10;
function getWhaleById() {}

// 常量：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 5;

// 文件命名：kebab-case（模块内统一）
// whale-conservation.controller.ts
// parse-optional-int.pipe.ts
```

### 注释规范

```typescript
/**
 * 获取鲸鱼个体信息
 * @param id - 鲸鱼 UUID
 * @param includeSightings - 是否包含观测记录
 * @returns 鲸鱼详细信息
 * @throws NotFoundException - 当鲸鱼不存在时
 */
async getWhale(id: string, includeSightings = false): Promise<Whale> {
  // 实现代码
}
```

---

## 提交信息规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 格式

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 类型 (type)

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add whale migration API` |
| `fix` | Bug 修复 | `fix: correct species validation` |
| `docs` | 文档变更 | `docs: update API examples` |
| `style` | 代码格式（不影响功能） | `style: format code with prettier` |
| `refactor` | 重构（非新功能/修复） | `refactor: simplify auth logic` |
| `perf` | 性能优化 | `perf: cache species list` |
| `test` | 添加/修改测试 | `test: add species API tests` |
| `chore` | 构建/工具/配置 | `chore: update dependencies` |

### 示例

```bash
# 新功能
git commit -m "feat(stats): add population growth trend prediction API"

# Bug 修复
git commit -m "fix(auth): resolve JWT expiration handling issue"

# 文档
git commit -m "docs: add CONTRIBUTING.md guide"

# 多行提交信息
git commit -m "feat(sightings): add behavior analysis endpoint

- Add GET /sightings/behaviors endpoint
- Include behavior distribution with percentages
- Add caching for 10 minutes

Closes #45"
```

---

## 测试要求

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:cov

# 运行特定测试文件
npm run test -- species.service.spec.ts
```

### 测试覆盖

- 新功能应包含单元测试
- Bug 修复应包含回归测试
- 目标覆盖率：>80%

### 测试规范

```typescript
describe('WhaleService', () => {
  let service: WhaleService;
  let repository: Repository<Whale>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WhaleService,
        {
          provide: getRepositoryToken(Whale),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<WhaleService>(WhaleService);
    repository = module.get<Repository<Whale>>(getRepositoryToken(Whale));
  });

  describe('findOne', () => {
    it('should return a whale by id', async () => {
      const whaleId = 'test-uuid';
      const expectedWhale = { id: whaleId, identifier: 'BCX001' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(expectedWhale as Whale);

      const result = await service.findOne(whaleId);
      expect(result).toEqual(expectedWhale);
    });

    it('should throw NotFoundException when whale not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## 常见问题

### Q: 如何保持 Fork 与上游同步？

```bash
# 获取上游最新代码
git fetch upstream

# 合并到本地主分支
git checkout main
git merge upstream/main

# 推送到你的远程仓库
git push origin main
```

### Q: PR 被要求修改怎么办？

1. 在本地分支进行修改
2. 提交新更改
3. 推送到同一分支
4. PR 会自动更新

```bash
# 修改代码后
git add .
git commit -m "fix: address review comments"
git push origin feature/your-feature-name
```

### Q: 如何撤销已提交但未推送的更改？

```bash
# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃更改）
git reset --hard HEAD~1
```

### Q: 遇到合并冲突怎么办？

```bash
# 拉取最新代码
git pull upstream main

# 手动解决冲突文件中的冲突标记
# <<<<<<< HEAD
# 你的更改
# =======
# 上游更改
# >>>>>>>

# 解决后标记为已解决
git add conflicted-file.ts

# 完成合并
git commit
```

### Q: 如何联系维护者？

- 📧 Email: erhch@users.noreply.github.com
- 💬 GitHub Issues: 在相关 Issue 中评论
- 🐦 Twitter: @erhch (非正式)

---

## 🎉 感谢贡献者

感谢所有为生物鲸创管理系统做出贡献的开发者！

<a href="https://github.com/erhch/whale-conservation/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=erhch/whale-conservation" />
</a>

---

<div align="center">
  <sub>最后更新：2026-03-31</sub>
</div>
