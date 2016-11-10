/*
The MIT License (MIT)

Copyright (c) 2016 Andrew Reese, All rights reserved

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
Simple particle system
A simple particle system to spawn new particles at a specified position.
*/
var ParticleSystem = function() {
    this.particles = [];
};

/*
Adds new particle to the system at the specified position
*/
ParticleSystem.prototype.addParticle = function(position) {
    particle = new Particle(position.copy());
    this.particles.push(particle);
};

ParticleSystem.prototype.run = function() {
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        p.run();
        if (p.isDead()) {
            this.particles.splice(i, 1);
        }
    }
};


/*
Simple particle
A simple particle has an initial position vector
*/
var Particle = function(position) {
    this.acceleration = createVector(0, 0);
    this.velocity     = createVector(random(-1, 1), random(-1, 1));
    this.position     = position.copy();
    this.lifespan     = 255.0;
};

Particle.prototype.run = function() {
    this.update();
    this.display();
};

/*
Updates position and lifespan of particle
*/
Particle.prototype.update = function() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.lifespan -= 4;
};

/*
Displays this particle
*/
Particle.prototype.display = function() {
    push();
    stroke(0, 0, 0, this.lifespan);
    // strokeWeight(random(1, 5));
    point(this.position.x, this.position.y);
    pop();
};

/*
Is this particle still alive?
*/
Particle.prototype.isDead = function() {
    return this.lifespan < 0;
};

