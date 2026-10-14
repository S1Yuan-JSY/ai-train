// Deliberately supports a small Markdown subset. Model HTML is always escaped.
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(text){
 return text.split(/(`[^`]+`)/g).map(part=>{
  if(part.startsWith('`')&&part.endsWith('`'))return `<code>${escape(part.slice(1,-1))}</code>`;
  return escape(part).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>').replace(/\[(K\d+)\]/g,'<button type="button" class="coach-citation" data-citation="$1" aria-label="查看参考 $1">$1</button>');
 }).join('');
}
const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(s=>s.trim());
const divider=line=>line.includes('|')&&cells(line).every(c=>/^:?-{3,}:?$/.test(c));
const special=line=>/^\s*(?:#{1,6}\s|[-*+]\s|\d+[.)]\s|>|```|(?:---+|\*\*\*+)\s*$)/.test(line);
export function renderCoachMarkdown(text){
 const lines=String(text).replace(/\r\n?/g,'\n').split('\n');const out=[];let i=0;
 while(i<lines.length){
  const line=lines[i];
  if(!line.trim()){i++;continue;}
  if(/^\s*```/.test(line)){
   const code=[];i++;while(i<lines.length&&!/^\s*```/.test(lines[i]))code.push(lines[i++]);
   if(i<lines.length)i++;out.push(`<pre><code>${escape(code.join('\n'))}</code></pre>`);continue;
  }
  if(i+1<lines.length&&line.includes('|')&&divider(lines[i+1])){
   const headers=cells(line);i+=2;const rows=[];
   while(i<lines.length&&lines[i].trim()&&lines[i].includes('|'))rows.push(cells(lines[i++]));
   out.push(`<div class="coach-table-hint">训练明细 · 表格可左右滑动</div><div class="coach-table-scroll" role="region" aria-label="私教建议表格" tabindex="0"><table><thead><tr>${headers.map(h=>`<th scope="col">${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${Array.from({length:Math.max(headers.length,row.length)},(_,n)=>`<td>${inline(row[n]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue;
  }
  const heading=line.match(/^\s*(#{1,6})\s+(.+)$/);
  if(heading){const level=Math.min(4,heading[1].length+1);out.push(`<h${level}>${inline(heading[2])}</h${level}>`);i++;continue;}
  if(/^\s*(?:---+|\*\*\*+)\s*$/.test(line)){out.push('<hr>');i++;continue;}
  const list=line.match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);
  if(list){
   const ordered=!!list[2],tag=ordered?'ol':'ul';const items=[];
   while(i<lines.length){const match=lines[i].match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);if(!match||!!match[2]!==ordered)break;
    let content=match[3];i++;while(i<lines.length&&/^\s{2,}\S/.test(lines[i])&&!special(lines[i]))content+='\n'+lines[i++].trim();items.push(`<li>${inline(content).replace(/\n/g,'<br>')}</li>`);
   }
   out.push(`<${tag}${ordered?` start="${Number(list[2])}"`:''}>${items.join('')}</${tag}>`);continue;
  }
  if(/^\s*>/.test(line)){const quote=[];while(i<lines.length&&/^\s*>/.test(lines[i]))quote.push(lines[i++].replace(/^\s*>\s?/,''));out.push(`<blockquote>${inline(quote.join('\n')).replace(/\n/g,'<br>')}</blockquote>`);continue;}
  const paragraph=[line];i++;while(i<lines.length&&lines[i].trim()&&!special(lines[i])&&!(i+1<lines.length&&lines[i].includes('|')&&divider(lines[i+1])))paragraph.push(lines[i++]);
  out.push(`<p>${inline(paragraph.join('\n')).replace(/\n/g,'<br>')}</p>`);
 }
 return out.join('');
}
