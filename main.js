window.onload = init;

function init() {
	const boardEle = document.getElementById('board');
	const ctx = boardEle.getContext('2d');
	
	const car1 = new Car(new Position(0, 0), Direction.Right, '#f00');
	const car2 = new Car(new Position(200, 50), Direction.Left, '#0f0');
	const car3 = new Car(new Position(200, 200), Direction.Up, '#00f');
	const car4 = new Car(new Position(50, 200), Direction.Down, '#ff0');
	
	const board = new Board(500, 500, [car1, car2, car3, car4]);
	
	const game = new Game(board);
	
	setInterval(function() {
		draw(game, ctx);
	}, 100);
}



function draw(game, ctx) {
	game.tick();
	game.draw(ctx);
}

class Game {
	constructor(board) {
		this.board = board;
	}
	
	tick() {
		for (var i = 0; i < this.board.cars.length; i++) {
			var car = this.board.cars[i];
			var newPosition = car.modelMove();
			if (this.board.isOnBoard(newPosition)) {
				car.position = newPosition;
			}
		}
	}
	
	draw(ctx) {
		ctx.fillStyle = 'gray';
		ctx.fillRect(0, 0, this.board.width, this.board.height);
		
		for (var i = 0; i < this.board.cars.length; i++) {
			var car = this.board.cars[i];
			ctx.fillStyle = car.color;
			if (car.direction == Direction.Up) {
				ctx.fillRect(car.position.x, car.position.y, 5, 10);
			} else if (car.direction == Direction.Down) {
				ctx.fillRect(car.position.x, car.position.y - 5, 5, 10);
			} else if (car.direction == Direction.Left) {
				ctx.fillRect(car.position.x, car.position.y, 10, 5);
			} else if (car.direction == Direction.Right) {
				ctx.fillRect(car.position.x - 5, car.position.y, 10, 5);
			}
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
	
	/* If the given position is on the board */
	isOnBoard(position) {
		return position.x >= 0 &&
				position.y >= 0 &&
				position.x < this.width &&
				position.y < this.height;
	}
}

class SpreadingPixel {
	constructor(position, direction, color) {
		this.position = position;
		this.direction = direction;
		this.color = color;
	}
}

class Car {
	constructor(position, direction, color) {
		this.position = position;
		this.direction = direction;
		this.color = color;
	}
	
	/* Move the car in it's direction. */
	move() {
		this.position.move(this.direction);
	}
	
	/* Model where the car would end up if it moved in its direction. */
	modelMove() {
		return this.position.modelMove(this.direction);
	}
}

class Position {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	
	/* Move in a direction */
	move(direction) {
		this.x += direction.x;
		this.y += direction.y;
	}
	
	/* Model a move in a direction */
	modelMove(direction) {
		return new Position(this.x + direction.x, this.y + direction.y);
	}
	
	getHash() {
		// TODO don't assume width
		return this.x * 1000 + this.y;
	}
}

/* Directions are special positions */
Direction = {
	Up: new Position(0, -1),
	Down: new Position(0, 1),
	Left: new Position(-1, 0),
	Right: new Position(1, 0)
};

//wantPositionLookup = new Map();
//wantPositionLookup.set(position.getHash(), spreadingPixel);