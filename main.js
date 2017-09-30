window.onload = init;

function init() {
	const boardEle = document.getElementById('board');
	const ctx = boardEle.getContext('2d');
	
	const car1 = new Car(new Position(0, 0), Direction.Right, '#f00');
	const car2 = new Car(new Position(201, 50), Direction.Left, '#0f0');
	const car3 = new Car(new Position(201, 200), Direction.Up, '#00f');
	const car4 = new Car(new Position(50, 201), Direction.Down, '#ff0');
	
	const board = new Board(500, 500, [car1, car2, car3, car4]);
	
	const game = new Game(board);
	
	setInterval(function() {
		draw(game, ctx);
	}, 10);
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
					this.spreadingPixels.set(leftOfCar.getHash(),
							new SpreadingPixel(leftOfCar, Direction.Left, car.color));
					const rightOfCar = car.position.modelMove(Direction.Right);
					this.spreadingPixels.set(rightOfCar.getHash(),
							new SpreadingPixel(rightOfCar, Direction.Right, car.color));
				} else if (car.direction == Direction.Left || car.direction == Direction.Right) {
					const aboveCar = car.position.modelMove(Direction.Up);
					this.spreadingPixels.set(aboveCar.getHash(),
							new SpreadingPixel(aboveCar, Direction.Up, car.color));
					const belowCar = car.position.modelMove(Direction.Down);
					this.spreadingPixels.set(belowCar.getHash(),
							new SpreadingPixel(belowCar, Direction.Down, car.color));
				}
			}
		}
		// Spread the pixels.
		// Copy into a new set so we can modify the `spreadingPixels` Map.
		const takenPositions = {};
		for (var pixel of new Set(this.spreadingPixels.values())) {
			const oldPixelHash = pixel.position.getHash();
			takenPositions[oldPixelHash] = true;
			this.spreadingPixels.delete(oldPixelHash);
			const newPosition = pixel.modelMove();
			// If the new position is on the board and not taken
			if (this.board.isOnBoard(newPosition) && !takenPositions[newPosition.getHash()]) {
				pixel.position = newPosition;
				const newPixelHash = pixel.position.getHash();
				takenPositions[newPixelHash] = true;
				this.spreadingPixels.set(newPixelHash, pixel);
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

class MovingObject {
	constructor(position, direction, color) {
		this.position = position;
		this.direction = direction;
		this.color = color;
	}
	
	/* Move the object in its direction. */
	move() {
		this.position.move(this.direction);
	}
	
	/* Model where the object would end up if it moved in its direction. */
	modelMove() {
		return this.position.modelMove(this.direction);
	}
}

class Car extends MovingObject{
	constructor(position, direction, color) {
		super(position, direction, color);
	}
}

class SpreadingPixel extends MovingObject {
	constructor(position, direction, color) {
		super(position, direction, color);
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
		return this.x * 500 + this.y;
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