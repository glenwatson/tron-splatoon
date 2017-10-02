window.addEventListener('load', init);

function init() {
	const boardEle = document.getElementById('board');
	const ctx = boardEle.getContext('2d');
	
	const car1 = new Car(new Position(0, 0), Direction.Right, '#f00', '#faa');
	const car2 = new Car(new Position(499, 499), Direction.Left, '#0f0', '#afa');
	const car3 = new Car(new Position(201, 200), Direction.Up, '#00f', '#aaf');
	const car4 = new Car(new Position(50, 201), Direction.Down, '#ff0', '#ffa');
	
	const board = new Board(500, 500, [car1, car2]);//, car3, car4]);
	
	const user = new UserPlayer();

	// User input
	document.onkeydown = function (e) {
		e = e || window.event;
		switch (e.charCode || e.keyCode) {
			case 38:
				user.userDirection = Direction.Up;
				break;
			case 40:
				user.userDirection = Direction.Down;
				break;
			case 37:
				user.userDirection = Direction.Left;
				break;
			case 39:
				user.userDirection = Direction.Right;
				break;
			case 68:
				toggleDebug();
				break;
			case 83:
				toggleScore();
				break;
			case 88: //TODO remove
				startGame();
				break;
			default:
				user.userDirection = undefined;
		}
	};
	
	document.getElementById('D').addEventListener('touchstart', toggleDebug);
	document.getElementById('S').addEventListener('touchstart', toggleScore);
	document.getElementById('X').addEventListener('touchstart', startGame);
	function toggleDebug() {
		DEBUG = !DEBUG;
	}
	function toggleScore() {
		SHOW_SCORE = !SHOW_SCORE;
	}
	function startGame() {
		// Start the "game"
		game.players[1] = new FollowingCpu(1, 0);
		SHOW_SCORE = true;
		DEBUG = false;
	}
	
	// Swipe events
	const MAX_SWIPE_TIME = 1000;
	const SWIPE_DISTANCE_THRESHOLD = 100; // min distance traveled to be considered swipe
	const SWIPE_DISTANCE_RESTRAINT = 70; // maximum distance allowed at the same time in perpendicular direction
	let startX, startY, startTime;
	const touchTarget = document.getElementById('touchtarget');
	touchTarget.addEventListener('touchstart', function(e) {
		const touchData = e.changedTouches[0];
		startX = touchData.pageX;
        startY = touchData.pageY;
        startTime = new Date().getTime();
		e.preventDefault();
	}, false);
	
	touchTarget.addEventListener('touchmove', function(e) {
		// prevent scrolling
        e.preventDefault();
    }, false);
	
	touchTarget.addEventListener('touchend', function(e) {
		const elapsedTime = new Date().getTime() - startTime;
		if (elapsedTime <= MAX_SWIPE_TIME) {
			const touchData = e.changedTouches[0];
			const distX = startX - touchData.pageX;
			const distY = startY - touchData.pageY;
			if (Math.abs(distX) >= SWIPE_DISTANCE_THRESHOLD && Math.abs(distY) <= SWIPE_DISTANCE_RESTRAINT) {
				if (distX < 0) {
					//swipe right
					user.userDirection = Direction.Right;
				} else {
					//swipe left
					user.userDirection = Direction.Left;
				}
			} else if (Math.abs(distY) >= SWIPE_DISTANCE_THRESHOLD && Math.abs(distX) <= SWIPE_DISTANCE_RESTRAINT) {
				if (distY < 0) {
					//swipe down
					user.userDirection = Direction.Down;
				} else {
					//swipe up
					user.userDirection = Direction.Up;
				}
			}
		}
		e.preventDefault();
	}, false);
	
	const game = new Game(board, [user, new RandomCpu()]);
	
	setInterval(function() {
		game.tick();
		game.draw(ctx);
	}, 20);
	setInterval(function() {
		if (SHOW_SCORE)
			game.drawScore(ctx);
	}, 2000);
}

const CAR_SIZE = 5;

let DEBUG = true;
let SHOW_SCORE = false;

class UserPlayer {
	constructor() {
		this.userDirection;
	}
	
	getDirection(board) {
		return this.userDirection;
	}
}

class RandomCpu {
	getDirection(board) {
		const entropy = Math.random();
		if (entropy > .9975)
			return Direction.Up;
		if (entropy > .995)
			return Direction.Down;
		if (entropy > .9925)
			return Direction.Left;
		if (entropy > .99)
			return Direction.Right;
	}
}

class FollowingCpu {
	constructor(myIndex, carIndexToFollow) {
		this.myIndex = myIndex;
		this.carIndexToFollow = carIndexToFollow;
	}
	
	getDirection(board) {
		const myPosition = board.cars[this.myIndex].position;
		const targetCar = board.cars[this.carIndexToFollow];
		const targetPosition = targetCar.position.modelOppositeMove(targetCar.direction);
		const distX = targetPosition.x - myPosition.x;
		const distY = targetPosition.y - myPosition.y;
		if (Math.abs(distX) > Math.abs(distY)) {
			if (distX > 0) {
				return Direction.Right;
			}
			if (distX < 0) {
				return Direction.Left;
			}
		} else {
			if (distY > 0) {
				return Direction.Down;
			}
			if (distY < 0) {
				return Direction.Up;
			}
		}
	}
}

class Game {
	constructor(board, players) {
		this.board = board;
		this.players = players;
		this.spreadingPixels = new Map();
	}
	
	testTurnCar(car) {
		if (car.direction == Direction.Up) {
			car.direction = Direction.Right;
		} else if (car.direction == Direction.Right) {
			car.direction = Direction.Down;
		} else if (car.direction == Direction.Down) {
			car.direction = Direction.Left;
		} else if (car.direction == Direction.Left) {
			car.direction = Direction.Up;
		}
	}
	
	tick() {
		this.updateDirections();
		this.updateCars();
		this.spreadPixels();
	}
	
	updateDirections() {
		this.players.forEach((player, index) => {
			const direction = player.getDirection(this.board);
			if (direction && this.board.cars[index].direction != direction) {
				this.board.cars[index].direction = direction;
			}
		});
	}
	
	updateCars() {
		// Update all cars
		for (let i = 0; i < this.board.cars.length; i++) {
			let car = this.board.cars[i];
			let newPosition = car.modelMove();
			if (this.board.isOnBoard(newPosition)) {
				// move the car
				car.position = newPosition;
				// make new spreading pixels
				if (car.direction == Direction.Up || car.direction == Direction.Down) {
					const leftOfCar = car.position;
					this.spreadingPixels.set(leftOfCar.getHash(),
							new SpreadingPixel(leftOfCar, Direction.Left, car.color, car.darkerColor));
					const rightOfCar = car.position.modelMove(Direction.Right);
					this.spreadingPixels.set(rightOfCar.getHash(),
							new SpreadingPixel(rightOfCar, Direction.Right, car.color, car.darkerColor));
				} else if (car.direction == Direction.Left || car.direction == Direction.Right) {
					const aboveCar = car.position;
					this.spreadingPixels.set(aboveCar.getHash(),
							new SpreadingPixel(aboveCar, Direction.Up, car.color, car.darkerColor));
					const belowCar = car.position.modelMove(Direction.Down);
					this.spreadingPixels.set(belowCar.getHash(),
							new SpreadingPixel(belowCar, Direction.Down, car.color, car.darkerColor));
				}
			} else {
				// Turn cars
				this.testTurnCar(car);
			}
		}
	}
	
	spreadPixels() {
		// Spread the pixels.
		// Copy into a new set so we can modify the `spreadingPixels` Map.
		const takenPositions = {}; // TODO: make a Map?
		for (let pixel of new Set(this.spreadingPixels.values())) {
			const oldPixelHash = pixel.position.getHash();
			takenPositions[oldPixelHash] = pixel;
			this.spreadingPixels.delete(oldPixelHash);
			const newPosition = pixel.modelMove();
			// If the new position is on the board and not taken
			if (pixel.ttl > 0 && this.board.isOnBoard(newPosition)) {
				const blockingPixel = takenPositions[newPosition.getHash()];
				if (blockingPixel) {
					this.spreadingPixels.delete(blockingPixel.position.getHash());
				} else {
					pixel.position = newPosition;
					const newPixelHash = pixel.position.getHash();
					takenPositions[newPixelHash] = pixel;
					this.spreadingPixels.set(newPixelHash, pixel);
					pixel.ttl--;
				}
			}
		}
	}
	
	draw(ctx) {
		if (DEBUG) {
			ctx.fillStyle = 'gray';
			ctx.fillRect(0, 0, this.board.width, this.board.height);
		}
		
		this.drawCars(ctx);
		this.drawSpreadingPixels(ctx);
	}
	
	drawCars(ctx) {
		for (let i = 0; i < this.board.cars.length; i++) {
			let car = this.board.cars[i];
			// Draw the car.
			ctx.fillStyle = car.darkerColor;
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
	}
	
	drawSpreadingPixels(ctx) {
		for (let pixel of this.spreadingPixels.values()) {
			ctx.fillStyle = pixel.color;
			let oldPosition = pixel.position.modelOppositeMove(pixel.direction);
			ctx.fillRect(oldPosition.x, oldPosition.y, 1, 1);
			ctx.fillStyle = pixel.darkerColor;
			ctx.fillRect(pixel.position.x, pixel.position.y, 1, 1);
		}
	}
	
	drawScore(ctx) {
		// Update stats
		const imageData = ctx.getImageData(0, 0, 500, 500);
		const imageDataIterator = imageData.data.values();
		let current = imageDataIterator.next(); // R
		const score = [0, 0, 0, 0];
		while (!current.done) {
			if (current.value === 255) {
				current = imageDataIterator.next(); // G
				if (current.value === 255) {
					score[3] += 1;
				} else {
					score[0] += 1;
				}
				current = imageDataIterator.next(); // B
			} else {
				current = imageDataIterator.next(); // G
				if (current.value === 255) {
					score[1] += 1;
				}
				current = imageDataIterator.next(); // B
				if (current.value === 255) {
					score[2] += 1;
				}
			}
			imageDataIterator.next(); // A
			current = imageDataIterator.next(); // R
		}
		ctx.fillStyle = 'white';	
		ctx.fillRect(0, 0, 300, 23);
		ctx.fillStyle = 'black';	
		ctx.font = '20px consolas';
		ctx.fillText(score, 0, 20);
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
	constructor(position, direction, color, darkerColor) {
		this.position = position;
		this.direction = direction;
		this.color = color;
		this.darkerColor = darkerColor; // TODO calculate this
	}
	
	/* Model where the object would end up if it moved in its direction. */
	modelMove() {
		return this.position.modelMove(this.direction);
	}
}

class Car extends MovingObject{
	constructor(position, direction, color, darkerColor) {
		super(position, direction, color, darkerColor);
	}
}

class SpreadingPixel extends MovingObject {
	constructor(position, direction, color, darkerColor) {
		super(position, direction, color, darkerColor);
		this.ttl = 100;
	}
}

class Position {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	
	/* Model a move in a direction */
	modelMove(direction) {
		return new Position(this.x + direction.x, this.y + direction.y);
	}
	
	/* Model a move in the opposite direction */
	modelOppositeMove(direction) {
		return new Position(this.x - direction.x, this.y - direction.y);
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