import { Correction } from "./correction.js"

export class Guessing {

    constructor() {
        this.cyan = color(50, 250, 255);
        this.white = color(255, 255, 255);
        this.red = color(240, 0, 0);
        this.dark_blue = (30, 70, 160);

        this.actions;
        this.guessed_sign = "empty";
        this.targeted_sign_idx = 2;

        this.probability;
        this.sentence = [];
        this.threshold = 0.9;

        this.playing = false;
        this.playable = true;
        this.last_played = Date.now();
        this.last_interract = Date.now();

        this.running = true;
        this.count_valid = 0;
        this.isStopped = false;

        this.correction;
        this.is_correction_running = false;

        this.right_hand_pose;
        this.left_hand_pose;
        this.body_pose;
    }

    playTuto() {

        if (this.targeted_sign_idx >= this.actions.length) return;
        this.playable = false;
        this.playing = true;
        this.targeted_sign = this.actions[this.targeted_sign_idx]
        this.video = createVideo(["./platform/home/apps/sign_training/components/videos/" + this.targeted_sign.replaceAll(" ", "_") + ".webm"]);
        this.video.autoplay();
        this.video.volume(0);
        this.video.size(550, 350);
        this.video.position(width/2, 50); //1500, 50
        this.video.play();
        this.guessed_sign = "empty";
        this.last_played = Date.now();
    }

    update_sign_data(guessed_sign, probability, actions) {
        if (actions != undefined) {
            this.actions = actions;
        }

        // if (Date.now() - this.last_interract < 3000) this.guessed_sign = "empty";
        if (guessed_sign != undefined) this.guessed_sign = guessed_sign;
        
        if (probability != undefined) {
            this.probability = probability;
        }
    }

    update_pose_data(right_hand_pose, left_hand_pose, body_pose) {
        if(right_hand_pose != undefined) {
            this.right_hand_pose = right_hand_pose;
        }

        if(left_hand_pose != undefined) {
            this.left_hand_pose = left_hand_pose;
        }

        if(body_pose != undefined) {
            this.body_pose = body_pose;
        }
    }

    show(sketch) {
        if(this.is_correction_running){
            // console.log("correction")
            this.correction.show(sketch);
        }
        else {
            // console.log("guessing")
            //Affichage de l'action détectée
            sketch.fill(this.dark_blue);
            sketch.noStroke();
            if (this.guessed_sign != undefined) {
                sketch.rect(0, 60, int(this.probability * this.guessed_sign.length * 20), 40);
            }

            sketch.textSize(32);
            sketch.fill(this.white);
            sketch.text(this.guessed_sign, 0, 85);

            //affichage du targeted_sign
            sketch.fill(this.red);
            sketch.noStroke();
            sketch.rect(0, 120, 150, 40);

            sketch.textSize(32);
            sketch.fill(this.white);
            if (this.targeted_sign != undefined) sketch.text(this.targeted_sign, 0, 145);

            //Affichage de la séquence
            sketch.fill(this.dark_blue);
            sketch.noStroke();
            sketch.rect(0, 0, 740, 40);

            sketch.textSize(32);
            sketch.fill(this.white);
            sketch.text(this.sentence, 3, 30);

            // sketch.text(this.playable, 0, 185);

            // sketch.text(this.playing, 0, 225);

            // sketch.text(this.count_valid, 0, 265);

            if (!this.running) {
                if(!this.isStopped) {
                    sketch.remove(this.video);
                    // this.video.hide();
                    sketch.emit("core-app_manager-stop_application", {
                        application_name: "sign_training"
                    });
                }
                this.isStopped = true;
            }
        }
    }

    reset() {
        this.playing = false;
        this.playable = true;
        this.last_played = Date.now();
        this.running = true;
        this.count_valid = 0;
        this.targeted_sign_idx = 0;
    }

    update(sketch) {
        if (Date.now() - this.last_interract > 60000) this.running = false;
        // if (Date.now() - this.last_interract < 3000) this.guessed_sign = "empty";

        if (this.actions == undefined) return;

        if(this.is_correction_running){
            // console.log("correction")
            this.correction.update_data(this.right_hand_pose, this.left_hand_pose, this.body_pose);
            this.correction.update(sketch);
            this.is_correction_running = this.correction.is_running;
        }
        else {

            if (this.video != undefined) {
                // on rejoue la vidéo toutes les 10 secondes si l'utilisateur ne trouve pas le mot
                if (Date.now() - this.last_played > 15000) {
                    this.video.hide();
                    this.playTuto();
                    return;
                }

                if (this.video.elt.ended) {
                    this.playing = false;
                    this.targeted_sign = "nothing"
                }

                //lancement de la vidéo si l'utilisateur fait le bon signe
                if (this.video.elt.ended && this.playable) {
                    this.video.hide();
                    this.playTuto();
                    return;
                }
            }
            else {
                this.playTuto()
                return;
            }

            if (this.guessed_sign != undefined && this.probability != undefined  && !this.playing) {
                this.targeted_sign = this.actions[this.targeted_sign_idx];

                if (this.probability > this.threshold && this.guessed_sign != "nothing" && this.guessed_sign != "empty" ) {
                    if (this.sentence.length > 0) {
                        if (this.guessed_sign != this.sentence[this.sentence.length - 1]) {
                            this.sentence.push(this.guessed_sign);
                        }
                    }
                    else {
                        this.sentence.push(this.guessed_sign);
                    }
                }
                if (this.sentence.length > 5) {
                    this.sentence.shift();
                }
            }

            if (this.guessed_sign == this.targeted_sign) {
                this.count_valid += 1;
            }
            else {
                this.count_valid = 0;
            }
            
            if (this.count_valid >= 10 && Date.now())  { 
                this.correction = new Correction(sketch, this.targeted_sign);
                this.is_correction_running = true;
                this.video.hide();
                sketch.remove(this.video);

                this.targeted_sign_idx++;

                this.last_interract = Date.now();
                this.guessed_sign = "empty";

                if (this.targeted_sign_idx < this.actions.length) {
                    if (!this.playing) {
                        this.playable = true;
                    }
                }
                this.count_valid = 0;
            }

            if (this.targeted_sign_idx >= this.actions.length) {
                this.running = false;
            }
        }
    }
}