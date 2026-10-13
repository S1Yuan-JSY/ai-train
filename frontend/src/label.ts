import {z} from 'zod';

export const ExtraNutrientSchema=z.object({name:z.string().trim().min(1).max(40),amount:z.number().finite().nonnegative().max(1000000),unit:z.enum(['g','mg','μg'])}).strict();
export const LabelSourceSchema=z.object({basisAmount:z.number().finite().positive().max(10000),basisUnit:z.enum(['g','ml']),density:z.number().finite().positive().max(20).nullable(),energy:z.number().finite().nonnegative().max(100000),energyUnit:z.enum(['kJ','kcal']),protein:z.number().finite().nonnegative(),carbs:z.number().finite().nonnegative(),fat:z.number().finite().nonnegative(),extras:z.array(ExtraNutrientSchema).max(30),text:z.string().max(12000),confirmedAt:z.string().datetime()}).strict();
export type LabelSource=z.infer<typeof LabelSourceSchema>;

export function labelFood(name:string,raw:unknown){
 const label=LabelSourceSchema.parse(raw);
 if(!name.trim()||name.trim().length>100)throw new Error('请填写食物名称（最多100字）。');
 if(label.basisUnit==='ml'&&label.density===null)throw new Error('每毫升标签按克记录时，需要提供密度（g/ml），不能默认1ml=1g。');
 const basisGrams=label.basisAmount*(label.basisUnit==='ml'?label.density!:1);
 const factor=100/basisGrams;
 const food={name:name.trim(),protein:label.protein*factor,carbs:label.carbs*factor,fat:label.fat*factor,kcal:label.energy/(label.energyUnit==='kJ'?4.184:1)*factor,source:`包装营养标签（用户核对）· 每${label.basisAmount}${label.basisUnit}${label.basisUnit==='ml'?` · 密度${label.density}g/ml`:''} · 能量${label.energy}${label.energyUnit}`,label};
 if(food.protein+food.carbs+food.fat>100.5||food.kcal>1000)throw new Error('换算后每100g营养值超出范围，请检查份量、单位和识别结果。');
 return food;
}

export function labelExtras(label:LabelSource,grams:number){
 const basisGrams=label.basisAmount*(label.basisUnit==='ml'?label.density!:1);
 return label.extras.map(n=>({...n,amount:n.amount*grams/basisGrams}));
}

// Only recognize explicit units and one amount column. NRV percentages are never nutrient amounts.
export function parseLabelText(raw:string){
 const text=raw.normalize('NFKC').replace(/[ \t]+/g,' ').replace(/千\s*焦/g,'千焦');
 const compact=text.replace(/[ \t]/g,'');
 const basis=compact.match(/每(?:份[（(]?)?(\d+(?:\.\d+)?)\s*(毫升|ml|克|g)/i);
 const result:{basisAmount?:number;basisUnit?:'g'|'ml';energy?:number;energyUnit?:'kJ'|'kcal';protein?:number;carbs?:number;fat?:number;extras:{name:string;amount:number;unit:'g'|'mg'|'μg'}[];warnings:string[]}={extras:[],warnings:[]};
 if(basis){result.basisAmount=Number(basis[1]);result.basisUnit=/ml|毫升/i.test(basis[2])?'ml':'g';}
 else result.warnings.push('未确认标签基准，请填写每100g或每份实际克数。');
 const definitions:[string,RegExp][]=[['energy',/能量|热量|energy|calories/i],['protein',/蛋白质|protein/i],['carbs',/碳水化合物|碳水|carbohydrate/i],['fat',/^(?:总)?脂肪|^totalfat/i],['膳食纤维',/膳食纤维|dietaryfiber/i],['钠',/^钠|^sodium/i],['糖',/^(?:总)?糖|^sugars|^totalsugars/i],['饱和脂肪',/饱和脂肪|saturatedfat/i],['钙',/^钙|^calcium/i],['铁',/^铁|^iron/i]];
 for(const [key,pattern] of definitions){
  const lines=compact.split(/\r?\n/).filter(l=>pattern.test(l));
  if(lines.length!==1)continue;
  const suffix=lines[0].slice((lines[0].match(pattern)?.index??0)+(lines[0].match(pattern)?.[0].length??0));
  if(/[<>≤≥]/.test(suffix)){result.warnings.push(`${key}为范围值，请核对后填写，不能当作精确数值。`);continue;}
  const values=[...suffix.matchAll(/(-?\d+(?:\.\d+)?)\s*(千焦|千卡|大卡|kcal|kj|毫克|微克|克|mg|μg|ug|g)(?![a-z])/gi)];
  if(values.length!==1){result.warnings.push(`${key}数值或列含糊，未自动填入。`);continue;}
  const amount=Number(values[0][1]);if(amount<0)continue;
  const unit=values[0][2].toLowerCase();
  if(key==='energy'){if(!/^(千焦|千卡|大卡|kcal|kj)$/.test(unit))continue;result.energy=amount;result.energyUnit=/千焦|kj/.test(unit)?'kJ':'kcal';}
  else if(['protein','carbs','fat'].includes(key)){if(!/^(克|g)$/.test(unit))continue;(result as Record<string,unknown>)[key]=amount;}
  else if(/^(克|g|mg|毫克|μg|ug|微克)$/.test(unit))result.extras.push({name:key,amount,unit:/毫克|mg/.test(unit)?'mg':/微克|μg|ug/.test(unit)?'μg':'g'});
 }
 for(const key of ['energy','protein','carbs','fat'] as const)if(result[key]===undefined)result.warnings.push(`${({energy:'能量',protein:'蛋白质',carbs:'碳水',fat:'脂肪'})[key]}未可靠识别，请对照照片补全。`);
 return result;
}
