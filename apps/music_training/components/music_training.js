import musicalElementsJson from './musical_elements.json' assert { type: "json" };
import laVieEnRoseJson from './scores/la_vie_en_rose.json' assert { type: "json" };
import scoreTestJson from './scores/score_test.json' assert { type: "json" };

export class MusicTraining{
    constructor() {
        this.frequency = 0;
        this.particlesSystem;
        this.gapBetweenBars = 20;
        this.shiftBars = 380;
        this.showBars = true;
        this.initParticles();

        this.playingTutorial = false;
        this.fallingNotes = [];
        this.total_score = 0;
        this.tempo;
        
        this.cursorXPos = 0;
        this.cursorYPos = 200;
        this.cursorDiameter = 10;

        this.particlesColor;
        this.maxParticles = 7;
        this.resetTutorial();
    }

    resetTutorial() {
        this.playingTutorial = false;
        this.fallingNotes = [];
        this.total_score = 0;
    }

    displayBars(sketch) {
        const musicalElements = JSON.parse(JSON.stringify(musicalElementsJson))
        for (let note in musicalElements.notes_key) {
            sketch.stroke(255)
            sketch.strokeWeight(0.5);
            sketch.fill(sketch.color(255,255,255))
            sketch.line(this.keyToPxl(musicalElements.notes_key[note]), this.cursorYPos, this.keyToPxl(musicalElements.notes_key[note]), height-200);
        }
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

    playTutorial() {
        this.playingTutorial = true;

        const score = JSON.parse(JSON.stringify(scoreTestJson))
        // const score = JSON.parse(JSON.stringify(laVieEnRoseJson))
        const musicalElements = JSON.parse(JSON.stringify(musicalElementsJson))
        this.tempo = score.rythm.tempo

        for (var i=0; i< score.notes.length; i++) {
            const noteNum = score.rythm.timeSignatureNum
            const pasMesure = 1/musicalElements.notes_durations_denom[score.notes[i][1]]
            let noteDuration =  noteNum * pasMesure * 60/this.tempo;

            let noteCoorX = this.keyToPxl(musicalElements.notes_key[score.notes[i][0]]);
            var lineY = i>0 ? this.fallingNotes[i-1].lineY + this.fallingNotes[i-1].distance: height;

            var newFallingNote = new FallingNote(lineY, noteDuration, noteCoorX);
            this.fallingNotes.push(newFallingNote);
        }
    }

    reset() {}

    updateData(frequency, amplitude) {
        this.frequency = frequency;
        this.amplitude = amplitude;
    }

    // Links the distance in pixels to the frequency
    pxToFreq(valuePx)
    {
        const keyNum = (valuePx + this.shiftBars)/ this.gapBetweenBars;
        return Math.min(Math.max(this.keyToGreq(keyNum), 0), 2000);
    }

    keyToPxl(keyNum)
    {
        return keyNum * this.gapBetweenBars - this.shiftBars;
    }

    keyToGreq(key) {
        const freq = 27.5 * Math.pow(Math.pow(2, 1/12), key-1)
        return freq;
    }

    freqToKey(freq) {
        return Math.log(freq/27.5)/Math.log(Math.pow(2, 1/12)) + 1
    }

    show(sketch) {
        
        var blueColor = sketch.color(30, 50, 250);

        if(!this.particlesColor) this.particlesColor = blueColor;

        if (this.frequency && this.amplitude) {
            if (this.frequency > 30 && this.amplitude>40)
            {
                var key = this.freqToKey(this.frequency)
                this.cursorXPos = this.keyToPxl(key);
                sketch.fill(this.particlesColor);
                sketch.ellipse(this.cursorXPos, this.cursorYPos, this.cursorDiameter);

                if (Math.floor(Math.random() * this.maxParticles) == 0) {
                    this.particlesSystem.addParticle(createVector(this.cursorXPos, this.cursorYPos), this.particlesColor);
                }
            }
            else
            {
                this.particlesSystem.particles = [];
                this.cursorXPos = 0;
            }
        }
        this.particlesSystem.run(sketch);

        if (this.showBars) this.displayBars(sketch);

        if (this.playingTutorial) {
            for (let i=0; i<this.fallingNotes.length; i++) {
                if(this.fallingNotes[i].lineY > this.cursorYPos) {
                    if(this.fallingNotes[i].isValidating(this.cursorXPos)) {
                        if(this.particlesColor.levels[0] > 0) this.particlesColor.levels[0] -=4;
                        if(this.particlesColor.levels[1] < 255) this.particlesColor.levels[1] +=4;
                        if(this.particlesColor.levels[2] > 0) this.particlesColor.levels[2] -=4;
                        this.maxParticles = 1;
                        if(this.cursorDiameter<20) this.cursorDiameter += 2;
                    }
                    else {
                        if(this.particlesColor.levels[0] > 0) this.particlesColor.levels[0] -=4;
                        if(this.particlesColor.levels[1] > 0) this.particlesColor.levels[1] -=4;
                        if(this.particlesColor.levels[2] < 255) this.particlesColor.levels[2] +=4;
                        this.maxParticles = 7;
                        if(this.cursorDiameter>10) this.cursorDiameter -= 2;
                    }
                }
                
                if (this.fallingNotes[i].isDead()) 
                {
                    this.total_score += this.fallingNotes[i].noteScore;
                    this.fallingNotes.splice(i, 1);
                }
                else {
                    this.fallingNotes[i].update(sketch, this.cursorXPos, this.cursorYPos, this.tempo);
                }
            }

            if(i == this.fallingNotes.length-1 && this.fallingNotes[i].lineY + this.fallingNotes[i].distance < 0) this.resetTutorial();
        }

        sketch.textSize(32);
        sketch.fill(255, 255, 255);
        sketch.text('Score: '+this.total_score, 50, 100);
    }

    toggleShowBars(isActivated) {
        this.showBars = isActivated;
    }

    startTutorial(isActivated)
    {
        if (isActivated && !this.playingTutorial) this.playTutorial();
    }

    toggleSound(isActivated)
    {
        this.soundActivation = isActivated;
    }

    update(sketch) {

    }
}

class FallingNote {
    constructor(lineY, duration, xCoor) {
        this.speed = 5;
        this.distance = duration * this.speed* 120;
        this.xCoor = xCoor;
        this.lineY = lineY;
        this.barColor;
        this.noteScore =0;
    }
    
    update(sketch, cursorXPos, cursorYPos, tempo)
    {
        if(!this.barColor) this.barColor = sketch.color(255,255,255);

        this.lineY = this.lineY - this.speed;

        //changing the color and the score
        if(this.lineY < cursorYPos) {
            let gain = this.speed*tempo*5/this.distance

            if(this.isValidating(cursorXPos)) {
                this.noteScore += Math.round(gain);
                if(this.barColor.levels[0] > 0) this.barColor.levels[0] -=gain;
                if(this.barColor.levels[1] < 255) this.barColor.levels[1] +=gain;
                if(this.barColor.levels[2] > 0) this.barColor.levels[2] -=gain;
            }
            else
            {
                this.noteScore -= Math.round(gain);
                if(this.barColor.levels[0] < 255) this.barColor.levels[0] +=gain;
                if(this.barColor.levels[1] > 0) this.barColor.levels[1] -=gain;
                if(this.barColor.levels[2] > 0) this.barColor.levels[2] -=gain;
            }
        }

        sketch.strokeWeight(5);
        sketch.stroke(this.barColor);
        sketch.line(this.xCoor, this.lineY, this.xCoor, this.lineY + this.distance);
    }

    isDead() {
        return this.lineY + this.distance < 0 ? true : false;
    }

    isValidating(cursorXPos) {
        return this.xCoor - 5 < cursorXPos && this.xCoor + 5 > cursorXPos;
    }
}