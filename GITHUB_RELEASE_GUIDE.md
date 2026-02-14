# GitHub Release 创建指南

**版本**: v3.0.0
**日期**: 2026-02-14

---

## 🚀 创建GitHub Release

### 方法1: 使用GitHub CLI (推荐)

```bash
# 安装GitHub CLI (如果未安装)
# macOS
brew install gh

# 登录GitHub
gh auth login

# 创建Release
gh release create v3.0.0 \
  --title "v3.0.0 - Zero Entropy Dictionary (零熵词典)" \
  --notes-file RELEASE_v3.0.md
```

### 方法2: 手动创建

1. 访问 https://github.com/RalphBigBear/Xuan/releases
2. 点击 "Draft a new release"
3. 填写以下信息:
   - **Tag**: v3.0.0
   - **Target**: main
   - **Title**: v3.0.0 - Zero Entropy Dictionary (零熵词典)
   - **Description**: 复制 RELEASE_v3.0.md 的内容
4. 勾选 "Set as the latest release"
5. 点击 "Publish release"

---

## 📋 Release Notes

请复制 `RELEASE_v3.0.md` 的内容到Release描述中。

---

## ✅ 检查清单

创建Release前，请确认:

- [ ] 所有文件已提交到Git
- [ ] 版本号已更新 (README.md, package.json等)
- [ ] CHANGELOG.md已更新
- [ ] RELEASE_v3.0.md已完善
- [ ] 查询引擎测试通过
- [ ] 文档链接正确
- [ ] 许可证信息正确

---

## 🎯 Release Assets

可以考虑添加以下Assets:

1. **xuan-v3.0.0.zip**: 完整项目zip包
2. **xuan-data-v3.0.0.zip**: 数据文件zip包 (concepts.json + encoded.json)
3. **xuan-query-engine-v2.0.js**: 独立的查询引擎脚本

### 创建Assets

```bash
# 创建完整项目zip包
git archive --format=zip --output=xuan-v3.0.0.zip main

# 创建数据文件zip包
zip -r xuan-data-v3.0.0.zip data/

# 创建独立查询引擎
cp tools/query.js xuan-query-engine-v2.0.js

# 上传到Release (使用GitHub CLI)
gh release upload v3.0.0 xuan-v3.0.0.zip
gh release upload v3.0.0 xuan-data-v3.0.0.zip
gh release upload v3.0.0 xuan-query-engine-v2.0.js
```

---

## 📢 发布后任务

创建Release后，请:

1. **发布公告**: 在社交媒体、社区等平台发布公告
2. **更新文档**: 确保所有文档链接到最新版本
3. **监控反馈**: 关注Issues和Discussions
4. **收集反馈**: 整理用户反馈，规划后续版本

---

**创建时间**: 2026-02-14 14:50 GMT+8
**创建者**: 东方Q (GLM-4.7)
