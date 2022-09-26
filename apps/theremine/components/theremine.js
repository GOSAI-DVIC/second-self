import notes_keys_CMaj_json from './notes_keys_CMaj.json' assert { type: "json" };
import notes_keys_json from './notes_keys.json' assert { type: "json" };
import la_vie_en_rose_json from './scores/la_vie_en_rose.json' assert { type: "json" };

export class Theremine{
    constructor() {
        this.frequency = 0;
        this.note_duration = 0.01;
        this.bitrate = 48000;
        this.amplitude = 0;
        this.right_hand_selected_point = [0,0,0];
        this.left_hand_selected_point = [0,0,0];
        this.system;
        
        this.initParticles();
    }

    displayBars(sketch) {
        const notes_keys_CMaj = JSON.parse(JSON.stringify(notes_keys_CMaj_json))
        const green_color = sketch.color(34, 245, 34);
        for (let note in notes_keys_CMaj) {
            sketch.stroke(200);
            // if (note[0] == 'C4') sketch.fill(green_color)
            sketch.line(this.key_to_pxl(notes_keys_CMaj[note]), 50, this.key_to_pxl(notes_keys_CMaj[note]), height - 50);
        }
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

        this.system = new ParticleSystem(createVector(this.right_hand_selected_point[0], this.right_hand_selected_point[1] - 40));
        // console.log(this.system.particles)
        }

    reset() {}

    update_data(right_hand_pose, left_hand_pose) {
        this.right_hand_pose = right_hand_pose;
        this.left_hand_pose = left_hand_pose;

        if(this.right_hand_pose.length !== 0){
            this.right_hand_selected_point = [0,0,0];
            for(var point_coor of this.right_hand_pose) 
                if(point_coor[0] > this.right_hand_selected_point[0]) this.right_hand_selected_point = point_coor;
        }
        
        if(this.left_hand_pose.length !== 0){
            this.left_hand_selected_point = [0,0,0];
            for(var point_coor of this.left_hand_pose) 
                if(point_coor[1] > this.left_hand_selected_point[1]) this.left_hand_selected_point = point_coor;
        }

        this.frequency = Math.min(Math.max(this.px_to_freq(this.right_hand_selected_point[0]), 0), 2000);
        this.amplitude = Math.max(2*height/3 - this.left_hand_selected_point[1], 0)/100;
    }

    // Links the distance in pixels to the frequency
    px_to_freq(value_px)
    {
        const key_num = (value_px + 200)/ 15;
        console.log(key_num)
        return this.key_to_freq(key_num) ;
    }

    key_to_pxl(key_num)
    {
        return key_num * 15 - 200;
    }

    key_to_freq(key) {
        const freq = 27.5 * Math.pow(Math.pow(2, 1/12), key-1)
        console.log(freq)
        return freq;
    }

    show(sketch) {
        var blue_color = sketch.color(30, 129, 250);
        var red_color = sketch.color(245, 34, 34);

        if (this.right_hand_pose) {
            if (this.right_hand_pose.length !== 0)
            {
                sketch.fill(blue_color);
                sketch.ellipse(this.right_hand_selected_point[0], this.right_hand_pose[11][1] - 40, 10);
                this.system.addParticle(createVector(this.right_hand_selected_point[0], this.right_hand_pose[11][1] - 40), blue_color);

            }
        }
        if (this.left_hand_pose) {
            if (this.left_hand_pose.length !== 0)
            {
                sketch.fill(red_color)
                sketch.ellipse(this.left_hand_selected_point[0] + 60, this.left_hand_pose[4][1], 10);
                this.system.addParticle(createVector(this.left_hand_selected_point[0] + 60, this.left_hand_pose[4][1]), red_color);
            }
        }
        else {
            this.left_hand_selected_point[1] = height;
            this.amplitude = 0;
        }
        this.system.run(sketch);

        this.displayBars(sketch);
    }

    update(sketch) {

    }


}