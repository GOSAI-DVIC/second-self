import musical_elements_json from './musical_elements.json' assert { type: "json" };
import la_vie_en_rose_json from './scores/la_vie_en_rose.json' assert { type: "json" };

export class Score_player{
    constructor() {
        this.frequency = 440;
        this.note_duration = 0.01;
        this.bitrate = 48000;
        this.amplitude = 0;
        this.playScore(la_vie_en_rose_json);
    }

    reset() {}

    update_data() {}

    show(sketch) {}

    playScore(score_json)
    {
        const score = JSON.parse(JSON.stringify(score_json));
        const musical_elements = JSON.parse(JSON.stringify(musical_elements_json));
        const notes_freqs = musical_elements.notes_freqs;
        const note_durations = musical_elements.note_durations;

        for(var note of score.notes)
        {

            this.frequency = notes_freqs[note[0]];
            this.note_duration = (1/note_durations[note[1]])*score.rythm.tempo/60;
            // 1/note_durations[note[1]] le pourcentage de la note dans une mesure
        }
    }

    update(sketch) {

    }


}