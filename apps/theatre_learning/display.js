
export const theatre_learning = new p5((sketch) => {
    sketch.name = "theatre_learning";
    sketch.z_index = 5;
    //sketch.activated = false;

    let results = ''
    let instruct = ''
    let state = ''
    let available_theatre_plays = ''
    let transcription = ''
    let scenes_info = ''
    let characters = ''

    let state_received = false
    let instruct_received = false
    let available_theatre_plays_received = false
    let theatre_play_title_init = true
    let theatre_plays_scene_init = false
    let scenes_info_received = false
    let choosing_characters_bool = false

    let hands_position = []
    let characterColors = {};
    let starting_correction = false 
    let users_initialized = false
    let longest = 0
    

    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);

        socket.on(sketch.name, (data) => {
            
            console.log('receiving')
            console.log(Object.keys(data)[0])
            // if (Object.keys(data)[0] == "hands_landmarks") {
            // if (data == undefined || data[0].length == 0) return;
            // hands_position = data["hands_landmarks"];
            // }
            if (Object.keys(data)[0] == "command_recognized_bool"){
                console.log('command_recognized_bool');
                console.log(data);
                transcription = data["transcription"]
        
            }

            if (Object.keys(data)[0] == "available_theatre_plays"){
                console.log('available_theatre_plays');
                console.log(data);
                available_theatre_plays = data.available_theatre_plays
                available_theatre_plays_received = true 
            }
            
            if (Object.keys(data)[0] == "scenes_info"){
                console.log('scenes_info');
                console.log(data);
                scenes_info = data["scenes_info"]
                scenes_info_received = true 
                theatre_play_title_init = false
                theatre_plays_scene_init = true
            }

            if (Object.keys(data)[0] == "characters"){
                console.log('characters');
                console.log(data);
                characters = data["characters"]

                if (characterColors=={}){
                    for (let i = 0; i < characters.length; i++){
                        characterColors[characters[i]]= "blue"

                    }
                }
                if (data['changing_mode_character']!="NO") {
                    if (characterColors[data['changing_mode_character']]==="blue"){
                        characterColors[data['changing_mode_character']] = "orange"  
                    }
                    else {
                        characterColors[data['changing_mode_character']] = "blue"  
                    }
                }
                theatre_plays_scene_init = false
                choosing_characters_bool = true
            }

            if (Object.keys(data)[0] == "state"){
                console.log('state');
                console.log(data);
                state = data["state"]
                state_received = true 
            }
            if (Object.keys(data)[0] == "instruction"){
                console.log('instruct');
                console.log(data);
                instruct = data["instruction"]
                instruct_received = true
                
               
            }
            if (Object.keys(data)[0] == "next_char"){
                console.log(data);
                results = data
                starting_correction = true 
            }
    
            // frequency = data["max_frequency"];
            // rfft = data["rfft"];
        

            
            // hands_sign = data["hands_sign"];
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
        
        // if ((!starting_correction) && (hands_position.length>0)) {

        //     console.log('hands positions : ')
        //     console.log(hands_position)
        //     console.log(hands_position.length)
        //     if (hands_position.length != 0){
        //         index_x_a = hands_position[0][8][0] * width;
        //         index_y_a = hands_position[0][8][1] * height;
        //         sketch.circle(index_x_a, index_y_a, 20);
            
        //     } else {
        //         index_x_a = 0;
        //         index_y_a = 0;
        //     }
        //     if (hands_position.length > 1) {
        //         index_x_b = hands_position[1][8][0] * width;
        //         index_y_b = hands_position[1][8][1] * height;
        //     } else {
        //         index_x_b = 0;
        //         index_y_b = 0;
        //     }
        // }

        if ((theatre_play_title_init)&&(available_theatre_plays_received)){
            // console.log('display')
            sketch.fill("green")
            sketch.rectMode(sketch.CENTER);
            let titleBgWidth = sketch.textWidth("************** AVAILABLE THEATRE PLAYS **************") + 20;
            sketch.rect( sketch.width / 2, sketch.height * 2 / (20) , titleBgWidth, 50 ,20); // Rounded rectangle background

            sketch.fill("white")
            sketch.text(" AVAILABLE THEATRE PLAYS ", sketch.width / 2, sketch.height * 2 / (20));
            console.log(available_theatre_plays.length)

            var lgth = 0
            for (var i = 0; i < available_theatre_plays.length; i++) {
                if (available_theatre_plays[i].length > lgth) {
                  lgth = available_theatre_plays[i].length;
                  longest = available_theatre_plays[i];
                }
              }
            for (let i = 0; i < available_theatre_plays.length; i++) {
                sketch.fill(50)
                let titleBgWidth = sketch.textWidth(longest) +40;
                sketch.rect( sketch.width / 2, ((i*2)*sketch.height / (20))+250, titleBgWidth, 45 ,20); // Rounded rectangle background
                sketch.fill("white")
                sketch.text(available_theatre_plays[i], sketch.width / 2, ((i*2)*sketch.height / (20))+250)
                console.log(available_theatre_plays[i])
            }
            sketch.text("COMMAND RECEIVED : "+transcription, sketch.width / 2, sketch.height*(available_theatre_plays.length+4) / (available_theatre_plays.length+5))
            
        }

        if ((scenes_info_received)&&(theatre_plays_scene_init)){
            
            sketch.fill("green")
            let titleBgWidth = sketch.textWidth("************** AVAILABLE SCENES **************") + 20;
            sketch.rect( sketch.width / 2, sketch.height * 2 / (20) , titleBgWidth, 50 ,20); // Rounded rectangle background

            sketch.fill("white")
            sketch.text(" AVAILABLE SCENES ", sketch.width / 2, sketch.height*2 / (20))
         

            var lgth = 0
            for (const [key, value] of Object.entries(scenes_info)) {
                if (str(value).length > lgth){
                  lgth = str(value).length;
                  longest = str(value);
                }
              }
            
            let j = 0 
            for (const [key, value] of Object.entries(scenes_info)) {
       
                
                let titleBgWidth = sketch.textWidth(longest) +40;

                sketch.fill(50)
                
                sketch.rect( sketch.width / 2, ((j*3 + 0.5)*sketch.height / (20))+250, titleBgWidth, 100 ,20); // Rounded rectangle background
                sketch.fill("white")
                sketch.text(key, sketch.width / 2, ((j*3)*sketch.height / (20))+250)
                sketch.text(value, sketch.width / 2, ((j*3 + 1)*sketch.height / (20))+250)
                console.log(j)
                j = j + 1
              }
              
            sketch.text("COMMAND RECEIVED : "+transcription, sketch.width / 2, sketch.height*(available_theatre_plays.length+4) / (available_theatre_plays.length+5))

            

        }


        if (choosing_characters_bool){
           
            sketch.fill(0, 255, 0);  // Green color for section title
            let chooseCharactersBgWidth = sketch.textWidth("CHOOSE THE CHARACTERS") + 20;
            sketch.rect(sketch.width / 2, sketch.height / 20, chooseCharactersBgWidth, 50, 20); // Rounded rectangle background
            sketch.fill(0);  // Black text color
            sketch.text("CHOOSE THE CHARACTERS", sketch.width / 2, sketch.height / 20);

            // Display rectangles for each character
            sketch.fill(0, 0, 255);  // Blue color for character rectangles

            var lgth = 0
            for (var i = 0; i < characters.length; i++) {
                if (characters[i].length > lgth) {
                  lgth = characters[i].length;
                  longest = characters[i];
                }
              }
            let characterName = ""
            let characterColor = ""
            let k = 0
            for (const [key, value] of Object.entries(characterColors)) {
                characterName = key;
                characterColor = value;
               
                

                let titleBgWidth = sketch.textWidth(longest) +40;

                sketch.fill(value)
                console.log(key)
                console.log(value)
                sketch.rect( sketch.width / 2, ((k*3)*sketch.height / (20))+250, titleBgWidth, 100 ,20); // Rounded rectangle background
                sketch.fill("white")
                sketch.text(key, sketch.width / 2, ((k*3)*sketch.height / (20))+250)
                
                console.log(j)
                k = k + 1
            }
           
            // ... (remaining code)
        }




        

        if ((!starting_correction)&&(instruct_received)){

            sketch.text(instruct, sketch.width / 2,sketch.height / 2);

            
            

        }
        
        
        


        if (starting_correction){ 
            console.log(results)

        
            sketch.text("**************[NEXT REPLY]**************", sketch.width / 2,(sketch.height / 15)*1);
            sketch.text("NEXT REPLY : "+results["next_sentence"], sketch.width / 2,(sketch.height / 15)*2)
            sketch.text("NEXT CHAR : "+results["next_char"], sketch.width / 2,(sketch.height / 15)*3)
            sketch.text("NEXT EMO : "+results["next_emo"], sketch.width / 2,(sketch.height / 15)*4)
            
            if (Object.keys(results).length > 3){
            sketch.text("**************[CORRECTION]**************", sketch.width / 2,(sketch.height / 15)*6);
            if (results.stt_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}
            sketch.text("[CORRECTION] STT : "+results["correction_stt"], sketch.width / 2,(sketch.height / 15)*7);
            sketch.text("[RESULT] STT : "+results["stt"], sketch.width / 2, (sketch.height / 15)*8);
            if (results.emo_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}
            sketch.text("[CORRECTION] EMO : "+results["correction_emo"], sketch.width / 2,(sketch.height / 15)*9);
            sketch.text("[RESULT] EMO : "+results["emo"], sketch.width / 2, (sketch.height / 15)*10);
            if (results.emb_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}
            sketch.text("[CORRECTION] EMB : "+results["correction_emb"], sketch.width / 2, (sketch.height / 15)*11);
            sketch.text("[RESULT] EMB : "+results["emb"], sketch.width / 2, (sketch.height / 15)*12);
                        }
            }
            sketch.fill("white")



        if (state_received) {
        console.log(state)
        sketch.text("STATE : "+state, sketch.width / 2,(sketch.height / 15)*14);
        }
        
        //     bar_height = sketch.map(rfft[i], 0, 750, 0, sketch.height);
        //     bar_color = sketch.map(bar_height, 0, 150, 120, 255);
        //     sketch.stroke(bar_color, 255, 255);
        //     sketch.line(i*mul, sketch.height, i*mul, sketch.height - bar_height);        for(let i = 0; i < results.length; i++){
        // }
    };
});


// "correction_emb": best_emb + " Score : "+str(best_emb_score)+"%", 
// "correction_stt": self.script_info["sentence"], 
// "correction_emo": self.script_info["emo"] ,
// "emo" : best_emo + " Score : "+str(best_conf)+"%",
// "emb" : best_emb + " Score : "+str(best_emb_score)+"%",
// "stt" : sentence,