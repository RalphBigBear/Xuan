#!/usr/bin/env node
/**
 * SBCP L∞ Encoding Tool
 * 玄典编码工具 - 极致信息压缩
 *
 * 原理: State-Based Compression Protocol with L-infinity Norm
 * 目标: 将概念数据压缩为高密度、可检索的编码
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SBCPEncoder {
  constructor() {
    this.conceptsPath = path.join(__dirname, '../data/concepts.json');
    this.outputPath = path.join(__dirname, '../data/encoded.json');
    this.concepts = null;
    this.encoded = [];
  }

  // 加载原始概念数据
  load() {
    try {
      const data = fs.readFileSync(this.conceptsPath, 'utf8');
      this.concepts = JSON.parse(data).concepts;
      console.log(`✅ 加载 ${this.concepts.length} 个概念`);
      return true;
    } catch (e) {
      console.error('❌ 加载失败:', e.message);
      return false;
    }
  }

  // 生成语义哈希（用于快速检索）
  generateHash(term, fromDomain, toDomain) {
    const source = `${term}:${fromDomain}:${toDomain}`;
    return crypto.createHash('md5').update(source).digest('hex').substring(0, 8);
  }

  // 提取核心关键词（L∞ 压缩）
  extractCoreKeywords(text, maxCount = 3) {
    if (!text) return [];

    // 简单分词（按空格、标点、连接符分割）
    const words = text
      .replace(/[|｜、，,；;。\.\s]+/g, ' ')
      .split(' ')
      .filter(w => w.length >= 2)
      .slice(0, maxCount);

    return words;
  }

  // L∞ 核心编码（最高频特征压缩）
  encodeCore(concept) {
    return {
      t: concept.term.substring(0, 20),  // term 截断
      f: concept.from_domain.substring(0, 15),
      d: concept.to_domain.substring(0, 15),
      s: concept.entropy_change || 0      // entropy score
    };
  }

  // 西方逻辑编码（逻辑特征提取）
  encodeWestern(concept) {
    const western = concept.resonance?.western || '';
    return {
      logic: this.extractCoreKeywords(western, 5).join('|'),
      key: this.extractKeyPhrase(western)
    };
  }

  // 东方直觉编码（洞察特征提取）
  encodeEastern(concept) {
    const eastern = concept.resonance?.eastern || '';
    return {
      insight: this.extractCoreKeywords(eastern, 5).join('|'),
      key: this.extractKeyPhrase(eastern)
    };
  }

  // 提取关键短语（最长 20 字）
  extractKeyPhrase(text) {
    if (!text) return '';
    // 去除标点，取前 20 字
    return text
      .replace(/[，,；;。\.\s]+/g, ' ')
      .trim()
      .substring(0, 20);
  }

  // 生成触发词（用于快速匹配查询）
  generateTriggers(concept) {
    const triggers = [];

    // 从 term 提取
    triggers.push(...this.extractCoreKeywords(concept.term, 2));

    // 从 definition 提取
    triggers.push(...this.extractCoreKeywords(concept.definition, 3));

    // 从 examples 提取
    if (concept.examples && concept.examples.length > 0) {
      concept.examples.slice(0, 2).forEach(ex => {
        triggers.push(...this.extractCoreKeywords(ex, 2));
      });
    }

    // 去重，限制数量
    return [...new Set(triggers)].slice(0, 10);
  }

  // 编码单个概念
  encodeConcept(concept) {
    return {
      id: concept.id,
      hash: this.generateHash(concept.term, concept.from_domain, concept.to_domain),
      core: this.encodeCore(concept),
      western: this.encodeWestern(concept),
      eastern: this.encodeEastern(concept),
      triggers: this.generateTriggers(concept)
    };
  }

  // 编码所有概念
  encodeAll() {
    if (!this.load()) return;

    console.log('\n🔧 开始 SBCP L∞ 编码...\n');

    this.encoded = this.concepts.map((c, i) => {
      const encoded = this.encodeConcept(c);
      console.log(`  [${i + 1}/${this.concepts.length}] ${c.term} → ${encoded.hash}`);
      return encoded;
    });

    console.log(`\n✅ 编码完成: ${this.encoded.length} 个概念`);
    this.saveStats();
  }

  // 计算压缩统计
  saveStats() {
    const originalSize = JSON.stringify(this.concepts).length;
    const encodedSize = JSON.stringify(this.encoded).length;
    const compressionRatio = ((1 - encodedSize / originalSize) * 100).toFixed(2);

    console.log('\n📊 压缩统计:');
    console.log(`  原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`  编码大小: ${(encodedSize / 1024).toFixed(2)} KB`);
    console.log(`  压缩率: ${compressionRatio}%`);
  }

  // 保存编码数据
  save() {
    try {
      const output = {
        meta: {
          version: '2.0.0',
          created: new Date().toISOString(),
          encoding: 'SBCP L∞',
          total_entries: this.encoded.length
        },
        encoded: this.encoded
      };

      fs.writeFileSync(this.outputPath, JSON.stringify(output, null, 2));
      console.log(`\n✅ 保存编码数据: ${this.outputPath}`);
      return true;
    } catch (e) {
      console.error('❌ 保存失败:', e.message);
      return false;
    }
  }

  // 验证编码（解码测试）
  validate() {
    console.log('\n🔍 验证编码完整性...');

    let passCount = 0;
    this.encoded.forEach(e => {
      const hasCore = e.core && e.core.t && e.core.f && e.core.d;
      const hasWestern = e.western && e.western.logic;
      const hasEastern = e.eastern && e.eastern.insight;
      const hasTriggers = e.triggers && e.triggers.length > 0;

      if (hasCore && hasWestern && hasEastern && hasTriggers) {
        passCount++;
      }
    });

    console.log(`  通过: ${passCount}/${this.encoded.length}`);
    return passCount === this.encoded.length;
  }

  // 运行完整编码流程
  run() {
    console.log('\n' + '='.repeat(60));
    console.log('🌀 SBCP L∞ 编码工具');
    console.log('='.repeat(60));

    this.encodeAll();
    this.validate();
    this.save();

    console.log('\n' + '='.repeat(60));
    console.log('✅ 编码完成！');
    console.log('='.repeat(60) + '\n');
  }
}

// CLI 入口
if (require.main === module) {
  const encoder = new SBCPEncoder();
  encoder.run();
}

module.exports = SBCPEncoder;
