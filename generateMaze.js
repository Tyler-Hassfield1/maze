// JavaScript source code
var frontierList = new Array();
var neighbors = new Array();

//Generates random integer 
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Computes the surrounding frontier cells of given cell
function computeFrontier(maze, cell_row, cell_col) {
    
    //Check cell above
    if ((cell_row - 2) >= 0 && maze[cell_row - 2][cell_col] == false) {
        frontierList.push({ x: (cell_row - 2), y: (cell_col) });
        maze[cell_row - 2][cell_col] = true;
    }
    
    //Check cell below
    if ((cell_row + 2) <= maze.length - 1 && (maze[cell_row + 2][cell_col]) == false) {
        frontierList.push({ x: (cell_row + 2), y: (cell_col) });
        maze[cell_row + 2][cell_col] = true;
    }

    //Check cell left
    if ((cell_col - 2) >= 0 && maze[cell_row][cell_col - 2] == false) {
        frontierList.push({ x: (cell_row), y: (cell_col - 2) });
        maze[cell_row][cell_col - 2] = true;
    }

    //Check cell right
    if ((cell_col + 2) <= maze.length && maze[cell_row][cell_col + 2] == false) {
        frontierList.push({ x: (cell_row), y: (cell_col + 2) });
        maze[cell_row][cell_col + 2] = true;
    }
}


//Computes the surrounding neighbors of given cell
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


//Connects the pathway between current frontier cell and chosen neighbor
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

    /**
    //Check cell above
    if ((cell_row - 2) >= 0 && maze[cell_row - 2][cell_col] == true) {
        maze[cell_row - 1][cell_col] = true;
    } else if ((cell_row + 2) <= maze.length && (maze[cell_row + 2][cell_col]) == true) {
        maze[cell_row + 1][cell_col] = true;
    } else if ((cell_col - 2) >= 0 && maze[cell_row][cell_col - 2] == true) {
        maze[cell_row][cell_col - 1] = true;
    } else if ((cell_col + 2) <= maze.length && maze[cell_row][cell_col + 2] == true) {
        maze[cell_row][cell_col + 1] = true;
    }
    */
}


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
    var neighbor_row;
    var neighbor_col;
   
    //Loop through frontier list
    while (frontierList.length > 0) {
        neighbors = [];

        rand_index = randomInteger(0, frontierList.length - 1);
        computeNeighbor(maze, frontierList[rand_index].x, frontierList[rand_index].y);

        rand_neighbor = randomInteger(0, neighbors.length - 1);
        connect_path(maze, frontierList[rand_index].x, frontierList[rand_index].y, neighbors[rand_neighbor].x, neighbors[rand_neighbor].y);

        computeFrontier(maze, frontierList[rand_index].x, frontierList[rand_index].y);

        frontierList.splice(rand_index, 1);
    }
    console.log(maze);
}

var num1 = 300;
var num2 = 300;

GenerateMaze(num1, num2);