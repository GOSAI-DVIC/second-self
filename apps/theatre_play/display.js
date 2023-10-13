
export const show_transcript = new p5((sketch) => {
    sketch.name = "show_transcript";
    sketch.z_index = 5;
    sketch.activated = false;
    let frequency = 0;
    let rfft = []
    let mul = 1;
    let bar_height = 0;
    let bar_color = 150;

    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);

        socket.on(sketch.name, (data) => {
            console.log(data);
            // frequency = data["max_frequency"];
            // rfft = data["rfft"];
        });
        sketch.colorMode(sketch.HSB, 255);
        sketch.fill(255);
        sketch.strokeWeight(1);
        sketch.textSize(32);
        sketch.textAlign(sketch.CENTER, sketch.CENTER);

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
        // sketch.text(frequency, sketch.width / 2, sketch.height / 2);
        // mul = sketch.width / rfft.length;
        // for(let i = 0; i < rfft.length; i++){
        //     bar_height = sketch.map(rfft[i], 0, 750, 0, sketch.height);
        //     bar_color = sketch.map(bar_height, 0, 150, 120, 255);
        //     sketch.stroke(bar_color, 255, 255);
        //     sketch.line(i*mul, sketch.height, i*mul, sketch.height - bar_height);
        // }
    };
});
