# 🕊 DigitalPigeon 咕咕送信

## 中文说明

[demo](https://digitalpigeon.aoyou.workers.dev/ )

这是我的第一个cloudflare workers项目，借助workers和kv储存可以实现临时信息的传输。可以设置最大浏览次数以及进行aes加密。可以用来交换一些临时却又有些敏感的信息。

## 自部署方式

由于本项目用了webpack，所以没办法直接在网页中通过快速编辑代码的方式来部署。 需要安装cli工具 wrangler，并clone此项目来部署。 **之后有空我考虑加一个actions用于部署到cloudflare...**

```bash
npm i @cloudflare/wrangler -g
git clone https://github.com/aoyouer/digital-pigeon
# 在浏览器中登陆，登陆后获取自己的账户id
wrangler login
wrangler whoami
# 创建kv储存并与 "PIGEON" 命名空间绑定
wrangler wrangler kv:namespace create "PIGEON"
npm install
# 编辑 wrangler.toml 填上 Account ID 以及 KV的ID 并将worker改成自己想要的名字，或者另外配置zone
wrangler publish
```

## TODOs

- [x] 完善信息提示 (如密码错误、服务器错误等)
- [ ] 储存信息过期机制
- [x] 全局强制加密，服务器只储存密文
- [ ] 支持图片分享

## English version

[demo](https://digitalpigeon.aoyou.workers.dev/ )

This is my first cloudflare workers project, with workers and kv storage can achieve temporary information transfer. You can set how many times the message can be viewed before deleting and use aes to encrypt your message in the browser. This program can be used to exchange some temporary but somewhat sensitive information with your friends.

## Self-deployment

Since this project uses webpack, there is no way to deploy it directly in the web page by quickly editing the code. You need to install the cli tool wrangler and clone this project to deploy. **I am considering adding an github actions for deploying to cloudflare...**

```bash
npm i @cloudflare/wrangler -g
git clone https://github.com/aoyouer/digital-pigeon
# Login in the browser and get your account id after login
wrangler login
wrangler whoami
# Create kv storage and bind it to the "PIGEON" namespace
wrangler wrangler kv:namespace create "PIGEON"
npm install
# Edit wrangler.toml and fill in the Account ID and KV ID and change the worker to the name you want, or configure another zone
wrangler publish
```
