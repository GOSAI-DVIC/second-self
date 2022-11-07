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

        socket.on(sketch.name, (data) => {
            sketch.body.update_data(data);
        });

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
        sketch.body.update();
    };

    sketch.show = () => {
        sketch.clear();
        sketch.body.show(sketch);
    };
});
