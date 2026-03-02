const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://xgfy-czuw-092q.m2.xano.io/vault/OXY-0ZPV/CPOepi6w0Y-8ZKco1aK8yJGNHUA/Ko7nUw../Specialised+Cert+-+Empty.png';
const outputPath = path.join(__dirname, 'public', 'assets', 'specialised-cert-empty.png');

console.log('Downloading certificate image...');
console.log('URL:', url);
console.log('Output:', outputPath);

const file = fs.createWriteStream(outputPath);

https.get(url, (response) => {
  console.log('Response status:', response.statusCode);
  console.log('Response headers:', response.headers);
  
  if (response.statusCode === 200) {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log('✅ Certificate image downloaded successfully!');
    });
  } else {
    console.error('❌ Failed to download image. Status:', response.statusCode);
    file.close();
    fs.unlink(outputPath, () => {}); // Delete the file on error
  }
}).on('error', (err) => {
  console.error('❌ Download error:', err.message);
  file.close();
  fs.unlink(outputPath, () => {}); // Delete the file on error
});