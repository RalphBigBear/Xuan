usr/bin/env node
/**
 * Xuan Canon Validation
 * 词典条目验证
 */

const fs = require('fs');
const path = require('path');

class XuanValidator {
  constructor() {
    this.conceptsPath = path.join(__dirname, '../data/concepts.json');
    this.data = null;
  }

  // 加载数据
  load() {
    try {
      this.data = JSON.parse(fs.readFileSync(this.conceptsPath, 'utf8'));
      return true;
    } catch (e) {
      console.error('❌ 加载失败:', e.message);
      return false;
    }
  }

  // 验证概念完整性
  validateConcept(concept) {
    const errors = [];
    const warnings = [];

    // 必需字段
    if (!concept.id) errors.push('缺少id');
    if (!concept.term) errors.push('缺少term');
    if (!concept.from_domain) errors.push('缺少from_domain');
    if (!concept.to_domain) errors.push('缺少to_domain');
    if (!concept.definition) errors.push('缺少definition');
    if (!concept.transition) errors.push('缺少transition');

    // 类型验证
    if (concept.entropy_change === undefined) warnings.push('缺少entropy_change');

    // 东西方共鸣验证
    if (!concept.resonance) {
      warnings.push('缺少东西方共鸣(resonance)');
    } else if (!concept.resonance.western || !concept.resonance.eastern) {
      warnings.push('东西方共鸣不完整');
    }

    return { errors, warnings };
  }

  // 验证所有概念
  validateAll() {
    if (!this.load()) return;

    const concepts = this.data.concepts || [];
    console.log(`\n📚 验证 ${concepts.length} 个概念...\n`);

    let totalErrors = 0;
    let totalWarnings = 0;

    concepts.forEach((c, i) => {
      const { errors, warnings } = this.validateConcept(c);
      
      if (errors.length > 0) {
        console.error(`❌ [${i + 1}] ${c.term}: ${errors.join(', ')}`);
        totalErrors++;
      }
      
      if (warnings.length > 0) {
        console.warn(`⚠️  [${i + 1}] ${c.term}: ${warnings.join(', ')}`);
        totalWarnings++;
      } else {
        console.log(`✅ [${i + 1}] ${c.term}: OK`);
      }
    });

    console.log('\n━'.repeat(60));
    console.log(`✅ 验证完成: ${concepts.length - totalErrors} 个有效`);
    console.log(`⚠️  警告: ${totalWarnings}`);
    console.log(`❌ 错误: ${totalErrors}`);
    console.log('━'.repeat(60));

    return totalErrors === 0;
  }

  // 统计信息
  stats() {
    if (!this.load()) return;

    const concepts = this.data.concepts || [];
    const domains = {};
    const categories = {};

    concepts.forEach(c => {
      domains[c.from_domain] = (domains[c.from_domain] || 0) + 1;
      if (c.category) categories[c.category] = (categories[c.category] || 0) + 1;
    });

    console.log('\n📊 词典统计\n');
    console.log('━'.repeat(40));
    console.log('源域分布:');
    Object.entries(domains).forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count} 个概念`);
    });
    console.log('\n类别分布:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} 个概念`);
    });

    const avgEntropy = concepts
      .filter(c => c.entropy_change !== undefined)
      .reduce((sum, c) => sum + c.entropy_change, 0) / concepts.length;

    console.log(`\n平均熵减: ${avgEntropy.toFixed(3)}`);
  }

  // 检测重复
  checkDuplicates() {
    if (!this.load()) return;

    const terms = {};
    const duplicates = [];

    this.data.concepts.forEach(c => {
      if (terms[c.term]) {
        duplicates.push(c);
      }
      terms[c.term] = true;
    });

    if (duplicates.length > 0) {
      console.log(`\n⚠️  检测到 ${duplicates.length} 个重复概念:`);
      duplicates.forEach(c => console.log(`  - ${c.term} (${c.id})`));
    } else {
      console.log('\n✅ 未检测到重复');
    }

    return duplicates.length === 0;
  }

  // 检测孤立概念
  checkOrphaned() {
    if (!this.load()) return;

    const ids = new Set(this.data.concepts.map(c => c.id));
    const orphans = [];

    // 简单检测：from_domain和to_domain都相同的不应该存在
    this.data.concepts.forEach(c => {
      if (c.from_domain === c.to_domain && c.from_domain !== '跃迁') {
        orphans.push(c);
      }
    });

    if (orphans.length > 0) {
      console.log(`\n⚠️  检测到 ${orphans.length} 个非跃迁概念:`);
      orphans.forEach(c => console.log(`  - ${c.term} (${c.from_domain} → ${c.to_domain})`));
    }
  }
}

// CLI接口
if (require.main === module) {
  const validator = new XuanValidator();
  const cmd = process.argv[2] || 'validate';

  switch (cmd) {
    case 'validate':
      validator.validateAll();
      break;
    case 'stats':
      validator.stats();
      break;
    case 'check-dup':
      validator.checkDuplicates();
      break;
    case 'check-orphan':
      validator.checkOrphaned();
      break;
    default:
      console.log(`
🔍 Xuan Canon 验证工具 v1.0

用法:
  node validate.js <命令>

命令:
  validate        验证所有概念
  stats           显示统计信息
  check-dup        检查重复
  check-orphan      检测孤立概念

示例:
  node validate.js validate
  node validate.js stats
      `);
  }
}

module.exports = XuanValidator;
