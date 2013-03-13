var Status = {
	DIRTY:'DIRTY',
	BRUSHED:'BRUSHED',
	CLEAN:'CLEAN'
};

var VELOCITY_FACTOR = 0.5;
var WORK_TIME = 1000;
var MOVE_TIME = 500;
var ERROR_TIME = 1000
var ANIM_FPS = 25;
var LOOP_MAX = 3;
var ANIMATE = true; //unstable

var NEIGHBOR_CHECK_ON_STOP = false;

function Array2D( w, h ){
	var x = new Array(w);
	for (var i = 0; i < w; i++) {
		x[i] = new Array(h);
	}
	return x;
}

function isDef(check){
    return typeof check != 'undefined';
}


function waitAndDo( doWhat, howMuch ){

    if( !isDef( howMuch ) )
        howMuch = 1000;

    setTimeout( function(){
        doWhat();
    }, howMuch * VELOCITY_FACTOR );
    
}
