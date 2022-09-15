import * as Kalidokit from "./dist/index.js";
import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.133.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.133.0/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMUtils, VRMSchema } from "./three-vrm.module.js";


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
        this.remap = Kalidokit.Utils.remap;
        this.clamp = Kalidokit.Utils.clamp;
        this.lerp = Kalidokit.Vector.lerp;

        /* THREEJS WORLD SETUP */
        
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
        this.orbitCamera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 10);
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

        this.imageSize = {
            width: width,
            height: height,
        };

        // Import Character VRM
        const loader = new GLTFLoader();
        loader.crossOrigin = "anonymous";
        // Import model from URL, add your own model here
        // console.log(window.location)
        loader.load(
            // "https://cdn.glitch.com/29e07830-2317-4b15-a044-135e73c7f840%2FAshtra.vrm?v=1630342336981",
            "./platform/home/apps/aria/components/models/papa_de_him_chan.vrm",
            // "https://cdn.glitch.com/29e07830-2317-4b15-a044-135e73c7f840%2Fthree-vrm-girl.vrm",
            (gltf) => {
                VRMUtils.removeUnnecessaryJoints(gltf.scene);

                VRM.from(gltf).then((vrm) => {
                    this.scene.add(vrm.scene);
                    this.currentVrm = vrm;
                    this.currentVrm.scene.rotation.y = Math.PI; // Rotate model 180deg to face camera

                    this.rigRotation("RightUpperArm", {
                        x: 0,
                        y: 0,
                        z: -1.5
                    }, 1, 1);
                    this.rigRotation("RightLowerArm", {
                        x: 0,
                        y: 0,
                        z: 0
                    }, 1, 1);
                    this.rigRotation("LeftUpperArm", {
                        x: 0,
                        y: 0,
                        z: 1.5
                    }, 1, 1);
                    this.rigRotation("LeftLowerArm", {
                        x: 0,
                        y: 0,
                        z: 0
                    }, 1, 1);
                });
            },

            (progress) => console.log("Loading model...", 100.0 * (progress.loaded / progress.total), "%"),

            (error) => console.error(error)
        );

        // Animate Rotation Helper function
        

        // Animate Position Helper Function
        this.rigPosition = (name, position = {
            x: 0,
            y: 0,
            z: 0
        }, dampener = 1, lerpAmount = 0.3) => {
            if (!this.currentVrm) {
                return;
            }
            const Part = this.currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName[name]);
            if (!Part) {
                return;
            }
            let vector = new THREE.Vector3(position.x * dampener, position.y * dampener, position.z * dampener);
            Part.position.lerp(vector, lerpAmount); // interpolate
        };

        this.oldLookTarget = new THREE.Euler();
    }

    rigRotation(name, rotation = {x: 0,y: 0,z: 0}, dampener = 1, lerpAmount = 0.3) 
        { 
            if (!this.currentVrm) {
                return;
            }
            const Part = this.currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName[name]);
            if (!Part) {
                return;
            }
            // console.log("rotation: ", rotation)
            let euler = new THREE.Euler(
                rotation.x * dampener,
                rotation.y * dampener,
                rotation.z * dampener,
                rotation.rotationOrder || "XYZ"
            );
            let quaternion = new THREE.Quaternion().setFromEuler(euler);
            if (isNaN(quaternion.x) || isNaN(quaternion.y) || isNaN(quaternion.z) || isNaN(quaternion.w)) {
                return;
            }
            Part.quaternion.slerp(quaternion, lerpAmount); // interpolate
        };

    rigFace(riggedFace) {
        if (!this.currentVrm) {
            return;
        }
        this.rigRotation("Neck", riggedFace.head, 0.7);

        // Blendshapes and Preset Name Schema
        const Blendshape = this.currentVrm.blendShapeProxy;
        const PresetName = VRMSchema.BlendShapePresetName;

        // Simple example without winking. Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
        // for VRM, 1 is closed, 0 is open.
        riggedFace.eye.l = this.lerp(this.clamp(1 - riggedFace.eye.l, 0, 1), Blendshape.getValue(PresetName.Blink), 0.5);
        riggedFace.eye.r = this.lerp(this.clamp(1 - riggedFace.eye.r, 0, 1), Blendshape.getValue(PresetName.Blink), 0.5);
        riggedFace.eye = Kalidokit.Face.stabilizeBlink(riggedFace.eye, riggedFace.head.y);
        Blendshape.setValue(PresetName.Blink, riggedFace.eye.l);

        // console.log(this.currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName["LeftIndexDistal"]).quaternion)

        // Interpolate and set mouth blendshapes
        Blendshape.setValue(PresetName.I, this.lerp(riggedFace.mouth.shape.I, Blendshape.getValue(PresetName.I), 0.5));
        Blendshape.setValue(PresetName.A, this.lerp(riggedFace.mouth.shape.A, Blendshape.getValue(PresetName.A), 0.5));
        Blendshape.setValue(PresetName.E, this.lerp(riggedFace.mouth.shape.E, Blendshape.getValue(PresetName.E), 0.5));
        Blendshape.setValue(PresetName.O, this.lerp(riggedFace.mouth.shape.O, Blendshape.getValue(PresetName.O), 0.5));
        Blendshape.setValue(PresetName.U, this.lerp(riggedFace.mouth.shape.U, Blendshape.getValue(PresetName.U), 0.5));

        //PUPILS
        //interpolate pupil and keep a copy of the value
        let lookTarget = new THREE.Euler(
            this.lerp(this.oldLookTarget.x, riggedFace.pupil.y, 0.4),
            this.lerp(this.oldLookTarget.y, riggedFace.pupil.x, 0.4),
            0,
            "XYZ"
        );
        this.oldLookTarget.copy(lookTarget);
        this.currentVrm.lookAt.applyer.lookAt(lookTarget);
    };

    animateVRM = (results, imageSize) => {
        if (!this.currentVrm) {
            return;
        }
        
        // Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
        let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

        const faces_landmarks = results.face_mesh;
        // Pose 3D Landmarks are with respect to Hip distance in meters
        const pose3DLandmarks = results.body_world_pose;
        // Pose 2D landmarks are with respect to videoWidth and videoHeight
        const pose2DLandmarks = results.body_pose;
        // Be careful, hand landmarks may be reversed
        const left_hands_landmarks = results.right_hand_pose;
        const right_hand_landmarks = results.left_hand_pose;
        // Animate Face
        if (faces_landmarks) {
            riggedFace = Kalidokit.Face.solve(faces_landmarks, {
                runtime: "mediapipe",
                imageSize: imageSize,
            });
            this.rigFace(riggedFace);
        }

        // Animate Pose
        if (pose2DLandmarks && pose3DLandmarks) {
            riggedPose = Kalidokit.Pose.solve(pose3DLandmarks, pose2DLandmarks, {
                runtime: "mediapipe",
                imageSize: imageSize,
            });
            // this.currentVrm.scene.position.set(-pose3DLandmarks[0].x, 0, 0);
            this.rigRotation("Hips", riggedPose.Hips.rotation, 0.7);
            console.log((pose2DLandmarks[24].x + pose2DLandmarks[23].x) / 2);
            this.rigPosition(
                "Hips", {
                    x: -(pose2DLandmarks[24].x + pose2DLandmarks[23].x -1.85) *2.5/2 , // Reverse direction
                    y: riggedPose.Hips.position.y + 1, // Add a bit of height
                    z: -riggedPose.Hips.position.z, // Reverse direction
                },
                1,
                0.07
            );

            this.rigRotation("Chest", riggedPose.Spine, 0.25, 0.3);
            this.rigRotation("Spine", riggedPose.Spine, 0.45, 0.3);

            this.rigRotation("LeftUpperArm", riggedPose.RightUpperArm, 1, 0.3);
            this.rigRotation("LeftLowerArm", riggedPose.RightLowerArm, 1, 0.3);
            this.rigRotation("RightUpperArm", riggedPose.LeftUpperArm, 1, 0.3);
            this.rigRotation("RightLowerArm", riggedPose.LeftLowerArm, 1, 0.3);

            // this.rigRotation("LeftUpperLeg", riggedPose.LeftUpperLeg, 1, 0.3);
            // this.rigRotation("LeftLowerLeg", riggedPose.LeftLowerLeg, 1, 0.3);
            // this.rigRotation("RightUpperLeg", riggedPose.RightUpperLeg, 1, 0.3);
            // this.rigRotation("RightLowerLeg", riggedPose.RightLowerLeg, 1, 0.3);
        }

        if (left_hands_landmarks && left_hands_landmarks.length == 21) {
            riggedLeftHand = Kalidokit.Hand.solve(left_hands_landmarks, "Left");
            if(riggedLeftHand) {

                this.rigRotation("LeftHand", {
                    // Combine pose rotation Z and hand rotation X Y
                    // z:0,
                    // y: 0,
                    // x: 0,
                    z: riggedPose.LeftHand.z,
                    y: riggedLeftHand.LeftWrist.y,
                    x: riggedLeftHand.LeftWrist.x,
                });
                // console.log(this.currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName["LeftIndexDistal"]).quaternion);
                // console.log(riggedLeftHand.LeftIndexDistal);
                
                this.rigRotation("LeftRingProximal", riggedLeftHand.LeftRingProximal);
                this.rigRotation("LeftRingIntermediate", riggedLeftHand.LeftRingIntermediate);
                this.rigRotation("LeftRingDistal", riggedLeftHand.LeftRingDistal);
                this.rigRotation("LeftIndexProximal", riggedLeftHand.LeftIndexProximal);
                this.rigRotation("LeftIndexIntermediate", riggedLeftHand.LeftIndexIntermediate);
                this.rigRotation("LeftIndexDistal", riggedLeftHand.LeftIndexDistal);
                this.rigRotation("LeftMiddleProximal", riggedLeftHand.LeftMiddleProximal);
                this.rigRotation("LeftMiddleIntermediate", riggedLeftHand.LeftMiddleIntermediate);
                this.rigRotation("LeftMiddleDistal", riggedLeftHand.LeftMiddleDistal);
                this.rigRotation("LeftThumbProximal", riggedLeftHand.LeftThumbProximal);
                this.rigRotation("LeftThumbIntermediate", riggedLeftHand.LeftThumbIntermediate);
                this.rigRotation("LeftThumbDistal", riggedLeftHand.LeftThumbDistal);
                this.rigRotation("LeftLittleProximal", riggedLeftHand.LeftLittleProximal);
                this.rigRotation("LeftLittleIntermediate", riggedLeftHand.LeftLittleIntermediate);
                this.rigRotation("LeftLittleDistal", riggedLeftHand.LeftLittleDistal);
            }
        }
        if (right_hand_landmarks && right_hand_landmarks.length == 21) {
            riggedRightHand = Kalidokit.Hand.solve(right_hand_landmarks, "Right");
            if(riggedRightHand) {
                this.rigRotation("RightHand", {
                    // Combine Z axis from pose hand and X/Y axis from hand wrist rotation
                    z: riggedPose.RightHand.z,
                    y: riggedRightHand.RightWrist.y,
                    x: riggedRightHand.RightWrist.x,
                });
                this.rigRotation("RightRingProximal", riggedRightHand.RightRingProximal);
                this.rigRotation("RightRingIntermediate", riggedRightHand.RightRingIntermediate);
                this.rigRotation("RightRingDistal", riggedRightHand.RightRingDistal);
                this.rigRotation("RightIndexProximal", riggedRightHand.RightIndexProximal);
                this.rigRotation("RightIndexIntermediate", riggedRightHand.RightIndexIntermediate);
                this.rigRotation("RightIndexDistal", riggedRightHand.RightIndexDistal);
                this.rigRotation("RightMiddleProximal", riggedRightHand.RightMiddleProximal);
                this.rigRotation("RightMiddleIntermediate", riggedRightHand.RightMiddleIntermediate);
                this.rigRotation("RightMiddleDistal", riggedRightHand.RightMiddleDistal);
                this.rigRotation("RightThumbProximal", riggedRightHand.RightThumbProximal);
                this.rigRotation("RightThumbIntermediate", riggedRightHand.RightThumbIntermediate);
                this.rigRotation("RightThumbDistal", riggedRightHand.RightThumbDistal);
                this.rigRotation("RightLittleProximal", riggedRightHand.RightLittleProximal);
                this.rigRotation("RightLittleIntermediate", riggedRightHand.RightLittleIntermediate);
                this.rigRotation("RightLittleDistal", riggedRightHand.RightLittleDistal);
            }
        }
    }

    array_to_landmarks(results)
    {
        var results_to_array = [];
        for (var key of Object.keys(results))
        {
            if (key == "body_world_pose") {
                var landmarks_array = [];
                var coor = {};
                for (var landmark of results[key])
                {
                    coor = {
                        "x":landmark[0],
                        "y":landmark[1],
                        "z":landmark[2],
                        "visibility":landmark[3]
                    }
                    landmarks_array.push(coor);
                }
            }
            else
            {
                const min_width = 96;
                const width = 448;
                const height = 480;
                var landmarks_array = [];
                var coor = {};
                for (var landmark of results[key])
                {   
                    coor = {
                        "x": landmark[0]/width,
                        "y": landmark[1]/height,
                        "z": landmark[2]
                    }
                    landmarks_array.push(coor);
                }
            }
            results_to_array[key] = landmarks_array;
        }
        return results_to_array
    }

    reset() {}

    render() {
        if (this.currentVrm) {
            // Update model to render physics
            this.currentVrm.update(this.clock.getDelta());
        this.currentVrm.scene.position.set(0, 0, -1);
        }
        this.renderer.render(this.scene, this.orbitCamera);
    }

    show() {}

    update() {}

    update_data(results) {
        var array_to_landmarks_results = this.array_to_landmarks(results);
        this.animateVRM(array_to_landmarks_results, this.imageSize)
    }
}