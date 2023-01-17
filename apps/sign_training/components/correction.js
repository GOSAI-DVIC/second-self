import { Hand } from "./hand.js"
import { Body } from "./body.js"
// import sampleJson from './slr_samples' assert { type: "json" };


export class Correction {
    
    // Une correction est appelée après chaque validation d'un signe
    // Elle dépend de ce signe
    constructor(sketch, action) {
        sketch.selfCanvas.clear();

        this.action = action;

        this.body_indexes_to_study = [0, 11, 12, 15, 16, 23, 24];
        this.hand_indexes_to_study = [0, 5, 17, 4, 8, 20];

        this.right_hand = new Hand("right_hand");
        this.left_hand = new Hand("left_hand");
        this.body = new Body("body");
        this.files_length = 30;

        this.frameIdx = 0;
        this.time = 0;
        this.timelimit = 10000;

        this.right_hand_pose;
        this.left_hand_pose;
        this.body_pose;

        this.isDataLoaded = false;

        this.init = false;
        this.offset = [0, 0];
        this.ratio = 1;

        this.body_diff = 0; // The lower, the closer the moves are
        this.right_hand_diff = 0; // The lower, the closer the moves are
        this.body_precision = 60; // if this.body_diff < this.body_precision, it goes on
        this.hand_precision = 50;
        this.sample_pose_frames = {};

        this.is_running = true;

        //on parcourt chaque frame et on l'ajoute à la pose_data
        for(let frameIdx = 0; frameIdx < this.files_length; frameIdx++) {
            loadJSON("./platform/home/apps/sign_training/components/slr_samples/" + this.action +"/"+ frameIdx + ".json",
            (data) => {
                sketch.slr_training.correction.sample_pose_frames[frameIdx] = this.rebuilt_frame(data);
            });
            if(frameIdx == this.files_length - 1) this.isDataLoaded = true;
        }
    }

    show(sketch) {
        if(this.sample_pose_frames[this.frameIdx] != undefined && this.init) {
            this.right_hand.show(sketch, this.sample_pose_frames[this.frameIdx]["right_hand"], this.offset, this.ratio);
            this.left_hand.show(sketch, this.sample_pose_frames[this.frameIdx]["left_hand"], this.offset, this.ratio);
            this.body.show(sketch, this.sample_pose_frames[this.frameIdx]["body"], this.offset, this.ratio);
        }
    }

    rebuilt_frame(frame) {
        let data = {}
        let pose_landmarks = []
        for (let i = 0; i<33*2; i++) {
            if (i % 2 == 0)
                pose_landmarks.push([Math.floor(frame[i]*this.ratio + this.offset[0]), Math.floor(frame[i+1]*this.ratio + this.offset[1])]) 
        }

        let right_hands_landmarks = []
        for (let i = 33*2; i< 33*2+21*2; i++) {
            if (i % 2 == 0)
            right_hands_landmarks.push([Math.floor(frame[i]*this.ratio + this.offset[0]), Math.floor(frame[i+1]*this.ratio + this.offset[1])]) 
        } 

        let left_hands_landmarks = []
        for (let i = 33*2+21*2; i< frame.length; i++) {
            if (i % 2 == 0)
            left_hands_landmarks.push([Math.floor(frame[i]*this.ratio + this.offset[0]), Math.floor(frame[i+1]*this.ratio + this.offset[1])]) 
        } 

        data["body"] = pose_landmarks
        data["left_hand"] = left_hands_landmarks
        data["right_hand"] = right_hands_landmarks
        return data
    }

    reset() {
        
    }

    update_data(right_hand_pose, left_hand_pose, body_pose) {
        this.right_hand_pose = right_hand_pose;
        this.left_hand_pose = left_hand_pose;
        this.body_pose = body_pose;
    }

    update(sketch) {
        if (this.frameIdx > this.files_length - 1) {
            sketch.selfCanvas.clear();
            this.is_running = false;
            return;
        }
        if (this.body_pose == undefined || this.body_pose.length <= 0) return;
        if (this.right_hand_pose == undefined || this.right_hand_pose.length <= 0) return;
        if (!this.isDataLoaded) return;
        if (this.sample_pose_frames == undefined || this.sample_pose_frames.length <= 0) return;

        if (Object.keys(this.sample_pose_frames).length != this.files_length) return

        if (!this.init) {
            this.init = true;

            let mirror_nose_reference = this.body_pose[0].slice(0, 2); // Current nose postion of the user
            let mirror_left_hip_reference = this.body_pose[24].slice(0, 2); // Current left hip postion of the user
            let sample_nose_reference = this.sample_pose_frames[0]["body"][0].slice(0, 2); // Position in pixels of the first nose of this.sample_pose_frames
            let sample_left_hip_reference = this.sample_pose_frames[0]["body"][24].slice(0, 2); // Position in pixels of the first left_hip of this.sample_pose_frames

            let mirror_distance = sketch.dist( //Nose Hip in the mirror
                mirror_nose_reference[0],
                mirror_nose_reference[1],
                mirror_left_hip_reference[0],
                mirror_left_hip_reference[1]
            );

            let sample_distance = sketch.dist( //Nose hip in the video
                sample_nose_reference[0],
                sample_nose_reference[1],
                sample_left_hip_reference[0],
                sample_left_hip_reference[1]
            );

            this.ratio = mirror_distance / sample_distance;
            this.offset = [
                mirror_nose_reference[0] - sample_nose_reference[0] * this.ratio,
                mirror_nose_reference[1] - sample_nose_reference[1] * this.ratio
            ];

        } else {
            this.time++;
            if (this.time > this.timelimit) {
                sketch.selfCanvas.clear();
                this.is_running = false;
                return;
            }
            if (this.frameIdx in Object.keys(this.sample_pose_frames)) {
                let body_distances = [];
                let right_hand_distances = [];
                for (let i = 0; i < this.body_indexes_to_study.length; i++) {
                    body_distances.push(
                        sketch.dist(
                            this.offset[0] + this.sample_pose_frames[this.frameIdx]["body"][this.body_indexes_to_study[i]][0] * this.ratio, //Video x
                            this.offset[1] + this.sample_pose_frames[this.frameIdx]["body"][this.body_indexes_to_study[i]][1] * this.ratio, //Video y
                            this.body_pose[this.body_indexes_to_study[i]][0], //Mirror x
                            this.body_pose[this.body_indexes_to_study[i]][1], //Mirror y
                        )
                    );
                }
                this.body_diff = body_distances.reduce((partial_sum, a) => partial_sum + a, 0) / (body_distances.length* this.ratio); //Mean of kpts differences

                if (this.sample_pose_frames[this.frameIdx]["right_hand"][0][0] == this.sample_pose_frames[this.frameIdx]["right_hand"][0][1] == 0) {
                    for (let i = 0; i < this.hand_indexes_to_study.length; i++) {
                        right_hand_distances.push(
                            sketch.dist(
                                this.offset[0] + this.sample_pose_frames[this.frameIdx]["right_hand"][this.hand_indexes_to_study[i]][0] * this.ratio, //Video x
                                this.offset[1] + this.sample_pose_frames[this.frameIdx]["right_hand"][this.hand_indexes_to_study[i]][1] * this.ratio, //Video y
                                this.right_hand_pose[this.hand_indexes_to_study[i]][0], //Mirror x
                                this.right_hand_pose[this.hand_indexes_to_study[i]][1], //Mirror y
                            )
                        );
                    }
                    this.right_hand_diff = right_hand_distances.reduce((partial_sum, a) => partial_sum + a, 0) / (right_hand_distances.length* this.ratio); //Mean of kpts differences
                }
                else this.right_hand_diff = 0;

                if (this.body_diff < this.body_precision && this.right_hand_diff < this.hand_precision) {
                    this.frameIdx++;
                    this.time = max(0, this.time - 5);
                    // console.log("Frame " + this.frameIdx + " " + this.action);
                }
            } else {
                this.frameIdx++;
            }
        }
    }
}