# Agent Note: Cloudflare Pages 前端访问密码

Status: implemented

## Problem

公开的 Pages 部署会直接交付前端页面和静态资源。个人部署需要用一个固定密码控制前端访问，同时保留现有订阅后端的访问方式。

## Decision

根目录的 Pages 中间件使用 HTTP Basic Auth。用户名固定为 `substore`，密码来自 Pages 加密绑定 `SITE_PASSWORD`。`public/_routes.json` 让所有请求经过鉴权，包括静态资源。未配置密码时返回 503，验证失败时返回 401，有效请求继续由 Pages 提供前端。

## Alternatives considered

- Cloudflare Access 支持在项目外对主域名和预览域名设置身份策略。身份验证通常使用邮箱验证码或身份提供商，与固定密码的要求不同。
- Vue 登录页可以做成单字段表单。静态资源仍可直接请求，服务端鉴权依然需要实现，还要额外管理登录会话。

## Consequences

Pages Functions 处理每个资源请求，部署环境需要提前配置密码，免费计划下通过 Fail closed 保持鉴权边界。历史部署使用各自的代码，需要单独保护或清理。登录信息由浏览器通过 HTTPS 发送，后端订阅地址继续使用自己的鉴权。

本地使用 `pnpm build` 和 `wrangler pages dev` 验证首页、Vue 子路由与构建后的脚本。无凭证、错误用户、错误密码及畸形凭证均返回 401，正确密码返回 200，缺少绑定时首页和脚本均返回 503。
