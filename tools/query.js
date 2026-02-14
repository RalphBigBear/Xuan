#!/usr/bin/env node
/**
 * SBCP L∞ Optimized Query Engine v2.0
 * 优化查询引擎 - 高性能检索接口
 *
 * 优化内容:
 * - 倒排索引优化
 * - 模糊搜索支持
 * - 查询缓存机制
 * - 批量查询支持
 * - 结果排序和分页
 */

const fs = require('fs');
const path = require('path');

class OptimizedQueryEngine {
  constructor() {
    this.encodedPath = path.join(__dirname, '../data/encoded.json');
    this.conceptsPath = path.join(__dirname, '../data/concepts.json');
    this.encoded = null;
    this.concepts = null;

    // 索引结构
    this.triggerIndex = {};
    this.fuzzyIndex = {};
    this.domainIndex = { from: {}, to: {} };

    // 缓存结构
    this.queryCache = new Map();
    this.cacheSize = 100;

    // 统计
    this.stats = {
      queries: 0,
      cacheHits: 0,
      avgTime: 0
    };
  }

  // 加载数据
  load() {
    try {
      const startTime = Date.now();

      // 加载编码数据
      const encodedData = JSON.parse(fs.readFileSync(this.encodedPath, 'utf8'));
      this.encoded = encodedData.encoded;

      // 加载完整概念数据
      const conceptsData = JSON.parse(fs.readFileSync(this.conceptsPath, 'utf8'));
      this.concepts = conceptsData.concepts;

      // 构建索引
      this.buildAllIndexes();

      const elapsed = Date.now() - startTime;
      console.log(`✅ 加载 ${this.encoded.length} 个编码概念 (${elapsed}ms)`);
      return true;
    } catch (e) {
      console.error('❌ 加载失败:', e.message);
      return false;
    }
  }

  // 构建所有索引
  buildAllIndexes() {
    this.buildTriggerIndex();
    this.buildFuzzyIndex();
    this.buildDomainIndex();
  }

  // 构建触发词倒排索引
  buildTriggerIndex() {
    this.triggerIndex = {};

    this.encoded.forEach((e, idx) => {
      e.triggers.forEach(trigger => {
        const normalized = trigger.toLowerCase();
        if (!this.triggerIndex[normalized]) {
          this.triggerIndex[normalized] = [];
        }
        this.triggerIndex[normalized].push(idx);
      });
    });
  }

  // 构建模糊搜索索引（2-gram）
  buildFuzzyIndex() {
    this.fuzzyIndex = {};

    this.encoded.forEach((e) => {
      const term = e.core.t.toLowerCase();

      // 生成2-gram
      for (let i = 0; i < term.length - 1; i++) {
        const gram = term.substr(i, 2);
        if (!this.fuzzyIndex[gram]) {
          this.fuzzyIndex[gram] = new Set();
        }
        this.fuzzyIndex[gram].add(e.id);
      }
    });
  }

  // 构建领域索引
  buildDomainIndex() {
    this.domainIndex = { from: {}, to: {} };

    this.encoded.forEach((e, idx) => {
      const fromDomain = e.core.f.toLowerCase();
      const toDomain = e.core.d.toLowerCase();

      if (!this.domainIndex.from[fromDomain]) {
        this.domainIndex.from[fromDomain] = [];
      }
      this.domainIndex.from[fromDomain].push(idx);

      if (!this.domainIndex.to[toDomain]) {
        this.domainIndex.to[toDomain] = [];
      }
      this.domainIndex.to[toDomain].push(idx);
    });
  }

  // 精确查询（触发词）
  queryByTrigger(keyword) {
    const cacheKey = `trigger:${keyword}`;

    // 检查缓存
    if (this.queryCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.queryCache.get(cacheKey);
    }

    const results = [];
    const normalized = keyword.toLowerCase();

    // 遍历触发词索引
    for (const [trigger, indices] of Object.entries(this.triggerIndex)) {
      if (trigger.includes(normalized) || normalized.includes(trigger)) {
        indices.forEach(idx => results.push(this.encoded[idx]));
      }
    }

    // 缓存结果
    this.addToCache(cacheKey, results);

    return results;
  }

  // 模糊查询（Levenshtein距离）
  queryByFuzzy(keyword, maxDistance = 2) {
    const results = [];
    const normalized = keyword.toLowerCase();

    // 使用2-gram快速过滤候选
    const candidates = new Set();

    for (let i = 0; i < normalized.length - 1; i++) {
      const gram = normalized.substr(i, 2);
      if (this.fuzzyIndex[gram]) {
        this.fuzzyIndex[gram].forEach(id => candidates.add(id));
      }
    }

    // 计算Levenshtein距离
    candidates.forEach(id => {
      const concept = this.encoded.find(e => e.id === id);
      if (concept) {
        const distance = this.levenshtein(normalized, concept.core.t.toLowerCase());
        if (distance <= maxDistance) {
          results.push({ ...concept, distance });
        }
      }
    });

    // 按距离排序
    results.sort((a, b) => a.distance - b.distance);

    return results;
  }

  // Levenshtein距离算法
  levenshtein(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // 领域查询
  queryByDomain(type, domain) {
    const cacheKey = `domain:${type}:${domain}`;

    if (this.queryCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.queryCache.get(cacheKey);
    }

    const normalized = domain.toLowerCase();
    const index = type === 'from' ? this.domainIndex.from : this.domainIndex.to;

    const results = (index[normalized] || []).map(idx => this.encoded[idx]);

    this.addToCache(cacheKey, results);

    return results;
  }

  // 综合查询
  query(options = {}) {
    const startTime = Date.now();
    this.stats.queries++;

    let results = this.encoded;

    // 触发词过滤
    if (options.trigger) {
      const triggerResults = this.queryByTrigger(options.trigger);
      const resultHashes = new Set(triggerResults.map(e => e.hash));
      results = results.filter(e => resultHashes.has(e.hash));
    }

    // 模糊搜索
    if (options.fuzzy) {
      const fuzzyResults = this.queryByFuzzy(options.fuzzy, options.maxDistance || 2);
      const resultHashes = new Set(fuzzyResults.map(e => e.hash));
      results = results.filter(e => resultHashes.has(e.hash));
    }

    // 哈希过滤
    if (options.hash) {
      results = results.filter(e => e.hash === options.hash);
    }

    // ID过滤
    if (options.id) {
      results = results.filter(e => e.id === options.id);
    }

    // 熵值范围过滤
    if (options.minEntropy !== undefined) {
      results = results.filter(e => e.core.s >= options.minEntropy);
    }

    if (options.maxEntropy !== undefined) {
      results = results.filter(e => e.core.s <= options.maxEntropy);
    }

    // 来源领域过滤
    if (options.fromDomain) {
      results = results.filter(e => e.core.f.toLowerCase().includes(options.fromDomain.toLowerCase()));
    }

    // 目标领域过滤
    if (options.toDomain) {
      results = results.filter(e => e.core.d.toLowerCase().includes(options.toDomain.toLowerCase()));
    }

    // 排序
    if (options.sortBy) {
      results = this.sort(results, options.sortBy, options.sortOrder || 'asc');
    }

    // 分页
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit || results.length;
      results = results.slice(offset, offset + limit);
    }

    const elapsed = Date.now() - startTime;
    this.updateAvgTime(elapsed);

    return results;
  }

  // 排序
  sort(results, sortBy, order) {
    const sorted = [...results];

    sorted.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case 'entropy':
          valA = a.core.s;
          valB = b.core.s;
          break;
        case 'term':
          valA = a.core.t;
          valB = b.core.t;
          break;
        case 'id':
          valA = a.id;
          valB = b.id;
          break;
        default:
          return 0;
      }

      if (order === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });

    return sorted;
  }

  // 批量查询
  batchQuery(queryList) {
    return queryList.map(options => this.query(options));
  }

  // 添加到缓存
  addToCache(key, value) {
    if (this.queryCache.size >= this.cacheSize) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }
    this.queryCache.set(key, value);
  }

  // 清除缓存
  clearCache() {
    this.queryCache.clear();
    console.log('✅ 缓存已清除');
  }

  // 更新平均时间
  updateAvgTime(time) {
    this.stats.avgTime = (this.stats.avgTime * (this.stats.queries - 1) + time) / this.stats.queries;
  }

  // 格式化输出
  format(results, options = {}) {
    if (results.length === 0) {
      console.log('❌ 未找到匹配的概念');
      return;
    }

    console.log(`\n📚 查询结果: ${results.length} 个\n`);

    results.forEach((e, i) => {
      const decoded = this.decode(e);

      console.log(`[${i + 1}] ${e.core.t} (${e.id})`);
      console.log(`    Hash: ${e.hash}`);
      console.log(`    跃迁: ${e.core.f} → ${e.core.d}`);
      console.log(`    熵减: ${e.core.s}`);

      if (options.showWestern && e.western?.logic) {
        console.log(`    西方: ${e.western.logic}`);
      }

      if (options.showEastern && e.eastern?.insight) {
        console.log(`    东方: ${e.eastern.insight}`);
      }

      if (options.showTriggers && e.triggers?.length > 0) {
        console.log(`    触发: ${e.triggers.join(', ')}`);
      }

      if (options.showFull && decoded) {
        console.log(`\n    定义: ${decoded.definition}`);
        console.log(`    共振:`);
        console.log(`      西: ${decoded.resonance.western}`);
        console.log(`      东: ${decoded.resonance.eastern}`);
      }

      console.log('');
    });
  }

  // 解码
  decode(encoded) {
    if (!encoded) return null;
    return this.concepts.find(c => c.id === encoded.id);
  }

  // 统计信息
  showStats() {
    if (!this.encoded) this.load();

    const entropyStats = {
      min: Math.min(...this.encoded.map(e => e.core.s)),
      max: Math.max(...this.encoded.map(e => e.core.s)),
      avg: this.encoded.reduce((sum, e) => sum + e.core.s, 0) / this.encoded.length
    };

    const triggerCount = Object.keys(this.triggerIndex).length;
    const avgTriggers = this.encoded.reduce((sum, e) => sum + e.triggers.length, 0) / this.encoded.length;

    console.log('\n📊 查询引擎统计\n');
    console.log(`  总概念数: ${this.encoded.length}`);
    console.log(`  触发词数: ${triggerCount}`);
    console.log(`  平均触发词: ${avgTriggers.toFixed(1)}`);
    console.log(`  熵减范围: ${entropyStats.min.toFixed(2)} ~ ${entropyStats.max.toFixed(2)}`);
    console.log(`  平均熵减: ${entropyStats.avg.toFixed(2)}`);
    console.log(`\n  查询次数: ${this.stats.queries}`);
    console.log(`  缓存命中: ${this.stats.cacheHits}`);
    console.log(`  缓存命中率: ${this.stats.queries > 0 ? ((this.stats.cacheHits / this.stats.queries) * 100).toFixed(1) : 0}%`);
    console.log(`  平均查询时间: ${this.stats.avgTime.toFixed(2)}ms`);
    console.log('');
  }

  // 性能测试
  benchmark() {
    if (!this.encoded) this.load();

    const testQueries = [
      { trigger: '光' },
      { trigger: '系统' },
      { trigger: '进化' },
      { trigger: '架构' },
      { trigger: '信息' },
      { fuzzy: '波泣' },
      { fuzzy: '系统' },
      { fuzzy: '机化' }
    ];

    console.log('\n⚡ 性能测试\n');

    testQueries.forEach(q => {
      const start = Date.now();
      const results = this.query(q);
      const elapsed = Date.now() - start;

      const queryType = q.trigger ? `"${q.trigger}"` : `"${q.fuzzy}" (fuzzy)`;
      console.log(`  ${queryType} → ${results.length} 结果 (${elapsed}ms)`);
    });

    console.log('');
  }
}

// CLI入口
if (require.main === module) {
  const engine = new OptimizedQueryEngine();
  engine.load();

  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'query':
    case 'q': {
      const keyword = args[1];
      if (!keyword) {
        console.log('用法: node query.js query <触发词>');
        process.exit(1);
      }
      const results = engine.query({ trigger: keyword });
      engine.format(results, { showWestern: true, showEastern: true, showTriggers: true });
      break;
    }

    case 'fuzzy':
    case 'f': {
      const keyword = args[1];
      if (!keyword) {
        console.log('用法: node query.js fuzzy <关键词>');
        process.exit(1);
      }
      const maxDistance = parseInt(args[2]) || 2;
      const results = engine.query({ fuzzy: keyword, maxDistance });
      engine.format(results);
      break;
    }

    case 'domain': {
      const type = args[1];
      const domain = args[2];
      if (!type || !domain) {
        console.log('用法: node query.js domain <from|to> <领域>');
        process.exit(1);
      }
      const results = engine.queryByDomain(type, domain);
      engine.format(results);
      break;
    }

    case 'stats':
      engine.showStats();
      break;

    case 'benchmark':
    case 'bench':
    case 'b':
      engine.benchmark();
      break;

    case 'cache-clear':
      engine.clearCache();
      break;

    default:
      console.log(`
🌀 SBCP L∞ 优化查询引擎 v2.0

用法:
  node query.js query <触发词>    精确查询
  node query.js fuzzy <关键词>    模糊查询
  node query.js domain <from|to> <领域>  领域查询
  node query.js stats              显示统计信息
  node query.js benchmark           性能测试
  node query.js cache-clear         清除缓存

示例:
  node query.js query "光"
  node query.js fuzzy "波泣" 2
  node query.js domain from "物理"
  node query.js stats
      `);
  }
}

module.exports = OptimizedQueryEngine;
