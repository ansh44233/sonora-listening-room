const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../api/search');

test('parses YouTube durations',()=>{
  assert.equal(api.seconds('PT4M13S'),253);
  assert.equal(api.seconds('PT1H2M9S'),3729);
  assert.equal(api.seconds('PT0S'),0);
  assert.equal(api.pretty(253),'4:13');
  assert.equal(api.pretty(3729),'1:02:09');
});
test('invalid duration is treated as zero',()=>{
  assert.equal(api.seconds('not-a-duration'),0);
  assert.equal(api.seconds(''),0);
});
function response(){
  return {headers:{},statusCode:200,body:null,setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(v){this.body=v;return this}};
}
test('rejects non-GET methods',async()=>{
  const res=response();
  await api({method:'POST',query:{}},res);
  assert.equal(res.statusCode,405);
  assert.equal(res.headers.Allow,'GET');
  assert.equal(res.body.error,'Method not allowed');
});
test('rejects empty search terms',async()=>{
  const res=response();
  await api({method:'GET',query:{q:'   '}},res);
  assert.equal(res.statusCode,400);
  assert.equal(res.body.error,'Add a search term.');
});
test('requires a server-side YouTube API key',async()=>{
  const previous=process.env.YOUTUBE_API_KEY;
  delete process.env.YOUTUBE_API_KEY;
  try{
    const res=response();
    await api({method:'GET',query:{q:'ambient music'}},res);
    assert.equal(res.statusCode,503);
    assert.match(res.body.error,/YOUTUBE_API_KEY/);
  }finally{
    if(previous!==undefined)process.env.YOUTUBE_API_KEY=previous;
  }
});
