
var camera, scene, renderer;
var geometry, material, mesh;
var controls;
var objects = [];
var raycaster;
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
// https://www.html5rocks.com/en/tutorials/pointerlock/intro/
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;


//Check if browser supports pointerlockcontrol
if (havePointerLock) {
	var element = document.body;
	var pointerlockchange = function (event) {
		if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
			controlsEnabled = true;
			controls.enabled = true;
			blocker.style.display = 'none';
		} else {
			controls.enabled = false;
			blocker.style.display = '-webkit-box';
			blocker.style.display = '-moz-box';
			blocker.style.display = 'box';
			instructions.style.display = '';
		}
	};
	var pointerlockerror = function (event) {
		instructions.style.display = '';
	};



	// Hook pointer lock state change events
	document.addEventListener('pointerlockchange', pointerlockchange, false);
	document.addEventListener('mozpointerlockchange', pointerlockchange, false);
	document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
	document.addEventListener('pointerlockerror', pointerlockerror, false);
	document.addEventListener('mozpointerlockerror', pointerlockerror, false);
	document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
	instructions.addEventListener('click', function (event) {
		instructions.style.display = 'none';

		// Ask the browser to lock the pointer
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
		if (/Firefox/i.test(navigator.userAgent)) {
			var fullscreenchange = function (event) {
				if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
					document.removeEventListener('fullscreenchange', fullscreenchange);
					document.removeEventListener('mozfullscreenchange', fullscreenchange);
					element.requestPointerLock();
				}
			};
			document.addEventListener('fullscreenchange', fullscreenchange, false);
			document.addEventListener('mozfullscreenchange', fullscreenchange, false);
			element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
			element.requestFullscreen();
		} else {
			element.requestPointerLock();
		}
	}, false);
} else {
	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}



init();
animate();



var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();



function init() {
	//Create camera, scene, and light source
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
	scene = new THREE.Scene();
	//scene.fog = new THREE.Fog(0xffffff, 0, 750);
	var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
	light.position.set(0.5, 1, 0.75);

	//Add the light and pointerlockcontrols to scene
	scene.add(light);
	controls = new THREE.PointerLockControls(camera);
	scene.add(controls.getObject());

	//Handle key events for movement
	var onKeyDown = function (event) {
		switch (event.keyCode) {
			case 38: // up
			case 87: // w
				moveForward = true;
				break;
			case 37: // left
			case 65: // a
				moveLeft = true; break;
			case 40: // down
			case 83: // s
				moveBackward = true;
				break;
			case 39: // right
			case 68: // d
				moveRight = true;
				break;
			case 32: // space
				if (canJump === true) velocity.y += 350;
				canJump = false;
				break;
		}
	};
	var onKeyUp = function (event) {
		switch (event.keyCode) {
			case 38: // up
			case 87: // w
				moveForward = false;
				break;
			case 37: // left
			case 65: // a
				moveLeft = false;
				break;
			case 40: // down
			case 83: // s
				moveBackward = false;
				break;
			case 39: // right
			case 68: // d
				moveRight = false;
				break;
		}
	};
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
	raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);



	//Geometry for floor plane 
	geometry = new THREE.PlaneGeometry(20000, 20000, 500, 500);
	geometry.rotateX(- Math.PI / 2);

	//Create pattern of floor
	for (var i = 0, l = geometry.vertices.length; i < l; i++) {
		var vertex = geometry.vertices[i];
		vertex.x += Math.random() * 20 - 10;
		vertex.y += Math.random() * 2;
		vertex.z += Math.random() * 20 - 10;
	}
	//Color floor pattern 
	for (var i = 0, l = geometry.faces.length; i < l; i++) {
		var face = geometry.faces[i];
		face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
		face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
		face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
	}
	//Mesh the geometry and material (Colors) together and add to scene
	material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);



	//START OF generateMaze.js

	var frontierList = new Array();
	var neighbors = new Array();

	//Generates random integer between min and max
	function randomInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}



	/**
	 * Returns true if the given x,y coordinate is already in the frontierList
	 * @param {any} ex - row in Maze array 
	 * @param {any} why - column in Maze array
	 */
	function includes(ex, why) {
		for (var i = 0; i < frontierList.length; i++) {
			if (frontierList[i].x == ex && frontierList[i].y == why) {
				return true;
            }
        }
    }


	/**
	 * Computes the surrounding frontier cells of given cell
	 * Frontier cell = any cell set to false that is 2 blocks away and within array 
	 * @param {any} maze
	 * @param {any} cell_row
	 * @param {any} cell_col
	 */
	function computeFrontier(maze, cell_row, cell_col) {

		//Check cell above
		if ((cell_row - 2) >= 0 && maze[cell_row - 2][cell_col] == false) {
			if (!includes((cell_row - 2), cell_col)) {
				frontierList.push({ x: (cell_row - 2), y: (cell_col) });
            }
		}

		//Check cell below
		if ((cell_row + 2) <= maze.length - 1 && (maze[cell_row + 2][cell_col]) == false) {
			if (!includes((cell_row + 2), cell_col)) {
				frontierList.push({ x: (cell_row + 2), y: (cell_col) });
            }
		}

		//Check cell left
		if ((cell_col - 2) >= 0 && maze[cell_row][cell_col - 2] == false) {
			if (!includes(cell_row, (cell_col - 2))) {
				frontierList.push({ x: (cell_row), y: (cell_col - 2) });
			}
		}

		//Check cell right
		if ((cell_col + 2) <= maze.length && maze[cell_row][cell_col + 2] == false) {
			if (!includes(cell_row, (cell_col + 2))) {
				frontierList.push({ x: (cell_row), y: (cell_col + 2) });
			}
		}
	}


	/**
	 * Computes the surrounding neighbors of given cell
	 * Neighbor = any cell set to true that is 2 blocks away wihtin array 
	 * @param {any} maze
	 * @param {any} cell_row
	 * @param {any} cell_col
	 */
	function computeNeighbor(maze, cell_row, cell_col) {

		//Check cell above
		if ((cell_row - 2) >= 0 && maze[cell_row - 2][cell_col] == true) {
			neighbors.push({ x: (cell_row - 2), y: (cell_col) });
		}

		//Check cell below
		if ((cell_row + 2) <= maze.length - 1 && (maze[cell_row + 2][cell_col]) == true) {
			neighbors.push({ x: (cell_row + 2), y: (cell_col) });
		}

		//Check cell left
		if ((cell_col - 2) >= 0 && maze[cell_row][cell_col - 2] == true) {
			neighbors.push({ x: (cell_row), y: (cell_col - 2) });
		}

		//Check cell right
		if ((cell_col + 2) <= maze.length && maze[cell_row][cell_col + 2] == true) {
			neighbors.push({ x: (cell_row), y: (cell_col + 2) });
		}
	}


	/**
	 * Connects the pathway between current frontier cell and chosen neighbor
	 * @param {any} maze
	 * @param {any} cell_row - row of origin cell 
	 * @param {any} cell_col - column of origin cell 
	 * @param {any} cell_row2 - row of neighbor to be connected
	 * @param {any} cell_col2 - column of neighbor to be connected 
	 */
	function connect_path(maze, cell_row, cell_col, cell_row2, cell_col2) {

		if (cell_row == cell_row2) {
			if (cell_col2 > cell_col) {
				maze[cell_row][cell_col + 1] = true;
			} else {
				maze[cell_row][cell_col - 1] = true;
			}
		} else if (cell_col == cell_col2) {
			if (cell_row2 > cell_row) {
				maze[cell_row + 1][cell_col] = true;
			} else {
				maze[cell_row - 1][cell_col] = true;
			}
		}

	}

	var entrance;

	/**
	 * Creates maze array and carries out prims randomized algorithm to generate maze
	 * @param {any} size_row - Number of rows in maze
	 * @param {any} size_col - Number of columns in maze
	 */
	function GenerateMaze(size_row, size_col) {

		/**
		 * Initialize 2D boolean array maze with values false
		 * False = blocked
		 * True = passage
		 * */
		var maze = new Array(size_col);
		for (i = 0; i < size_col; i++) {
			maze[i] = new Array(size_row);
		}

		for (var i = 0; i < size_row; i++) {
			for (var j = 0; j < size_col; j++) {
				maze[i][j] = false;
			}
		}


		// Select random cell and set it to true (passage)
		var cell_row = randomInteger(1, size_row - 1);
		var cell_col = randomInteger(1, size_col - 1);


		//Set random cell to true 
		maze[cell_row][cell_col] = true;


		//Create list of frontier cells
		computeFrontier(maze, cell_row, cell_col);


		var rand_index;
		var rand_neighbor;
		
		
		//Loop through frontier list until it is empty 
		while (frontierList.length > 0) {

			neighbors = [];

			//Pick random cell from frontierList and compute its neighbors 
			rand_index = randomInteger(0, frontierList.length - 1);
			computeNeighbor(maze, frontierList[rand_index].x, frontierList[rand_index].y);

			//Select random neighbor from neighbors list and connect path between it and previously chosen frontier cell 
			rand_neighbor = randomInteger(0, neighbors.length - 1);
			connect_path(maze, frontierList[rand_index].x, frontierList[rand_index].y, neighbors[rand_neighbor].x, neighbors[rand_neighbor].y);

			//Set previously chosen frontier cell to true and compute its frontier cells 
			maze[frontierList[rand_index].x][frontierList[rand_index].y] = true;
			computeFrontier(maze, frontierList[rand_index].x, frontierList[rand_index].y);

			//Remove previoulsy chosen frontier cell from list 
			frontierList.splice(rand_index, 1);
		}

		//Loop through maze array to set all outer facing rows and columns to walls
		for (var i = 0; i < maze.length; i++) {
			maze[0][i] = false;
			maze[i][0] = false;
			maze[maze.length - 1][i] = false;
			maze[i][maze.length - 1] = false;
		}

		
		//Set entrance 
		for (var i = 1; i < maze.length; i++) {
			if (maze[1][i] == true) {
				maze[0][i] = true;
				entrance = i;
				break;
			}
		}

		//Set exit
		for (var i = maze.length - 1; i > 0; i--) {
			if (maze[maze.length - 2][i] == true) {
				maze[maze.length - 1][i] = 2;
				break;
			}
		}


		return maze;
	}

	//Size of entire Maze
	var sizeX = 10;
	var sizeY = 10;
	
	var mazeArray = GenerateMaze(sizeX, sizeY);

	//Initialize new array for solution
	var solveArray = new Array(sizeX);
	for (i = 0; i < sizeX; i++) {
		solveArray[i] = new Array(sizeY);
	}

	for (var i = 0; i < sizeY; i++) {
		for (var j = 0; j < sizeX; j++) {
			solveArray[i][j] = false;
		}
	}
	
	//Set solution array equal to the generted maze 
	for (var i = 0; i < mazeArray.length; i++) {
		for (var j = 0; j < mazeArray.length; j++) {
			solveArray[i][j] = mazeArray[i][j];
		} 
	}

	//END OF generateMaze.js


	function solveMaze(solution) {
		var solved = false;
		function walk(column, row) {
			if(solution[column][row] == 2) {
				console.log("We solved the maze at (" + column + ", " + row + ")");
				solved = true;
			} else if (solution[column][row] == true && solved == false) {
				
				solution[column][row] = 9;
				if (column < solution.length - 1 && solved == false) {
					walk(column + 1, row);
				}
				if (row <= solution[column].length - 1 && solved == false) {
					walk(column, row + 1);
				}
				if (column > 0 && solved == false) {
					walk(column - 1, row);
				}
				if (row > 0 && solved == false) {
					walk(column, row - 1);
				}
			}
			
		};

		if (solved == false) {
			walk(0, entrance);
        }
		
		return solution;
	};

	solveMaze(solveArray);

	console.log(solveArray);

	//OBJECTS
	//Create geometry of boxes and set colors 
	geometry = new THREE.BoxGeometry(20, 40, 20);
	for (var i = 0, l = geometry.faces.length; i < l; i++) {
		var face = geometry.faces[i];
		face.vertexColors[0] = new THREE.Color().setHSL(3 * 0.3 + 0.5, 0.75, 3 * 0.25 + 0.75);
		face.vertexColors[1] = new THREE.Color().setHSL(3 * 0.3 + 0.5, 0.75, 3 * 0.25 + 0.75);
		face.vertexColors[2] = new THREE.Color().setHSL(3 * 0.3 + 0.5, 0.75, 3 * 0.25 + 0.75);
	}

	//Render 2D maze array with previously created boxes by looping though array and multiplying each index by size of boxes then add them to the scene
	for (var i = 0; i < mazeArray.length; i++) {
		for (var j = 0; j < mazeArray[i].length; j++) {
			if (mazeArray[i][j] == false) {
				material = new THREE.MeshPhongMaterial({ specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors });
				var mesh = new THREE.Mesh(geometry, material);
				mesh.position.x = i * 20;
				mesh.position.y = 12;
				mesh.position.z = j * 20;
				scene.add(mesh);
				material.color.setHSL(1.5, 0.75, 1);
				objects.push(mesh);
			}
		}
	}

	//Initalize WebGL renderer and attributes 
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0xffffff);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);
}



function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}


//Physics 
function animate() {
	requestAnimationFrame(animate);
	if (controlsEnabled) {
		//Configure raycaster 
		raycaster.ray.origin.copy(controls.getObject().position);
		raycaster.ray.origin.y -= 10;
		var intersections = raycaster.intersectObjects(objects);
		var isOnObject = intersections.length > 0;
		var time = performance.now();
		//Set velocity of user 
		var delta = (time - prevTime) / 1000;
		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;
		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		if (moveForward) {
			velocity.z -= 400.0 * delta;
		}
		if (moveBackward) {
			velocity.z += 400.0 * delta;
		}
		if (moveLeft) {
			velocity.x -= 400.0 * delta;
		}
		if (moveRight) {
			velocity.x += 400.0 * delta;
		}
		if (isOnObject === true) {
			velocity.y = Math.max(0, velocity.y);
			canJump = true;
		}

		controls.getObject().translateX(velocity.x * delta);
		controls.getObject().translateY(velocity.y * delta);
		controls.getObject().translateZ(velocity.z * delta);
		if (controls.getObject().position.y < 10) {
			velocity.y = 0;
			controls.getObject().position.y = 10;
			canJump = true;
		}

		prevTime = time;
	}

	renderer.render(scene, camera);
}