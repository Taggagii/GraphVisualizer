
// CANVAS INITALIZATION
const canvas = document.getElementById("canvas");

const RADIUS = 25; // radius of the balls
const NEIGHBOUR_DISTANCE = 10 * RADIUS; // distance to attract neighbours until
const REPULSION_DISTANCE = 2 * RADIUS; // distance to detect collisions at 2 * RADIUS for normal collisions
const updateWidthHeight = () => {
        canvas.width = window.innerWidth - (window.innerWidth % (2 * RADIUS));
        canvas.height = window.innerHeight - (window.innerHeight % (2 * RADIUS));
}

updateWidthHeight();
window.addEventListener("resize", () => {
        window.location.reload();
})

/** @type {CanvasRenderingContext2D} */
const context = canvas.getContext('2d');
context.textBaseline = "middle";
context.textAlign = "center";
// ---------------------------------

// DRAWING FUNCTIONS
https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
function drawArrow(fromx, fromy, tox, toy, color = "red") {
        var headlen = RADIUS * 0.6; // length of head in pixels
        var dx = tox - fromx;
        var dy = toy - fromy;
        var angle = Math.atan2(dy, dx);
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.moveTo(fromx, fromy);
        context.lineTo(tox, toy);
        context.stroke();

        context.beginPath();
        context.fillStyle = color;
        context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        context.moveTo(tox, toy);
        context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        context.fill();
        }


const drawGrid = (gridCellSize = 2 * RADIUS) => {
        context.lineWidth = 1;
        context.strokeStyle = "black";
        for (let x = 0; x <= canvas.width; x += gridCellSize) {
                context.beginPath();
                context.moveTo(x, 0);
                context.lineTo(x, canvas.height);
                context.stroke();
        }                

        for (let y = 0; y <= canvas.height; y += gridCellSize) {
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(canvas.width, y);
                context.stroke();
        }                
}
// ---------------------------------


// GRID COLLISION INITALIZATION
const convertFromCoordToGridCenter = (coord) => {               
        return coord - (coord % (2 * RADIUS)) + RADIUS;
}

const convertFromGridCenterToGridIndex = (centerCoord) => {
        return (centerCoord - RADIUS) / (2 * RADIUS);
}


let board = [];
let boardWidth = canvas.width / (2 * RADIUS);
let boardHeight = canvas.height / (2 * RADIUS);
for (let i = 0; i < boardWidth; ++i) {
        board[i] = [];
        for (let ii = 0; ii < boardHeight; ++ii) {
                board[i][ii] = [];
        }
}
// ---------------------------------

// CLASSES
class Ball {
        static ballCount = 0;
        constructor(x, y, neighbours = []) {
                this.initalized = false;
                this.setCoords(x, y);
                this.initalized = true;
                this.N = neighbours;
                this.NColors = [];
                this.P = [];
                this.isGrabbed = false;
                this.color = "black";
                this.id = Ball.ballCount++;
                // bfs
                this.visited = false;
                this.level = -1;
                // dfs 
                this.startingTime = -1;
                this.finishingTime = -1;
        }

        removeNeighbourColor(n) {
                this.NColors.splice(this.NColors.indexOf(this.NColors.find((mapping) => mapping[0].n == n)), 1);
        }

        addNeighbourColor(n, color) {
                this.NColors.push([getBall(n), color]);
        }

        removeNeighbour(n) {
                let neighbour = this.N.find((ball) => ball.id === n);
                this.N.splice(this.N.indexOf(neighbour), 1);
                neighbour.P.splice(neighbour.P.indexOf(this), 1);
                this.removeNeighbourColor(n);
        }

        addNeighbours(neighbours) {
                neighbours.forEach((neighbourIndex) => {
                        this.N.push(getBall(neighbourIndex));
                        getBall(neighbourIndex).P.push(this);

                })
        }

        detachNeighbours() {
                this.N.map((neighbour) => neighbour.id).forEach((n) => this.removeNeighbour(n));
        }

        detachParents() {
                this.P.forEach((parent) => parent.removeNeighbour(this.id));
        }

        detach() {
                this.detachNeighbours();
                this.detachParents();
        }

        attractNeighbours() {
                this.N.forEach((neighbour) => {
                        const diffX = this.x - neighbour.x;
                        const diffY = this.y - neighbour.y;
                        const distance = Math.sqrt(diffX * diffX + diffY * diffY);

                        if (Math.abs(distance - NEIGHBOUR_DISTANCE) > 50) {
                                if (distance - NEIGHBOUR_DISTANCE > 0) {
                                        // attract
                                        let shift = distance / 50;
                                        let shiftX = (shift * diffX) / distance;
                                        let shiftY = (shift * diffY) / distance;

                                        this.setCoords(this.x - shiftX / 2, this.y - shiftY / 2)
                                        neighbour.setCoords(neighbour.x + shiftX / 2, neighbour.y + shiftY / 2)
                                } else if (distance - NEIGHBOUR_DISTANCE < 0) {
                                        // repulse
                                        let shift = distance / 50;
                                        let shiftX = (shift * diffX) / distance;
                                        let shiftY = (shift * diffY) / distance;

                                        this.setCoords(this.x + shiftX / 2, this.y + shiftY / 2)
                                        neighbour.setCoords(neighbour.x - shiftX / 2, neighbour.y - shiftY / 2)
                                }
                        }
                })
        }

        setCoords(x = undefined, y = undefined, overrideGrabLock = false) {
                if (this.isGrabbed && !overrideGrabLock) return;

                const settingEither = (x !== undefined || y !== undefined);

                if (settingEither && this.initalized) {
                        board[this.gridIX][this.gridIY].splice(board[this.gridIX][this.gridIY].indexOf(this), 1);
                }
                
                if (x !== undefined) {
                        this.x = Math.min(Math.max(RADIUS, x), canvas.width - RADIUS);
                        if (this.x !== x) this.vx *= -1;
                        this.gridX = convertFromCoordToGridCenter(this.x);
                        this.gridIX = convertFromGridCenterToGridIndex(this.gridX)
                }
                if (y !== undefined) {
                        this.y = Math.min(Math.max(RADIUS, y), canvas.height - RADIUS);
                        if (this.y !== y) this.vy *= -1;
                        this.gridY = convertFromCoordToGridCenter(this.y);
                        this.gridIY = convertFromGridCenterToGridIndex(this.gridY)
                }

                if (settingEither) {
                        if (isFinite(this.gridIX) && isFinite(this.gridIY)) {
                                board[this.gridIX][this.gridIY].push(this);
                        } else {
                                console.log(this)
                                throw "shit we broke something"
                        }
                }
        }

        draw() {
                context.beginPath();
                context.fillStyle = this.color;

                context.arc(this.x, this.y, RADIUS, 0, 2 * Math.PI, false);
                context.fill();

                context.font = "20px Arial";
                context.strokeStyle = "white";
                context.lineWidth = 2;
                context.strokeText(this.id, this.x, this.y)

                this.N.forEach((neighbour) => {
                        let mapping = this.NColors.find((mapping) => mapping[0] === neighbour);
                        if (mapping) { 
                                this.strokeStyle = mapping[1];
                        } else {
                                this.strokeStyle = "black";
                        }

                        const diffX = this.x - neighbour.x;
                        const diffY = this.y - neighbour.y;
                        const distance = Math.sqrt(diffX * diffX + diffY * diffY);
                        context.lineWidth = 0.5;
                        const toX = neighbour.x + RADIUS * (diffX / distance);
                        const toY = neighbour.y + RADIUS * (diffY / distance);
                        const fromX = this.x - RADIUS * (diffX / distance);
                        const fromY = this.y - RADIUS * (diffY / distance);
                        drawArrow(fromX, fromY, toX, toY, this.strokeStyle);
                });
        }

        handleOverlap() {
                for (let xOffset = -1; xOffset <= 1; ++xOffset) {
                        for (let yOffset = -1; yOffset <= 1; ++yOffset) {
                                let aroundIX = this.gridIX + xOffset;
                                let aroundIY = this.gridIY + yOffset;

                                if (aroundIX < 0 || aroundIY < 0 || aroundIX >= boardWidth || aroundIY >= boardHeight) continue;

                                let aroundBallList = board[aroundIX][aroundIY];
                                if (aroundBallList.length > 0) {
                                        for (let i = 0; i < aroundBallList.length; ++i) {
                                                let aroundBall = aroundBallList[i];
                                                if (aroundBall == this) continue;

                                                const xDiff = aroundBall.x - this.x;
                                                const yDiff = aroundBall.y - this.y;
                                                let distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
                                                const overlap = REPULSION_DISTANCE - distance;
                                                
                                                if (distance < REPULSION_DISTANCE) { // overlapping
                                                        if (!distance) {
                                                                // if two balls are on top of each other we just move one up and the other down
                                                                this.setCoords(undefined, this.y - 1);
                                                                aroundBall.setCoords(undefined, aroundBall.y + 1);
                                                                continue;
                                                        }
                                                        let overlapX = (overlap * xDiff) / distance;
                                                        let overlapY = (overlap * yDiff) / distance;

                                                        this.setCoords(this.x - overlapX / 2, this.y - overlapY / 2)
                                                        aroundBall.setCoords(aroundBall.x + overlapX / 2, aroundBall.y + overlapY / 2)
                                                }


                                        }
                                }

                        }
                }
        }
}
// ---------------------------------

// GRAPH FUNCTIONS
const BFS = (s = 0) => {
        // we do a BFS from s
        getBall(s).visited = true;
        getBall(s).level = 0;
        let Q = [getBall(s)];

        while (Q.length) {
                let curBall = Q.shift();
                
                for (let i = 0; i < curBall.N.length; ++i) {
                        let neighbour = curBall.N[i];

                        if (!neighbour.visited) {
                                neighbour.visited = true;
                                neighbour.level = curBall.level + 1;
                                Q.push(neighbour);
                        }
                }
        }
}

const BFSVisual = async (s = 0) => {
        // unvisited = black
        // visited = green
        // current = blue
        // goingToVisit = red

        ballsApply((ball) => ball.setCoords(canvas.width - Math.random() * 500, canvas.height / 2)  + Math.random() * 500 - 250);

        // we do a BFS from 0
        let delay = 500;

        getBall(s).visited = true;
        getBall(s).level = 0;
        getBall(s).setCoords(RADIUS, canvas.height / 2);
        let Q = [getBall(s)];

        while (Q.length) {
                let curBall = Q.shift();
                curBall.color = "blue";

                if (curBall.N.length) {
                        await new Promise((resolve) => {
                                setTimeout(resolve, delay);
                        });
                }

                curBall.N.forEach((neighbour) => curBall.addNeighbourColor(neighbour.id, "red"))
                

                for (let i = 0; i < curBall.N.length; ++i) {
                        let neighbour = curBall.N[i];

                        if (!neighbour.visited) {
                                neighbour.visited = true;
                                neighbour.level = curBall.level + 1;
                                neighbour.color = "red";
                                Q.push(neighbour);
                        }
                }
                if (curBall.N.length) {
                        await new Promise((resolve) => {
                                setTimeout(resolve, delay);
                        });
                } else {
                        await new Promise((resolve) => {
                                setTimeout(resolve, delay / 10);
                        });
                }
                curBall.color = "green";
                curBall.N.forEach((neighbour) => {
                        curBall.removeNeighbourColor(neighbour.id)
                        neighbour.setCoords((curBall.level + 1) * NEIGHBOUR_DISTANCE,curBall.y);
                        
                });
        }

}

const removeUnreachablesFrom = (s = 0) => {
        BFS(s);
        ballsApply((i) => {
                if (!getBall(i).visited) {
                        delete(balls[i]);
                }
        }, index=true)
        ballsApply((ball) => ball.visited = false);
        ballsReindex();
}

const removeCycles = (s = 0) => {
        // we do a BFS from 0
        getBall(s).visited = true;
        let Q = [getBall(s)];

        while (Q.length) {
                let curBall = Q.shift();
                
                for (let i = 0; i < curBall.N.length; ++i) {
                        let neighbour = curBall.N[i];

                        if (!neighbour.visited) {
                                neighbour.visited = true;
                                Q.push(neighbour);
                        } else { // remove cycles
                                curBall.removeNeighbour(neighbour.id);
                                --i;
                        }
                }
        }
        ballsApply((ball) => ball.visited = false);
}

const cleanlyPlace = (s = 0) => {
        // this function doesn't really work
        getBall(s).visited = true;
        getBall(s).level = 0;
        getBall(s).setCoords(RADIUS, canvas.height / 2);
        let Q = [getBall(s)];

        while (Q.length) {
                let curBall = Q.shift();
                
                
                for (let i = 0; i < curBall.N.length; ++i) {
                        let neighbour = curBall.N[i];

                        if (!neighbour.visited) {
                                neighbour.setCoords((curBall.level + 1) * NEIGHBOUR_DISTANCE, curBall.y);
                                neighbour.visited = true;
                                neighbour.level = curBall.level + 1;
                                Q.push(neighbour);
                        }
                }
        }

        ballsApply((ball) => {
                ball.visited = false;
                ball.level = -1;
        });
}

// ---------------------------------

// INITIALIZATION
let balls = {};

const makeBall = (x, y, N) => {
        let newBall = new Ball(x, y, N);

        balls[newBall.id] = newBall;
}

const getBall = (i) => {
        if (balls.hasOwnProperty(i)) {
                return balls[i];
        } else {
                throw "Ball does not exist";
        }
}

const randomCoord = (max) => {
        return Math.floor(Math.random() * max);
}

const ballsApply = (f, index = false) => {
        Object.keys(balls).forEach((ball) => f(index ? ball : getBall(ball)));
}

const ballsReindex = () => {
        let count = 0;
        let newBalls = {};
        Object.keys(balls).forEach((ball) => {
                let tempBall = getBall(ball);
                tempBall.id = count;
                newBalls[count++] = tempBall;
        });
        Ball.ballCount = count;
        balls = newBalls;
}

// create balls
let numberOfBalls = 25;
for (let i = 0; i < numberOfBalls; ++i) {
        makeBall(randomCoord(canvas.width), randomCoord(canvas.height), [])
}

// connect neighbours
for (let i = 0; i < Object.keys(balls).length; ++i) {
        for (let amount = 0; amount < 4; ++amount) {
                let randomBallI = Math.floor(Math.random() * Object.keys(balls).length);
                while (randomBallI == i || getBall(i).N.includes(getBall(randomBallI))) {
                        randomBallI = Math.floor(Math.random() * Object.keys(balls).length);
                }
                getBall(i).addNeighbours([randomBallI])
        }
}



// we will now run DFS and keep track of starting and finishing time
const DFS = (s = 0, delta = 0) => {
        // from this ball we explore all of it's neighbours
        const cur = getBall(s);
        cur.startingTime = delta;
        ++delta;
        for (let i = 0; i < cur.N.length; ++i) {
                let neighbour = cur.N[i]
                if (!neighbour.visited) {
                        neighbour.visited = true;
                        neighbour.P.push(cur);
                        delta = DFS(neighbour.id, delta);
                }
        }
        cur.finishingTime = delta;
        ++delta;

        return delta;
}




const topicgraphicallySort = async (s = 0) => {
        DFS(0);

        let sortableBalls = [];
        for (let i = 0; i < Ball.ballCount; ++i) {
                sortableBalls.push(getBall(i));
        }

        sortableBalls.sort((a, b) => b.finishingTime - a.finishingTime);

        let newBalls = {};
        for (let i = 0; i < sortableBalls.length; ++i) {
                const ball = sortableBalls[i];
         
                await new Promise((resolve) => {
                        setTimeout(() => {
                                ball.x = i * (canvas.width / RADIUS) + RADIUS;
                                ball.y = canvas.height / 2 + (1 - ball.N.length) * RADIUS * 3;
                                ball.id = i;
                                newBalls[ball.id] = ball;

                                resolve(); 
                        }, 100);
                })
        }

        balls = newBalls;

        ballsApply((ball) => {
                ball.visited = false;
                ball.startingTime = -1;
                ball.finishingTime = -1;
        });

        for (let i = 0; i < Ball.ballCount; ++i) {
                console.log(getBall(i).id, getBall(i).N.map((ball) => ball.id));
        }
        
}

removeCycles(0);
removeUnreachablesFrom(0);

topicgraphicallySort(0); 






// cleanlyPlace(0);

// BFSVisual(0);


// ---------------------------------

// MAIN LOOP
let previousTime = 0;
const loop = (time) => {
        let dt = time - previousTime;
        if (dt > 20) {
                console.log("dropping frames")
        }
        previousTime = time;
        
        for (let i = 0; i < 10; ++i) {
                ballsApply((ball) => ball.handleOverlap());
        }
        
        context.clearRect(0, 0, canvas.width, canvas.height)
        // ballsApply((ball) => ball.attractNeighbours());
        ballsApply((ball) => ball.draw());

        window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);
// ---------------------------------


// EVENT LISTENERS
let mouse = {x: 0, y: 0, grabbed: undefined};
canvas.addEventListener("mousedown", (event) => {
        const rect = canvas.getBoundingClientRect();

        mouse.x = event.x - rect.x;
        mouse.y = event.y - rect.y;

        ballsApply((ball) => {
                const diffX = mouse.x - ball.x;
                const diffY = mouse.y - ball.y;
                const distance = Math.sqrt(diffX * diffX + diffY * diffY)

                if (distance < RADIUS) {
                        mouse.grabbed = ball;
                        ball.isGrabbed = true;
                }
        })

});

canvas.addEventListener("mouseup", (event) => {
        mouse.state = "UP";
        if (mouse.grabbed) {
                mouse.grabbed.isGrabbed = false;
                mouse.grabbed = undefined;
        }
})

canvas.addEventListener('mousemove', (event) => {
        if (mouse.grabbed) {
                const rect = canvas.getBoundingClientRect();
                let x = event.x - rect.x;
                let y = event.y - rect.y;

                mouse.grabbed.setCoords(x, y, overrideGrabLock = true);
        }
})
// ---------------------------------

