function toRupiah(angka) {
  var saldo = '';
  var angkarev = angka.toString().split('').reverse().join('');
  
  for (var i = 0; i < angkarev.length; i++) {
    if (i % 3 == 0 && i !== 0) saldo += '.';  // Add dot after every 3 digits, except at the start
    saldo += angkarev[i];
  }
  return '' + saldo.split('').reverse().join('');
}

module.exports = toRupiah;
