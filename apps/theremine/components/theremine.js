import musicalElementsJson from './musical_elements.json' assert { type: "json" };
import laVieEnRoseJson from './scores/la_vie_en_rose.json' assert { type: "json" };
import noTimeToDie from './scores/no_time_to_die.json' assert { type: "json" };

export class Theremine{
    constructor() {
        this.frequency = 0;
        this.noteDuration = 0.01;
        this.bitrate = 48000;
        this.amplitude = 0;
        this.rightHandSelectedPoint = [0,0,0];
        this.leftHandSelectedPoint = [0,0,0];
        this.particlesSystem;

        this.gabBetweenBars = 20;
        this.shiftBars = 340;
        this.showBars = true;

        this.cursorsDiameter = 10;

        this.initParticles();
    }

    displayBars(sketch) {
        const musicalElements = JSON.parse(JSON.stringify(musicalElementsJson))
        for (let note in musicalElements.notes_key) {
            sketch.stroke(255)
            sketch.strokeWeight(0.5);
            sketch.fill(sketch.color(255,255,255))
            sketch.line(this.keyToPxl(musicalElements.notes_key[note]), 50, this.keyToPxl(musicalElements.notes_key[note]), height-50);
        }
        const ampToPxMin = this.ampToPx(0);
        const ampToPxMax = this.ampToPx(7);
        sketch.fill(sketch.color(34,245,34));
        sketch.stroke(255)
        sketch.strokeWeight(2)
        sketch.line(0, ampToPxMin, 200, ampToPxMin);
        sketch.fill(sketch.color(34,245,34));
        sketch.stroke(255)
        sketch.strokeWeight(2)
        sketch.line(0, ampToPxMax, 200, ampToPxMax);
    }

    initParticles() {
        // A simple Particle class
        let Particle = function(position, color) {
            this.acceleration = createVector(0, -0.05);
            // this.velocity = createVector(random(-0.8,0.8), random(-0.8, 0));
            this.velocity = createVector(random(-0.2,0.2), 0);
            this.position = position.copy();
            this.lifespan = 200;
            this.color = color;
        };
        
        Particle.prototype.run = function(sketch) {
            this.update();
            this.display(sketch);
        };
        
        // Method to update position
        Particle.prototype.update = function(){
            this.velocity.add(this.acceleration);
            this.position.add(this.velocity);
            this.lifespan -= 1;
        };
        
        // Method to display
        Particle.prototype.display = function(sketch) {
            sketch.stroke(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.lifespan)
            sketch.fill(this.color);
            sketch.ellipse(this.position.x, this.position.y, 2);
        };
        
        // Is the particle still useful?
        Particle.prototype.isDead = function(){
            return this.lifespan < 0;
        };
        
        let ParticleSystem = function(position) {
            this.origin = position.copy();
            this.particles = [];
        };
        
        ParticleSystem.prototype.addParticle = function(position, color) {
            this.particles.push(new Particle(position, color));
        };
        
        ParticleSystem.prototype.run = function(sketch) {
            for (let i = this.particles.length-1; i >= 0; i--) {
                let p = this.particles[i];
                p.run(sketch);
                if (p.isDead()) {
                    this.particles.splice(i, 1);
                }
            }
        };

        this.particlesSystem = new ParticleSystem(createVector(0,0));
    }


    reset() {}

    

    update_data(right_hand_pose, left_hand_pose) {
        this.right_hand_pose = right_hand_pose;
        this.left_hand_pose = left_hand_pose;

        if(this.right_hand_pose.length !== 0){
            this.rightHandSelectedPoint = [0,0,0];
            for(var point_coor of this.right_hand_pose) 
                if(point_coor[0] > this.rightHandSelectedPoint[0]) this.rightHandSelectedPoint = point_coor;
        }
        
        if(this.left_hand_pose.length !== 0){
            this.leftHandSelectedPoint = [0,0,0];
            for(var point_coor of this.left_hand_pose) 
                if(point_coor[1] > this.leftHandSelectedPoint[1]) this.leftHandSelectedPoint = point_coor;
        }

        this.frequency = this.pxToFreq(this.rightHandSelectedPoint[0]);
        
        this.amplitude = this.pxToAmp(this.leftHandSelectedPoint[1]);
    }

    pxToAmp(value_px)
    {
        return Math.min(Math.max((height/2 - value_px)/100, 0), 7);
    }

    ampToPx(amp)
    {
        return -(amp*100 - height/2)
    }

    pxToFreq(valuePx)
    {
        const keyNum = (valuePx + this.shiftBars)/ this.gabBetweenBars;
        return Math.min(Math.max(this.keyToFreq(keyNum), 0), 2000);
    }

    keyToPxl(keyNum)
    {
        return keyNum * this.gabBetweenBars - this.shiftBars;
    }

    keyToFreq(key) {
        const freq = 27.5 * Math.pow(Math.pow(2, 1/12), key-1)
        return freq;
    }

    freqToKey(freq) {
        return Math.log(freq/27.5)/Math.log(Math.pow(2, 1/12)) + 1
    }

    show(sketch) {
        var blue_color = sketch.color(30, 129, 250);
        var red_color = sketch.color(245, 34, 34);

        if (this.right_hand_pose) {
            if (this.right_hand_pose.length !== 0)
            {
                sketch.fill(blue_color);
                sketch.ellipse(this.rightHandSelectedPoint[0], this.right_hand_pose[11][1] - 40, this.cursorsDiameter);
                this.particlesSystem.addParticle(createVector(this.rightHandSelectedPoint[0], this.right_hand_pose[11][1] - 40), blue_color);

            }
        }
        if (this.left_hand_pose) {
            if (this.left_hand_pose.length !== 0)
            {
                sketch.fill(red_color)
                sketch.ellipse(this.leftHandSelectedPoint[0] + 60, this.left_hand_pose[4][1], this.cursorsDiameter);
                this.particlesSystem.addParticle(createVector(this.leftHandSelectedPoint[0] + 60, this.left_hand_pose[4][1]), red_color);
            }
        }
        else {
            this.leftHandSelectedPoint[1] = height;
            this.amplitude = 0;
        }
        this.particlesSystem.run(sketch);

        if (this.showBars) this.displayBars(sketch);
    }

    toggleShowBars(isActivated) {
        this.showBars = isActivated;
    }

    startTutorial(isActivated)
    {
        console.log("on verra plus tard") // TODO
    }

    toggleSound(isActivated)
    {
        this.sound_activation = isActivated;
    }

    update(sketch) {

    }
}