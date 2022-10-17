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
        socket.on("application-music_training-bars_activation", (is_selected) => {
            sketch.theremine.toggleShowBars(is_selected)
        });

        socket.on("application-music_training-tutorial_start", (is_selected) => {
            sketch.theremine.startTutorial(is_selected)
        });

        socket.on("application-music_training-sound_activation", (is_selected) => {
            sketch.theremine.toggleSound(is_selected)
        });
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
