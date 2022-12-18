export class Correction {
    constructor(sketch) {
        this.actions = ["hello", "thanks", "iloveyou"];
        this.actionIdx = 0;

        this.body_indexes_to_study = [0, 11, 12, 15, 16, 23, 24];
        this.hand_indexes_to_study = [0, 5, 17, 4, 8, 20];

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
        this.hand_precision = 60;
        this.mirror_sample_pose_frames = {};
        this.cables_sample_pose_frames = {};
        
        //on load les données à envoyer à cables
        this.load_frame_cables(sketch, this.actions[this.actionIdx], this.frameIdx)

        //on load les données à comparer avec le miroir
        //on parcourt chaque frame et on l'ajoute à la pose_data
        for(let frameIdx = 0; frameIdx < this.files_length; frameIdx++) {
            loadJSON("./platform/home/apps/slr_correction_cables/components/slr_samples/" + this.actions[this.actionIdx] +"/"+ frameIdx + ".json",
            (data) => {
                sketch.correction.mirror_sample_pose_frames[frameIdx] = this.rebuild_frame(data);
            });
            if(frameIdx == this.files_length - 1) {
                this.isDataLoaded = true;
            }
        }

        
    }

    load_frame_cables(sketch, action, frameIdx) {
        loadJSON("./platform/home/apps/slr_correction_cables/components/slr_samples_raw/" + action +"/"+ frameIdx + ".json",
        (data) => {
            sketch.correction.cables_sample_pose_frames = data;
        });
    }

    rebuild_frame(frame) {
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
        this.actionIdx = 0;
        this.frameIdx = 0;
    }

    cables_landmarks_to_mirror_array(landmarks) {
        let window = 1.0;
        let image_shape = [480, 448];
        let min_width = int((0.5 - window / 2) * image_shape[1]);
        
        let landmark_array = [];
        landmarks = landmarks.split(';');
        for (let landmark of landmarks) {
            let [x, y] = landmark.split(',');
            x = min_width + Math.round(x* image_shape[1]);
            y = Math.round(y * image_shape[0]);
            landmark_array.push([x, y]);
        }
        return landmark_array;
    }

    // mirror_landmarks_to_cables_dict(landmarks) {
    //     let window = 1.0;
    //     let image_shape = [480, 448];
    //     let min_width = int((0.5 - window / 2) * image_shape[1]);
    //     let width = image_shape[1];
    //     let height = image_shape[0];

    //     let landmark_dict = {};
    //     for(let frameIdx = 0; frameIdx < this.files_length; frameIdx++) {
    //         for (let member of Object.keys(landmarks[frameIdx])) {
    //             if (landmark_dict[frameIdx] == undefined) 
    //                 landmark_dict[frameIdx] = {};
    //             if(landmark_dict[frameIdx][member] == undefined)
    //                 landmark_dict[frameIdx][member] = [];

    //             for (let coor of landmarks[frameIdx][member])
    //             {
    //                 let x = coor[0] / width - min_width;
    //                 let y = coor[1] / height;
    //                 let z = 0;
    //                 landmark_dict[frameIdx][member].push([x, y, z]);
    //             }
    //         }
    //     }
    //     return landmark_dict;
    // }

    // mirror_landmarks_to_cables_dict(landmarks) {
    //     let window = 1.0;
    //     let image_shape = [480, 448];
    //     let min_width = int((0.5 - window / 2) * image_shape[1]);
    //     let width = image_shape[1];
    //     let height = image_shape[0];

    //     let landmark_dict = {};
    //     for(let frameIdx = 0; frameIdx < this.files_length; frameIdx++) {

    //         for (let member of Object.keys(landmarks[frameIdx])) {
    //             if (landmark_dict[frameIdx] == undefined) 
    //                 landmark_dict[frameIdx] = {};
    //             if(landmark_dict[frameIdx][member] == undefined)
    //                 landmark_dict[frameIdx][member] = [];

    //             for (let coor of landmarks[frameIdx][member])
    //             {
    //                 let x = coor[0] / width - min_width;
    //                 let y = coor[1] / height;
    //                 let z = 0;
    //                 landmark_dict[frameIdx][member].push(x, y, z);
    //             }
    //         }
    //     }
    //     console.log(landmark_dict)
    //     return landmark_dict;
    // }

    update_data(right_hand_pose, left_hand_pose, body_pose) {
        
        this.right_hand_pose = right_hand_pose ? this.cables_landmarks_to_mirror_array(right_hand_pose) : [];
        this.left_hand_pose = left_hand_pose ? this.cables_landmarks_to_mirror_array(left_hand_pose) : [];
        this.body_pose = body_pose ? this.cables_landmarks_to_mirror_array(body_pose) : [];
    }

    update(sketch) {
        if (this.frameIdx > this.files_length - 1) {
            if(this.actionIdx > this.actions.length - 1) {
                this.reset();
            }
            else {
                this.frameIdx
                this.actionIdx+1
            }
        }
        if (this.body_pose == undefined || this.body_pose.length <= 0) return;
        // if (this.right_hand_pose == undefined || this.right_hand_pose.length <= 0) return;
        // if (this.left_hand_pose == undefined || this.left_hand_pose.length <= 0) return;
        if (!this.isDataLoaded) return;
        if (this.mirror_sample_pose_frames == undefined || this.mirror_sample_pose_frames.length <= 0) return;
        if (Object.keys(this.mirror_sample_pose_frames).length != this.files_length) return
        
        if (!this.init) {
            this.init = true;
            console.log(this.cables_sample_pose_frames)
            
            // this.cables_sample_pose_frames = this.mirror_landmarks_to_cables_dict(this.mirror_sample_pose_frames);


            let mirror_nose_reference = this.body_pose[0].slice(0, 2); // Current nose postion of the user
            let mirror_left_hip_reference = this.body_pose[24].slice(0, 2); // Current left hip postion of the user

            let sample_nose_reference = this.mirror_sample_pose_frames[0]["body"][0].slice(0, 2); // Position in pixels of the first nose of this.mirror_sample_pose_frames
            let sample_left_hip_reference = this.mirror_sample_pose_frames[0]["body"][24].slice(0, 2); // Position in pixels of the first left_hip of this.mirror_sample_pose_frames

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

            if (this.frameIdx in Object.keys(this.mirror_sample_pose_frames)) {
                let body_distances = [];
                let right_hand_distances = [];
                let left_hand_distances = [];

                if (this.mirror_sample_pose_frames[this.frameIdx]["body"][0][0] > 0 && this.mirror_sample_pose_frames[this.frameIdx]["body"][0][1] > 0) {
                    for (let i = 0; i < this.body_indexes_to_study.length; i++) {
                        body_distances.push(
                            sketch.dist(
                                this.offset[0] + this.mirror_sample_pose_frames[this.frameIdx]["body"][this.body_indexes_to_study[i]][0] * this.ratio, //Video x
                                this.offset[1] + this.mirror_sample_pose_frames[this.frameIdx]["body"][this.body_indexes_to_study[i]][1] * this.ratio, //Video y
                                this.body_pose[this.body_indexes_to_study[i]][0], //Mirror x
                                this.body_pose[this.body_indexes_to_study[i]][1], //Mirror y
                            )
                        );
                    };
                    this.body_diff = body_distances.reduce((partial_sum, a) => partial_sum + a, 0) / (body_distances.length* this.ratio); //Mean of kpts differences
                }
                else this.body_diff = 0;

                if (this.right_hand_pose != undefined && this.right_hand_pose.length != 0 && this.mirror_sample_pose_frames[this.frameIdx]["right_hand"][0][0] > 0 && this.mirror_sample_pose_frames[this.frameIdx]["right_hand"][0][1] > 0) {
                    for (let i = 0; i < this.hand_indexes_to_study.length; i++) {
                        right_hand_distances.push(
                            sketch.dist(
                                this.offset[0] + this.mirror_sample_pose_frames[this.frameIdx]["right_hand"][this.hand_indexes_to_study[i]][0] * this.ratio, //Video x
                                this.offset[1] + this.mirror_sample_pose_frames[this.frameIdx]["right_hand"][this.hand_indexes_to_study[i]][1] * this.ratio, //Video y
                                this.right_hand_pose[this.hand_indexes_to_study[i]][0], //Mirror x
                                this.right_hand_pose[this.hand_indexes_to_study[i]][1], //Mirror y
                            )
                        );
                    };
                    this.right_hand_diff = right_hand_distances.reduce((partial_sum, a) => partial_sum + a, 0) / (right_hand_distances.length* this.ratio); //Mean of kpts differences
                }
                else this.right_hand_diff = 0;

                if (this.left_hand_pose != undefined && this.left_hand_pose.length != 0 && this.mirror_sample_pose_frames[this.frameIdx]["left_hand"][0][0] > 0 && this.mirror_sample_pose_frames[this.frameIdx]["left_hand"][0][1] > 0) {
                    for (let i = 0; i < this.hand_indexes_to_study.length; i++) {
                        left_hand_distances.push(
                            sketch.dist(
                                this.offset[0] + this.mirror_sample_pose_frames[this.frameIdx]["left_hand"][this.hand_indexes_to_study[i]][0] * this.ratio, //Video x
                                this.offset[1] + this.mirror_sample_pose_frames[this.frameIdx]["left_hand"][this.hand_indexes_to_study[i]][1] * this.ratio, //Video y
                                this.left_hand_pose[this.hand_indexes_to_study[i]][0], //Mirror x
                                this.left_hand_pose[this.hand_indexes_to_study[i]][1], //Mirror y
                            )
                        );
                    };
                    this.left_hand_diff = left_hand_distances.reduce((partial_sum, a) => partial_sum + a, 0) / (left_hand_distances.length* this.ratio); //Mean of kpts differences
                }
                else {
                    this.left_hand_diff = 0;
                }
                // console.log(this.body_diff, this.right_hand_diff, this.left_hand_diff)
                if (this.body_diff < this.body_precision && this.right_hand_diff < this.hand_precision && this.left_hand_diff < this.left_hand_precision)
                {    
                    this.frameIdx++;
                    this.cables_sample_pose_frames = {}
                    if (this.frameIdx < this.files_length)
                        this.cables_sample_pose_frames = this.load_frame_cables(this.actions[this.actionIdx], this.frameIdx)
                    
                }
            } 
            else {
                this.frameIdx++;
            }
        }
    }
}