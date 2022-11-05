import musicalElementsJson from './musical_elements.json' assert { type: "json" };
import laVieEnRoseJson from './scores/la_vie_en_rose.json' assert { type: "json" };
import noTimeToDie from './scores/no_time_to_die.json' assert { type: "json" };


export class Theremine{
    constructor() {
        this.frequency = 0;
        this.particlesSystem;
        this.gapBetweenBars = 20;
        this.shiftBars = 340;
        this.showBars = true;
        this.initParticles();

        this.playingTutorial = false;
        this.fallingNotes = [];
        this.total_score = 0;
        this.tempo;
        
        this.cursorsDiameter = 10;

        this.particlesColor;
        this.maxParticles = 5;

        this.playingMusic = false;
        this.playedScore = NaN;

        this.musicalElements = JSON.parse(JSON.stringify(musicalElementsJson))
        this.scores = {"laVieEnRoseJson": laVieEnRoseJson};

        this.cursorYPos = 200;

        this.noteDuration = 0.01;
        this.bitrate = 48000;
        this.amplitude = 0;
        this.rightHandSelectedPoint = [0,0,0];
        this.leftHandSelectedPoint = [0,0,0];
    }

    displayBars(sketch) {
        sketch.stroke(255)
        sketch.strokeWeight(0.5);
        let rectSupLeftXPt;
        let rectSupLeftYPt;
        let rectWidth;
        let rectHeight;
        
        for (let note in this.musicalElements.notes_key) {
            sketch.fill(sketch.color(255))
            sketch.strokeWeight(2);
            sketch.stroke(255);
            sketch.line(this.keyToPxl(this.musicalElements.notes_key[note]), this.cursorYPos, this.keyToPxl(this.musicalElements.notes_key[note]), this.cursorYPos + 500);
            
            if(!note.includes("#"))
            {
                // La coordonnée du do et fa doit être décalée car pas de dièse avant
                // rectSupLeftXPt = this.keyToPxl(note_counter+first_note_index) + note_counter*this.gapBetweenBars - this.gapBetweenBars/2 + 1 //+ shiftCount*this.gapBetweenBars;
                
                rectSupLeftYPt = this.cursorYPos;
                rectWidth = this.gapBetweenBars*1.2; //*2.2
                rectHeight = 150;
                
                sketch.fill(sketch.color(255));
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
                rectHeight = 100;
                
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
        const score = JSON.parse(JSON.stringify(this.scores["laVieEnRoseJson"]));
        this.tempo = score.rythm.tempo;

        for (var i=0; i< score.notes.length; i++) {
            const noteNum = score.rythm.timeSignatureNum
            const pasMesure = 1/this.musicalElements.notes_durations_denom[score.notes[i][1]]
            let noteDuration =  noteNum * pasMesure * 60/this.tempo;
            let noteCoorX = this.keyToPxl(this.musicalElements.notes_key[score.notes[i][0]]);
            console.log(this.musicalElements.notes_key[score.notes[i][0]])
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
        const keyNum = (valuePx + this.shiftBars)/ this.gapBetweenBars;
        return Math.min(Math.max(this.keyToFreq(keyNum), 0), 2000);
    }

    keyToPxl(keyNum)
    {
        let pxl = keyNum * this.gapBetweenBars - this.shiftBars
        // let pxl = (keyNum + Math.floor((keyNum - 4)/12) + Math.floor((keyNum - 9)/12)) * this.gapBetweenBars - this.shiftBars
        return pxl;
    }

    keyToFreq(key) {
        const freq = 27.5 * Math.pow(Math.pow(2, 1/12), key-1)
        return freq;
    }

    show(sketch) {
        if (this.showBars) this.displayBars(sketch);
        
        var redColor = sketch.color(245, 34, 34);
        var blueColor = sketch.color(0, 191, 255);

        if(!this.particlesColor) this.particlesColor = blueColor;

        if (this.right_hand_pose) {
            if (this.right_hand_pose.length !== 0)
            {
                sketch.fill(blueColor);
                sketch.ellipse(this.rightHandSelectedPoint[0], this.right_hand_pose[11][1] - 40, this.cursorsDiameter);

                if (Math.floor(Math.random() * this.maxParticles) == 0) {
                    this.particlesSystem.addParticle(createVector(this.rightHandSelectedPoint[0], this.right_hand_pose[11][1] - 40), blueColor);
                }
            }
        }
        if (this.left_hand_pose) {
            if (this.left_hand_pose.length !== 0)
            {
                sketch.fill(redColor)
                sketch.ellipse(this.leftHandSelectedPoint[0] + 60, this.left_hand_pose[4][1], this.cursorsDiameter);
                
                if (Math.floor(Math.random() * this.maxParticles) == 0) {
                    this.particlesSystem.addParticle(createVector(this.leftHandSelectedPoint[0] + 60, this.left_hand_pose[4][1]), redColor);
                }
            }
        }
        else {
            this.leftHandSelectedPoint[1] = height;
            this.amplitude = 0;
        }
        this.particlesSystem.run(sketch);

        if (this.playingTutorial) {
            for (let i=0; i<this.fallingNotes.length; i++) {
                if(this.fallingNotes[i].lineY > this.rightHandSelectedPoint[1]) {
                // if(this.fallingNotes[i].lineY > this.cursorYPos) {
                    if(this.fallingNotes[i].isValidating(this.rightHandSelectedPoint[0])) {
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
                    this.fallingNotes[i].update(sketch, this.rightHandSelectedPoint[0], this.rightHandSelectedPoint[1], this.tempo);
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

    toggleSound(isActivated)
    {
        this.sound_activation = isActivated;
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
            let colorgain = this.speed*tempo*5/this.distance

            if(this.isValidating(cursorXPos)) {
                this.noteScore += Math.round(colorgain);
                if(this.barColor.levels[0] > 0) this.barColor.levels[0] -=colorgain;
                if(this.barColor.levels[1] < 255) this.barColor.levels[1] +=colorgain;
                if(this.barColor.levels[2] > 0) this.barColor.levels[2] -=colorgain;
            }
            else
            {
                if(this.barColor.levels[0] < 255) this.barColor.levels[0] +=colorgain;
                if(this.barColor.levels[1] > 0) this.barColor.levels[1] -=colorgain;
                if(this.barColor.levels[2] > 0) this.barColor.levels[2] -=colorgain;
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