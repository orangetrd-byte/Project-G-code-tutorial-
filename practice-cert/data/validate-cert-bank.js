const fs=require('fs');
const html=fs.readFileSync('practice-cert/index.html','utf8');
const data=JSON.parse(fs.readFileSync('practice-cert/data/cert-practice-bank.json','utf8'));
const issues=[];
data.questions.forEach((q,i)=>{
  if (!String(q.question||'').trim()) issues.push('Q'+(i+1)+' missing question');
  if (!Array.isArray(q.answers) || q.answers.length<2) issues.push((q.id||'Q'+(i+1))+' needs >=2 answers');
  if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index >= q.answers.length) issues.push((q.id||'Q'+(i+1))+' bad correct_index '+q.correct_index);
});
if (!html.includes('CERT_PRACTICE_BANK') || !html.includes('cert-app') || !html.includes('renderHome') || !html.includes('renderQuiz') || !html.includes('renderResult')) issues.push('HTML missing required cert UI functions');
const expectedDomainIds=[
  'nims-manual-turning-level-1',
  'nims-manual-milling-level-1',
  'nims-cnc-machining',
  'nims-measurement-materials-safety',
  'nims-grinding-level-1',
  'nims-drill-press-level-1',
  'nims-job-planning-benchwork-layout',
  'nims-cam-level-1',
  'nims-edm-plunge',
  'nims-metalforming-level-1',
  'nims-stamping-level-2',
  'nims-stamping-level-3',
  'nims-manual-milling-skills-1',
  'nims-cnc-mill-programming-setup-operations',
  'nims-moldmaking-level-2'
];
expectedDomainIds.forEach(id=>{
  if (!data.domains.find(d=>d.id===id)) issues.push('missing domain '+id);
});
data.domains.forEach((d,idx)=>{
  ['topics','exam_sections'].forEach(f=>{
    if (d[f] && (!Array.isArray(d[f]) || !d[f].length)) issues.push('domain '+(d.id||idx)+' '+f+' must be empty array if omitted');
  });
});
const out={
  issues: issues.length,
  messages: issues.length ? issues : 'none',
  seedQuestions: data.questions.length,
  seedDomains: data.domains.length,
  domainIds: data.domains.map(d=>d.id)
};
console.log(JSON.stringify(out, null, 2));
process.exit(issues.length?1:0);
