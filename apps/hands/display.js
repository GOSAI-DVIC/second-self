import { Hand } from "./components/hand.js";

export const hands = new p5((sketch) => {
    sketch.name = "hands";
    sketch.z_index = 5;
    sketch.activated = false;

    sketch.face;
    sketch.body;
    sketch.right_hand;
    sketch.left_hand;

    sketch.set = (width, height, socket) => {
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
            sketch.right_hand.update_data(
                data["right_hand_pose"]
            );
            sketch.left_hand.update_data(
                data["left_hand_pose"]
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
        sketch.right_hand.update();
        sketch.left_hand.update();
    };

    sketch.show = () => {
        sketch.clear();
        sketch.right_hand.show(sketch);
        sketch.left_hand.show(sketch);
    };
});
