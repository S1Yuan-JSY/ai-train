import {cameraSession} from './camera.js?v=20261011-camera';
import {FoodSchema,labelFood,labelExtras,parseLabelText,totals} from './core.js?v=20261011-label-archive-final';

export function initLabelPanel({save,isConnected}){
 const host=document.getElementById('label-panel');
 host.innerHTML=`<small>PACKAGE NUTRITION</small><h2>拍标签 · 按克记录</h2><p class="muted">拍清楚整张营养成分表，或从相册上传。照片在本机识别；核对数值后按实际摄入克数换算。结果依赖包装标示与称重，不代表实验室实测。</p>
 <div class="fields"><button id="label-camera" type="button" class="primary">打开相机</button><label>上传图片<input id="label-file" type="file" accept="image/jpeg,image/png,image/webp"></label></div>
 <div id="label-camera-panel" class="label-camera-panel" hidden><video id="label-video" autoplay muted playsinline aria-label="营养标签相机取景"></video><p id="label-camera-status" role="status">正在请求相机权限…</p><div class="actions"><button id="label-shutter" type="button" data-unavailable="true" disabled>拍照并识别</button><button id="label-camera-close" type="button">关闭相机</button></div></div>
 <img id="label-image" class="label-image" alt="待核对的营养成分表" hidden>
 <p id="label-progress" class="muted" role="status">支持 JPG、PNG、WebP，最大15MB。对准标签、避免反光，可先裁剪照片。</p><button id="label-cancel" type="button" hidden>取消识别</button>
 <details><summary>识别文字 / 手动粘贴标签</summary><textarea id="label-text" maxlength="12000" rows="6" placeholder="每100克\n能量 800 kJ\n蛋白质 10 g\n脂肪 5 g\n碳水化合物 25 g\n钠 100 mg"></textarea><button id="label-parse" type="button">提取文字中的数值</button></details>
 <form id="label-form"><div class="fields">
 <label class="wide">食物名称<input id="label-name" required maxlength="100" placeholder="如：某品牌原味酸奶"></label>
 <label>标签基准数量<input id="label-basis" type="number" min="0.001" max="10000" step="any" required placeholder="每100g填100；每份30g填30"></label>
 <label>标签基准单位<select id="label-basis-unit"><option value="g">克（g）</option><option value="ml">毫升（ml）</option></select></label>
 <label id="label-density-wrap" hidden>密度 g/ml（每毫升换算为克必填）<input id="label-density" type="number" min="0.001" max="20" step="any" placeholder="查包装或实测，不自动假定"></label>
 <label>能量（标签原值）<input id="label-energy" type="number" min="0" step="any" required></label><label>能量单位<select id="label-energy-unit"><option value="kJ">千焦 kJ</option><option value="kcal">千卡 kcal</option></select></label>
 ${[['protein','蛋白质'],['fat','脂肪'],['carbs','碳水化合物']].map(([key,name])=>`<label>${name}（g / 标签基准）<input id="label-${key}" type="number" min="0" step="any" required></label>`).join('')}
 </div><p class="muted">填写含量列，不填写 NRV%。每份标签需填写该份的克数。未识别的数值留空，不能默认成0。</p>
 <details><summary>其他营养成分（选填，按同一标签基准）</summary><div id="label-extras"></div><button id="label-extra-add" type="button">＋ 添加营养成分</button></details>
 <label>这次吃了多少克？<input id="label-grams" type="number" min="0.1" max="10000" step="any" required placeholder="填写实际摄入重量"></label>
 <div id="label-preview" class="label-calculation" role="status">补全标签与克数后，这里显示本次摄入营养。</div>
 <label class="check-line"><input id="label-confirm" type="checkbox" required> 我已对照包装核对基准份量、单位和各项数值</label>
 <label class="check-line"><input id="label-remember" type="checkbox" checked> 同时保存到我的食物库，下次直接按克记录</label>
 <button class="primary" id="label-save">确认并记录到今天</button><p id="label-result" role="status" class="muted"></p></form>`;
 const $=id=>document.getElementById(id);let imageUrl='',generation=0,worker=null,ocrBusy=false,saving=false;
 const status=text=>{$('label-progress').textContent=text;};
 const camera=cameraSession(options=>navigator.mediaDevices.getUserMedia(options));
 let cameraGeneration=0,capturing=false;
 function ready(value){$('label-shutter').disabled=!value;$('label-shutter').dataset.unavailable=String(!value);}
 function closeCamera(){cameraGeneration++;camera.close();$('label-video').pause();$('label-video').srcObject=null;$('label-camera-panel').hidden=true;capturing=false;ready(false);}
 $('label-camera-close').onclick=closeCamera;
 $('label-video').onloadeddata=()=>{if($('label-video').srcObject&&!capturing){ready(true);$('label-camera-status').textContent='对准整张营养成分表，文字清晰后拍照。';}};
 $('label-camera').onclick=async()=>{
  if(saving)return;
  closeCamera();
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){status('当前浏览器或地址不能直接打开相机。请使用 HTTPS（本机 localhost / 127.0.0.1 也可），或上传照片；手机通过局域网 HTTP 地址访问时需改用 HTTPS。');return;}
  await cancel();const current=++cameraGeneration;
  $('label-camera-panel').hidden=false;$('label-camera-status').textContent='请允许浏览器访问相机，也可随时关闭。';status('相机照片仅在本机识别。');
  try{const stream=await camera.open();if(!stream||current!==cameraGeneration)return;
   $('label-video').srcObject=stream;await $('label-video').play();
  }catch(error){if(current!==cameraGeneration)return;closeCamera();
   status(({NotAllowedError:'未获得相机权限，请在浏览器网站权限中允许相机后重试。',NotFoundError:'没有找到摄像头，请连接摄像头或上传照片。',NotReadableError:'相机可能正被其他程序占用，请关闭占用程序后重试。'})[error.name]||'相机未能启动，请重试或上传照片。');
  }
 };
 $('label-shutter').onclick=async()=>{
  const video=$('label-video');if(capturing||!video.srcObject||video.readyState<2||!video.videoWidth)return;
  capturing=true;ready(false);const current=cameraGeneration;
  try{const canvas=document.createElement('canvas');const scale=Math.min(1,2400/Math.max(video.videoWidth,video.videoHeight));canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.95));if(current!==cameraGeneration)return;
   closeCamera();if(!blob)throw new Error('capture');await recognize(blob);
  }catch{if(current===cameraGeneration)closeCamera();status('拍照未完成，请重新打开相机或上传照片。');}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)closeCamera();});
 window.addEventListener('pagehide',closeCamera);

 function addExtra(value={name:'',amount:'',unit:'mg'}){const row=document.createElement('div');row.className='label-extra-row';
  const name=document.createElement('input');name.placeholder='如：钠、膳食纤维';name.setAttribute('aria-label','营养成分名称');name.maxLength=40;name.value=value.name;
  const amount=document.createElement('input');amount.type='number';amount.min='0';amount.step='any';amount.placeholder='含量';amount.setAttribute('aria-label','营养成分含量');amount.value=value.amount;
  const unit=document.createElement('select');unit.setAttribute('aria-label','营养成分单位');for(const text of ['g','mg','μg'])unit.add(new Option(text,text));unit.value=value.unit;
  const remove=document.createElement('button');remove.type='button';remove.textContent='移除';remove.onclick=()=>{row.remove();changed();};row.append(name,amount,unit,remove);$('label-extras').append(row);
 }
 function numeric(id){const value=$(id).value.trim();if(!value)throw new Error('请补全标签基准、能量、三大营养素和实际克数。');const n=Number(value);if(!Number.isFinite(n))throw new Error('请输入有效数值。');return n;}
 function values(){const extras=[...$('label-extras').children].map(row=>{const [name,amount,unit]=row.querySelectorAll('input,select');if(!name.value.trim()||amount.value.trim()==='')throw new Error('请补全选填营养成分，或移除空行。');return {name:name.value.trim(),amount:Number(amount.value),unit:unit.value};});
  const food=FoodSchema.parse(labelFood($('label-name').value,{basisAmount:numeric('label-basis'),basisUnit:$('label-basis-unit').value,density:$('label-basis-unit').value==='ml'?numeric('label-density'):null,energy:numeric('label-energy'),energyUnit:$('label-energy-unit').value,protein:numeric('label-protein'),fat:numeric('label-fat'),carbs:numeric('label-carbs'),extras,text:$('label-text').value.slice(0,12000),confirmedAt:new Date().toISOString()}));
  const grams=numeric('label-grams');if(grams<=0||grams>10000)throw new Error('摄入克数应大于0且不超过10000。');return {food,grams};
 }
 function preview(){try{const row=values(),n=totals([row]);$('label-preview').textContent=`本次 ${row.grams}g：${n.kcal.toFixed(2)} kcal · 蛋白质 ${n.protein.toFixed(2)}g · 脂肪 ${n.fat.toFixed(2)}g · 碳水 ${n.carbs.toFixed(2)}g`+(row.food.label.extras.length?' · '+labelExtras(row.food.label,row.grams).map(x=>`${x.name} ${x.amount.toFixed(2)}${x.unit}`).join(' · '):'');}catch(e){$('label-preview').textContent=e.issues?'请核对营养值范围和单位。':e.message;}}
 function changed(){if(saving)return;$('label-confirm').checked=false;$('label-result').textContent='';$('label-density-wrap').hidden=$('label-basis-unit').value!=='ml';$('label-density').required=$('label-basis-unit').value==='ml';preview();}
 $('label-form').addEventListener('input',e=>{if(!['label-confirm','label-remember'].includes(e.target.id))changed();});
 $('label-text').oninput=changed;$('label-basis-unit').onchange=changed;$('label-energy-unit').onchange=changed;
 function extract(){const parsed=parseLabelText($('label-text').value);for(const key of ['basisAmount','energy','protein','fat','carbs'])$(key==='basisAmount'?'label-basis':'label-'+key).value=parsed[key]??'';
  // Unrecognized basis is deliberately blank rather than assumed per100g.
  $('label-basis-unit').value=parsed.basisUnit??'g';$('label-energy-unit').value=parsed.energyUnit??'kJ';$('label-density').value='';$('label-extras').replaceChildren();parsed.extras.forEach(addExtra);changed();status(parsed.warnings.length?parsed.warnings.join(' '):'已提取标签数值，请对照照片逐项核对后记录。');
 }
 $('label-parse').onclick=extract;$('label-extra-add').onclick=()=>{if($('label-extras').children.length>=30)return;addExtra();changed();};
 async function cancel(){generation++;ocrBusy=false;if(worker){void worker.terminate();worker=null;}$('label-cancel').hidden=true;status('识别已取消，可重新上传或手动填写。');}
 $('label-cancel').onclick=cancel;
 async function recognize(file){
  if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>15*1024*1024){status('请选择不超过15MB的 JPG、PNG 或 WebP 图片；HEIC 请先转为 JPG。');return;}
  await cancel();const current=++generation;ocrBusy=true;$('label-cancel').hidden=false;$('label-confirm').checked=false;
  $('label-text').value='';extract();if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=URL.createObjectURL(file);$('label-image').src=imageUrl;$('label-image').hidden=false;
  const timeout=setTimeout(()=>{if(current===generation){void cancel();status('识别超时，请裁剪清晰的标签后重试，或手动填写。');}},90000);
  try{
   status('正在准备本地识别…');const img=new Image();img.src=imageUrl;await img.decode();if(current!==generation)return;
   if(img.naturalWidth*img.naturalHeight>50000000)throw new Error('图片尺寸过大，请先裁剪营养表区域。');
   const scale=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(img,0,0,canvas.width,canvas.height);
   const {default:Tesseract}=await import('./vendor/ocr/tesseract.esm.min.js?v=6.0.1');const {createWorker}=Tesseract;
   const created=await createWorker('chi_sim+eng',1,{workerPath:'/web/vendor/ocr/worker.min.js',corePath:'/web/vendor/ocr/core',langPath:'/web/vendor/ocr/lang',workerBlobURL:false,logger:m=>{if(current===generation)status(m.status==='recognizing text'?`正在识别 ${Math.round(m.progress*100)}%…`:'正在加载本地中英文识别组件…');}});
   if(current!==generation){await created.terminate();return;}worker=created;await worker.setParameters({preserve_interword_spaces:'1',tessedit_pageseg_mode:'6'});const result=await worker.recognize(canvas);
   if(current!==generation)return;$('label-text').value=result.data.text.slice(0,12000);extract();if(!result.data.text.trim())status('未识别到文字，请拍清晰的营养表，或手动填写。');
  }catch(e){console.warn('Local nutrition OCR failed:',e?.message);if(current===generation)status('图片识别未完成，请换清晰照片或手动填写标签。'+(e.message?.includes('图片尺寸')?e.message:''));}
  finally{clearTimeout(timeout);if(current===generation){if(worker)void worker.terminate();worker=null;ocrBusy=false;$('label-cancel').hidden=true;}}
 }
 $('label-file').onchange=e=>{closeCamera();void recognize(e.target.files?.[0]);e.target.value='';};
 $('label-form').onsubmit=async e=>{e.preventDefault();if(saving)return;try{if(!isConnected())throw new Error('请先登录。');if(ocrBusy)throw new Error('请等待识别完成，或取消识别后手动核对。');if(!$('label-confirm').checked)throw new Error('请先核对标签并勾选确认。');const row=values();saving=true;$('label-save').disabled=true;await save(row,$('label-remember').checked);$('label-confirm').checked=false;$('label-result').textContent=`已记录 ${row.food.name} ${row.grams}g，可在今天的饮食中查看或撤销。`;}catch(e){$('label-result').textContent=e.issues?'请检查标签的数值、单位与份量范围。':e.message;}finally{saving=false;$('label-save').disabled=false;}};
 const reset=()=>{closeCamera();void cancel();if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl='';$('label-image').removeAttribute('src');$('label-image').hidden=true;$('label-form').reset();$('label-extras').replaceChildren();$('label-text').value='';$('label-result').textContent='';preview();};
 reset.closeCamera=closeCamera;return reset;
}
