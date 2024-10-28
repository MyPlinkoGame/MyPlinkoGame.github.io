class Plinko {
    constructor() {
        this.canvas = document.getElementById('plinkoCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.money = 1000; // Starting money
        this.ballCost = 10; // Cost per ball
        
        // Adjust canvas size
        this.canvas.width = 600;  // Reduced width to fit upgrades panel
        this.canvas.height = 550; // Reduced from 650 to 550
        
        // Game properties
        this.pegs = [];
        this.balls = [];
        this.pegRadius = 5;
        this.ballRadius = 10;
        
        // Scoring zones properties
        this.scoreZones = [];
        this.zoneHeight = 60; // Increased zone height
        // Update multipliers to be more reasonable values
        this.multipliers = [40, 15, 10, 5, 2, 0.5, 0.2, 0.2, 0.2, 0.5, 2, 5, 10, 15, 40];
        
        // Upgrades state
        this.upgrades = {
            autoDrop: {
                level: 0,
                maxLevel: 3,
                cost: 500, // Base cost
                interval: null,
                dropIntervals: [2000, 1500, 1000, 500] // Speed for each level
            },
            bounciness: {
                level: 0,
                maxLevel: 3,
                cost: 1000, // Base cost
                values: [0.5, 0.7, 0.85, 1.0] // Bounciness for each level
            },
            rewardMultiplier: {
                level: 0,
                maxLevel: 3,
                cost: 2000, // Base cost
                multipliers: [1.0, 1.5, 2.0, 3.0] // Multiplier for each level
            }
        };
        
        this.initializePegs();
        this.initializeScoreZones();
        this.setupEventListeners();
        this.setupUpgradeListeners();
        this.gameLoop();
    }

    initializePegs() {
        const rows = 12;  // Reduced from 15 to 12 rows for smaller height
        const startPegs = 3;
        const spacing = 35;
        
        for (let row = 0; row < rows; row++) {
            const pegsInRow = startPegs + row;
            const rowWidth = pegsInRow * spacing;
            const startX = (this.canvas.width - rowWidth) / 2;
            
            for (let i = 0; i < pegsInRow; i++) {
                this.pegs.push({
                    x: startX + (i * spacing) + spacing/2,
                    y: (row + 1) * spacing + 30  // Reduced top offset from 50 to 30
                });
            }
        }
    }

    initializeScoreZones() {
        // Calculate zone width based on the width of the bottom row of pegs
        const bottomRowPegs = this.pegs.slice(-this.multipliers.length);
        const zoneWidth = (bottomRowPegs[1].x - bottomRowPegs[0].x) / (this.multipliers.length - 1);
        const totalWidth = zoneWidth * this.multipliers.length;
        const startX = (this.canvas.width - totalWidth) / 2;
        const lastPegY = bottomRowPegs[0].y;

        for (let i = 0; i < this.multipliers.length; i++) {
            this.scoreZones.push({
                x: startX + (i * zoneWidth),
                width: zoneWidth,
                y: lastPegY + 70, // Increased from 50 to 70 to move zones further down
                height: this.zoneHeight,
                multiplier: this.multipliers[i]
            });
        }
    }

    setupEventListeners() {
        document.getElementById('dropBall').addEventListener('click', () => {
            this.dropBall();
        });
    }

    setupUpgradeListeners() {
        document.getElementById('autoDropUpgrade').addEventListener('click', () => this.buyUpgrade('autoDrop'));
        document.getElementById('bouncinessUpgrade').addEventListener('click', () => this.buyUpgrade('bounciness'));
        document.getElementById('rewardMultiplierUpgrade').addEventListener('click', () => this.buyUpgrade('rewardMultiplier'));
    }

    buyUpgrade(type) {
        const upgrade = this.upgrades[type];
        const cost = upgrade.cost * Math.pow(2, upgrade.level); // Cost increases exponentially

        if (this.money >= cost && upgrade.level < upgrade.maxLevel) {
            this.money -= cost;
            upgrade.level++;
            document.getElementById('score').textContent = this.money.toFixed(2);
            
            // Apply upgrade effects
            if (type === 'autoDrop') {
                this.updateAutoDrop();
            }
            
            // Update button text and cost
            const button = document.getElementById(`${type}Upgrade`);
            if (upgrade.level >= upgrade.maxLevel) {
                button.disabled = true;
                button.textContent = 'MAX';
            } else {
                const nextCost = upgrade.cost * Math.pow(2, upgrade.level);
                button.textContent = `Upgrade ($${nextCost})`;
            }
        }
    }

    updateAutoDrop() {
        if (this.upgrades.autoDrop.interval) {
            clearInterval(this.upgrades.autoDrop.interval);
        }
        
        const currentSpeed = this.upgrades.autoDrop.dropIntervals[this.upgrades.autoDrop.level];
        this.upgrades.autoDrop.interval = setInterval(() => {
            if (this.money >= this.ballCost) {
                this.dropBall();
            }
        }, currentSpeed);
    }

    dropBall() {
        if (this.money >= this.ballCost) {
            this.money -= this.ballCost;
            document.getElementById('score').textContent = this.money.toFixed(2);
            this.createBall(this.canvas.width / 2);
        } else {
            alert('Not enough money to play!');
            if (this.upgrades.autoDrop.interval) {
                clearInterval(this.upgrades.autoDrop.interval);
                this.upgrades.autoDrop.interval = null;
            }
        }
    }

    createBall(x) {
        this.balls.push({
            x: x,
            y: 20,
            velocity: { x: 0, y: 0 },
            value: this.ballCost,
            scored: false
        });
    }

    update() {
        this.balls.forEach(ball => {
            // Update ball positions
            ball.velocity.y += 0.2;
            
            // Update position
            ball.x += ball.velocity.x;
            ball.y += ball.velocity.y;

            // Check collisions with pegs
            this.pegs.forEach(peg => {
                const dx = ball.x - peg.x;
                const dy = ball.y - peg.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.ballRadius + this.pegRadius) {
                    // Calculate collision normal
                    const nx = dx / distance;
                    const ny = dy / distance;

                    // Calculate relative velocity
                    const relativeVelocity = {
                        x: ball.velocity.x,
                        y: ball.velocity.y
                    };

                    // Calculate velocity along the normal
                    const normalVelocity = relativeVelocity.x * nx + relativeVelocity.y * ny;

                    // Only bounce if we're moving towards the peg
                    if (normalVelocity < 0) {
                        // Use bounciness from upgrades
                        const restitution = this.upgrades.bounciness.values[this.upgrades.bounciness.level];

                        // Calculate impulse
                        const impulse = -(1 + restitution) * normalVelocity;

                        // Apply impulse
                        ball.velocity.x += impulse * nx;
                        ball.velocity.y += impulse * ny;

                        // Add some randomness to make it more interesting
                        ball.velocity.x += (Math.random() - 0.5) * 0.8;

                        // Move ball out of collision
                        const overlap = (this.ballRadius + this.pegRadius) - distance;
                        ball.x += overlap * nx;
                        ball.y += overlap * ny;
                    }
                }
            });

            // Check ball-to-ball collisions
            for (let i = 0; i < this.balls.length; i++) {
                for (let j = i + 1; j < this.balls.length; j++) {
                    const ball1 = this.balls[i];
                    const ball2 = this.balls[j];
                    
                    const dx = ball2.x - ball1.x;
                    const dy = ball2.y - ball1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.ballRadius * 2) {
                        // Calculate collision normal
                        const nx = dx / distance;
                        const ny = dy / distance;
                        
                        // Calculate relative velocity
                        const relativeVelocityX = ball2.velocity.x - ball1.velocity.x;
                        const relativeVelocityY = ball2.velocity.y - ball1.velocity.y;
                        
                        // Calculate relative velocity in terms of normal
                        const normalVelocity = relativeVelocityX * nx + relativeVelocityY * ny;
                        
                        // Only resolve if balls are moving towards each other
                        if (normalVelocity < 0) {
                            const restitution = 0.5;
                            const impulse = -(1 + restitution) * normalVelocity;
                            
                            // Apply impulse
                            ball1.velocity.x -= impulse * nx;
                            ball1.velocity.y -= impulse * ny;
                            ball2.velocity.x += impulse * nx;
                            ball2.velocity.y += impulse * ny;
                            
                            // Move balls apart to prevent sticking
                            const overlap = (this.ballRadius * 2) - distance;
                            const moveX = (overlap * nx) / 2;
                            const moveY = (overlap * ny) / 2;
                            
                            ball1.x -= moveX;
                            ball1.y -= moveY;
                            ball2.x += moveX;
                            ball2.y += moveY;
                        }
                    }
                }
            }

            // Mark ball as missed if it hits the walls
            if (ball.x < this.ballRadius || ball.x > this.canvas.width - this.ballRadius) {
                ball.velocity.x *= -0.8;  // Keep the bounce physics
            }

            // Check for scoring
            if (ball.y > this.canvas.height - this.zoneHeight && !ball.scored) {
                const zoneIndex = this.scoreZones.findIndex(zone => 
                    ball.x >= zone.x && ball.x <= zone.x + zone.width
                );

                if (zoneIndex >= 0) {
                    const baseMultiplier = this.multipliers[zoneIndex];
                    const upgradeMultiplier = this.upgrades.rewardMultiplier.multipliers[this.upgrades.rewardMultiplier.level];
                    const winAmount = ball.value * baseMultiplier * upgradeMultiplier;
                    this.money += winAmount;
                    document.getElementById('score').textContent = this.money.toFixed(2);
                }
                ball.scored = true;
            }
        });

        // Remove balls that fall below canvas
        this.balls = this.balls.filter(ball => ball.y < this.canvas.height + this.ballRadius);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw score zones
        this.scoreZones.forEach((zone, index) => {
            // Set zone color
            let color;
            if (index < this.multipliers.length / 2) {
                color = index % 2 === 0 ? '#ff4444' : '#ff8844';
            } else {
                color = index % 2 === 0 ? '#ff8844' : '#ff4444';
            }
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            
            // Draw multiplier text
            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            
            const baseMultiplier = this.multipliers[index];
            const upgradeMultiplier = this.upgrades.rewardMultiplier.multipliers[this.upgrades.rewardMultiplier.level];
            const totalMultiplier = baseMultiplier * upgradeMultiplier;
            
            this.ctx.fillText(
                `x${totalMultiplier.toFixed(1)}`,
                zone.x + zone.width / 2,
                zone.y + zone.height / 2
            );
        });

        // Draw pegs
        this.pegs.forEach(peg => {
            this.ctx.beginPath();
            this.ctx.arc(peg.x, peg.y, this.pegRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
            this.ctx.closePath();
        });

        // Draw balls
        this.balls.forEach(ball => {
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, this.ballRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ff0';
            this.ctx.fill();
            this.ctx.closePath();
        });
    } // <-- Add this closing brace

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Plinko();
});
