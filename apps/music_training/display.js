export const music_training = new p5(( sketch ) => {
    sketch.name = "music_training"
    sketch.z_index = 0
    sketch.activated = false

    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch.createCanvas(width, height).position(0, 0).style("z-index", sketch.z_index);

        socket.on(sketch.name, (data) => {
            frequency = data["max_frequency"];
            rfft = data["rfft"];
        });
    }

    sketch.windowResized = () => {
        sketch.resizeCanvas(windowWidth, windowHeight);
    }

    sketch.resume = () => {};

    sketch.pause = () => {};

    sketch.update = () => {}

    sketch.show = () => {
        sketch.clear();
    }
});
