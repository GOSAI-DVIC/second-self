import musicalElementsJson from './musical_elements.json' assert { type: "json" };
import laVieEnRoseJson from './scores/la_vie_en_rose.json' assert { type: "json" };
import noTimeToDie from './scores/no_time_to_die.json' assert { type: "json" };
import scoreTestJson from './scores/score_test.json' assert { type: "json" };


export class MusicTraining{
    constructor() {
        this.frequency = 0;
        this.particlesSystem;
        this.gapBetweenBars = 10;
        this.shiftBars = 180;
        this.showBars = true;
        this.initParticles();

        this.playingTutorial = false;
        this.fallingNotes = [];
        this.total_score = 0;
        this.tempo;
        
        this.cursorXPos = 0;
        this.cursorYPos = 200;
        this.cursorDiameter = 12;

        this.particlesColor;
        this.maxParticles = 3;

        this.playingMusic = false;
        this.playedScore = NaN;

        this.musicalElements = JSON.parse(JSON.stringify(musicalElementsJson))
        this.scores = {"laVieEnRoseJson": laVieEnRoseJson};

        this.keyFreqGap = 0;
    }

    displayBars(sketch) {
        sketch.stroke(255)
        sketch.strokeWeight(0.5);
        let rectSupLeftXPt;
        let rectSupLeftYPt;
        let rectWidth;
        let rectHeight;

        // sketch.fill(sketch.color(255))
        // console.log(this.keyToPxl(Object.values(this.musicalElements.notes_key)[1]), height-300, this.keyToPxl(Object.values(this.musicalElements.notes_key)[-1]), height-250)
        // sketch.rect(this.keyToPxl(Object.values(this.musicalElements.notes_key)[1]), height-300, this.keyToPxl(Object.values(this.musicalElements.notes_key)[-1]), height-250);
        
        for (let note in this.musicalElements.notes_key) {
            if(!note.includes("#"))
            {
                // La coordonnée du do et fa doit être décalée car pas de dièse avant
                // rectSupLeftXPt = this.keyToPxl(note_counter+first_note_index) + note_counter*this.gapBetweenBars - this.gapBetweenBars/2 + 1 //+ shiftCount*this.gapBetweenBars;
                
                rectSupLeftYPt = this.cursorYPos;
                rectWidth = this.gapBetweenBars*2.2;
                rectHeight = 250;

                sketch.fill(sketch.color(255))
                sketch.strokeWeight(2);
                sketch.stroke(0);
                sketch.rect(this.keyToPxl(this.musicalElements.notes_key[note]) - rectWidth/2, rectSupLeftYPt, rectWidth, rectHeight);
            }
        }
        
        // first_note_index = Object.values(this.musicalElements.notes_key)[1];
        for (let note in this.musicalElements.notes_key) {
            if(note.includes("#")) 
            {
                rectSupLeftXPt = this.keyToPxl(this.musicalElements.notes_key[note]) - this.gapBetweenBars/2;
                rectSupLeftYPt = this.cursorYPos;
                rectWidth = this.gapBetweenBars*1.2;
                rectHeight = 200;
                
                sketch.fill(sketch.color(16))
                sketch.noStroke()
                sketch.rect(this.keyToPxl(this.musicalElements.notes_key[note]) - rectWidth/2, rectSupLeftYPt, rectWidth, rectHeight);
            }
        }
    }

    initParticles() {
        // A simple Particle class
        let Particle = function(position, color) {
            this.acceleration = createVector(0, -0.05);
            // this.velocity = createVector(random(-0.8,0.8), random(-0.8, 0));
            this.velocity = createVector(random(-0.2,0.2), 0);
            this.position = position.copy();
            this.lifespan = 300;
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
        const score = JSON.parse(JSON.stringify(this.scores["laVieEnRoseJson"]));
        this.tempo = score.rythm.tempo;

        for (var i=0; i< score.notes.length; i++) {
            const noteNum = score.rythm.timeSignatureNum
            const pasMesure = 1/this.musicalElements.notes_durations_denom[score.notes[i][1]]
            let noteDuration =  noteNum * pasMesure * 60/this.tempo;
            let noteCoorX = this.keyToPxl(this.musicalElements.notes_key[score.notes[i][0]] - this.keyFreqGap);
            var lineY = i>0 ? this.fallingNotes[i-1].lineY + this.fallingNotes[i-1].distance: height;

            var newFallingNote = new FallingNote(lineY, noteDuration, noteCoorX);
            this.fallingNotes.push(newFallingNote);
        }
    }

    stopTutorial() {
        this.playingTutorial = false;
        this.fallingNotes = [];
        this.total_score = 0;
    }

    frequencyCalibration(sketch) {
        let sungNote = "";
        let sungKey = 0;

        sketch.textSize(48);
        sketch.fill(255, 255, 255);
        sketch.text('Sing a comfortable note', 50, 150);

        sungKey = this.freqToKey(this.frequency)

        if (Object.values(this.musicalElements.notes_key).includes(sungKey)) {
            sungNote = this.keyToNote(sungKey);
            sketch.text(sungNote, 200, 100);
        }
        const score = JSON.parse(JSON.stringify(this.scores["laVieEnRoseJson"]));
        this.keyFreqGap = Math.floor((this.musicalElements.notes_key[score.principalHigh] - sungKey)/12 + 1)*12;
    }

    reset() {}

    updateData(frequency, amplitude, dt) {
        this.frequency = frequency;
        this.amplitude = amplitude;
    }

    // Links the distance in pixels to the frequency
    // pxlToFreq(valuePx)
    // {
    //     const keyNum = (valuePx + this.shiftBars)/ this.gapBetweenBars;
    //     return Math.min(Math.max(this.keyToFreq(keyNum), 0), 2000);
    // }

    keyToPxl(keyNum)
    {
        let pxl = (keyNum + Math.floor((keyNum - 4)/12) + Math.floor((keyNum - 9)/12)) * this.gapBetweenBars - this.shiftBars
        return pxl;
    }

    keyToFreq(key) {
        const freq = 27.5 * Math.pow(Math.pow(2, 1/12), key-1)
        return freq;
    }

    keyToNote(key) {
        return Object.keys(this.musicalElements.notes_key).find(note=>this.musicalElements.notes_key[note]===key)
    }

    freqToKey(freq) {
        return Math.round(Math.log(freq/27.5)/Math.log(Math.pow(2, 1/12)) + 1)
    }

    show(sketch) {
        if (this.showBars) this.displayBars(sketch);

        var blueColor = sketch.color(0, 191, 255);

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

        if (sketch.millis() - this.tutorialStartTime < 4000) this.frequencyCalibration(sketch);

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
                if(i == this.fallingNotes.length-1 && this.fallingNotes[i].lineY + this.fallingNotes[i].distance < 0) this.stopTutorial();
            }
            sketch.textSize(32);
            sketch.fill(255, 255, 255);
            sketch.text('Score: '+this.total_score, 50, 100);
        }
    }

    toggleShowBars(isActivated) {
        this.showBars = isActivated;
    }

    triggerFreqCalibration(sketch) {
        this.stopTutorial();
        this.playingTutorial = false;
        this.playingMusic == false;
        this.tutorialStartTime = sketch.millis();
    }

    triggerTutorial()
    {
        this.playingTutorial = !this.playingTutorial;
        this.playingMusic = false

        if (this.playingTutorial) {
            this.playTutorial();
        }
        else {
            this.stopTutorial();
        }
    }

    update(sketch) {

    }

    triggerMusic(sketch, scoreName) {
        this.stopTutorial();
        // if the music is not already playing and a new one is selected
        if (this.playingMusic && this.playedScore != scoreName) 
        {
            this.stopMusic(sketch);
            this.playMusic(sketch, scoreName);
        }
        else {
            this.playingMusic = !this.playingMusic;
            if(this.playingMusic && !this.playingTutorial) {
                this.playMusic(sketch, scoreName);
            }
            else {
                this.stopMusic(sketch)
                this.playedScore = NaN;
            }
        }
    }

    playMusic(sketch, scoreName) {
        this.playedScore = scoreName;
        var amplitude = 0.5;
        
        const score = JSON.parse(JSON.stringify(this.scores[scoreName + "Json"]));

        for(var note of score.notes)
        {
            const noteNum = score.rythm.timeSignatureNum
            const pasMesure = 1/this.musicalElements.notes_durations_denom[note[1]]
            let noteDuration =  noteNum * pasMesure * 60/score.rythm.tempo - 0.1;
            if(this.playingMusic) { 
                sketch.emit("score_player_synthesize", {
                    "frequency": this.keyToFreq(this.musicalElements.notes_key[note[0]]), 
                    "amplitude": amplitude,
                    "duration": noteDuration,
                });
            }
            else break;
        }
    }

    stopMusic(sketch) {
        sketch.emit("score_player_stop_music", {});
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