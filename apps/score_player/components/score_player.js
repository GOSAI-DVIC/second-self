import notes_freq_CMaj_json from './notes-frequencies-CMaj.json' assert { type: "json" };
import notes_freq_json from './notes-frequencies.json' assert { type: "json" };
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
        const score = JSON.parse(JSON.stringify(score_json))
        const notes_freq = JSON.parse(JSON.stringify(notes_freq_json))
        
        for(var note of score.notes)
        {
            this.frequency = notes_freq[note[0]];
            this.note_duration = note[1]*score.rythm.tempo/60;
            
        }
    }

    update(sketch) {

    }


}