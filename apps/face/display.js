import { Face } from "./components/face.js";

export const face = new p5((sketch) => {
    sketch.name = "face";
    sketch.z_index = 5;
    sketch.activated = false;

    sketch.face;
    sketch.body;
    sketch.right_hand;
    sketch.left_hand;

    sketch.set = (width, height, socket) => {
        sketch.face = new Face("face");

        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);

        // sketch.angleMode(RADIANS);
        // sketch.textAlign(CENTER, CENTER);
        // sketch.textStyle(BOLD);
        // sketch.imageMode(CENTER);

        socket.on(sketch.name, (data) => {
            sketch.face.update_data(data);
        });

        // socket.emit("get_available_applications");

        // sketch.emit = (name, data) => {
        //     socket.emit(name, data);
        // };

        sketch.activated = true;
    };

    sketch.resume = () => {};

    sketch.pause = () => {
        sketch.clear();
    };

    sketch.windowResized = () => {
        sketch.resizeCanvas(windowWidth, windowHeight);
    };

    sketch.update = () => {
        sketch.face.update();
    };

    sketch.show = () => {
        sketch.clear();
        sketch.face.show(sketch);
    };
});
