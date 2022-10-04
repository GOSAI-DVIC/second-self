
export const show_frequency = new p5((sketch) => {
    sketch.name = "show_frequency";
    sketch.z_index = 5;
    sketch.activated = false;
    let frequency = 0;
    let rfft = []
    let mul = 1;

    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);

        socket.on(sketch.name, (data) => {
            // console.log(data);
            frequency = data["max_frequency"];
            rfft = data["rfft"];
        });

        sketch.activated = true;
    };

    sketch.resume = () => {};
    sketch.pause = () => {};

    sketch.windowResized = () => {
        sketch.resizeCanvas(windowWidth, windowHeight);
    };

    sketch.update = () => {};

    sketch.show = () => {
        sketch.clear();
        sketch.fill(255);
        sketch.stroke(255);
        sketch.strokeWeight(1);
        sketch.textSize(32);
        sketch.textAlign(sketch.CENTER, sketch.CENTER);
        sketch.text(frequency, sketch.width / 2, sketch.height / 2);
        mul = sketch.width / rfft.length;
        for(let i = 0; i < rfft.length; i++){
            sketch.line(i*mul, sketch.height, i*mul, sketch.height - 10*rfft[i]);
        }
    };
});
