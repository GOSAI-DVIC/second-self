import { Score_player } from "./components/score_player.js";

export const score_player = new p5(( sketch ) => {
    sketch.name = "score_player"
    sketch.z_index = 0
    sketch.activated = false
    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch.createCanvas(width, height).position(0, 0).style("z-index", sketch.z_index);
        sketch.score_player = new Score_player()
        socket.on(sketch.name, (data) => {
            sketch.score_player.update_data()
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
            "frequency": sketch.score_player.frequency, 
            "amplitude": sketch.score_player.amplitude,
            "note_duration": sketch.score_player.note_duration, 
            "bitrate": sketch.score_player.bitrate
        });

        sketch.score_player.update(sketch);
    };

    sketch.show = () => {
        if (!sketch.activated) return;
        sketch.clear();
        sketch.score_player.show(sketch);
    }
});
