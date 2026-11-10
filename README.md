# 鞋店管家 · Shoe Store Manager

面向小型鞋店的中文本地库存与销售记账应用，基于 React、TypeScript、Vite 和 Tailwind CSS。无需 AI API Key 或服务端账号。

## 已有功能

- 商品登记、图片压缩、分类与备注；按尺码和颜色维护库存。
- 库存搜索、低库存筛选、编辑与删除。
- 同一销售窗口支持多规格、多价格明细；按规格合并扣减并阻止超卖。
- 销售小票、销售历史、退货撤销与库存恢复。
- 库存数量、成本总值、累计利润、按双数统计的今日销量、近 7 日利润趋势与畅销商品。
- JSON 备份导出、支持系统分享时分享文件；导入前校验结构、数量与销售字段。

## 开始使用

需要 Node.js 22.12+、npm。

```sh
npm ci
npm run dev
```

打开终端给出的地址 → 新增库存 → 在库存页登记销售 → 在销售历史中查看或撤销 → 定期在设置页导出备份。

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

## 目录结构

```text
App.tsx                  状态、视图导航与备份入口
components/              概览、库存、进货表单、销售窗口
services/inventory.ts    扣库存、退货、当日销量和备份校验
types.ts                 库存、规格与销售数据类型
tests/                   核心业务回归测试
public/                  manifest 和应用图标
capacitor.config.ts      Android 包装配置
.github/workflows/       自动测试与构建
```

## 数据与备份

数据保存在当前浏览器、当前站点的 `localStorage`，刷新后保留。更换设备、域名或端口不会自动迁移；清理网站数据会丢失本地记录。图片也占用浏览器存储空间，出现存储失败提示时应立即导出备份。

“设置 → 分享备份”导出包含 `stocks`、`sales`、`exportDate`、`version` 的 JSON；导入会在校验通过、确认覆盖后替换当前数据。兼容原有 1.2 格式导出。导入前建议先导出当前记录。取消分享不代表文件已保存；下载操作也无法确认用户最终是否保留了文件。

退货会撤销对应销售记录并恢复规格数量，属于简易记账撤销，不是财务审计账本或真实支付退款。删除商品后，销售记录仍保留，但商品详情无法恢复；先导出备份再删除。

## 静态部署与 Android

`npm run build` 后将 **dist 目录整体**上传静态托管服务。相对资源路径支持子目录部署。manifest 和 SVG 图标会随构建复制；当前未实现 Service Worker，不能据此承诺完整离线 PWA。

Android 需另装 Android Studio、匹配 Capacitor 8 的 JDK/SDK，并执行：

```sh
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

本次验证覆盖 Web 构建与业务测试，未构建或签名 APK；生成的 Android 工程、应用 ID、图标和商店材料应在发布前配置。

## 当前边界

适合单店、单设备轻量记账。尚无登录权限、云同步、多设备并发、采购单/供应商、正式审计日志和自动化异地备份。localStorage 多标签页同时编辑可能覆盖数据，建议只在一个标签页维护。正式商用前应按实际流程补齐这些能力。

版本 1.7.0；尚未声明开源许可证。贡献时请先执行测试、类型检查和生产构建。
