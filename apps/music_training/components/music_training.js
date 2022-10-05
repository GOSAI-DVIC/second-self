import notes_keys_CMaj_json from './notes_keys_CMaj.json' assert { type: "json" };
import notes_keys_json from './notes_keys.json' assert { type: "json" };
import la_vie_en_rose_json from './scores/la_vie_en_rose.json' assert { type: "json" };

export class MusicTraining{
    constructor() {
        this.frequency = 0;
        this.particles_system;
        this.gap_between_bars = 20;
        this.shift_bars = 450;
        this.show_bars = true;
        this.initParticles();
    }

    displayBars(sketch) {
        const notes_keys_CMaj = JSON.parse(JSON.stringify(notes_keys_CMaj_json))
        for (let note in notes_keys_CMaj.notes_key) {
            sketch.stroke(255)
            sketch.strokeWeight(1);
            var bar_color = note[0] == 'C4' ? sketch.color(255,255,255) : sketch.color(34, 245, 34); 
            sketch.fill(bar_color)
            sketch.line(this.key_to_pxl(notes_keys_CMaj.notes_key[note]), 50, this.key_to_pxl(notes_keys_CMaj.notes_key[note]), height - 50);
        }
        
        sketch.fill(sketch.color(34,245,34));
        sketch.stroke(255)
        sketch.strokeWeight(2)
    }

    initParticles() {
        // A simple Particle class
        let Particle = function(position, color) {
            this.acceleration = createVector(0, 0.02);
            this.velocity = createVector(random(-0.8,0.8), random(-0.8, 0));
            this.position = position.copy();
            this.lifespan = 50;
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
            this.lifespan -= 2;
        };
        
        // Method to display
        Particle.prototype.display = function(sketch) {
            sketch.fill(this.color);
            sketch.ellipse(this.position.x, this.position.y, 3, 3);
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
        const la_vie_en_rose = JSON.parse(JSON.stringify(la_vie_en_rose_json))
        for (note in la_vie_en_rose.notes) {
            
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
        // var key = 
        return Math.log(freq/27.5)/Math.log(Math.pow(2, 1/12)) + 1
        // return key < 0 ? 0 : key;
    }

    show(sketch) {
        var blue_color = sketch.color(30, 129, 250);

        if (this.frequency && this.amplitude) {
            if (this.frequency !== 0 && this.amplitude>40)
            {
                var key = this.freq_to_key(this.frequency)
                sketch.fill(blue_color);
                sketch.ellipse(this.key_to_pxl(key), 800, 10);
                this.particles_system.addParticle(createVector(this.key_to_pxl(key), 800), blue_color);
            }
        }
        this.particles_system.run(sketch);

        if (this.show_bars) this.displayBars(sketch);
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