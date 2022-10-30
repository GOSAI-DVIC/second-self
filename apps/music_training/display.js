import { MusicTraining } from "./components/music_training.js";

export const music_training = new p5(( sketch ) => {
    sketch.name = "music_training"
    sketch.z_index = 0
    sketch.activated = false
    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch.createCanvas(width, height).position(0, 0).style("z-index", sketch.z_index);
        sketch.music_training = new MusicTraining()
        socket.on(sketch.name, (data) => {
            sketch.music_training.updateData(
                data["max_frequency"], data["amplitude"]
            )
        });
        socket.on("application-music_training-bars_activation", (isSelected) => {
            sketch.music_training.toggleShowBars(isSelected)
        });

        socket.on("application-music_training-tutorial_start", () => {
            sketch.music_training.triggerTutorial()
        });

        socket.on("application-music_training-trigger_la_vie_en_rose", () => {
            sketch.music_training.triggerMusic(sketch, "laVieEnRose")
        });

        socket.on("application-music_training-trigger_no_time_to_die", () => {
            sketch.music_training.triggerMusic(sketch, "noTimeToDie")
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

    sketch.resume = () => {};

    sketch.pause = () => {};

    sketch.update = () => {}

    sketch.show = () => {
        if (!sketch.activated) return;
        sketch.clear();
        sketch.music_training.show(sketch);
    }
});
