export class Theremine{
    constructor() {
        this.frequency = 0;
        this.length = 0.01;
        this.bitrate = 48000;
        this.amplitude = 0;
        this.right_hand_selected_point = [0,0,0];
        this.left_hand_selected_point = [0,0,0];
        
        // A simple Particle class
        let Particle = function(position) {
            this.acceleration = createVector(0, 0.05);
            this.velocity = createVector(random(-1, 1), random(-1, 0));
            this.position = position.copy();
            this.lifespan = 255;
            
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
            sketch.stroke(50, this.lifespan);
            sketch.fill(0,0,200, this.lifespan);
            sketch.ellipse(this.position.x, this.position.y, 12, 12);
        };
        
        // Is the particle still useful?
        Particle.prototype.isDead = function(){
            return this.lifespan < 0;
        };
        
        let ParticleSystem = function() {
            this.particles = [];
        };
        
        ParticleSystem.prototype.addParticle = function(position) {
            this.particles.push(new Particle(position));
        };
        
        ParticleSystem.prototype.run = function(sketch) {
            console.log(this.particles)
            for (let i = this.particles.length-1; i >= 0; i--) {
                let p = this.particles[i];
                p.run(sketch);
                if (p.isDead()) {
                this.particles.splice(i, 1);
                }
            }
        };

        this.system = new ParticleSystem(createVector(this.right_hand_selected_point[0], this.right_hand_selected_point[1] - 40));
    }

    synthesize() {
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

        this.frequency = this.right_hand_selected_point[0];
        this.amplitude = this.left_hand_selected_point[1];


    }

    show(sketch) {
        // sketch.fill(0,0,255)
        // sketch.ellipse(this.right_hand_selected_point[0], this.right_hand_selected_point[1] - 40, 10);
        // sketch.fill(255,0,0)
        // sketch.ellipse(this.left_hand_selected_point[0] + 40, this.left_hand_selected_point[1], 10);
        this.system.addParticle(createVector(this.right_hand_selected_point[0], this.right_hand_selected_point[1] - 40));
        this.system.run(sketch);
    }

    update(sketch) {
    }


}