const https = require('https');
https.get('https://usealphaco.com.br/products/camiseta-oversized-hunter-azul-marinho', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const imgMatches = data.match(/https:\/\/[^\"\'\s]+\.(jpg|webp|png)/gi) || [];
    const uniqueImgs = [...new Set(imgMatches)].filter(i => i.includes('cdn/shop/files/'));
    
    let price = '149.90';
    const priceMatch = data.match(/\"price\":\s?([\d\.]+)/);
    if (priceMatch) price = priceMatch[1];
    
    console.log('Images:', uniqueImgs.slice(0, 10));
    console.log('Price:', price);
  });
});
