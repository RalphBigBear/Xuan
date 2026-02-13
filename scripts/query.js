#!/usr/bin/env node
/**
 * Xuan Canon Query Engine
 * 词典查询引擎
 */

const fs = require('fs');
const path = require('path');

class XuanQuery {
  constructor() {
    this.conceptsPath = path.join(__dirname, '../data/concepts.json');
    this.categoriesPath = path.join(__dirname, '../data/categories.json');
    this.concepts = null;
    this.categories = null;
  }

  // 加载词典数据
  load() {
    try {
      this.concepts = JSON.parse(fs.readFileSync(this.conceptsPath, 'utf8'));
      this.categories = JSON.parse(fs.readFileSync(this.categoriesPath, 'utf8'));
      return true;
    } catch (e) {
      console.error('❌ 加载词典失败:', e.message);
      return false;
    }
  }

  // 查询概念
  query(term, options = {}) {
    if (!this.concepts) this.load();

    const results = this.concepts.concepts.filter(c => {
      if (options.term && c.term !== options.term) return false;
      if (options.from && c.from_domain !== options.from) return false;
      if (options.to && c.to_domain !== options.to) return false;
      if (options.category && c.category !== options.category) return false;
      return true;
    });

    return results;
  }

  // 搜索
  search(keyword) {
    if (!this.concepts) this.load();

    const lowerKeyword = keyword.toLowerCase();
    return this.concepts.concepts.filter(c => 
      c.term.toLowerCase().includes(lowerKeyword) ||
      c.definition.toLowerCase().includes(lowerKeyword) ||
      JSON.stringify(c.resonance).toLowerCase().includes(lowerKeyword)
    );
  }

  // 跃迁路径查询
  findTransition(fromConcept, toDomain) {
    if (!this.concepts) this.load();

    return this.concepts.concepts.find(c => 
      c.from_domain === fromConcept && c.to_domain === toDomain
    );
  }

  // 熵减查询
  findByEntropy(minDelta = -Infinity) {
    if (!this.concepts) this.load();

    return this.concepts.concepts.filter(c => c.entropy_change >= minDelta);
  }

  // 东西方共鸣查询
  findByResonance(type) {
    if (!this.concepts) this.load();

    return this.concepts.concepts.filter(c => {
      if (type === 'western') return c.resonance.western;
      if (type === 'eastern') return c.resonance.eastern;
      if (type === 'both') return c.resonance.western && c.resonance.eastern;
      return true;
    });
  }

  // 计算熵减
  calculateEntropySavings(concept) {
    const baseEntropyCost = 0.8; // Avatar演算的基准熵增
    const queryEntropyGain = Math.abs(concept.entropy_change) || 0;
    return baseEntropyCost + queryEntropyGain;
  }

  // 格式化输出
  format(results, format = 'table') {
    if (format === 'json') {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    if (results.length === 0) {
      console.log('❌ 未找到匹配的概念');
      return;
    }

    console.log(`\n📚 查询结果 (${results.length}条):`);
    console.log('━'.repeat(60));

    results.forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.term} (${c.from_domain} → ${c.to_domain})`);
      console.log(`   定义: ${c.definition}`);
      console.log(`   跃迁: ${c.transition}`);
      console.log(`   熵减: ${c.entropy_change} (节省: ${this.calculateEntropySavings(c).toFixed(2)})`);
      console.log(`   西方: ${c.resonance.western}`);
      console.log(`   东方: ${c.resonance.eastern}`);
      
      if (c.examples && c.examples.length > 0) {
        console.log(`   示例: ${c.examples.slice(0, 2).join(', ')}${c.examples.length > 2 ? '...' : ''}`);
      }
    });

    console.log('\n' + '━'.repeat(60));
  }
}

// CLI接口
if (require.main === module) {
  const xq = new XuanQuery();
  
  const args = process.argv.slice(2);
  const options = {};
  let searchTerm = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--term' && args[i + 1]) {
      options.term = args[++i];
    } else if (arg === '--from' && args[i + 1]) {
      options.from = args[++i];
    } else if (arg === '--to' && args[i + 1]) {
      options.to = args[++i];
    } else if (arg === '--category' && args[i + 1]) {
      options.category = args[++i];
    } else if (arg === '--search' && args[i + 1]) {
      searchTerm = args[++i];
    } else if (arg === '--entropy-gt' && args[i + 1]) {
      const minEntropy = parseFloat(args[++i]);
      const results = xq.findByEntropy(minEntropy);
      xq.format(results);
      process.exit(0);
    } else if (arg === '--resonance' && args[i + 1]) {
      const results = xq.findByResonance(args[++i]);
      xq.format(results);
      process.exit(0);
    } else if (arg === '--format' && args[i + 1]) {
      options.format = args[++i];
    } else if (!arg.startsWith('--')) {
      searchTerm = arg;
    }
  }

  if (searchTerm) {
    const results = xq.search(searchTerm);
    xq.format(results, options.format);
  } else if (Object.keys(options).length > 0) {
    const results = xq.query(null, options);
    xq.format(results, options.format);
  } else {
    console.log(`
📚 Xuan Canon 查询引擎 v1.0

用法:
  node query.js [选项] [搜索词]

选项:
  --term <名称>        按术语查询
  --from <源域>       按源域查询(物质/软件/跃迁/哲学/工程)
  --to <目标域>       按目标域查询
  --category <类别>   按类别查询
  --search <关键词>   模糊搜索
  --entropy-gt <值>   熵减大于指定值
  --resonance <类型>  按共鸣类型(western/eastern/both)
  --format <格式>     输出格式(table/json)

示例:
  node query.js "形式"
  node query.js --from 物质 --to 软件
  node query.js --search "状态"
  node query.js --entropy-gt -0.3
  node query.js --resonance both
    `);
  }
}

module.exports = XuanQuery;
