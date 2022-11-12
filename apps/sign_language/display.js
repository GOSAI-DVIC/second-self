import { Slr } from "./components/slr.js"

export const sign_language = new  p5(( sketch ) => {
    sketch.name = "sign_language"
    sketch.z_index = 2
    sketch.activated = false

    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch.createCanvas(width, height).position(0, 0).style("z-index", sketch.z_index);
        sketch.slr = new Slr()
        print("sketch.name",sketch.name)
        socket.on(sketch.name, (data) => {
            console.log("receiving data")
            sketch.slr.update_data(
                data["guessed_sign"], data["probability"]
            )
        });
        // sketch.emit = (name, data) => {
            // socket.emit(name, data);
        // };
        sketch.activated = true;
    }
    
    sketch.resume = () => {
        sketch.slr.reset();
    };

    sketch.pause = () => {};

    sketch.update = () => {
        sketch.slr.update()
    }

    sketch.show = () => {
        if (!sketch.activated) return;
        sketch.clear();
        sketch.slr.show(sketch);
    }
});
