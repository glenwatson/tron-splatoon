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

const CAR_SIZE = 5;

function draw(game, ctx) {
	game.tick();
	game.draw(ctx);
}

class Game {
	constructor(board) {
		this.board = board;
		this.spreadingPixels = new Map();
	}
	
	tick() {
		for (var i = 0; i < this.board.cars.length; i++) {
			var car = this.board.cars[i];
			var newPosition = car.modelMove();
			if (this.board.isOnBoard(newPosition)) {
				// move the car
				car.position = newPosition;
				// make new spreading pixels
				if (car.direction == Direction.Up || car.direction == Direction.Down) {
					const leftOfCar = car.position.modelMove(Direction.Left);
					this.spreadingPixels.set(leftOfCar,
							new SpreadingPixel(leftOfCar, Direction.Left, car.color));
					const rightOfCar = car.position.modelMove(Direction.Right);
					this.spreadingPixels.set(rightOfCar,
							new SpreadingPixel(rightOfCar, Direction.Right, car.color));
				} else if (car.direction == Direction.Left || car.direction == Direction.Right) {
					const aboveCar = car.position.modelMove(Direction.Up);
					this.spreadingPixels.set(aboveCar,
							new SpreadingPixel(aboveCar, Direction.Up, car.color));
					const belowCar = car.position.modelMove(Direction.Down);
					this.spreadingPixels.set(belowCar,
							new SpreadingPixel(belowCar, Direction.Down, car.color));
				}
			}
		}
		// spread the pixels
		for (var pixel of this.spreadingPixels.values()) {
			if (!this.board.isOnBoard(pixel.position)) {
				this.spreadingPixels.delete(pixel.position);
			} else {
				pixel.move();
			}
		}
	}
	
	draw(ctx) {
		ctx.fillStyle = 'gray';
		ctx.fillRect(0, 0, this.board.width, this.board.height);
		
		// Draw the cars.
		for (var i = 0; i < this.board.cars.length; i++) {
			var car = this.board.cars[i];
			// Draw the car.
			ctx.fillStyle = car.color;
			if (car.direction == Direction.Up) {
				ctx.fillRect(car.position.x, car.position.y, CAR_SIZE, CAR_SIZE * 2);
			} else if (car.direction == Direction.Down) {
				ctx.fillRect(car.position.x, car.position.y - CAR_SIZE, CAR_SIZE, CAR_SIZE * 2);
			} else if (car.direction == Direction.Left) {
				ctx.fillRect(car.position.x, car.position.y, CAR_SIZE * 2, CAR_SIZE);
			} else if (car.direction == Direction.Right) {
				ctx.fillRect(car.position.x - CAR_SIZE, car.position.y, CAR_SIZE * 2, CAR_SIZE);
			}
		}
		
		// Draw spreading pixels.
		for (var pixel of this.spreadingPixels.values()) {
			ctx.fillStyle = pixel.color;
			ctx.fillRect(pixel.position.x, pixel.position.y, 1, 1);
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

class Car {
	constructor(position, direction, color) {
		this.position = position;
		this.direction = direction;
		this.color = color;
	}
	
	// TODO share with SpreadingPixel
	/* Move the car in it's direction. */
	move() {
		this.position.move(this.direction);
	}
	
	// TODO share with SpreadingPixel
	/* Model where the car would end up if it moved in its direction. */
	modelMove() {
		return this.position.modelMove(this.direction);
	}
}

class SpreadingPixel {
	constructor(position, direction, color) {
		this.position = position;
		this.direction = direction;
		this.color = color;
	}

	// TODO share with Car
	/* Move the car in it's direction. */
	move() {
		this.position.move(this.direction);
	}
	
	// TODO share with Car
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