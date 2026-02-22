// simple client test script
document.getElementById('check').addEventListener('click', function(){
  fetch('/no-such-file')
    .then(function(res){
      console.log('site fetch status:', res.status);
      return res.text();
    })
    .then(function(body){
      console.log('body length', body.length);
    })
    .catch(function(err){
      console.log('fetch error', err);
    });
});
