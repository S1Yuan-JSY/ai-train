import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCoachMarkdown} from '../../frontend/public/coach-format.js';

test('coach answer renders headings, training tables, lists and citations',()=>{
 const html=renderCoachMarkdown('## 版本 A：完整腿日\n\n**热身 8 分钟**\n\n| 动作 | 组数 |\n|---|---|\n| 哈克倒蹬 | 4×8-10 [K29] |\n\n---\n\n1. 核对计划\n2. 核对记录\n\n- 每组保留余力\n\n> 注意恢复');
 assert.match(html,/<h3>版本 A/);
 assert.match(html,/<strong>热身 8 分钟<\/strong>/);
 assert.match(html,/<th scope="col">动作/);
 assert.match(html,/<td>哈克倒蹬/);
 assert.match(html,/data-citation="K29"/);
 assert.match(html,/<ol start="1"><li>核对计划/);
 assert.match(html,/<ul><li>每组保留余力/);
 assert.match(html,/<blockquote>注意恢复/);
});

test('model text cannot inject executable HTML or links',()=>{
 const html=renderCoachMarkdown('<img src=x onerror=alert(1)>\n\n**<script>alert(1)</script>**\n\n[链接](javascript:alert(1))\n\n`<svg onload=alert(1)>`\n\n```html\n<script>alert(1)</script>\n```');
 assert.doesNotMatch(html,/<(?:img|script|svg|a)\b/i);
 assert.match(html,/&lt;img/);
 assert.match(html,/<code>&lt;svg/);
 assert.match(html,/<pre><code>&lt;script/);
});
