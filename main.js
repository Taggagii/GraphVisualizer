window.onload = () => {
        const canvas = document.getElementById("canvas");
        
        const RADIUS = 20;
        const NEIGHBOUR_DISTANCE = 150
        const REPULSION_DISTANCE = 3 * RADIUS;
        const updateWidthHeight = () => {
                canvas.width = window.innerWidth - (window.innerWidth % (2 * RADIUS));
                canvas.height = window.innerHeight - (window.innerHeight % (2 * RADIUS));
        }

        updateWidthHeight();
        window.addEventListener("resize", updateWidthHeight)

        /** @type {CanvasRenderingContext2D} */
        const context = canvas.getContext('2d');



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

        const convertFromCoordToGridCenter = (coord) => {               
                return coord - (coord % (2 * RADIUS)) + RADIUS;
        }

        const convertFromGridCenterToGridIndex = (centerCoord) => {
                return (centerCoord - RADIUS) / (2 * RADIUS);
        }

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

        let board = [];
        let boardWidth = canvas.width / (2 * RADIUS);
        let boardHeight = canvas.height / (2 * RADIUS);
        for (let i = 0; i < boardWidth; ++i) {
                board[i] = [];
                for (let ii = 0; ii < boardHeight; ++ii) {
                        board[i][ii] = [];
                }
        }

        class Ball {
                constructor(x, y, neighbours) {
                        this.initalized = false
                        this.setCoords(x, y);
                        this.initalized = true;
                        this.N = neighbours;
                        this.isGrabbed = false;
                }

                attractNeighbours() {
                        this.N.forEach((neighbour) => {
                                const diffX = this.x - neighbour.x;
                                const diffY = this.y - neighbour.y;
                                const distance = Math.sqrt(diffX * diffX + diffY * diffY);

                                if (distance > NEIGHBOUR_DISTANCE) {
                                        let shift = distance / 50;
                                        let shiftX = (shift * diffX) / distance;
                                        let shiftY = (shift * diffY) / distance;

                                        this.setCoords(this.x - shiftX / 2, this.y - shiftY / 2)
                                        neighbour.setCoords(neighbour.x + shiftX / 2, neighbour.y + shiftY / 2)
                                }
                                
                                context.lineWidth = 1;
                                context.strokeStyle = "red";
                                const toX = neighbour.x + RADIUS * (diffX / distance);
                                const toY = neighbour.y + RADIUS * (diffY / distance);
                                const fromX = this.x - RADIUS * (diffX / distance);
                                const fromY = this.y - RADIUS * (diffY / distance);
                                
                                drawArrow(fromX, fromY, toX, toY);
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
                        context.fillStyle = "black";
                        context.arc(this.x, this.y, RADIUS, 0, 2 * Math.PI, false);
                        context.fill();
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
                                                                if (!distance) continue;
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

        let balls = [];

        const randomCoord = (max) => {
                return Math.floor(Math.random() * max);
        }

        let numberOfBalls = 25;
        for (let i = 0; i < numberOfBalls; ++i) {
                let x = randomCoord(canvas.width);
                let y = randomCoord(canvas.height);

                let div = 10;

                balls.push(new Ball(randomCoord(canvas.width), randomCoord(canvas.height), []));
        }
        

        for (let i = 0; i < balls.length; ++i) {
                for (let amount = 0; amount < 1; ++amount) {
                        let randomBallI = Math.floor(Math.random() * balls.length);
                        while (randomBallI == i || balls[i].N.includes(balls[randomBallI])) {
                                randomBallI = Math.floor(Math.random() * balls.length);
                        }
                        balls[i].N.push(balls[randomBallI])
                }
        }

        let mouse = {x: 0, y: 0, grabbed: undefined};
        canvas.addEventListener("mousedown", (event) => {
                const rect = canvas.getBoundingClientRect();

                mouse.x = event.x - rect.x;
                mouse.y = event.y - rect.y;

                for (let i = 0; i < balls.length; ++i) {
                        const diffX = mouse.x - balls[i].x;
                        const diffY = mouse.y - balls[i].y;
                        const distance = Math.sqrt(diffX * diffX + diffY * diffY)

                        if (distance < RADIUS) {
                                mouse.grabbed = balls[i];
                                balls[i].isGrabbed = true;
                        }
                }

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

        let previousTime = 0;
        const loop = (time) => {
                let dt = time - previousTime;
                if (dt > 20) {
                        console.log("dropping frames")
                }
                previousTime = time;

                for (let i = 0; i < 10; ++i) {
                        balls.forEach((ball) => {
                                ball.handleOverlap();
                        })
                }
                context.clearRect(0, 0, canvas.width, canvas.height)

                balls.forEach((ball) => {
                        ball.draw();
                })
                balls.forEach((ball) => {
                        ball.attractNeighbours();
                })

                window.requestAnimationFrame(loop);
        }
        window.requestAnimationFrame(loop);






        drawGrid();









        



        


}