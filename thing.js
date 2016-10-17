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
	this.mass = mass; //2275 + Math.random() * 100;
	this.pos = pos; //createVector(Math.floor(Math.random() * getZoomedWidth()), Math.floor(Math.random() * getZoomedHeight()));
	this.vel = vel; //createVector(Math.floor(Math.random() * 2 * MAX_RAND_VEL) - MAX_RAND_VEL, Math.floor(Math.random() * 2 * MAX_RAND_VEL) - MAX_RAND_VEL);	
	this.isLocked = false;

	this.history = [];

	this.accumulatedForce = createVector(0, 0);
	this.shouldBeDestroyed = false;

	// public functions
	this.getRadius = function() {
		// things are 2D. density is Mass / area
		// area = pi*r^2, r = sqrt(area / pi)

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

		// this conserves momentum. Get the total momentum, then 
		// figure out how fast the combined mass would be going with that momentum.
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
		this.history.unshift(this.pos.copy());		// insert at front
		if (this.history.length > HISTORY_LENGTH) {
			this.history.pop();						// remove from rear
		}
	}
	
	this.show = function () {
		var radius = Math.floor(this.getRadius());
		var r_indicator = radius * (1 - INDICATOR_SIZE_RATIO);

		// TODO: recommend moving color constant definitions either here or define them at the top of this script.
		
		push();
			if (SHOW_HISTORY) {
				// set history color
				var red = 0;
				var green = 128;
				var blue = 200;
				var historyColor;
				
				// set alpha vars
				var alpha = HISTORY_ALPHA;
				var alphaStep = alpha / this.history.length;

				for (var i = 0; i < this.history.length; i++) {
					alpha -= alphaStep;
					
					// check threshold
					if (alpha < HISTORY_ALPHA_CUTOFF_THRESHOLD) {
						break;
					}

					// draw history disk
					push();
						historyColor = "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";

						noStroke();	// no outlines in history/tail?  preference call
						translate(this.history[i].x, this.history[i].y);
						fill(historyColor);
						ellipse(0, 0, (1 - i / this.history.length) * this.getRadius());
					pop();
				}

			}

			// draw current thing
			push();
				translate(this.pos.x, this.pos.y);

				// draw large "orbit" disc
				push();
					var gsl = 128; // greyscale level
					// and use rgba so we can use alpha channel
					var diskColor = "rgba(" + gsl + "," + gsl + "," + gsl + "," + 0.5 + ")"

					noStroke(); // no outline on disk?  preference call
					fill(diskColor);
					ellipse(0, 0, 2 * r_indicator);
				pop();
				
				// draw the actual "thing"
				push();
					fill(64);
					ellipse(0, 0, radius);
				pop();
				
				// draw orbiting body
				push();
					var orbitBodyColor = "rgb(255, 0, 0)";
					
					rotate(this.angle);
					translate(0, r_indicator - INDICATOR_SIZE_RATIO * radius);
					fill(orbitBodyColor);
					ellipse(0, 0, 2 * radius * INDICATOR_SIZE_RATIO);
				pop();
			pop();
		pop();
	}

}
