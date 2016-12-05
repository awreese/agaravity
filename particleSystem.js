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
var ParticleSystem = function(position, lifespan) {
    this.position = position.copy();
    this.lifespan  = lifespan;
    this.particles = [];
};

/*
Adds new particle to the system.
*/
ParticleSystem.prototype.addParticle = function() {
    if (this.isDead()) {
        return;
    }
    particle = new Particle(this.position, p5.Vector.random2D().setMag(1.0), createVector(0,0), this.lifespan);
    this.particles.push(particle);
};

/*
Update system and display it.
*/
ParticleSystem.prototype.run = function() {
    this.update();
    this.display();
};

/*
Updates to this system, i.e. lifespan is decremented usually.
By default standard particle systems don't expire.  This method must be
overridden in order to give a system a lifespan (or any other updating).
*/
ParticleSystem.prototype.update = function() {
  // this.lifespan--;
};

/*
Displays this particle system by calling the run method on all it's 
particles, then removing those particles that have expired.
*/
ParticleSystem.prototype.display = function() {
    for (var i = this.particles.length - 1; i >= 0; i--) {
        var p = this.particles[i];
        
        p.run();
        if (p.isDead()) {
            this.particles.splice(i, 1);
        }
    }
};

/*
Returns true if this particle system's lifespan has expired, false otherwise.
*/
ParticleSystem.prototype.isDead = function () {
  return this.lifespan < 0;
};

/*
Returns true if this system is expired and all particles have expired, false otherwise.
Allows system to still display and run existing particles until they expire.
*/
ParticleSystem.prototype.isDepleted = function() {
  return this.isDead() && this.particles.length < 0;
};


/*
Simple particle
A simple particle has initial position, velocity, and acceleration vectors, and lifespan.
*/
var Particle = function(position, velocity, acceleration, lifespan) {
    this.acceleration = acceleration.copy();
    this.velocity     = velocity.copy();
    this.position     = position.copy();
    this.lifespan     = lifespan;
};

/*
Update particle and display it.
*/
Particle.prototype.run = function() {
    this.update();
    this.display();
};

/*
Updates position and lifespan of particle.
*/
Particle.prototype.update = function() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.lifespan--;
};

/*
Displays this particle.
*/
Particle.prototype.display = function() {
    stroke(0, this.lifespan);
    point(this.position.x, this.position.y);
};

/*
Returns true if this particle's lifespan has expired, false otherwise.
*/
Particle.prototype.isDead = function() {
    return this.lifespan < 0;
};
