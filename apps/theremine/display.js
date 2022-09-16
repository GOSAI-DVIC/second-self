import { Theremine } from "./components/theremine.js";

export const theremine = new p5(( sketch ) => {
    sketch.name = "theremine"
    sketch.z_index = 0
    sketch.activated = false
    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch.createCanvas(width, height).position(0, 0).style("z-index", sketch.z_index);
        sketch.theremine = new Theremine()
        socket.on(sketch.name, (data) => {
            sketch.theremine.update_data(
                data["right_hand_pose"], 
                data["left_hand_pose"]
            )
        });
        
        sketch.emit = (event_name, data = undefined) => {
            if (data == undefined) socket.emit(event_name);
            else socket.emit(event_name, data);
        }
        sketch.activated = true
    }

    sketch.windowResized = () => {
        sketch.resizeCanvas(windowWidth, windowHeight);
    }

    sketch.resume = () => {
        sketch.reset();
    };

    sketch.pause = () => {
        sketch.clear();
    };

    sketch.update = () => {
        // console.log("FREQUENCY: ", sketch.theremine.frequency);
        sketch.emit("synthesize", {
            "frequency": sketch.theremine.frequency, 
            "amplitude": sketch.theremine.amplitude,
            "length": sketch.theremine.length, 
            "bitrate": sketch.theremine.bitrate
        });
        // console.log("FREQUENCY: ", sketch.theremine.frequency);

        sketch.theremine.update(sketch);
    };

    sketch.show = () => {
        sketch.clear();
    }
});
