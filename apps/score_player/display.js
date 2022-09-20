import { Score_player } from "./components/score_player.js";
import notes_freq_CMaj_json from './components/notes-frequencies-CMaj.json' assert { type: "json" };
import notes_freq_json from './components/notes-frequencies.json' assert { type: "json" };
import la_vie_en_rose_json from './components/scores/la_vie_en_rose.json' assert { type: "json" };

export const score_player = new p5(( sketch ) => {
    sketch.name = "score_player"
    sketch.z_index = 0
    sketch.activated = false
    sketch.set = async (width, height, socket) => {
        sketch.selfCanvas = sketch.createCanvas(width, height).position(0, 0).style("z-index", sketch.z_index);
        socket.on(sketch.name, (data) => {
        });
        
        sketch.emit = (event_name, data = undefined) => {
            if (data == undefined) socket.emit(event_name);
            else socket.emit(event_name, data);
        }
        sketch.activated = true

        var frequency = 0;
        var duration = 0.01;
        var amplitude = 0.5;

        const score = JSON.parse(JSON.stringify(la_vie_en_rose_json))
        const notes_freq = JSON.parse(JSON.stringify(notes_freq_json))

        for(var note of score.notes)
        {
            frequency = notes_freq[note[0]];
            duration = note[1]*score.rythm.tempo/60;
            
            sketch.emit("score_player_synthesize", {
                "frequency": frequency, 
                "amplitude": amplitude,
                "duration": duration,
            });
        }
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

    sketch.update = () => {};

    sketch.show = () => {
        if (!sketch.activated) return;
    }

});
