var Slot = function(){

  this.defaultSymbol = {
    material : null,
    probability : 1,
    name : 'default',
    isDefault : true
  };

  this.symbol = [];
  this.symbol.push( Object.create( this.defaultSymbol ) );

  this.probabilitySum = 1;

  this.reels = [];

  this.isReach = false;
  this.isWin = false;

  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );
  this.renderer = new THREE.WebGLRenderer();

  document.body.appendChild( this.renderer.domElement );

  this.camera.position.z = 5;

  this.panelGeometry = new THREE.PlaneBufferGeometry( 1, 1 );

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0 );
  directionalLight.position.set( 0, 0, 1 );
  this.scene.add( directionalLight );

  this.setSize( window.innerWidth, window.innerHeight );

  this.setCameraPosition( 0, 0, 5 );

};

Slot.prototype.loop = function(){

  for( var i=0; i<this.reels.length; i++ ){
    this.reels[i].loop();
  }

  this.renderer.render( this.scene, this.camera );

};

Slot.prototype.check = function(){

  var a = {};
  for( var i=0; i<this.reels.length; i++ ){
    var v = -1;
    if( !(this.reels[i].isMove) ){
      v = this.reels[i].symbol[6].name;
    }
    if( a[v] ){
      a[v] ++;
    }else{
      a[v] = 1;
    }
  }

  var modeV = 0;
  var modeC = 0;
  for( var v in a ){
    if( modeC < a[v] ){
      modeV = v;
      modeC = a[v];
    }
  }

  if( modeC == this.reels.length-1 && a[-1] == 1 ){
    this.reach = modeV;
    this.win = '';
    if( typeof this.onReach == 'function' ){ this.onReach( modeV ); }
  }else if( modeC == this.reels.length && !a[-1] ){
    this.reach = '';
    this.win = modeV;
    if( typeof this.onWin == 'function' ){ this.onWin( modeV ); }
  }else{
    this.reach = '';
    this.win = '';
  }

};

Slot.prototype.setCameraPosition = function( _x, _y, _z ){

  this.camera.position.set( _x, _y, _z );
  this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

};

Slot.prototype.setId = function( _id ){

  this.renderer.domElement.id = _id;

};

Slot.prototype.setSize = function( _w, _h ){

  this.camera.aspect = _w/_h;
  this.renderer.setSize( _w, _h );
  this.camera.updateProjectionMatrix();

};

Slot.prototype.getSymbol = function(){

  var dice = Math.random();
  var sum = 0;
  for( var i=0; i<this.symbol.length; i++ ){
    sum += this.symbol[i].probability/this.probabilitySum;
    if( dice < sum ){
      return this.symbol[i];
    }
  }

};

Slot.prototype.addSymbol = function( _t, _p ){

  if( this.symbol[0].isDefault ){
    this.symbol = [];
    this.probabilitySum = 0;
  }

  var texture = THREE.ImageUtils.loadTexture( _t );
  var material = new THREE.MeshPhongMaterial( { color : 0xffffff, ambient : 0xffffff, map : texture } );

  // i want more smart method of here
  var probability = _p && _p.probability ? _p.probability : 1;
  var name = _p && _p.name ? _p.name : _t;

  var symbol = {
    material : material,
    probability : probability,
    name : name
  };

  this.symbol.push( symbol );
  this.probabilitySum += probability;

};

Slot.prototype.getReelAtMouse = function( _e ){

  // thanks : http://qiita.com/edo_m18/items/5aff5c5e4f421ddd97dc

  var rect = _e.target.getBoundingClientRect();
  var mousex = _e.clientX-rect.left;
  var mousey = _e.clientY-rect.top;

  var x = (mousex/window.innerWidth)*2-1;
  var y = -(mousey/window.innerHeight)*2+1;

  var pos = new THREE.Vector3( x, y, 1 );
  pos.unproject( this.camera );

  var ray = new THREE.Raycaster( this.camera.position, pos.sub( this.camera.position ).normalize() );

  var obj = ray.intersectObjects( this.scene.children, true )[0];

  if( obj && obj.object && obj.object.reel ){
    return obj.object.reel;
  }else{
    return null;
  }
};

Slot.prototype.onReach = null;

Slot.prototype.onWin = null;

// ----------------

Slot.Reel = function( _slot ){

  this.slot = _slot;

  this.isMove = false;

  this.position = 0;
  this.velocity = 0;
  this.accel = 0;
  this.resist = 1.1;

  this.symbol = [];
  for( var i=0; i<12; i++ ){
    this.symbol[i] = this.slot.getSymbol();
  }

  this.model = new THREE.Object3D();
  for( var i=0; i<12; i++ ){
    var panel = new THREE.Mesh( this.slot.panelGeometry, this.symbol[i].material );

    panel.position.z += Math.cos(Math.PI/6*(i-6))*1.88;
    panel.position.y += -Math.sin(Math.PI/6*(i-6))*1.88;
    panel.rotation.x += Math.PI/6*(i-6);

    panel.reel = this;

    this.model.add( panel );
  }

  this.model.reel = this;
  this.slot.scene.add( this.model );

  this.light = new THREE.SpotLight( 0x7f7f7f, 1.6, 0, 1000, 40 );
  this.light.position.set( 0, 0, 4 );
  this.light.target = this.model;
  this.slot.scene.add( this.light );

  this.slot.reels.push( this );

};

Slot.Reel.prototype.loop = function(){

  this.velocity += this.accel;
  this.velocity /= this.resist;
  this.position += this.velocity;

  if( 1 <= this.position ){
    this.position = this.position%1;
    this.symbol.pop();
    this.symbol.unshift( this.slot.getSymbol() );

    for( var i=0; i<12; i++ ){
      this.model.children[i].material = this.symbol[i].material;
    }
  }

  if( this.position < 0 ){
    this.position = this.position%1;
    this.symbol.push();
    this.symbol.shift( this.slot.getSymbol() );

    for( var i=0; i<12; i++ ){
      this.model.children[i].material = this.symbol[i].material;
    }
  }

  this.model.rotation.x = this.position*Math.PI/6;

};

Slot.Reel.prototype.translate = function( _x, _y, _z ){

  this.model.position.set( _x, _y, _z );
  this.light.position.set( _x, _y, _z+4 );
  this.light.target = this.model;

};

Slot.Reel.prototype.start = function(){

  this.isMove = true;

  this.accel = 0.04;

  this.light.intensity = 0.8;

};

Slot.Reel.prototype.stop = function(){

  this.isMove = false;

  this.accel = 0;
  this.velocity = 0;
  this.position = Math.round(this.position);

  if( 1 == this.position ){
    this.position = 0;
    this.symbol.pop();
    this.symbol.unshift( this.slot.getSymbol() );

    for( var i=0; i<12; i++ ){
      this.model.children[i].material = this.symbol[i].material;
    }
  }

  this.light.intensity = 1.6;

  this.slot.check();

};

Slot.Reel.prototype.setLightColor = function( _r, _g, _b ){

  this.light.color = new THREE.Color( _r, _g, _b );

};
