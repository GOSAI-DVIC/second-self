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
        this.sample_pose_frames = {};

        //on parcourt chaque frame et on l'ajoute à la pose_data
        for(let frameIdx = 0; frameIdx < this.files_length; frameIdx++) {
            loadJSON("./platform/home/apps/sign_training/components/slr_samples/" + this.actions[this.actionIdx] +"/"+ frameIdx + ".json",
            (data) => {
                sketch.correction.sample_pose_frames[frameIdx] = this.rebuild_frame(data);
            });
            if(frameIdx == this.files_length - 1) this.isDataLoaded = true;
        }
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

    cables_landmarks_to_mirror_array(landmarks, min_width, width, height) {
        let landmark_array = [];
        landmarks = landmarks.split(';');
        for (let landmark of landmarks) {
            let [x, y] = landmark.split(',');
            x = min_width + Math.round(x* width);
            y = Math.round(y * height);
            landmark_array.push([x, y]);
        }
        // console.log(landmark_array)
        return landmark_array;
    }

    update_data(right_hand_pose, left_hand_pose, body_pose) {
        let window = 1.0;
        let image_shape = [480, 448];
        let min_width = int((0.5 - window / 2) * image_shape[1]);
        this.right_hand_pose = right_hand_pose ? this.cables_landmarks_to_mirror_array(right_hand_pose, min_width, image_shape[1], image_shape[0]) : [];
        this.left_hand_pose = left_hand_pose ? this.cables_landmarks_to_mirror_array(left_hand_pose, min_width, image_shape[1], image_shape[0]) : [];
        this.body_pose = body_pose ? this.cables_landmarks_to_mirror_array(body_pose, min_width, image_shape[1], image_shape[0]) : [];
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

            if (this.frameIdx in Object.keys(this.sample_pose_frames)) {
                let body_distances = [];
                let right_hand_distances = [];
                let left_hand_distances = [];

                if (this.sample_pose_frames[this.frameIdx]["body"][0][0] > 0 && this.sample_pose_frames[this.frameIdx]["body"][0][1] > 0) {
                    for (let i = 0; i < this.body_indexes_to_study.length; i++) {
                        body_distances.push(
                            sketch.dist(
                                this.offset[0] + this.sample_pose_frames[this.frameIdx]["body"][this.body_indexes_to_study[i]][0] * this.ratio, //Video x
                                this.offset[1] + this.sample_pose_frames[this.frameIdx]["body"][this.body_indexes_to_study[i]][1] * this.ratio, //Video y
                                this.body_pose[this.body_indexes_to_study[i]][0], //Mirror x
                                this.body_pose[this.body_indexes_to_study[i]][1], //Mirror y
                            )
                        );
                    };
                    this.body_diff = body_distances.reduce((partial_sum, a) => partial_sum + a, 0) / (body_distances.length* this.ratio); //Mean of kpts differences
                }
                else this.body_diff = 0;

                if (this.right_hand_pose != undefined && this.right_hand_pose.length != 0 && this.sample_pose_frames[this.frameIdx]["right_hand"][0][0] > 0 && this.sample_pose_frames[this.frameIdx]["right_hand"][0][1] > 0) {
                    for (let i = 0; i < this.hand_indexes_to_study.length; i++) {
                        right_hand_distances.push(
                            sketch.dist(
                                this.offset[0] + this.sample_pose_frames[this.frameIdx]["right_hand"][this.hand_indexes_to_study[i]][0] * this.ratio, //Video x
                                this.offset[1] + this.sample_pose_frames[this.frameIdx]["right_hand"][this.hand_indexes_to_study[i]][1] * this.ratio, //Video y
                                this.right_hand_pose[this.hand_indexes_to_study[i]][0], //Mirror x
                                this.right_hand_pose[this.hand_indexes_to_study[i]][1], //Mirror y
                            )
                        );
                    };
                    this.right_hand_diff = right_hand_distances.reduce((partial_sum, a) => partial_sum + a, 0) / (right_hand_distances.length* this.ratio); //Mean of kpts differences
                }
                else this.right_hand_diff = 0;

                if (this.left_hand_pose != undefined && this.left_hand_pose.length != 0 && this.sample_pose_frames[this.frameIdx]["left_hand"][0][0] > 0 && this.sample_pose_frames[this.frameIdx]["left_hand"][0][1] > 0) {
                    for (let i = 0; i < this.hand_indexes_to_study.length; i++) {
                        left_hand_distances.push(
                            sketch.dist(
                                this.offset[0] + this.sample_pose_frames[this.frameIdx]["left_hand"][this.hand_indexes_to_study[i]][0] * this.ratio, //Video x
                                this.offset[1] + this.sample_pose_frames[this.frameIdx]["left_hand"][this.hand_indexes_to_study[i]][1] * this.ratio, //Video y
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
                    this.frameIdx++;
            } 
            else {
                this.frameIdx++;
            }
        }
    }
}