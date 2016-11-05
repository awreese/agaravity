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

	this.history = [];

	this.accumulatedForce = createVector(0, 0);
	this.shouldBeDestroyed = false;

	// public functions
	this.getRadius = function() {
		var area = this.mass / DENSITY;
		var radius = Math.sqrt(area / Math.PI);
		return radius;
	}

	this.distanceTo = function(otherThing) {
		var vectorToOther = p5.Vector.sub(this.pos, otherThing.pos);
		var dist = vectorToOther.mag();
		return dist;
	
	}
	
	this.toString = function() {
		var str = "";
		str += this.pos.toString();
		return str;
	}

	this.accumulateForce = function(force) {
		this.accumulatedForce.add(force);
	}
	
	this.toggleLocked = function() {
		this.isLocked = !this.isLocked;
	}

	this.applyAccumulatedForce = function() {
		var accelarationMag = this.accumulatedForce.mag() / this.mass;
		if (this.accumulatedForce.mag() == 0)
			accelarationMag = 0;
	
		var accelaration = this.accumulatedForce.copy();
		accelaration.normalize();
		accelaration.mult(accelarationMag);
		
		this.vel.add(accelaration);
		this.accumulatedForce.set(0, 0);
	}

	this.isCollidingWith = function(otherThing) {
		return this.distanceTo(otherThing) <= this.getRadius() + otherThing.getRadius();
	}

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
		var r = this.distanceTo(otherThing);
		var grav = GRAV * this.mass * otherThing.mass / (r * r);
		var gravVector = p5.Vector.sub(otherThing.pos, this.pos);
		gravVector.normalize();
		gravVector.mult(grav);
		return gravVector;

	}

	this.getCombinedMomentum = function(otherThing) {
		// momentum = mass * velocity
		var myMomentum = p5.Vector.mult(this.vel, this.mass);
		var theirMomentum = p5.Vector.mult(otherThing.vel, otherThing.mass);		
		var totalMomentum = p5.Vector.add(myMomentum, theirMomentum);
		return totalMomentum;
	}

	this.absorb = function (otherThing) {
		var totalMomentum = this.getCombinedMomentum(otherThing);
		this.mass += otherThing.mass;

		this.vel = p5.Vector.mult(totalMomentum, 1.0 / this.mass);

		otherThing.shouldBeDestroyed = true;
	}

	this.update = function() {
		this.updateHistory();
		this.updatePositionAndAngle();
		if (bounceEnabled)
			this.handleEdgeBounce();
	}

	this.handleEdgeBounce = function() {
		var r = this.getRadius();
		
		var h = getZoomedHeight();
		var w = getZoomedWidth();

		// bounce the balls off the edges of the play area
		if (this.pos.x - r <= 0 && this.vel.x < 0)
			this.vel.x *= -BOUNCE_FACTOR;
		if (this.pos.x >= w - r && this.vel.x > 0)
			this.vel.x *= -BOUNCE_FACTOR;
		if (this.pos.y - r <= 0 && this.vel.y < 0)
			this.vel.y *= -BOUNCE_FACTOR;
		if (this.pos.y >= h - r && this.vel.y > 0)
			this.vel.y *= -BOUNCE_FACTOR;
	}

	this.updatePositionAndAngle = function() {
		if (!this.isLocked) {
			this.pos.add(p5.Vector.mult(this.vel, TIME_SCALE));
			this.angle += this.angularVelocity * TIME_SCALE;
		}
	}
	
	this.updateHistory = function() {
		if (SHOW_HISTORY) { // Only calculate if showing history
			this.history.unshift(this.pos.copy());
			if (this.history.length > HISTORY_LENGTH) {
				this.history.pop();
			}
		} else {
			this.history.length = 0;
		}
	}
	
	this.show = function () {
		this.showHistory();
		this.showBody();
	}

	this.showBody = function() {
		var radius = Math.floor(this.getRadius());
		var r_indicator = radius * (1 - INDICATOR_SIZE_RATIO);

		push();
			translate(this.pos.x, this.pos.y);
			rotate(this.angle);

			// draw large "orbit" disc
			push();
				var gsl = 128;
				
				var gradientLevels = 20;
				
				var alpha = 0.5;
				var k = 0.88;

				noStroke();

				// use gradient to create "cloud" around thing
				for (var r = 1; r <= gradientLevels; r++) {
					alpha = HISTORY_ALPHA * exp(log(k) * r);
					if (alpha <= HISTORY_ALPHA_CUTOFF_THRESHOLD) {
						break;
					}
					var diskColor = "rgba(" + gsl + "," + gsl + "," + gsl + "," + alpha + ")"
					fill(diskColor);
					ellipse(0, 0, r_indicator * (1 + float(r / gradientLevels)));
				}
				
			pop();
			
			// draw the actual "thing"
			push();
				fill(64);
				ellipse(0, 0, radius);
			pop();
			
			// draw rotation indicator
			push();
				translate(0, r_indicator);
				fill(255, 0, 0);
				ellipse(0, 0, radius * INDICATOR_SIZE_RATIO);
			pop();

			push();
				var sinComponent = (sin(frameCount / 30) + 1) / 2;
				var breathingCenterRadius = (0.5 + sinComponent * 0.5) * radius * 0.6;
				fill(200, 200, 200);
				ellipse(0, 0, breathingCenterRadius);
			pop();
		pop();
	}

	this.showHistory = function() {
		if (SHOW_HISTORY) {
			var red = 0;
			var green = 128;
			var blue = 200;
			var historyColor;

			var alpha = HISTORY_ALPHA;
			var k = 0.75;

			for (var i = 0; i < this.history.length; i++) {
				alpha = HISTORY_ALPHA * exp(log(k) * i);				
				
				if (alpha <= HISTORY_ALPHA_CUTOFF_THRESHOLD) {
					break;
				}

				// draw history disk
				push();
					historyColor = "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";

					noStroke();
					translate(this.history[i].x, this.history[i].y);
					fill(historyColor);
					ellipse(0, 0, (1 - i / this.history.length) * this.getRadius());
				pop();

			}

		}
	}

}
