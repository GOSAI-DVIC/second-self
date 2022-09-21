import musical_elements_json from './components/musical_elements.json' assert { type: "json" };
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

        const score = JSON.parse(JSON.stringify(la_vie_en_rose_json));
        const musical_elements = JSON.parse(JSON.stringify(musical_elements_json));
        const notes_freqs = musical_elements.notes_freqs;
        const note_durations = musical_elements.notes_durations;

        for(var note of score.notes)
        {
            frequency = notes_freqs[note[0]];
            duration = (1/note_durations[note[1]])*60/score.rythm.tempo;
            
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
