import musical_elements_json from './musical_elements.json' assert { type: "json" };
import la_vie_en_rose_json from './scores/la_vie_en_rose.json' assert { type: "json" };
import score_test_json from './scores/score_test.json' assert { type: "json" };

export class MusicTraining{
    constructor() {
        this.frequency = 0;
        this.particles_system;
        this.gap_between_bars = 20;
        this.shift_bars = 450;
        this.show_bars = true;
        this.initParticles();
        
        this.playingTutorial = true;
        this.tempo;
        this.falling_notes = [];
        this.score = 0;
        
        this.cursor_x_pos = 0;
        this.cursor_y_pos = height - 200;
        this.cursor_diameter = 10;

        this.particles_color;
        this.max_particles = 7;

        this.playTutorial();

    }

    displayBars(sketch) {
        const musical_elements = JSON.parse(JSON.stringify(musical_elements_json))
        for (let note in musical_elements.notes_key) {
            sketch.stroke(255)
            sketch.strokeWeight(1);
            sketch.fill(sketch.color(255,255,255))
            sketch.line(this.key_to_pxl(musical_elements.notes_key[note]), 200, this.key_to_pxl(musical_elements.notes_key[note]), this.cursor_y_pos);
        }
    }

    initParticles() {
        // A simple Particle class
        let Particle = function(position, color) {
            this.acceleration = createVector(0, 0.05);
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
            sketch.ellipse(this.position.x, this.position.y, 0.14);
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

        this.particles_system = new ParticleSystem(createVector(0,0));
        }

    playTutorial() {
        this.playingTutorial = true;

        // const score = JSON.parse(JSON.stringify(score_test_json))
        const score = JSON.parse(JSON.stringify(la_vie_en_rose_json))
        const musical_elements = JSON.parse(JSON.stringify(musical_elements_json))
        this.tempo = score.rythm.tempo

        for (var i=0; i< score.notes.length; i++) {
            const note_num = score.rythm.timeSignatureNum
            const pas_mesure = 1/musical_elements.notes_durations_denom[score.notes[i][1]]
            let note_duration =  note_num * pas_mesure * 60/this.tempo;

            let note_coor_x = this.key_to_pxl(musical_elements.notes_key[score.notes[i][0]]);
            var lineY = i>0 ? this.falling_notes[i-1].lineY - this.falling_notes[i-1].distance: 0;

            var newFallingNote = new FallingNote(lineY, note_duration, note_coor_x);
            this.falling_notes.push(newFallingNote);
        }
    }

    reset() {}

    update_data(frequency, amplitude) {
        this.frequency = frequency;
        this.amplitude = amplitude;
    }

    // Links the distance in pixels to the frequency
    px_to_freq(value_px)
    {
        const key_num = (value_px + this.shift_bars)/ this.gap_between_bars;
        return Math.min(Math.max(this.key_to_freq(key_num), 0), 2000);
    }

    key_to_pxl(key_num)
    {
        return key_num * this.gap_between_bars - this.shift_bars;
    }

    key_to_freq(key) {
        const freq = 27.5 * Math.pow(Math.pow(2, 1/12), key-1)
        return freq;
    }

    freq_to_key(freq) {
        return Math.log(freq/27.5)/Math.log(Math.pow(2, 1/12)) + 1
    }

    show(sketch) {
        
        var blue_color = sketch.color(30, 50, 250);

        if(!this.particles_color) this.particles_color = blue_color;

        if (this.frequency && this.amplitude) {
            if (this.frequency > 30 && this.amplitude>40)
            {
                var key = this.freq_to_key(this.frequency)
                this.cursor_x_pos = this.key_to_pxl(key);
                sketch.fill(this.particles_color);
                sketch.ellipse(this.cursor_x_pos, this.cursor_y_pos, this.cursor_diameter);

                if (Math.floor(Math.random() * this.max_particles) == 0) {
                this.particles_system.addParticle(createVector(this.cursor_x_pos, this.cursor_y_pos), this.particles_color);
            }
            }
            else
            {
                this.particles_system.particles = [];
                this.cursor_x_pos = 0;
            }
        }
        this.particles_system.run(sketch);

        if (this.show_bars) this.displayBars(sketch);

        if (this.playingTutorial) {
            for (let i=0; i<this.falling_notes.length; i++) {
                if(this.falling_notes[i].lineY > this.cursor_y_pos) {
                    if(this.falling_notes[i].isValidating(this.cursor_x_pos)) {
                        if(this.particles_color.levels[0] > 0) this.particles_color.levels[0] -=1;
                        if(this.particles_color.levels[1] < 255) this.particles_color.levels[1] +=1;
                        if(this.particles_color.levels[2] > 0) this.particles_color.levels[2] -=1;
                        this.max_particles = 1;
                        if(this.cursor_diameter<20) this.cursor_diameter += 1;
                    }
                    else {
                        if(this.particles_color.levels[0] > 0) this.particles_color.levels[0] -=1;
                        if(this.particles_color.levels[1] > 0) this.particles_color.levels[1] -=1;
                        if(this.particles_color.levels[2] < 255) this.particles_color.levels[2] +=1;
                        this.max_particles = 7;
                        if(this.cursor_diameter>10) this.cursor_diameter -= 1;
                    }
                }
                
                if (this.falling_notes[i].isDead()) 
                {
                    this.score += this.falling_notes[i].noteScore;
                    this.falling_notes.splice(i, 1);
                }
                else {
                    this.falling_notes[i].update(sketch, this.cursor_x_pos, this.cursor_y_pos, this.tempo);
                }
            }
        }

        sketch.textSize(32);
        sketch.fill(255, 255, 255);
        sketch.text('Score: '+this.score, 10, 30);
    }

    toggleShowBars(isActivated) {
        this.show_bars = isActivated;
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

class FallingNote {
    constructor(lineY, duration, x_coor) {
        this.speed = 5;
        this.distance = duration * this.speed* 120;
        this.x_coor = x_coor;
        this.lineY = lineY;
        this.barColor;
        this.noteScore =0;
    }
    
    update(sketch, cursor_x_pos, cursor_y_pos, tempo)
    {
        if(!this.barColor) this.barColor = sketch.color(255,255,255);

        this.lineY = this.lineY + this.speed;

        //changing the color and the score
        if(this.lineY > cursor_y_pos) {
            let gain = this.speed*tempo*5/this.distance

            if(this.isValidating(cursor_x_pos)) {
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
        sketch.line(this.x_coor, this.lineY, this.x_coor, this.lineY - this.distance);
    }

    isDead() {
        return this.lineY - this.distance > height ? true : false;
    }

    isValidating(cursor_x_pos) {
        return this.x_coor - 5 < cursor_x_pos && this.x_coor + 5 > cursor_x_pos;
    }
}