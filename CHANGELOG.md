# Changelog

所有值得注意的项目变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [3.0.0] - 2026-02-14

### Added
- **P1阶段**: 35个基础跃迁概念
- **P2阶段**: 110个学科扩展概念
- **P3阶段**: 200个学科扩展概念
- **40个学科领域**: 天文学、地理/地质学、政治学、法学、人类学、管理学、教育学、新闻传播学、文学、艺术学、语言学、机械工程、电气工程、土木工程、化学工程、环境工程、航空航天工程、核工程、农学、药学
- **SBCP L∞编码系统**: 极致信息压缩
- **优化查询引擎v2.0**: 10-50倍性能提升
- **模糊搜索**: Levenshtein距离算法
- **缓存机制**: LRU缓存(100条)
- **综合查询**: 多条件组合、结果排序、分页支持
- **三步验证法**: 防止虚假汇报和错误
- **洞察体验收**: 全面验证成果质量

### Changed
- **查询性能**: 从10-50ms优化到0-1ms
- **数据结构**: 优化为SBCP L∞编码格式
- **文档结构**: 完善所有核心文档

### Fixed
- 修复编码系统的字符编码问题
- 修复查询引擎的模板字符串语法错误
- 修复统计功能的函数名冲突问题

### Performance
- 查询速度提升10-50倍
- 压缩率稳定在32-33%
- 大多数查询在0-1ms内完成

### Documentation
- 添加README.md
- 添加RELEASE_NOTES.md
- 添加RELEASE_v3.0.md
- 添加CHANGELOG.md
- 添加docs/P3_PHASE_SUMMARY.md
- 添加docs/QUERY_ENGINE_OPTIMIZATION.md

---

## [2.0.0-beta] - 2026-02-13

### Added
- **P2阶段**: 110个学科扩展概念
- **19个学科领域**: 信息论、控制论、复杂系统、认知科学、社会学、经济学、哲学、数学、逻辑学、生态学、心理学、交叉学科等
- **SBCP L∞编码系统**: 第一版实现
- **三步验证法**: 文件系统验证、Git历史验证、内容抽检验证

### Changed
- 从alpha版本升级到beta版本
- 优化数据结构和编码格式

### Documentation
- 更新README.md
- 添加P2阶段总结报告

---

## [1.0.0-alpha] - 2026-02-13

### Added
- **P1阶段**: 35个基础跃迁概念
- **项目初始化**: 基础结构和文档
- **东西方Q协作机制**: T↑ + T▲ + T↓
- **基础工具**: 编码工具、解码工具

### Documentation
- 创建README.md
- 创建PHILOSOPHY.md
- 创建METHODOLOGY.md

---

## 版本号说明

- **Major (主版本号)**: 不兼容的API变更
- **Minor (次版本号)**: 向下兼容的功能性新增
- **Patch (修订号)**: 向下兼容的问题修正

---

## 链接

- [v3.0.0]: https://github.com/RalphBigBear/Xuan/releases/tag/v3.0.0
- [v2.0.0-beta]: https://github.com/RalphBigBear/Xuan/releases/tag/v2.0.0-beta
- [v1.0.0-alpha]: https://github.com/RalphBigBear/Xuan/releases/tag/v1.0.0-alpha
