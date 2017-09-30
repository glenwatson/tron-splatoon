window.onload = init;

function init() {
	const boardEle = document.getElementById('board');
	const ctx = boardEle.getContext('2d');
	
	const car1 = new Car(new Position(0, 0), '#f00');
	const car2 = new Car(new Position(200, 50), '#0f0');
	
	const board = new Board(500, 500, [car1, car2]);
	
	const game = new Game(board);
	
	setInterval(function() {
		draw(game, ctx);
	}, 2000);
}



function draw(game, ctx) {
	game.draw(ctx);
}

class Game {
	constructor(board) {
		this.board = board;
	}
	
	draw(ctx) {
		ctx.fillStyle = 'gray';
		ctx.fillRect(0, 0, this.board.width, this.board.height);
		
		for (var i = 0; i < this.board.cars.length; i++) {
			var car = this.board.cars[i];
			ctx.fillStyle = car.color;
			ctx.fillRect(car.pos.x, car.pos.y, 5, 5);
		}
		
	}
}

class Board {
	constructor(width, height, cars) {
		this.width = width;
		this.height = height;
		// TODO check for same (similar?) colors
		this.cars = cars;
		// TODO: obstacles
	}
}

class SpreadingPixel {
	constructor(pos, dir, color) {
		this.pos = pos;
		this.y = y;
		this.dir = dir;
		this.color = color;
	}
}

class Car {
	constructor(pos, color) {
		this.pos = pos;
		this.color = color;
	}
}

class Position {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	
	getHash() {
		// TODO don't assume width
		return this.x * 1000 + this.y;
	}
}

//wantPositionLookup = new Map();
//wantPositionLookup.set(pos.getHash(), spreadingPixel);