const https = require('https');

https.get('https://www.youtube.com/results?search_query=Physics+Wallah+NEET+One+Shot', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const matches = data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
    const ids = matches ? [...new Set(matches.map(m => m.split('"')[3]))] : [];
    console.log(ids.slice(0, 15));
  });
});
