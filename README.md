#slot.js  
It enables create your own slot game easily on JavaScript.

- first import three.js
- then import slot.js
- prepare your own images !! ( powers of 2 are preferred for dimensions )
- below is simple usage example

```JavaScript

var slot = new Slot();

slot.addSymbol( 'image/a.png' );
slot.addSymbol( 'image/b.png' );
slot.addSymbol( 'image/c.png' );
slot.addSymbol( 'image/rare.png', { probability : 0.1 } );
slot.addSymbol( 'image/legendary.png', { probability : 0.01 } );

var reel = [];
for( var i=0; i<3; i++ ){
  reel[i] = new Slot.Reel( slot );
  reel[i].translate( (i-1)*1.1, 0, 0 );
}

function loop(){
  slot.loop();
  requestAnimationFrame( loop );
}
requestAnimationFrame( loop );

var phase = 0;

document.onmousedown = function( _e ){
  switch(phase){
    case 0:
      for( var i=0; i<3; i++ ){
        reel[i].start();
      }
      break;
    default:
      reel[phase-1].stop();
      break;
  }
  phase = (++phase)%4;
}

slot.onWin = function(){
  alert( 'You Win !!' );
}

```

this library is created for [きりん.jp](http://きりん.jp).
