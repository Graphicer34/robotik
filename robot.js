var status = {
	x: 0,
	y: 0,
	lastx: 0,
	lasty: 0,
	loopDetector: 0,
	ground: [],
	robots: {},
	getGround: function(){
	    return this.ground[this.x][this.y];
	}
};

var posits = [
	[  0 ,  0 ], [  0 ,  1 ],
	[  0 , -1 ], [  1 ,  0 ],
	[ -1 ,  0 ], [ -1 ,  1 ],
	[ -1 , -1 ], [  1 ,  1 ],
	[  1 , -1 ]
];

self.onmessage = function(event) {

	var msg = event.data;
	
	switch( msg.type ){
	
		case 'init':
			status.ground = msg.data.ground;
			status.name = msg.data.name;
		break;
		case 'position':
			status.x = msg.data.x;
			status.y = msg.data.y;
			post(self, 'position', status.x, status.y );
		break;
		case 'work':
            work();
		break;
		
		case 'robot.position':
			var data = msg.data;
			status.robots[data.robot] = status.robots[data.robot] || {};
			status.robots[data.robot].x = data.x;
			status.robots[data.robot].y = data.y;
		break;
		
		case 'robot.change':
			var data = msg.data;
			status.ground[data.x][data.y] = data.status;		
		break;
		
		case 'robot.movingTo':
			var data = msg.data;
			status.robots[data.robot] = status.robots[data.robot] || {};
			status.robots[data.robot].movingTo = { 'x' : data.x, 'y' : data.y };
		break;
		
		case 'robot.cleanMovingTo':
			var data = msg.data;
			status.robots[data.robot] = status.robots[data.robot] || {};
			status.robots[data.robot].movingTo = false;
			status.robots[data.robot].x = data.x;
			status.robots[data.robot].y = data.y;
		break;
		
		case 'robot.workingOn':
			var data = msg.data;
			status.robots[data.robot] = status.robots[data.robot] || {};
			status.robots[data.robot].workingOn = { 'x' : data.x, 'y' : data.y };
		break;
		
		case 'robot.cleanWorkingOn':    
			var data = msg.data;
			status.robots[data.robot] = status.robots[data.robot] || {};
			status.robots[data.robot].workingOn = false;
			status.robots[data.robot].x = data.x;
			status.robots[data.robot].y = data.y;
		break;
		
	}

};

function distance( status, x2, y2 ){
    return Math.abs(status.x-x2) + Math.abs(status.y-y2);
}

function position( x , y ){
    return { 'x' : x, 'y' : y };
}

function distance2D( status, x, y ){
    return { 'x' : status.x - x, 'y' : status.y - y };
}

function direction2D( status, x, y ){
    var dist = distance2D( status, x, y );
    return { 'x' : dist.x == 0 ? 0 : ( dist.x < 0 ? 1 : -1 ),
             'y' : dist.y == 0 ? 0 : ( dist.y < 0 ? 1 : -1 ) };
}

function isVisited( visited , x , y ){
	return visited[x][y] == 1;
}

function positionExists( x , y ){
	return x >= 0 && y >= 0 && isDef( status.ground[x] ) && isDef( status.ground[x][y] );
}

function robotInThere( x, y ){
	for( var rob in status.robots ){
		var inThere = status.robots[rob].x == x && status.robots[rob].y == y;
		if(inThere){
			return true;
		}
	}
	return false;
}

function robotIsWorkingThere( x, y ){
	for( var rob in status.robots ){
	
		if( typeof status.robots[rob].workingOn == 'undefined' || status.robots[rob].workingOn == false )
			continue;
	
		var isWorkingOn = status.robots[rob].workingOn.x == x && status.robots[rob].workingOn.y == y;
		if(isWorkingOn){
			return true;
		}
		
	}
	return false;
}

function robotIsMovingToThere( x, y ){
	for( var rob in status.robots ){
	
		if( typeof status.robots[rob].movingTo == 'undefined' || status.robots[rob].movingTo == false )
			continue;
	
	    var robot = status.robots[rob];
		var isMovingTo = robot.movingTo.x == x && robot.movingTo.y == y;
		if( isMovingTo ){
			return distance(robot, x, y) < distance(status, x, y);
		}
		
	}
	return false;
}

function hasNeighbor( x, y ){

	for( var i in posits ){

		var pos = { 'x': x + posits[i][0] , 'y': y + posits[i][1] };
		
		if( ! positionExists( pos.x , pos.y ) )
			continue;

        var hasRobot = robotInThere(pos.x , pos.y) || robotIsWorkingThere(pos.x , pos.y);
		if( hasRobot ){
			return true;
		}
		
	}
	
	return false;
}

function work( finalize ){

    var finalize = isDef(finalize) && finalize; 
    
    var lookFor = finalize ? Status.CLEAN : status.lookFor;
    
    var checkForPositionWithNoNeighbors = finalize;
    var visitedPositions = Array2D(status.ground.length, status.ground[0].length);
    var iteration = 0;
    
    var next = findNextToClean( lookFor, status.x, status.y, visitedPositions, iteration, checkForPositionWithNoNeighbors );
        
    if( next ){

		post(self, 'movingTo', next.x, next.y);
		
		var onerror = function(){
			post(self, 'cleanMovingTo', status.x, status.y);
    		waitAndDo(function(){ work(); }, ERROR_TIME);
		};
		
		var onfinish = function(){
		
			post(self, 'cleanMovingTo', status.x, status.y);
			
            if(status.getGround() == status.lookFor){
                ( !finalize ) && changeGroundStatusOf(status.x, status.y, status.changeTo, status, function(){
                    work();
                });
            } else {
                work();
            }

        };
        
        var breakLoopOnFounded = distance(status, next.x, next.y) == 0 && finalize;

        if( ! breakLoopOnFounded ){
            moveTo( next.x, next.y, onfinish, onerror );
        } else {
			post( self, 'terminate', status.x, status.y );
        }
		
    } else {
    
        work( true );
        
    }
    
}

function findNextToClean( lookForStatus, x, y, visited, iteration, dontHasNeighbor ){
	
	var size = status.ground.length * status.ground[0].length;
	
	visited[x][y] = 1;

	for( var i in posits ){

		var pos = { 'x': x + posits[i][0] , 'y': y + posits[i][1] };
		
		if( ! positionExists( pos.x , pos.y ) )
			continue;

        var neighborCheck = dontHasNeighbor && NEIGHBOR_CHECK_ON_STOP ? !hasNeighbor(pos.x , pos.y) : true;
        var noRobot = !robotInThere(pos.x , pos.y) && !robotIsWorkingThere(pos.x , pos.y);
		if( status.ground[ pos.x ][ pos.y ] == lookForStatus && noRobot && neighborCheck ){
			return { 'x' : pos.x , 'y' : pos.y };
		}
		
	}
	
	iteration++;
	
	if(iteration < size){
		for( var i in posits ){
    		var pos = { 'x': x + posits[i][0] , 'y': y + posits[i][1] };    		
			if( positionExists( pos.x , pos.y ) && !isVisited( visited, pos.x , pos.y ) ){
				var next = findNextToClean( lookForStatus, pos.x , pos.y, visited, iteration, dontHasNeighbor );
				if( next != false ){
					return next;
				}				
			}
		}
	}
	
	return false;

}

function moveTo( x, y, onfinish, onerror ){

    waitAndDo( function(){
    
		if(!positionExists( x , y ) || robotIsMovingToThere( x, y ) || robotIsWorkingThere( x, y ) || robotInThere( x, y ) ){
    	    if(isDef(onerror)) onerror();
			return;
		}
		
		var robotInX = false;
		var robotInY = false;
		
        var direc = direction2D( status, x, y );
    
        if( direc.x != 0 ){
        
            robotInX = robotInThere( status.x + direc.x, status.y );
            
            if(!robotInX){
                status.lastx = status.x;
                status.x += direc.x;
                post( self, 'position', status.x, status.y );
                moveTo( x, y, onfinish, onerror );
                return;
            }
            
        }
        
        if( direc.y != 0 ){
        
            var robotInY = robotInThere( status.x, status.y + direc.y );
            
            if(!robotInY){
                status.lasty = status.y;
                status.y += direc.y;
                post( self, 'position', status.x, status.y );
                moveTo( x, y, onfinish, onerror );
                return;
            }
            
        }
        
        if( status.y != y || status.x != x ){

            if( status.loopDetector >= LOOP_MAX ){
                status.loopDetector = 0;
                onerror();
                return;
            }

            var backToTheHighway = function(){
                moveTo( x, y, onfinish, onerror );
            }
        
            if( robotInY ){
               avoidRobotsInAxys('y', backToTheHighway, onerror);
            } else if( robotInX ){
               avoidRobotsInAxys('x', backToTheHighway, onerror);
            }

            return;
        }
        
        if( typeof onfinish != 'undefined' )
            onfinish();
        
    }, MOVE_TIME );
    
}

function avoidRobotsInAxys( axis , backToTheHighway, onerror ){

    var inc = [-1, 1][Math.round( Math.random() )];
    var direc = position( axis == 'x' ? inc : 0 , axis == 'y' ? inc : 0 );

    while( robotInThere( status.x + direc.x, status.y + direc.y ) ){
        direc[axis] += inc;
        if( ! positionExists( status.x + direc.x , status.y + direc.y ) ){
            inc *= -1;
            direc = position( axis == 'x' ? inc : 0 , axis == 'y' ? inc : 0 );
        }

    }

    var move = position( status.x + direc.x , status.y + direc.y );    
    if( move[axis] == status['last' + axis] ){
        status.loopDetector++ ;
    }

    moveTo( move.x, move.y , backToTheHighway, onerror );
    
}

function changeGroundStatusOf( x, y, groundStatus, robotStatus, onfinish ){
	post( self, 'workingOn', x, y );
    waitAndDo( function(){
        robotStatus.ground[x][y] = groundStatus;
        post( self, 'change', x, y, groundStatus );
		post( self, 'cleanWorkingOn', x, y );
        if( typeof onfinish != 'undefined' )
            onfinish();
    }, WORK_TIME );
}
