#!/usr/bin/env node
/**
 * SBCP L∞ Decode & Query Tool
 * 解码查询工具 - Avatar 快速检索接口
 *
 * 用途: Avatar 通过触发词快速查询跃迁概念
 */

const fs = require('fs');
const path = require('path');

class SBCPDecoder {
  constructor() {
    this.encodedPath = path.join(__dirname, '../data/encoded.json');
    this.conceptsPath = path.join(__dirname, '../data/concepts.json');
    this.encoded = null;
    this.concepts = null;
    this.triggerIndex = {};
  }

  // 加载编码数据
  load() {
    try {
      const encodedData = JSON.parse(fs.readFileSync(this.encodedPath, 'utf8'));
      this.encoded = encodedData.encoded;

      const conceptsData = JSON.parse(fs.readFileSync(this.conceptsPath, 'utf8'));
      this.concepts = conceptsData.concepts;

      this.buildTriggerIndex();
      console.log(`✅ 加载 ${this.encoded.length} 个编码概念`);
      return true;
    } catch (e) {
      console.error('❌ 加载失败:', e.message);
      return false;
    }
  }

  // 构建触发词倒排索引
  buildTriggerIndex() {
    this.encoded.forEach((e, idx) => {
      e.triggers.forEach(trigger => {
        if (!this.triggerIndex[trigger]) {
          this.triggerIndex[trigger] = [];
        }
        this.triggerIndex[trigger].push(idx);
      });
    });
  }

  // 通过触发词查询（快速匹配）
  queryByTrigger(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    // 遍历触发词索引
    for (const [trigger, indices] of Object.entries(this.triggerIndex)) {
      if (trigger.toLowerCase().includes(lowerKeyword) || lowerKeyword.includes(trigger)) {
        indices.forEach(idx => results.push(this.encoded[idx]));
      }
    }

    return results;
  }

  // 通过语义哈希查询（精确匹配）
  queryByHash(hash) {
    return this.encoded.find(e => e.hash === hash);
  }

  // 通过 ID 查询
  queryById(id) {
    return this.encoded.find(e => e.id === id);
  }

  // 通过熵值范围查询
  queryByEntropyRange(min, max) {
    return this.encoded.filter(e => e.core.s >= min && e.core.s <= max);
  }

  // 联合查询（多条件组合）
  query(options = {}) {
    let results = this.encoded;

    if (options.trigger) {
      const triggerResults = this.queryByTrigger(options.trigger);
      const resultHashes = new Set(triggerResults.map(e => e.hash));
      results = results.filter(e => resultHashes.has(e.hash));
    }

    if (options.hash) {
      results = results.filter(e => e.hash === options.hash);
    }

    if (options.id) {
      results = results.filter(e => e.id === options.id);
    }

    if (options.minEntropy !== undefined) {
      results = results.filter(e => e.core.s >= options.minEntropy);
    }

    if (options.maxEntropy !== undefined) {
      results = results.filter(e => e.core.s <= options.maxEntropy);
    }

    if (options.fromDomain) {
      results = results.filter(e => e.core.f.includes(options.fromDomain));
    }

    if (options.toDomain) {
      results = results.filter(e => e.core.d.includes(options.toDomain));
    }

    return results;
  }

  // 解码（从编码还原为完整概念）
  decode(encoded) {
    if (!encoded) return null;

    return this.concepts.find(c => c.id === encoded.id);
  }

  // 格式化输出（SBCP 风格）
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

  // 统计信息
  stats() {
    if (!this.encoded) this.load();

    const entropyStats = {
      min: Math.min(...this.encoded.map(e => e.core.s)),
      max: Math.max(...this.encoded.map(e => e.core.s)),
      avg: this.encoded.reduce((sum, e) => sum + e.core.s, 0) / this.encoded.length
    };

    const triggerCount = Object.keys(this.triggerIndex).length;
    const avgTriggers = this.encoded.reduce((sum, e) => sum + e.triggers.length, 0) / this.encoded.length;

    console.log('\n📊 SBCP L∞ 统计\n');
    console.log(`  总概念数: ${this.encoded.length}`);
    console.log(`  触发词数: ${triggerCount}`);
    console.log(`  平均触发词: ${avgTriggers.toFixed(1)}`);
    console.log(`  熵减范围: ${entropyStats.min.toFixed(2)} ~ ${entropyStats.max.toFixed(2)}`);
    console.log(`  平均熵减: ${entropyStats.avg.toFixed(2)}`);
    console.log('');
  }

  // 测试查询性能
  benchmark() {
    if (!this.encoded) this.load();

    const testQueries = ['光', '系统', '进化', '架构', '信息'];

    console.log('\n⚡ 性能测试\n');

    testQueries.forEach(q => {
      const start = Date.now();
      const results = this.queryByTrigger(q);
      const elapsed = Date.now() - start;

      console.log(`  "${q}" → ${results.length} 结果 (${elapsed}ms)`);
    });

    console.log('');
  }
}

// CLI 入口
if (require.main === module) {
  const decoder = new SBCPDecoder();
  decoder.load();

  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'query':
    case 'q': {
      const keyword = args[1];
      if (!keyword) {
        console.log('用法: node decode.js query <触发词>');
        process.exit(1);
      }
      const results = decoder.queryByTrigger(keyword);
      decoder.format(results, { showWestern: true, showEastern: true, showTriggers: true });
      break;
    }

    case 'hash': {
      const hash = args[1];
      if (!hash) {
        console.log('用法: node decode.js hash <语义哈希>');
        process.exit(1);
      }
      const result = decoder.queryByHash(hash);
      if (result) {
        decoder.format([result], { showFull: true });
      } else {
        console.log('❌ 未找到匹配的哈希');
      }
      break;
    }

    case 'stats':
      decoder.stats();
      break;

    case 'benchmark':
    case 'bench':
      decoder.benchmark();
      break;

    default:
      console.log(`
🌀 SBCP L∞ 解码查询工具

用法:
  node decode.js query <触发词>      通过触发词查询
  node decode.js hash <语义哈希>     通过哈希查询
  node decode.js stats               显示统计信息
  node decode.js benchmark           性能测试

示例:
  node decode.js query "光"
  node decode.js hash 67dfe09c
  node decode.js stats
      `);
  }
}

module.exports = SBCPDecoder;
