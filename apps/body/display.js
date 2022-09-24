import { Body } from "./components/body.js";

export const body = new p5((sketch) => {
    sketch.name = "body";
    sketch.z_index = 5;
    sketch.activated = false;

    sketch.body;

    sketch.set = (width, height, socket) => {
        sketch.body = new Body("body");

        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);

        // sketch.angleMode(RADIANS);
        // sketch.textAlign(CENTER, CENTER);
        // sketch.textStyle(BOLD);
        // sketch.imageMode(CENTER);

        socket.on(sketch.name, (data) => {
            sketch.body.update_data(data);
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
        sketch.body.update();
    };

    sketch.show = () => {
        sketch.clear();
        sketch.body.show(sketch);
    };
});
