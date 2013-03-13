var size = 50;
var ground_texture, robot_side;

var images = {

    'floor':false,
	
    'dirty1':false,
    'dirty2':false,
    'dirty3':false,
	
    'trash1':false,
    'trash2':false,
    'trash3':false,
	
    'robot_brusher.js_left':false,
    'robot_brusher.js_right':false,
    'robot_cleaner.js_left':false,
    'robot_cleaner.js_right':false
	
};

function refreshGroundPiece( ctx, ground , x , y ){

    var img = images[ "floor" ];
    var pattern = ctx.createPattern(img, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(x * size, y * size, size, size);
	
	try {
	    if( ground[x][y] == Status.DIRTY || ground[x][y] == Status.BRUSHED ){
	        var img = images[ "dirty" + ground_texture[x][y] ];
		    var pattern = ctx.createPattern(img, 'repeat');
		    ctx.fillStyle = pattern;
		    ctx.fillRect(x * size, y * size, size, size);
	    }
	
	    if( ground[x][y] == Status.DIRTY ){
		    var img = images[ "trash" + ground_texture[x][y] ];
		    var pattern = ctx.createPattern(img, 'repeat');
		    ctx.fillStyle = pattern;
		    ctx.fillRect(x * size, y * size, size, size);
	    }
	} catch(error){
	    console.log("error", x, y);
	}

}

function refreshGround( ctx, ground, refreshTextures ){

    refreshTextures = !isDef(refreshTextures) ? false : refreshTextures;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    
    if(refreshTextures){
        ground_texture = Array2D(ground.length, ground[0].length);
        for( var i in ground ){
	        for( var j in ground[i] ){
                ground_texture[i][j] = Math.floor(Math.random() * 3) + 1;
	        }				
        }
    }
    
    for( var i in ground ){
	    for( var j in ground[i] ){
	        refreshGroundPiece( ctx, ground , i , j );
	    }				
    }
}

function refreshGroundPieceContourn( ctx, ground , x , y ){
    ctx.strokeStyle = "#0F0";
    ctx.strokeRect( x * size, y * size, size, size );
}

function refreshGroundContourn( ctx, ground ){
    for( var i in ground ){
	    for( var j in ground[i] ){
	        refreshGroundPieceContourn( ctx, ground , i , j );
	    }				
    }
}

function refreshRobots( ctx, ground , robots ){
    for( var i in robots )
        refreshRobot( ctx, ground, robots[i] );
}

function refreshRobotBlock( ctx, ground , robot , img , x , y , last ){
    refreshGroundPiece( ctx, ground , robot.x , robot.y );
    if( last && isDef(robot.lastx) && isDef(robot.lasty) )
        refreshGroundPiece( ctx, ground , robot.lastx , robot.lasty );
    ctx.drawImage(img, x, y);
}

function refreshRobot( ctx, ground , robot ){

    var half = size / 3;
    
	if( !isDef( robot.side ))
		robot.side = 'LEFT';
    else if( robot.x > robot.lastx )
        robot.side = 'RIGHT'
    else if( robot.x < robot.lastx )
        robot.side = 'LEFT'
    
    var img = images['robot_' + robot.script + '_' + robot.side.toLowerCase()];
    
    robot.anim = 0;
    
    var fps = ANIM_FPS;
    var sec = ( ( MOVE_TIME / 2 ) * VELOCITY_FACTOR) / fps;
    var fpsremain = fps;
    
    var draw = function() {

        setTimeout(function() {
        
            if( robot.anim > fps ) return;
        
            var x = robot.x * size;
            var y = robot.y * size;
            var lastx = robot.lastx * size;
            var lasty = robot.lasty * size;
            var currx = x;
            var curry = y;
            
            if( x != lastx ){
                if( x > lastx ){
                    currx = (((x - lastx) / fps) * robot.anim) + lastx;
                } else if( x < lastx ){
                    currx = lastx - ( ( (lastx - x) / fps) * robot.anim );
                }     
            } else if( y != lasty ){
                if( y > lasty ){
                    curry = (((y - lasty) / fps) * robot.anim) + lasty;
                } else if( y < lasty ){
                    curry = lasty - ( ((lasty - y) / fps) * robot.anim );
                }            
            }
            
            if( currx == x && currx == y )
                return;
                
            refreshRobotBlock( ctx , ground , robot , img , currx , curry , true );
                        
            robot.anim++;
            
            draw();
        
        }, sec);
        
    }
    
    if( ANIMATE ){
    //    if( robot.x == robot.lastx && robot.y == robot.lasty ){
            refreshRobotBlock( ctx , ground , robot , img , robot.x * size , robot.y * size , true );
    //    } else {
    //        draw();
    //    }
    } else {
        refreshRobotBlock( ctx , ground , robot , img , robot.x * size , robot.y * size , true );
    }
    
}

function loadResources(canvas, ctx, onFinish ){
    var total = Object.keys(images).length;
    var loaded = 0;
    for(var image in images){
        images[image] = new Image();
        images[image].onload = function() {
            if(++loaded >= total) {
                onFinish(canvas, ctx);
            }
        };
        images[image].src = 'images/' + image + '.png';
    }
}

function initUI(canvas, ctx){
    loadResources(canvas, ctx, function(canvas, ctx){
        init(canvas, ctx);
    });
}
