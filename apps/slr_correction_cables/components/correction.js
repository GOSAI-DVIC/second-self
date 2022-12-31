export class Correction {
    constructor(sketch) {
        this.actions = ["hello", "thanks", "iloveyou"];
        this.actionIdx = 0;

        this.body_indexes_to_study = [0, 11, 12, 15, 16, 23, 24];
        this.hand_indexes_to_study = [0, 5, 17, 4, 8, 20];

        this.cables_right_hand_distances = [];
        this.cables_left_hand_distances = [];

        this.right_hand_distances = [];
        this.left_hand_distances = [];

        this.files_length = 30;

        this.frameIdx = 0;

        this.right_hand_pose;
        this.left_hand_pose;
        this.body_pose;

        this.isDataLoaded = false;

        this.init = false;
        this.offset = [0, 0];
        this.ratio = 1;

        this.body_diff = 0; // The lower, the closer the moves are
        this.right_hand_diff = 0; // The lower, the closer the moves are
        this.left_hand_diff = 0; // The lower, the closer the moves are
        
        this.body_precision = 60; // if this.body_diff < this.body_precision, it goes on
        this.hand_precision = 20;

        this.sample_frames = {};
        this.rebuild_sample_frames = {};
        
        //on load les données à envoyer à cables
        // this.load_frame_cables(sketch, this.actions[this.actionIdx], this.frameIdx)

        //on load les données à comparer avec le miroir
        //on parcourt chaque frame et on l'ajoute à la pose_data
        for(let frameIdx = 0; frameIdx < this.files_length; frameIdx++) {
            loadJSON("./platform/home/apps/slr_correction_cables/components/slr_samples_raw/" + this.actions[this.actionIdx] +"/"+ frameIdx + ".json",
            (data) => {
                //donnée pour la comparaison locale
                sketch.correction.rebuild_sample_frames[frameIdx] = this.rebuild_frame(data);
                //donnée pour l'envoi à cables pour affichage
                sketch.correction.sample_frames[frameIdx] = data;
            });
            if(frameIdx == this.files_length - 1) {
                this.isDataLoaded = true;
            }
        }  
    }

    calibrate_frame_array(frame) {
        let data = {};
        let pose_landmarks = [];
        for (let i = 0; i<frame.body_pose.length; i++) {
            if (i % 2 == 0)
                pose_landmarks.push(frame.body_pose[i]*this.ratio + this.offset[0], frame.body_pose[i+1]*this.ratio + this.offset[1]) 
        }

        let right_hand_landmarks = [];
        for (let i = 0; i< frame.right_hand.length; i++) {
            if (i % 2 == 0)
                right_hand_landmarks.push(frame.right_hand[i]*this.ratio + this.offset[0], frame.right_hand[i+1]*this.ratio + this.offset[1]) 
        } 

        let left_hand_landmarks = [];
        for (let i = 0; i< frame.left_hand.length; i++) {
            if (i % 2 == 0)
                left_hand_landmarks.push(frame.left_hand[i]*this.ratio + this.offset[0], frame.left_hand[i+1]*this.ratio + this.offset[1]) 
        } 

        data["body"] = pose_landmarks;
        data["left_hand"] = left_hand_landmarks;
        data["right_hand"] = right_hand_landmarks;
        return data;
    }

    // cette fonction prend un dictionnaire de la forme {"body_pose": [0.4646635353565216, 0.5532782077789307, -0.7486476302146912,...
    // en entrée et return un dictionnaire de la forme {"body": [[0.4646635353565216, 0.5532782077789307], [-0.7486476302146912,...
    
    rebuild_frame(frame) {
        let data = {};
        let pose_landmarks = [];
        for (let i = 0; i<frame.body_pose.length; i++) {
            if (i % 2 == 0)
                pose_landmarks.push([frame.body_pose[i]*this.ratio + this.offset[0], frame.body_pose[i+1]*this.ratio + this.offset[1]]) 
        }

        let right_hand_landmarks = [];
        for (let i = 0; i< frame.right_hand.length; i++) {
            if (i % 2 == 0)
                right_hand_landmarks.push([frame.right_hand[i]*this.ratio + this.offset[0], frame.right_hand[i+1]*this.ratio + this.offset[1]]) 
        } 

        let left_hand_landmarks = [];
        for (let i = 0; i< frame.left_hand.length; i++) {
            if (i % 2 == 0)
                left_hand_landmarks.push([frame.left_hand[i]*this.ratio + this.offset[0], frame.left_hand[i+1]*this.ratio + this.offset[1]]) 
        } 

        data["body"] = pose_landmarks;
        data["left_hand"] = left_hand_landmarks;
        data["right_hand"] = right_hand_landmarks;
        return data;
    }

    reset() {
        this.actionIdx = 0;
        this.frameIdx = 0;
    }
    /**
     * cette fonction mets les données récupérées de la pose filmée par cables sous le même format
        que les pose_sample_raw récupérés en local. On a pas besoin de mettre au format du miroir
     */
    
    cables_rebuild_landmarks(landmarks) {        
        let landmark_array = [];
        landmarks = landmarks.split(';');
        for (let landmark of landmarks) {
            let [x, y] = landmark.split(',');
            landmark_array.push([parseFloat(x), parseFloat(y)]);
        }
        return landmark_array;
    }

    update_data(right_hand_pose, left_hand_pose, body_pose) {
        
        this.right_hand_pose = right_hand_pose ? this.cables_rebuild_landmarks(right_hand_pose) : [];
        this.left_hand_pose = left_hand_pose ? this.cables_rebuild_landmarks(left_hand_pose) : [];
        this.body_pose = body_pose ? this.cables_rebuild_landmarks(body_pose) : [];
        // console.log(this.left_hand_pose, this.right_hand_pose, this.body_pose)
    }

    update(sketch) {
        if (this.frameIdx > this.files_length - 1) {
            this.frameIdx = 0;
            this.actionIdx++;
        }

        if(this.actionIdx > this.actions.length - 1) {
            this.actionIdx = 0;
        }
        
        if (this.body_pose == undefined || this.body_pose.length <= 0) return;
        // if (this.right_hand_pose == undefined || this.right_hand_pose.length <= 0) return;
        // if (this.left_hand_pose == undefined || this.left_hand_pose.length <= 0) return;
        
        if (!this.isDataLoaded) return;
        if (this.rebuild_sample_frames == undefined || this.rebuild_sample_frames.length <= 0) return;
        if (Object.keys(this.rebuild_sample_frames).length != this.files_length) return
        if (!this.init) {
            this.init = true;
            
            // let mirror_nose_reference = this.body_pose[0].slice(0, 2); // Current nose postion of the user
            // let mirror_left_hip_reference = this.body_pose[12].slice(0, 2); // Current left hip postion of the user

            // let sample_nose_reference = this.rebuild_sample_frames[0]["body"][0].slice(0, 2); // Position in pixels of the first nose of this.rebuild_sample_frames
            // let sample_left_hip_reference = this.rebuild_sample_frames[0]["body"][12].slice(0, 2); // Position in pixels of the first left_hip of this.rebuild_sample_frames

            // let mirror_distance = sketch.dist( //Nose Hip in the mirror
            //     mirror_nose_reference[0],
            //     mirror_nose_reference[1],
            //     mirror_left_hip_reference[0],
            //     mirror_left_hip_reference[1]
            // );

            // let sample_distance = sketch.dist( //Nose hip in the video
            //     sample_nose_reference[0],
            //     sample_nose_reference[1],
            //     sample_left_hip_reference[0],
            //     sample_left_hip_reference[1]
            // );

            // this.ratio = mirror_distance / sample_distance;
            // this.offset = [
            //     mirror_nose_reference[0] - sample_nose_reference[0] * this.ratio,
            //     mirror_nose_reference[1] - sample_nose_reference[1] * this.ratio
            // ];

            // for (let i = 0; i < this.files_length; i++) {
            //     this.rebuild_sample_frames[i] = this.rebuild_frame(this.sample_frames[i])
            //     this.sample_frames[i] = this.calibrate_frame_array(this.sample_frames[i])
            // }

        } else {

            if (this.frameIdx in Object.keys(this.rebuild_sample_frames)) {
                this.cables_right_hand_distances = [];
                this.cables_left_hand_distances = [];
                this.body_diff = 0;

                //calcul des distances entre les points de la pose du miroir et les points de la pose du sample
                if (this.right_hand_pose != undefined && this.right_hand_pose.length != 0 && this.rebuild_sample_frames[this.frameIdx]["right_hand"][0][0] > 0 && this.rebuild_sample_frames[this.frameIdx]["right_hand"][0][1] > 0) {
                    for (let i = 0; i < this.right_hand_pose.length; i++) {
                        this.cables_right_hand_distances.push(
                            sketch.dist(
                                this.rebuild_sample_frames[this.frameIdx]["left_hand"][i][0], //Video x
                                this.rebuild_sample_frames[this.frameIdx]["left_hand"][i][1], //Video y
                                this.right_hand_pose[i][0], //Mirror x
                                this.right_hand_pose[i][1], //Mirror y
                            )
                        );
                    };
                }
                else this.cables_right_hand_distances.push(1);

                if (this.left_hand_pose != undefined && this.left_hand_pose.length != 0 && this.rebuild_sample_frames[this.frameIdx]["left_hand"][0][0] > 0 && this.rebuild_sample_frames[this.frameIdx]["left_hand"][0][1] > 0) {
                    for (let i = 0; i < this.left_hand_pose.length; i++) {
                        this.cables_left_hand_distances.push(
                            sketch.dist(
                                this.offset[0] + this.rebuild_sample_frames[this.frameIdx]["right_hand"][i][0], //Video x
                                this.offset[1] + this.rebuild_sample_frames[this.frameIdx]["right_hand"][i][1], //Video y
                                this.left_hand_pose[i][0], //Mirror x
                                this.left_hand_pose[i][1], //Mirror y
                            )
                        );
                    };
                }
                else this.cables_left_hand_distances.push(1);




                this.right_hand_distances = [];
                this.left_hand_distances = [];
                //calcul des distances entre certains points de la pose du miroir et les points de la pose du sample
                if (this.rebuild_sample_frames[this.frameIdx]["right_hand"][0][0] == 0 && this.rebuild_sample_frames[this.frameIdx]["right_hand"][0][1] == 0)
                {
                    this.right_hand_diff = 0;
                }
                else {
                    if (this.right_hand_pose != undefined && this.right_hand_pose.length != 0 && this.rebuild_sample_frames[this.frameIdx]["right_hand"][0][0] > 0 && this.rebuild_sample_frames[this.frameIdx]["right_hand"][0][1] > 0) {
                        for (let i = 0; i < this.hand_indexes_to_study.length; i++) {
                            this.right_hand_distances.push(
                                sketch.dist(
                                    this.offset[0] + this.rebuild_sample_frames[this.frameIdx]["left_hand"][this.hand_indexes_to_study[i]][0] * this.ratio, //Video x
                                    this.offset[1] + this.rebuild_sample_frames[this.frameIdx]["left_hand"][this.hand_indexes_to_study[i]][1] * this.ratio, //Video y
                                    this.right_hand_pose[this.hand_indexes_to_study[i]][0], //Mirror x
                                    this.right_hand_pose[this.hand_indexes_to_study[i]][1], //Mirror y
                                )
                            );
                        };
                        this.right_hand_diff = Math.round(this.right_hand_distances.reduce((partial_sum, a) => partial_sum + a, 0)*1000 / (this.right_hand_distances.length* this.ratio)); //Mean of kpts differences
                    }
                    else this.right_hand_diff = 100;
                }

                if (this.rebuild_sample_frames[this.frameIdx]["left_hand"][0][0] == 0 && this.rebuild_sample_frames[this.frameIdx]["left_hand"][0][1] == 0)
                {
                    this.left_hand_diff = 0;  
                }
                else
                {
                    if (this.left_hand_pose != undefined && this.left_hand_pose.length != 0 && this.rebuild_sample_frames[this.frameIdx]["left_hand"][0][0] > 0 && this.rebuild_sample_frames[this.frameIdx]["left_hand"][0][1] > 0) {
                        for (let i = 0; i < this.hand_indexes_to_study.length; i++) {
                            this.left_hand_distances.push(
                                sketch.dist(
                                    this.offset[0] + this.rebuild_sample_frames[this.frameIdx]["right_hand"][this.hand_indexes_to_study[i]][0] * this.ratio, //Video x
                                    this.offset[1] + this.rebuild_sample_frames[this.frameIdx]["right_hand"][this.hand_indexes_to_study[i]][1] * this.ratio, //Video y
                                    this.left_hand_pose[this.hand_indexes_to_study[i]][0], //Mirror x
                                    this.left_hand_pose[this.hand_indexes_to_study[i]][1], //Mirror y
                                )
                            );
                        };
                        this.left_hand_diff = Math.round(this.left_hand_distances.reduce((partial_sum, a) => partial_sum + a, 0)*1000 / (this.left_hand_distances.length* this.ratio)); //Mean of kpts differences
                    }
                    else this.left_hand_diff = 100;
                }


                if (this.right_hand_diff < this.hand_precision && this.left_hand_diff < this.hand_precision)
                {    
                    this.frameIdx++;
                }
            } 
            else {
                this.frameIdx++;
            }
        }
    }
}