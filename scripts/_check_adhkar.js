var fs = require('fs');
for (var i = 1; i <= 11; i++) {
  var p = 'lessons/adhkar/adhkar-' + i + '.html';
  try {
    var src = fs.readFileSync(p, 'utf8');
    var re = /ar" dir="rtl"><p>([^<]+)/;
    var m = re.exec(src);
    if (m) {
      var hasQM = m[1].indexOf('?') >= 0;
      if (hasQM) console.log(p + ': CORRUPT => ' + m[1].substring(0, 40));
      else console.log(p + ': OK');
    }
  } catch (e) {}
}
