function broadcast( robotKey , msg ){
	for( var rob in robots ){
		if(rob == robotKey || !robots[rob].open)
			continue;
		robots[rob].worker.postMessage( msg );
	}
}

function post(worker){
    var msgargs = [];
    for(var i = 1; i < arguments.length; i++)
        msgargs.push( arguments[i] );
    worker.postMessage( message.apply(null, msgargs) );
}

function wlog(objects){
    post( self, 'log', objects );
}

function message( type ){
        
    var messages = {
	
        'init'                 : [ 'ground' , 'name' ],
        'position'             : [ 'x' , 'y' ],
        'work'                 : [ ],
        'terminate'            : [ 'x' , 'y' ],
        'change'               : [ 'x' , 'y' , 'status' ],
        'log'                  : [ 'objects' ],

		'movingTo'             : [ 'x' , 'y' ],
		'cleanMovingTo'        : [ 'x' , 'y' ],
		'workingOn'            : [ 'x' , 'y' ],
		'cleanWorkingOn'       : [ 'x' , 'y' ],
		
		'robot.position'       : [ 'robot' , 'x' , 'y' ],
		'robot.change'         : [ 'robot' , 'x' , 'y' , 'status' ],
		'robot.movingTo'       : [ 'robot' , 'x' , 'y' ],
		'robot.cleanMovingTo'  : [ 'robot' , 'x' , 'y' ],
		'robot.workingOn'      : [ 'robot' , 'x' , 'y' ],
		'robot.cleanWorkingOn' : [ 'robot' , 'x' , 'y' ]
		
    };
    
    var message = messages[type];
    var data = {};
    
    for( var args in message ){
        args = parseInt(args);
        data[ message[args] ] = arguments[args+1];
    }
    
    return { 'type' : type, 'data' : data };

}

function messageHandler( ctx, ground, robotKey, event) {

    var msg = event.data;
    var robot = robots[robotKey];

    switch( msg.type ){
    
        case 'position':
		
		    robot.lastx = robot.x
		    robot.lasty = robot.y
            robot.x = msg.data.x;
            robot.y = msg.data.y;
            
			refreshRobot( ctx, ground, robot );
			
			broadcast( robotKey, message('robot.position', robotKey, msg.data.x, msg.data.y ) ); 
			
        break;
        case 'change':

            ground[ msg.data.x ][ msg.data.y ] = msg.data.status;
		    robot.lastx = msg.data.x
		    robot.lasty = msg.data.y

			refreshRobot( ctx, ground, robot );
			
			broadcast( robotKey, message('robot.change', robotKey, msg.data.x, msg.data.y, msg.data.status ) ); 
			
        break;
        
        case 'movingTo':       broadcast( robotKey, message('robot.movingTo', robotKey, msg.data.x, msg.data.y ) ); break;
        case 'cleanMovingTo':  broadcast( robotKey, message('robot.cleanMovingTo', robotKey, msg.data.x, msg.data.y ) ); break;
        case 'workingOn':      broadcast( robotKey, message('robot.workingOn', robotKey, msg.data.x, msg.data.y ) );  break;
        case 'cleanWorkingOn': broadcast( robotKey, message('robot.cleanWorkingOn', robotKey, msg.data.x, msg.data.y ) );  break;

        case 'log': console.log( robot.name, msg, msg.data ); break;
        
        case 'terminate':
            robot.worker.terminate();
            robot.open = false;
        break;
        
    }
}
