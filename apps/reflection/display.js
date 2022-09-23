import { Face } from "./components/face.js";
import { Hand } from "./components/hand.js";
import { Body } from "./components/body.js";

export const reflection = new p5((sketch) => {
    sketch.name = "reflection";
    sketch.z_index = 5;
    sketch.activated = false;

    sketch.face;
    sketch.body;
    sketch.right_hand;
    sketch.left_hand;

    sketch.set = (width, height, socket) => {
        sketch.face = new Face("face");
        sketch.body = new Body("body");
        sketch.right_hand = new Hand("right_hand");
        sketch.left_hand = new Hand("left_hand");

        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);

        // sketch.angleMode(RADIANS);
        // sketch.textAlign(CENTER, CENTER);
        // sketch.textStyle(BOLD);
        // sketch.imageMode(CENTER);

        socket.on(sketch.name, (data) => {
            sketch.face.update_data(data["face_mesh"]);
            sketch.body.update_data(data["body_pose"]);
            sketch.right_hand.update_data(
                data["right_hand_pose"],
                data["right_hand_sign"]
            );
            sketch.left_hand.update_data(
                data["left_hand_pose"],
                data["left_hand_sign"]
            );
        });

        // socket.emit("get_available_applications");

        // sketch.emit = (name, data) => {
        //     socket.emit(name, data);
        // };

        sketch.activated = true;
    };

    sketch.resume = () => {};

    sketch.pause = () => {};

    sketch.windowResized = () => {
        sketch.resizeCanvas(windowWidth, windowHeight);
    };

    sketch.update = () => {
        sketch.face.update();
        sketch.body.update();
        sketch.right_hand.update();
        sketch.left_hand.update();
    };

    sketch.show = () => {
        sketch.clear();
        sketch.face.show(sketch);
        sketch.body.show(sketch);
        sketch.right_hand.show(sketch);
        sketch.left_hand.show(sketch);
    };
});
