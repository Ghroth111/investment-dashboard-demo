# 衡策资产 Demo

一个仅前端的高保真投资整合资产看板 App Demo，基于 `React Native + Expo + TypeScript` 开发。当前阶段不接后端、不接数据库、不接真实 API，所有数据都来自本地 mock，并保留首发版本的页面结构、功能边界和主要交互流程。

## 已实现内容

- 启动页与登录页
- 底部 Tab 导航：首页、账户、记录、我的
- 首页资产看板：总资产、趋势图、资产类别分布、平台分布、快捷操作
- 账户模块：列表、搜索、筛选、详情、删除
- 添加账户流程：API 接入占位、截图导入占位、手动录入
- 记录页：资金流列表与记账模块占位
- 设置页：基础货币切换、汇率说明、路线图、退出登录
- 全局 mock 数据管理与 Zustand 状态
- 前端可交互操作：手动添加账户、删除账户、切换基础货币
- 空状态、加载状态、错误状态预览

## 技术栈

- Expo SDK 54
- React Native 0.81
- TypeScript
- React Navigation
- Zustand
- `react-native-svg`
- IBM Plex Sans 字体

## 启动方式

```bash
npm install
npx expo start
```

常用命令：

```bash
npm run android
npm run ios
npm run web
```

## 已验证

```bash
npx tsc --noEmit
npx expo export --platform web
```

## 项目结构

```text
investment-dashboard-demo
├─ App.tsx
├─ app.json
├─ assets/
├─ src/
│  ├─ components/
│  │  ├─ accounts/
│  │  ├─ chart/
│  │  ├─ dashboard/
│  │  ├─ layout/
│  │  ├─ states/
│  │  └─ ui/
│  ├─ features/
│  │  └─ dashboard/
│  ├─ mock/
│  ├─ navigation/
│  ├─ screens/
│  │  ├─ accounts/
│  │  ├─ auth/
│  │  ├─ dashboard/
│  │  ├─ records/
│  │  └─ settings/
│  ├─ store/
│  ├─ theme/
│  ├─ types/
│  └─ utils/
└─ README.md
```

## Mock 数据说明

`src/mock/` 下统一管理：

- `accounts.ts`：默认账户与持仓
- `dashboard.ts`：资产趋势图
- `records.ts`：资金流记录
- `settings.ts`：汇率和设置项
- `user.ts`：用户信息

## Demo 交互说明

- 首页和账户页提供“状态预览”，用于查看正常、加载、异常、空状态。
- 手动录入保存后会直接写入 Zustand，本地状态会立刻反映到首页、账户列表和详情页。
- 账户详情页支持前端删除。
- 设置页切换基础货币后，金额展示会统一切换。

## 当前边界

- 不含真实登录鉴权
- 不含真实 API 接入
- 不含真实截图识别
- 不含数据库与后端
- 不含推送通知和 AI 建议

## 后续建议

- 接入真实账户同步接口
- 为截图导入补 OCR/AI 识别
- 增加账户编辑能力
- 为记录页补真实记账流
- 增加暗色主题与更完整的组件测试
