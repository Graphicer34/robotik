var ground, robots;
var started = false, next_ground = 0;
    
var grounds = ['ground1','ground2','ground3'];

function parseText(grstr){

    ground = [], robots = {};
            
    grstr = $.trim(grstr);
    var map = { '#':Status.DIRTY , '@':Status.BRUSHED , '0':Status.CLEAN };
    var robs = { '&':'brusher.js' , '$':'cleaner.js' };
    
    var lvls = $.map( grstr.split(/\n/), function(val, i) {
        return [jQuery.trim(val).match(/(.{1,2})/g)];
    });

    var ret = Array2D(lvls[0].length, lvls.length);
    for( var j = 0; j < lvls[0].length; j++ ){
        ret[j] = [];
        for( var i = 0; i < lvls.length; i++ ){
            ret[j][i] = lvls[i][j];
        }
    }

    $.map( ret, function(val, i){
    
        ground[i] = $.map( val, function(valu, j){
            
            var robot = valu.substr(1,1);
            
            if( jQuery.trim( robot ) != '' ){
                var robotInfo = robs[robot];
                var robotNumber = ( Object.keys(robots).length + 1 );
                
                robots[ robotInfo + "." + robotNumber ] = {
                    'x': i,
                    'y': j,
                    'name' : robotNumber,
                    'script': robotInfo
                }
            }
        
            return map[valu.substr(0,1)];
        
        });
    
    });

}

function hasFinished( doWhat ){
    waitAndDo( function(){
        for( var i in robots ){
            var robot = robots[i];
            if( robot.open ){
                hasFinished( doWhat );
                return;
            }
        }
        doWhat();
    }, 5000);
}

function init(canvas, ctx){
                
    $.ajax({
        type: 'GET',
        url: 'grounds/' + grounds[next_ground],
        cache: false,
        success: function(response){

            parseText(response);

            refreshGround( ctx, ground, true );

            for( var i in robots ){

                var robot = robots[i];
                refreshRobot( ctx, ground , robot );
                
		        robots[i]['worker'] = new Worker("robots/" + robot.script);
		        robots[i].worker.robotName = i;
		        robots[i].worker.addEventListener('message', function(event) {
		            messageHandler( ctx, ground, this.robotName, event );
		        }, false );
		
		        robots[i].open = true;
		
                post( robots[i].worker, 'init', ground, i );
                post( robots[i].worker, 'position', robot.x, robot.y );
                post( robots[i].worker, 'work' );
               
            }
            
            started = true;
            
            hasFinished( function(){
            
                next_ground++;
                if(next_ground == grounds.length)
                    next_ground = 0;
                    
                init(canvas, ctx);
                
            } );
            
        }
    });
    
}

$(document).ready(function(){

    var canvas = $("#canvas")[0];
    var ctx = canvas.getContext("2d");

    $(window).resize(function(){
    
	    canvas.width  = $(document).width();
	    canvas.height = $(document).height();
	    
	    if(started){
    	    refreshGround( ctx, ground );
    	    refreshRobots( ctx, ground, robots );
	    }
	    
	}).resize();
	
    initUI(canvas, ctx);
	
});
