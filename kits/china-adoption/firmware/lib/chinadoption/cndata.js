'use strict';
// cndata.js -- frozen China regulatory + event + partner + beta-tester fixtures for
// issue MyZubster-Ecosystem/MyZubster-Robot #34 ("[China] MyZubster adoption in China").
// Pure research snapshot; operators must refresh live data at runtime. No wallets/keys.

// Chinese / cross-border regulators touching crypto + agri-tech adoption.
// Notably the 2021 PBoC trading ban shapes the framework; e-CNY CBDC is the compliant rail.
const REGULATORS = Object.freeze({
  PBOC: Object.freeze({ name: 'People\'s Bank of China (PBoC)', sector: 'digital-currency/AML', regClarity: 2, notes: '2021 ban on crypto trading/exchange; ICBC-led digital RMB (e-CNY) CBDC pilot; agri-cross-border settlement only via compliant rails.' }),
  CAC: Object.freeze({ name: 'Cyberspace Administration of China (CAC)', sector: 'data/altchain-security', regClarity: 3, notes: 'Blockchain ML/Security review; on-chain data localization; Key Ethical-aspects Management Ideals; in scope for agri/IoT.' }),
  SAFE: Object.freeze({ name: 'State Administration of Foreign Exchange (SAFE)', sector: 'FX/cross-border', regClarity: 3, notes: 'Cross-border FX controls; settlement from offshore must follow current account / capital account rules; e-CNY cross-border pilot.' }),
  MARA: Object.freeze({ name: 'Ministry of Agriculture and Rural Affairs (MARA)', sector: 'agri-tech', regClarity: 4, notes: 'Field-trial authorization for agri-robotics; smart-farm demonstration programs; agri-machinery safety.' }),
  MIIT: Object.freeze({ name: 'Ministry of Industry and Information Technology (MIIT)', sector: 'industrial-robotics', regClarity: 4, notes: 'Robot/sensor certification; MIIT FCC-equivalent radio; UAV (agri-drone CAAC) registration is realwinner scope.' }),
});

// Chinese agri-tech + blockchain events. Static research calendar; operators verify dates.
const EVENTS = Object.freeze([
  Object.freeze({ id: 'cimae', name: 'China International Modern Agricultural Exhibition (CIMAE)', city: 'Beijing', month: 4, priority: 5, type: 'trade-fair' }),
  Object.freeze({ id: 'ciame', name: 'China International Agricultural Machinery Exhibition (CIAME)', city: 'Wuhan', month: 10, priority: 5, type: 'trade-fair' }),
  Object.freeze({ id: 'xiamen_agri', name: 'Asia Agriculture & Livestock Expo (Xiamen)', city: 'Xiamen', month: 9, priority: 4, type: 'trade-fair' }),
  Object.freeze({ id: 'chinadrone', name: 'China International UAV / Drone Expo', city: 'Shenzhen', month: 6, priority: 4, type: 'trade-fair' }),
  Object.freeze({ id: 'wkblockchain', name: 'World Artificial Intelligence Conference / Blockchain Forum (Shanghai)', city: 'Shanghai', month: 7, priority: 3, type: 'conference' }),
]);

// Chinese agri-robotics market sizing + entry strategy.
const MARKET = Object.freeze({
  agriRoboticsValue: '~45B USD / ~320B RMB (China agri-machinery + UAV agri, 2026 est)',
  topRegions: Object.freeze(['Shandong', 'Henan', 'Jiangsu', 'Heilongjiang']), // major agri provinces
  entryStrategy: 'Shandong (agri-machinery OEM base) drone pilot -> Jiangsu/Henan autonomous-unit expansion',
});

// China partners. DJI Agriculture / XAG = dominant Chinese agri-drone; Zoomlion = agri machinery.
const PARTNERS = Object.freeze([
  Object.freeze({ id: 'dji_agri', name: 'DJI Agriculture', sector: 'agri-drone', stage: 'identified', touchpoint: 'Co-integration of MyZubster payment rail + DJI A3/N3 mission plans' }),
  Object.freeze({ id: 'xag', name: 'XAG (Xianfeng)', sector: 'agri-drone', stage: 'identified', touchpoint: 'Field-robotics co-research; agri-drone autopilot integration' }),
  Object.freeze({ id: 'zoomlion', name: 'Zoomlion', sector: 'agri-machinery', stage: 'identified', touchpoint: 'Autonomous tractor + smart-farm cooperation' }),
  Object.freeze({ id: 'caamm', name: 'China Association of Agricultural Machinery Manufacturers (CAAMM)', sector: 'industry-org', stage: 'identified', touchpoint: 'Community-manager recruitment pipeline + event access (CIMAE/CIAME)' }),
]);

// Issue outcome: 2 active robots in China. Beta-tester roster (n=2).
const BETA_TESTERS = Object.freeze([
  Object.freeze({ name: 'Beta tester 1 (Shandong agri demo farm)', region: 'Shandong', stage: 'applied' }),
  Object.freeze({ name: 'Beta tester 2 (Jiangsu agri machinery park)', region: 'Jiangsu', stage: 'applied' }),
]);

// Simplified-Chinese (zh) localization keys for the adoption UI surface (mirrors en/it pattern).
// Values are demo strings -- internationalization is content the operator team will finalize.
const ZH_LOCALE = Object.freeze({
  cn_adoption_title: 'MyZubster \u5728\u4e2d\u56fd\u7684\u91c7\u7eb3', // MyZubster 在中国的采纳
  cn_adoption_goal: '\u5728\u4e2d\u56fd\u63a8\u5e7f MyZubster \u4ee5\u6212\u9886\u5148\u7684\u673a\u5668\u4eba\u652f\u4ed8\u7cfb\u7edf', // 在中国推广 MyZubster 机器人支付系统
  cn_adoption_outcome: '2 \u53f0\u6d3b\u8dc3\u673a\u5668\u4eba\u5728\u4e2d\u56fd\u5b9e\u73b0', // 2 台活跃机器人在中国实现
  cn_adoption_partner_dji: '\u4e0e DJI \u519c\u4e1a\u5408\u4f5c', // 与 DJI 农业合作
  cn_adoption_events: '\u4e2d\u56fd\u519c\u4e1a\u4e8b\u4ef6\u65e5\u5386', // 中国农业事件日历
  cn_adoption_docs: '\u7b80\u4f53\u4e2d\u6587\u6587\u6863', // 简体中文文档
  cn_adoption_community: '\u62db\u52df\u672c\u5730\u793e\u533a\u7ba1\u7406\u5458', // 招募本地社区管理员
});

module.exports = { REGULATORS, EVENTS, MARKET, PARTNERS, BETA_TESTERS, ZH_LOCALE };
