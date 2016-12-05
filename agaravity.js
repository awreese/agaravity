// View values
var WIDTH = 0;
var HEIGHT = 0;
var PADDING = 10;
var SCALE = 1.0;


// Reset values
var INITIAL_NUM_THINGS = 250;

var RANDOM_MASS_BASE = 2275;
var RANDOM_MASS_RANGE = 100;

var RANDOM_VEL_BASE = 0;
var RANDOM_VEL_RANGE = 25;

// debugging vars
var lastFrameTime = 0;
var shouldLogFrameRate = false;

var fooCount = 0;

// sim variables
var th = Array();
var TIME_SCALE = 1.0;

// inputs and input state values
var inputs = {};

var stopped = false;
var bounceEnabled = true;
var trackLargestThingEnabled = false;
var showStats = true;

function getZoomedWidth() {
	return WIDTH / SCALE;
}

function getZoomedHeight() {
	return HEIGHT / SCALE;
}

function resetInputChange_cb() {
	th = [];
	createThings(INITIAL_NUM_THINGS);
	sizeToFit();
}

function createButtonInput(container, name, clickedFunction) {
	var input = document.createElement("BUTTON");
	input.setAttribute("name", name);
	input.onclick = clickedFunction;
	input.innerHTML = name;
	inputs[name] = input;
	container.appendChild(input);
}

function createCheckboxInput(container, name, defaultValue, changeFunction) {
	var label = createLabel(name);

	var input = document.createElement("INPUT");
	input.setAttribute("type", "checkbox");
	input.checked = defaultValue;
	input.onchange = changeFunction;

	label.appendChild(input);
	label.appendChild(document.createElement("BR"));

	container.appendChild(label);
	appendBR(container);
}

function mousePressed() {
	if (mouseButton == RIGHT) {
		rightClick();
	} else if (mouseButton == LEFT) {
		leftClick();
	} else if (mouseButton == CENTER) {
		centerClick();
	}
}

function leftClick() {
	var clicked = -1;
	var mouseVect = createVector(mouseX / SCALE, mouseY / SCALE);

	for (var i = 0; i < this.th.length; i++) {
		var d = mouseVect.dist(th[i].pos);
		var r = th[i].getRadius();
		if (d < r) {
			// clicked on the thing
			if (clicked == -1) {
				clicked = i;
			} else if (th[i].mass > th[clicked].mass) {
				clicked = i;
			}
		}
	}

	if (clicked != -1) {
		th[clicked].toggleLocked();
	}
}

function rightClick() {
	// TODO: implement ability to shoot things by clicking and dragging
	console.log("rightClick hasn't been implemented");
}

function centerClick() {
	console.log("centerClick hasn't been implemented");
}

function createLabel(name) {
	var label = document.createElement("LABEL");
	label.setAttribute("for", name);
	var span = document.createElement("SPAN");
	span.setAttribute("class", "input_label");
	span.innerHTML = name;
	label.appendChild(span);
	appendBR(label);
	return label;
}

function createRangeInput(container, name, min, max, defaultValue, step, changeFunction) {	
	var input = document.createElement("INPUT");
	input.setAttribute("name", name);
	input.setAttribute("type", "range");
	input.setAttribute("min", min);
	input.setAttribute("max", max);
	input.setAttribute("step", step);
	input.setAttribute("defaultValue", defaultValue);
	input.value = defaultValue;
	input.onchange = changeFunction;
	inputs[name] = input;
	
	var label = createLabel(name);

	var readOut = document.createElement("div");
	readOut.classList.add("readout");
	readOut.innerHTML = defaultValue;
	input.readOut = readOut;
	
	label.appendChild(input);
	label.appendChild(readOut);
	appendBR(label);

	container.appendChild(label);
	appendBR(container);
}

function setWindowDimensions() {
	var agaravityWindow = $(".agaravity");
	var agaravityPanel = $(".agaravity-simulation");
	var agaravityPanelHeader = agaravityWindow.find(".panel-header");
	var controlPanel = $("#control-panel");
	
	HEIGHT = agaravityWindow.height() - agaravityPanelHeader.outerHeight(true) - (2 * PADDING);
	WIDTH = agaravityPanel.width() - controlPanel.outerWidth(true);

	if (WIDTH == 0 || HEIGHT == 0) {
		WIDTH = HEIGHT = 1080;
	}

	console.log("Width x Height: (" + WIDTH + " x " + HEIGHT + ")");
}

function windowResized() {
	sizeToFit();
}

function sizeToFit() {
	setWindowDimensions();
	$("#control-panel").outerHeight(HEIGHT);
	$("#controls").height(HEIGHT - (2 * PADDING));
	$("#simulation-panel").width(WIDTH);
	$("#simulation-panel").height(HEIGHT);
	resizeCanvas(WIDTH, HEIGHT);
}

function startStopInputChange_cb() {
	stopped = ! stopped;

	if (stopped) {
		noLoop();
	} else {
		loop();
	}
}

function gravInputChange_cb() {
	var value = inputs["grav"].value;
	GRAV = value;	
	inputs["grav"].readOut.innerHTML = value;
}

function enableBounceInputChange_cb() {
	bounceEnabled = !bounceEnabled;
}

function showHistoryChange_cb() {
	SHOW_HISTORY = !SHOW_HISTORY;
}

function showDisplayRate_cb() {
	showFrameRate = !showFrameRate;
	console.log("showFrameRate=" + showFrameRate);
}

function showStats_cb() {
	showStats = !showStats;
	console.log("showStats=" + showStats);
}

function zoomInputChange_cb() {
	SCALE = this.value;
	this.readOut.innerHTML = this.value;
}

function numThingsInputChange_cb() {
	INITIAL_NUM_THINGS = this.value;
	this.readOut.innerHTML = this.value;
}

function trackLargestThingInputChange_cb() {
	// TODO: when tracking is enabled, apply forcer with arrow keys
	//	 maybe scroll wheel to change strength
	trackLargestThingEnabled = ! trackLargestThingEnabled

	console.log("trackLargestThingEnabled=" + trackLargestThingEnabled);
}

function historyLengthChange_cb() {
	HISTORY_LENGTH = this.value;
	for (var i = 0; i < th.length; i++) {
		th[i].history.splice(HISTORY_LENGTH);
	}
	this.readOut.innerHTML = this.value;
}

function historyAlphaLevel_cb() {
	HISTORY_ALPHA = this.value;
	this.readOut.innerHTML = this.value;
}

function randomMassCenterInputChange_cb() {
	console.log("Random mass center changed to " + this.value);
	RANDOM_MASS_BASE = this.value;
	this.readOut.innerHTML = this.value;
}

function randomMassRadiusInputChange_cb() {
	console.log("Random mass radius changed to " + this.value);
	RANDOM_MASS_RANGE = this.value;
	this.readOut.innerHTML = this.value;
}

function randomVelCenterInputChange_cb() {
	console.log("Random vel center changed to " + this.value);
	RANDOM_VEL_BASE = this.value;
	this.readOut.innerHTML = this.value;
}

function randomVelRadiusInputChange_cb() {
	console.log("Random vel radius changed to " + this.value);
	RANDOM_VEL_RANGE = this.value;
	this.readOut.innerHTML = this.value;
}

function timeScaleInputChange_cb() {
	console.log("Time scale changed to " + this.value);
	TIME_SCALE = this.value;
	this.readOut.innerHTML = this.value;
}

function createInputs() {
	var inputContainer = document.createElement("div");
	inputContainer.id = "inputPanel";

	//					 container,		 name					min 	max		default 			step 	callback
	createRangeInput	(inputContainer, "random mass base", 	1, 		5000, 	RANDOM_MASS_BASE,  1, 		randomMassCenterInputChange_cb); 
	createRangeInput	(inputContainer, "random mass range",	0, 		500, 	RANDOM_MASS_RANGE, 1, 		randomMassRadiusInputChange_cb);
	createRangeInput	(inputContainer, "random vel base", 	0, 		100, 	RANDOM_VEL_BASE,   1, 		randomVelCenterInputChange_cb);
	createRangeInput	(inputContainer, "random vel range", 	0, 		100, 	RANDOM_VEL_RANGE,  1, 		randomVelRadiusInputChange_cb);
	createRangeInput	(inputContainer, "grav", 				0, 		2, 		GRAV, 			   0.0001, 	gravInputChange_cb);
	createRangeInput	(inputContainer, "history length", 		0, 		1000, 	HISTORY_LENGTH,    1, 		historyLengthChange_cb);

	createRangeInput	(inputContainer, "history alpha",		0.0,	1.0,	HISTORY_ALPHA,     0.1, 	historyAlphaLevel_cb);

	createRangeInput	(inputContainer, "zoom", 				0.05, 	2.5, 	1.0, 				0.01, 	zoomInputChange_cb);
	createRangeInput	(inputContainer, "num things", 				1, 		1500, 	INITIAL_NUM_THINGS, 1, 		numThingsInputChange_cb);
	createRangeInput	(inputContainer, "time scale",		0.1,		2.5,	TIME_SCALE,	0.005,	timeScaleInputChange_cb);	

	//					 container,		 name					default 			callback
	createCheckboxInput	(inputContainer, "enable bounce", 		bounceEnabled, enableBounceInputChange_cb);
	createCheckboxInput	(inputContainer, "track largest thing", trackLargestThingEnabled, trackLargestThingInputChange_cb);
	createCheckboxInput	(inputContainer, "enable show history", SHOW_HISTORY, 	showHistoryChange_cb);
	createCheckboxInput (inputContainer, "nerd stuffs", 		showStats, 	showStats_cb);
	
	createButtonInput	(inputContainer, "start/stop", startStopInputChange_cb);
	createButtonInput	(inputContainer, "reset", resetInputChange_cb);

	document.getElementById("controls").appendChild(inputContainer);

}

function appendBR(element) {
	element.appendChild(document.createElement("BR"));
}

var bufferedThingImage;

function setup() {
	createInputs();	

	var canvas = createCanvas(WIDTH, HEIGHT);
	canvas.parent("simulation-panel");
	sizeToFit();

	createThings(INITIAL_NUM_THINGS);

	lastFrameTime = getTime();

	imageMode(CENTER);
	ellipseMode(RADIUS);

	bufferedThingImage = createBufferedThingImage();
}

function createThings(numberOfThings) {
	for (var i = 0; i < numberOfThings; i++)
		th.push(new thing(randomMass(), randomPosition(), randomVelocity()));
}

function randomMass() {
	return randomRange(RANDOM_MASS_BASE, RANDOM_MASS_RANGE);
}

function randomVelocity() {
	return p5.Vector.random2D().setMag(randomRange(RANDOM_VEL_BASE, RANDOM_VEL_RANGE));
}

/*
Returns random value within the range from base or 
base if the returned value would be less than 0
*/
function randomRange(base, range) {
	var halfRange = range / 2;
	var randomVal = float(base) + random(-halfRange, halfRange);
	return randomVal < 0 ? base : randomVal;
};

function randomPosition() {
	return createVector(random(getZoomedWidth()), random(getZoomedHeight()));
}

function draw() {
	fooCount++;
	
	if (shouldLogFrameRate) {
		logFrameRate();
	}

	background(0);

	push();
	scale(SCALE, SCALE);
	if (trackLargestThingEnabled) {
		var largestThing = th[getLargestThingIndex()];
		translate(getZoomedWidth() / 2 - largestThing.pos.x, getZoomedHeight() / 2 - largestThing.pos.y);
	}

	handleInteractions();
	displayThings();
	pop();
	displayStats();
}

function displayStats() {
	if (showStats) {
		push();
		noStroke();
		fill('rgba(0,0,0,0.25)');
		rect(15, 15, 250, 100);
		textAlign(LEFT);
		fill(0,255,51);
		textSize(32);

		displayFrameRate();
		displayNumThings();
		pop();
	}
}

function displayFrameRate() {
	text("framerate: " + round(frameRate() * 10.0) / 10, 20, 50);
}

function displayNumThings() {
	text("things: " + th.length, 20, 90);
}

function getLargestThingIndex() {
	var largestThingIndex = 0;
	for (var i = 0; i < this.th.length; i++) {
		if (th[i].mass > th[largestThingIndex].mass)
			largestThingIndex = i;
	}
	return largestThingIndex;
}

function displayThings() {
	
	for (var i = th.length - 1; i >= 0; i--) {
		var t = th[i];

		t.update();

		if (t.shouldBeDestroyed) {
			th.splice(i, 1);
		} else {
			t.show();
		}
	}
}

function handleInteractions() {
	for (var i = 0; i < th.length; i++) {
		for (var j = i + 1; j < th.length; j++) {
			
			if (th[i].shouldBeDestroyed) {
				break; // thing[i] already absorbed, skip calculations
			}

			if (th[j].shouldBeDestroyed) {
				continue; // thing[j] already absorbed, skip this thing
			}

			if (th[i].isCollidingWith(th[j])) {
				if (th[i].mass >= th[j].mass) {
					th[i].absorb(th[j]);
				} else {
					th[j].absorb(th[i]);
				}
			}

			var force = th[i].getGravitationalForce(th[j]);
			th[i].accumulateForce(force);
			th[j].accumulateForce(force.mult(-1.0));
		}

		th[i].applyAccumulatedForce();
	}
}

function logFrameRate() {
	console.log("Frame rate: " + frameRate());
}

function getTime() {
	return new Date().getTime();
}
