import * as Kalidokit from "./dist/index.js";
import * as THREE from 'three';
// import * as THREE from 'three';
// import * as THREE_VRM from "three_vrm"
// import {VRM, VRMUtils} from 'three-vrm';
// import {VRM, VRMUtils} from './three-vrm.js';
import { OrbitControls } from 'https://unpkg.com/three@0.133.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.133.0/examples/jsm/loaders/GLTFLoader.js';
import {WebGLRenderer} from 'https://unpkg.com/three@0.133.0/src/renderers/WebGLRenderer.js'
import { VRM, VRMUtils } from "./three-vrm.module.js"
// import * as THREE from "./three-vrm.js"


export class myScene {
    constructor() {
        this.face_mesh = [];
        this.body_pose = [];
        this.right_hand_pose = [];
        this.left_hand_pose = [];

        const canvasElement = document.createElement('canvas');
        let sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }
        canvasElement.width = sizes.width;
        canvasElement.height = sizes.height;
        canvasElement.style.position = "absolute";
        canvasElement.style.left = "0px"
        canvasElement.style.top = "0px"
        canvasElement.style.zIndex = 5

        //Import Helper Functions from Kalidokit
        const remap = Kalidokit.Utils.remap;
        const clamp = Kalidokit.Utils.clamp;
        const lerp = Kalidokit.Vector.lerp;

        /* THREEJS WORLD SETUP */
        this.currentVrm;

        // renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvasElement,
            alpha: true,
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // camera
        this.orbitCamera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.orbitCamera.position.set(0.0, 1.4, 0.7);

        // controls
        const orbitControls = new OrbitControls(this.orbitCamera, this.renderer.domElement);
        orbitControls.screenSpacePanning = true;
        orbitControls.target.set(0.0, 1.4, 0.0);
        orbitControls.update();

        // scene
        this.scene = new THREE.Scene();

        // light
        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1.0, 1.0, 1.0).normalize();
        this.scene.add(light);

        // Main Render Loop
        this.clock = new THREE.Clock();

        // requestAnimationFrame(animate);

        // Import Character VRM
        const loader = new GLTFLoader();
        loader.crossOrigin = "anonymous";
        // Import model from URL, add your own model here
        // console.log(window.location)
        loader.load(
            // "https://cdn.glitch.com/29e07830-2317-4b15-a044-135e73c7f840%2FAshtra.vrm?v=1630342336981",
            "./platform/home/apps/aria/components/models/Yuya.vrm",
            // "https://cdn.glitch.com/29e07830-2317-4b15-a044-135e73c7f840%2Fthree-vrm-girl.vrm",
            (gltf) => {
                VRMUtils.removeUnnecessaryJoints(gltf.scene);

                VRM.from(gltf).then((vrm) => {
                    this.scene.add(vrm.scene);
                    this.currentVrm = vrm;
                    this.currentVrm.scene.rotation.y = Math.PI; // Rotate model 180deg to face camera
                });
            },

            (progress) => console.log("Loading model...", 100.0 * (progress.loaded / progress.total), "%"),

            (error) => console.error(error)
        );

        // Animate Rotation Helper function
        const rigRotation = (name, rotation = {
            x: 0,
            y: 0,
            z: 0
        }, dampener = 1, lerpAmount = 0.3) => {
            if (!this.currentVrm) {
                return;
            }
            const Part = this.currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName[name]);
            if (!Part) {
                return;
            }

            let euler = new THREE.Euler(
                rotation.x * dampener,
                rotation.y * dampener,
                rotation.z * dampener,
                rotation.rotationOrder || "XYZ"
            );
            let quaternion = new THREE.Quaternion().setFromEuler(euler);
            Part.quaternion.slerp(quaternion, lerpAmount); // interpolate
        };

        // Animate Position Helper Function
        const rigPosition = (name, position = {
            x: 0,
            y: 0,
            z: 0
        }, dampener = 1, lerpAmount = 0.3) => {
            if (!this.currentVrm) {
                return;
            }
            const Part = this.currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName[name]);
            if (!Part) {
                return;
            }
            let vector = new THREE.Vector3(position.x * dampener, position.y * dampener, position.z * dampener);
            Part.position.lerp(vector, lerpAmount); // interpolate
        };

        let oldLookTarget = new THREE.Euler();
        const rigFace = (riggedFace) => {
            if (!this.currentVrm) {
                return;
            }
            rigRotation("Neck", riggedFace.head, 0.7);

            // Blendshapes and Preset Name Schema
            const Blendshape = this.currentVrm.blendShapeProxy;
            const PresetName = THREE.VRMSchema.BlendShapePresetName;

            // Simple example without winking. Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
            // for VRM, 1 is closed, 0 is open.
            riggedFace.eye.l = lerp(clamp(1 - riggedFace.eye.l, 0, 1), Blendshape.getValue(PresetName.Blink), 0.5);
            riggedFace.eye.r = lerp(clamp(1 - riggedFace.eye.r, 0, 1), Blendshape.getValue(PresetName.Blink), 0.5);
            riggedFace.eye = Kalidokit.Face.stabilizeBlink(riggedFace.eye, riggedFace.head.y);
            Blendshape.setValue(PresetName.Blink, riggedFace.eye.l);

            // Interpolate and set mouth blendshapes
            Blendshape.setValue(PresetName.I, lerp(riggedFace.mouth.shape.I, Blendshape.getValue(PresetName.I), 0.5));
            Blendshape.setValue(PresetName.A, lerp(riggedFace.mouth.shape.A, Blendshape.getValue(PresetName.A), 0.5));
            Blendshape.setValue(PresetName.E, lerp(riggedFace.mouth.shape.E, Blendshape.getValue(PresetName.E), 0.5));
            Blendshape.setValue(PresetName.O, lerp(riggedFace.mouth.shape.O, Blendshape.getValue(PresetName.O), 0.5));
            Blendshape.setValue(PresetName.U, lerp(riggedFace.mouth.shape.U, Blendshape.getValue(PresetName.U), 0.5));

            //PUPILS
            //interpolate pupil and keep a copy of the value
            let lookTarget = new THREE.Euler(
                lerp(oldLookTarget.x, riggedFace.pupil.y, 0.4),
                lerp(oldLookTarget.y, riggedFace.pupil.x, 0.4),
                0,
                "XYZ"
            );
            oldLookTarget.copy(lookTarget);
            this.currentVrm.lookAt.applyer.lookAt(lookTarget);
        };
    }

    animateVRM = (results) => {
        if (!this.currentVrm) {
            return;
        }
        // Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
        let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

        const faces_landmarks = results.face_mesh;
        // Pose 3D Landmarks are with respect to Hip distance in meters
        const pose3DLandmarks = results.body_pose;
        // Pose 2D landmarks are with respect to videoWidth and videoHeight
        // const pose2DLandmarks = results.body_landmarks;
        // Be careful, hand landmarks may be reversed
        const left_hands_landmarks = results.right_hand_pose;
        const right_hand_landmarks = results.left_hand_pose;

        // Animate Face
        if (faces_landmarks) {
            riggedFace = Kalidokit.Face.solve(faces_landmarks, {
                runtime: "mediapipe",
                video: videoElement,
            });
            rigFace(riggedFace);
        }

        // Animate Pose
        if (pose2DLandmarks && pose3DLandmarks) {
            riggedPose = Kalidokit.Pose.solve(pose3DLandmarks, pose2DLandmarks, {
                runtime: "mediapipe",
                video: videoElement,
            });
            rigRotation("Hips", riggedPose.Hips.rotation, 0.7);
            rigPosition(
                "Hips", {
                    x: riggedPose.Hips.position.x, // Reverse direction
                    y: riggedPose.Hips.position.y + 1, // Add a bit of height
                    z: -riggedPose.Hips.position.z, // Reverse direction
                },
                1,
                0.07
            );

            rigRotation("Chest", riggedPose.Spine, 0.25, 0.3);
            rigRotation("Spine", riggedPose.Spine, 0.45, 0.3);

            rigRotation("RightUpperArm", riggedPose.RightUpperArm, 1, 0.3);
            rigRotation("RightLowerArm", riggedPose.RightLowerArm, 1, 0.3);
            rigRotation("LeftUpperArm", riggedPose.LeftUpperArm, 1, 0.3);
            rigRotation("LeftLowerArm", riggedPose.LeftLowerArm, 1, 0.3);

            rigRotation("LeftUpperLeg", riggedPose.LeftUpperLeg, 1, 0.3);
            rigRotation("LeftLowerLeg", riggedPose.LeftLowerLeg, 1, 0.3);
            rigRotation("RightUpperLeg", riggedPose.RightUpperLeg, 1, 0.3);
            rigRotation("RightLowerLeg", riggedPose.RightLowerLeg, 1, 0.3);
        }

        // Animate Hands
        if (left_hands_landmarks) {
            riggedLeftHand = Kalidokit.Hand.solve(left_hands_landmarks, "Left");
            rigRotation("LeftHand", {
                // Combine pose rotation Z and hand rotation X Y
                z: riggedPose.LeftHand.z,
                y: riggedLeftHand.LeftWrist.y,
                x: riggedLeftHand.LeftWrist.x,
            });
            rigRotation("LeftRingProximal", riggedLeftHand.LeftRingProximal);
            rigRotation("LeftRingIntermediate", riggedLeftHand.LeftRingIntermediate);
            rigRotation("LeftRingDistal", riggedLeftHand.LeftRingDistal);
            rigRotation("LeftIndexProximal", riggedLeftHand.LeftIndexProximal);
            rigRotation("LeftIndexIntermediate", riggedLeftHand.LeftIndexIntermediate);
            rigRotation("LeftIndexDistal", riggedLeftHand.LeftIndexDistal);
            rigRotation("LeftMiddleProximal", riggedLeftHand.LeftMiddleProximal);
            rigRotation("LeftMiddleIntermediate", riggedLeftHand.LeftMiddleIntermediate);
            rigRotation("LeftMiddleDistal", riggedLeftHand.LeftMiddleDistal);
            rigRotation("LeftThumbProximal", riggedLeftHand.LeftThumbProximal);
            rigRotation("LeftThumbIntermediate", riggedLeftHand.LeftThumbIntermediate);
            rigRotation("LeftThumbDistal", riggedLeftHand.LeftThumbDistal);
            rigRotation("LeftLittleProximal", riggedLeftHand.LeftLittleProximal);
            rigRotation("LeftLittleIntermediate", riggedLeftHand.LeftLittleIntermediate);
            rigRotation("LeftLittleDistal", riggedLeftHand.LeftLittleDistal);
        }
        if (right_hand_landmarks) {
            riggedRightHand = Kalidokit.Hand.solve(right_hand_landmarks, "Right");
            rigRotation("RightHand", {
                // Combine Z axis from pose hand and X/Y axis from hand wrist rotation
                z: riggedPose.RightHand.z,
                y: riggedRightHand.RightWrist.y,
                x: riggedRightHand.RightWrist.x,
            });
            rigRotation("RightRingProximal", riggedRightHand.RightRingProximal);
            rigRotation("RightRingIntermediate", riggedRightHand.RightRingIntermediate);
            rigRotation("RightRingDistal", riggedRightHand.RightRingDistal);
            rigRotation("RightIndexProximal", riggedRightHand.RightIndexProximal);
            rigRotation("RightIndexIntermediate", riggedRightHand.RightIndexIntermediate);
            rigRotation("RightIndexDistal", riggedRightHand.RightIndexDistal);
            rigRotation("RightMiddleProximal", riggedRightHand.RightMiddleProximal);
            rigRotation("RightMiddleIntermediate", riggedRightHand.RightMiddleIntermediate);
            rigRotation("RightMiddleDistal", riggedRightHand.RightMiddleDistal);
            rigRotation("RightThumbProximal", riggedRightHand.RightThumbProximal);
            rigRotation("RightThumbIntermediate", riggedRightHand.RightThumbIntermediate);
            rigRotation("RightThumbDistal", riggedRightHand.RightThumbDistal);
            rigRotation("RightLittleProximal", riggedRightHand.RightLittleProximal);
            rigRotation("RightLittleIntermediate", riggedRightHand.RightLittleIntermediate);
            rigRotation("RightLittleDistal", riggedRightHand.RightLittleDistal);
        }
    }

    reset() {}

    render() {
        if (this.currentVrm) {
            // Update model to render physics
            this.currentVrm.update(this.clock.getDelta());
        }
        this.renderer.render(this.scene, this.orbitCamera);
    }

    show() {}

    update() {}

    update_data(results) {
        this.animateVRM(results)
    }


}