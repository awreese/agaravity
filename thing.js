var SIZ = 20;
var DENSITY = 100;

var INDICATOR_SIZE_RATIO = 0.1;

var GRAV = 0.01;

var MAX_RAND_VEL = 25;

var BOUNCE_FACTOR = 0.9;

var HISTORY_LENGTH = 20;
var HISTORY_ALPHA = 0.5;
var HISTORY_ALPHA_CUTOFF_THRESHOLD = 0.05;
var SHOW_HISTORY = true;
var SHOW_PARTICLES = false;


function ThingParticleSystem(parent) {
    ParticleSystem.call(this);
    this.parent = parent;
};

ThingParticleSystem.prototype = Object.create(ParticleSystem.prototype);
ThingParticleSystem.prototype.constructor = ThingParticleSystem;

ThingParticleSystem.prototype.addParticle = function() {
    // ParticleSystem.prototype.addParticle.call(this, this.parentThing.pos);
    particle = new ThingParticle(this.parent.pos.copy());
    this.particles.push(particle);
};

function ThingParticle(position) {
	Particle.call(this, position.copy());
};

ThingParticle.prototype = Object.create(Particle.prototype);
ThingParticle.prototype.constructor = Particle;

ThingParticle.prototype.display = function() {
	push();
	var c = 255.0 - this.lifespan;
	stroke(c, c, c, this.lifespan);
	strokeWeight(random(1, 5));
	point(this.position.x, this.position.y);
	pop();
};


/* Notes
*	-rotational inertia for a disk, I = 0.5 * m * r * r 
*	-rotational momentu, L = I * angular_velocity
*
*	This is just a change to test my git settings - rocne 10/4/2016
*/

function thing(mass, pos, vel) {
	// fields
	this.angle = 0;
	this.angularVelocity = 0.1;
	this.mass = mass;
	this.pos = pos;
	this.vel = vel;	
	this.isLocked = false;

	this.radius = Math.sqrt(this.mass / DENSITY / Math.PI);

	this.history = [];
	this.tps = new ThingParticleSystem(this);

	this.accumulatedForce = createVector(0, 0);
	this.shouldBeDestroyed = false;

	// public functions
	this.getRadius = function() {
		return this.radius;
	};

	this.updateRadius = function() {
		this.radius = Math.sqrt(this.mass / DENSITY / Math.PI);
	}

	// this.distanceTo = function(otherThing) {
	// 	// var vectorToOther = p5.Vector.sub(this.pos, otherThing.pos);
	// 	// var dist = vectorToOther.mag();
	// 	// return dist;
	// 	return (this.pos).dist(otherThing.pos);
	// };
	
	this.toString = function() {
		var str = "";
		str += this.pos.toString();
		return str;
	};

	this.accumulateForce = function(force) {
		this.accumulatedForce.add(force);
	};
	
	this.toggleLocked = function() {
		this.isLocked = !this.isLocked;
	};

	this.applyAccumulatedForce = function() {
		var accelarationMag = this.accumulatedForce.mag() / this.mass;
		if (this.accumulatedForce.mag() == 0)
			accelarationMag = 0;
	
		var accelaration = this.accumulatedForce.copy();
		accelaration.normalize();
		accelaration.mult(accelarationMag);
		
		this.vel.add(accelaration);
		this.accumulatedForce.set(0, 0);
	};

	this.isCollidingWith = function(otherThing) {
		return (p5.Vector.sub(this.pos, otherThing.pos)).magSq() <= (this.mass + otherThing.mass) / DENSITY / PI;
	};

	this.getGravitationalForce = function(otherThing) {
		/*
		* F = G * m_1 * m_2 / r^2, where:
		*
		*	F = total applied force
		*	G = Gravity constant
		*	m_1 = mass of first object, (this in our case)
		*	m_2 = mass of second object, (otherThing)
		*	r = distance between m_1 and m_2
		*/ 
		var gravVector = p5.Vector.sub(otherThing.pos, this.pos);
		var rSq = gravVector.magSq();
		var grav = GRAV * this.mass * otherThing.mass / rSq;
		return gravVector.normalize().mult(grav);
	};

	this.getCombinedMomentum = function(otherThing) {
		/*
		momentum = mass * velocity
		total momentum = m_1v_1 + m_2v_2
		*/
		var myMomentum = p5.Vector.mult(this.vel, this.mass);
		var theirMomentum = p5.Vector.mult(otherThing.vel, otherThing.mass);		
		var totalMomentum = p5.Vector.add(myMomentum, theirMomentum);
		return totalMomentum;
	};

	this.absorb = function(otherThing) {
		var totalMomentum = this.getCombinedMomentum(otherThing);
		this.mass += otherThing.mass; // new total mass
		this.updateRadius();

		/*
		v_after = total momentum / total mass = (m_1v_1 + m_2v_2) / (m_1 + m_2)
		*/
		this.vel = p5.Vector.div(totalMomentum, this.mass);

		otherThing.shouldBeDestroyed = true;
	};

	this.update = function() {
		this.updateHistory();
		this.updatePositionAndAngle();
		if (bounceEnabled)
			this.handleEdgeBounce();
		// this.tps.addParticle();
	};

	this.handleEdgeBounce = function() {
		var r = this.getRadius();
		
		var h = getZoomedHeight();
		var w = getZoomedWidth();

		// bounce the balls off the edges of the play area
		if (this.pos.x <= r && this.vel.x < 0) {
			this.vel = this.reflect(this.vel, createVector(1, 0));
			return;
		}
			
		if (this.pos.x >= w - r && this.vel.x > 0) {
			this.vel = this.reflect(this.vel, createVector(-1, 0));
			return;
		}
			
		if (this.pos.y <= r && this.vel.y < 0) {
			this.vel = this.reflect(this.vel, createVector(0, 1));
			return;
		}
			
		if (this.pos.y >= h - r && this.vel.y > 0) {
			this.vel = this.reflect(this.vel, createVector(0, -1));
			return;
		}
			
	};

	/*
	Reflects velocity vector v across surface normal vector n with applied restituion (i.e. some energy is lost)
	*/
	this.reflect = function(v, n) {
		// v - Restitution * v.dot(n) * n;
		return p5.Vector.sub(v, n.mult(v.copy().dot(n) * 2)).mult(BOUNCE_FACTOR);
	};

	this.updatePositionAndAngle = function() {
		if (!this.isLocked) {
			this.pos.add(p5.Vector.mult(this.vel, TIME_SCALE));
			this.angle += this.angularVelocity * TIME_SCALE;
		}
	};
	
	this.updateHistory = function() {
		if (SHOW_HISTORY) { // Only calculate if showing history
			this.history.unshift(this.pos.copy());
			if (this.history.length > HISTORY_LENGTH) {
				this.history.pop();
			}
		} else {
			this.history.length = 0;
		}
	};
	
	this.show = function () {
		// this.ps.run();
		// this.tps.run();
		this.showHistory();
		this.showBody();
	};

	this.showBody = function() {
		var radius = Math.floor(this.getRadius());
		var r_indicator = radius * (1 - INDICATOR_SIZE_RATIO);

		push();
			translate(this.pos.x, this.pos.y);

			// draw large "orbit" disc
			push();
			var gsl = 128;
			
			var gradientLevels = 20;
			
			var alpha = 0.5;
			var k = 0.88;

			// use gradient to create "cloud" around thing
			for (var r = 1; r <= gradientLevels; r++) {
				alpha = HISTORY_ALPHA * exp(log(k) * r);
				if (alpha <= HISTORY_ALPHA_CUTOFF_THRESHOLD) {
					break;
				}
				
				stroke(gsl, alpha * 255);
				strokeWeight(2 * r_indicator * (1 + float(r / gradientLevels)));
				point(0,0);
			}
			pop();
			
			// draw the actual "thing"
			push();
			stroke(64);
			strokeWeight(2 * radius);
			point(0,0);
			pop();
			
			// draw rotation indicator
			push();
			rotate(this.angle);
			translate(0, r_indicator);

			stroke(255,0,0);
			strokeWeight(2 * radius * INDICATOR_SIZE_RATIO);
			point(0,0);
			pop();

			push();
			var sinComponent = (sin(frameCount / 30) + 1) / 2;
			var breathingCenterRadius = (0.5 + sinComponent * 0.5) * radius * 0.6;
			
			stroke(200);
			strokeWeight(2 * breathingCenterRadius);
			point(0,0);
			pop();
		pop();
	};

	this.showHistory = function() {
		if (SHOW_HISTORY) {
			var historyColor = color(0, 128, 200);

			var alpha = HISTORY_ALPHA;
			var k = 0.75;

			for (var i = 0, length = this.history.length; i < length; i++) {
				alpha = HISTORY_ALPHA * exp(log(k) * i);				
				
				if (alpha <= HISTORY_ALPHA_CUTOFF_THRESHOLD) {
					break;
				}

				// draw history disk
				push();
				translate(this.history[i].x, this.history[i].y);

				stroke(red(historyColor), green(historyColor), blue(historyColor), alpha * 255);
				strokeWeight(2 * (1 - i / this.history.length) * this.getRadius());
				point(0,0);
				pop();
			}

		}
	};

}
