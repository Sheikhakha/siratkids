var fs = require('fs');
var files = [
  'lessons/adhkar/adhkar-1.html',
  'lessons/tawheed-1-2.html',
  'lessons/tawheed-2-1.html',
  'lessons/tawheed-3-1.html',
  'lessons/hadith/hadith-1.html'
];
files.forEach(function(f) {
  var src = fs.readFileSync(f, 'utf8');
  var re = /ar" dir="rtl"><p>([^<]+)/g;
  var idx = 0;
  var m;
  while ((m = re.exec(src)) !== null && idx < 2) {
    var text = m[1];
    var hasQM = text.indexOf('?') >= 0;
    console.log(f + ': ' + (hasQM ? 'CORRUPT' : 'OK') + ' => ' + text.substring(0, 60));
    idx++;
  }
});
