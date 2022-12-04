import Vector from "../utils/vector.js";
import { clamp, remap } from "../utils/helpers.js";
import { PI } from "./../constants.js";

/**
 * Calculates Hip rotation and world position
 * @param {Array} lm3d : array of 3D pose vectors from tfjs or mediapipe
 * @param {Array} lm2d : array of 2D pose vectors from tfjs or mediapipe
 */

 let pose_keypoints = ['nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
 'right_eye_inner', 'right_eye', 'right_eye_outer',
 'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
 'left_shoulder', 'right_shoulder', 'left_elbow',
 'right_elbow', 'left_wrist', 'right_wrist', 'left_pinky',
 'right_pinky', 'left_index', 'right_index', 'left_thumb',
 'right_thumb', 'left_hip', 'right_hip', 'left_knee', 'right_knee',
 'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
 'left_foot_index', 'right_foot_index'
];

let pose_symmetry_map = 
{
 "nose": "nose",
 "left_eye_inner": "right_eye_inner",
 "left_eye": "right_eye",
 "left_eye_outer": "right_eye_outer",
 "right_eye_inner": "left_eye_inner",
 "right_eye": "left_eye",
 "right_eye_outer": "left_eye_outer",
 "left_ear": "right_ear",
 "right_ear": "left_ear",
 "mouth_left": "mouth_right",
 "mouth_right": "mouth_left",
 "left_shoulder": "right_shoulder",
 "right_shoulder": "left_shoulder",
 "left_elbow": "right_elbow",
 "right_elbow": "left_elbow",
 "left_wrist": "right_wrist",
 "right_wrist": "left_wrist",
 "left_pinky": "right_pinky",
 "right_pinky": "left_pinky",
 "left_index": "right_index",
 "right_index": "left_index",
 "left_thumb": "right_thumb",
 "right_thumb": "left_thumb",
 "left_hip": "right_hip",
 "right_hip": "left_hip",
 "left_knee": "right_knee",
 "right_knee": "left_knee",
 "left_ankle": "right_ankle",
 "right_ankle": "left_ankle",
 "left_heel": "right_heel",
 "right_heel": "left_heel",
 "left_foot_index": "right_foot_index",
 "right_foot_index": "left_foot_index"
}

function invertRightLeftPose(pose) {
    // Invert right/left pose
    if (pose) {
        let inverted_pose = {};
        for (let i = 0; i < Object.keys(pose).length; i++) {
            let point = pose[i];
            let point_name = pose_keypoints[i];
            let point_opposite_name = pose_symmetry_map[point_name];
            let point_opposite_index = pose_keypoints.findIndex((keypoint) => keypoint === point_opposite_name);
            inverted_pose[point_opposite_index] = point;
            // console.log("inverting " + i + " to " + point_opposite_index);
        }
        return inverted_pose;
    }
}

export const calcHips = (lm3d, lm2d) => {
    // lm3d = invertRightLeftPose(lm3d);
    // lm2d = invertRightLeftPose(lm2d);
    //Find 2D normalized Hip and Shoulder Joint Positions/Distances
    const hipLeft2d = Vector.fromArray(lm2d[23]);
    const hipRight2d = Vector.fromArray(lm2d[24]);
    const shoulderLeft2d = Vector.fromArray(lm2d[11]);
    const shoulderRight2d = Vector.fromArray(lm2d[12]);
    const hipCenter2d = hipLeft2d.lerp(hipRight2d, 1);
    const shoulderCenter2d = shoulderLeft2d.lerp(shoulderRight2d, 1);
    const spineLength = hipCenter2d.distance(shoulderCenter2d);

    const hips= {
        position: {
            x: clamp(hipCenter2d.x - 0.4, -1, 1), //subtract .4 to bring closer to 0,0 center
            y: 0,
            z: clamp(spineLength - 1, -2, 0),
        },
    };
    hips.worldPosition = {
        x: hips.position.x,
        y: 0,
        z: hips.position.z * Math.pow(hips.position.z * -2, 2),
    };
    hips.worldPosition.x *= hips.worldPosition.z;

    hips.rotation = Vector.rollPitchYaw(lm3d[23], lm3d[24]);
    //fix -PI, PI jumping
    if (hips.rotation.y > 0.5) {
        hips.rotation.y -= 2;
    }
    hips.rotation.y += 0.5;
    //Stop jumping between left and right shoulder tilt
    if (hips.rotation.z > 0) {
        hips.rotation.z = 1 - hips.rotation.z;
    }
    if (hips.rotation.z < 0) {
        hips.rotation.z = -1 - hips.rotation.z;
    }
    const turnAroundAmountHips = remap(Math.abs(hips.rotation.y), 0.2, 0.4);
    hips.rotation.z *= 1 - turnAroundAmountHips;
    hips.rotation.x = 0; //temp fix for inaccurate X axis

    const spine = Vector.rollPitchYaw(lm3d[11], lm3d[12]);
    //fix -PI, PI jumping
    if (spine.y > 0.5) {
        spine.y -= 2;
    }
    spine.y += 0.5;
    //Stop jumping between left and right shoulder tilt
    if (spine.z > 0) {
        spine.z = 1 - spine.z;
    }
    if (spine.z < 0) {
        spine.z = -1 - spine.z;
    }
    //fix weird large numbers when 2 shoulder points get too close
    const turnAroundAmount = remap(Math.abs(spine.y), 0.2, 0.4);
    spine.z *= 1 - turnAroundAmount;
    spine.x = 0; //temp fix for inaccurate X axis

    return rigHips(hips, spine);
};

/**
 * Converts normalized rotations to radians and estimates world position of hips
 * @param {Object} hips : hip position and rotation values
 * @param {Object} spine : spine position and rotation values
 */
export const rigHips = (hips, spine) => {
    //convert normalized values to radians
    if (hips.rotation) {
        hips.rotation.x *= -Math.PI;
        hips.rotation.y *= -Math.PI;
        hips.rotation.z *= -Math.PI;
    }

    spine.x *= -PI;
    spine.y *= -PI;
    spine.z *= -PI;

    return {
        Hips: hips,
        Spine: spine,
    };
};
