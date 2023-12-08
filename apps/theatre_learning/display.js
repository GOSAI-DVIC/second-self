
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

    let characterColors_init = false
    let characterColors = {};
    let starting_correction = false 

    let longest = 0
    

    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);

        socket.on(sketch.name, (data) => {
            
            console.log('receiving')
            console.log(Object.keys(data)[0])
            
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
                console.log(characterColors.length);
                characters = data["characters"]
                transcription = data["transcription"]
                console.log('transcription')
                console.log(transcription)
                if (!characterColors_init){
                    for (let i = 0; i < characters.length; i++){
                        characterColors[characters[i]]= "blue"

                    }
                    characterColors_init = true
                }
                if (data['changing_mode_character'].length!=0) {
                    for (var i = 0; i < data['changing_mode_character'].length; i++){
                        if (characterColors[data['changing_mode_character'][i]]=="blue"){
                            characterColors[data['changing_mode_character'][i]] = "orange"  
                        }
                        else {
                            characterColors[data['changing_mode_character'][i]] = "blue"  
                        }
                     }
                }

                console.log(characterColors)
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
                choosing_characters_bool = false
                
               
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
            sketch.text("COMMAND RECEIVED : "+transcription, sketch.width / 2,  sketch.height*(17) / (20))
            
        }

        if ((scenes_info_received)&&(theatre_plays_scene_init)){
            
            sketch.fill("green")
            let titleBgWidth = sketch.textWidth("************** AVAILABLE SCENES **************") + 20;
            sketch.rect( sketch.width / 2, sketch.height * 2 / (20) , titleBgWidth, 50 ,20); // Rounded rectangle background

            sketch.fill("white")
            sketch.text(" AVAILABLE SCENES ", sketch.width / 2, sketch.height * 2 / (20))
         

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
                
                sketch.rect( sketch.width / 2, ((j*2 + 0.5)*sketch.height / (20))+200, titleBgWidth, 75 ,20); // Rounded rectangle background
                sketch.fill("white")
                sketch.text(key, sketch.width / 2, ((j*2)*sketch.height / (20))+200)
                sketch.text(value, sketch.width / 2, ((j*2 + 1)*sketch.height / (20))+200)
                console.log(j)
                j = j + 1
              }
              
            sketch.text("COMMAND RECEIVED : "+transcription, sketch.width / 2,  sketch.height*(17) / (20))

            

        }


        if (choosing_characters_bool){
           
            sketch.fill("green");  // Green color for section title
            let chooseCharactersBgWidth = sketch.textWidth("************** AVAILABLE SCENES **************") + 20;
            sketch.rect(sketch.width / 2, sketch.height * 2 / 20, chooseCharactersBgWidth, 50, 20); // Rounded rectangle background
            sketch.fill("white");  // Black text color
            sketch.text("CHOOSE THE CHARACTERS", sketch.width / 2, sketch.height*2 / 20);

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
                sketch.rect( sketch.width / 2, ((k)*sketch.height / (20))+250, titleBgWidth, 50 ,20); // Rounded rectangle background
                sketch.fill("white")
                sketch.text(key, sketch.width / 2, ((k)*sketch.height / (20))+250)
                

                k = k + 1
            }

            sketch.text("COMMAND RECEIVED : "+transcription, sketch.width / 2, sketch.height*(17) / (20))
           
            // ... (remaining code)
        }




        

        if ((!starting_correction)&&(instruct_received)){

            sketch.text(instruct, sketch.width / 2,sketch.height / 2);

            
            

        }
        
         
        


        if (starting_correction){ 
            console.log(results)

            sketch.fill(50)

            let list = ["**************[NEXT REPLY]**************", "NEXT REPLY : "+results["next_sentence"], "NEXT CHAR : "+results["next_char"], "NEXT EMO : "+results["next_emo"]]
            var lgth = 0
            for (var i = 0; i < list.length; i++) {
                if (list[i].length > lgth) {
                  lgth = list[i].length;
                  longest = list[i];
                }
              }

            let chooseCharactersBgWidth = sketch.textWidth(longest) + 20;
            sketch.rect(sketch.width / 2, sketch.height * 3 / 20, chooseCharactersBgWidth, 145, 20); // Rounded rectangle background
            sketch.fill("white")
            sketch.text("**************[NEXT REPLY]**************", sketch.width / 2,(sketch.height / 20)*1);
            sketch.text("NEXT REPLY : "+results["next_sentence"], sketch.width / 2,(sketch.height / 20)*2)
            sketch.text("NEXT CHAR : "+results["next_char"], sketch.width / 2,(sketch.height / 20)*3)
            sketch.text("NEXT EMO : "+results["next_emo"], sketch.width / 2,(sketch.height / 20)*4)
            
            if (Object.keys(results).length > 3){
            sketch.text("**************[CORRECTION]**************", sketch.width / 2,(sketch.height / 15)*6);
            if (results.stt_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}

            if (("[CORRECTION] STT : "+results["correction_stt"]).length < ("[RESULT] STT : "+results["stt"]).length){
                chooseCharactersBgWidth = sketch.textWidth("[RESULT] STT : "+results["stt"]) + 20;
            }
            else {
                chooseCharactersBgWidth = sketch.textWidth("[CORRECTION] STT : "+results["correction_stt"]) + 20;
            }

            sketch.rect(sketch.width / 2, sketch.height * 8.5 / 20, chooseCharactersBgWidth, 100, 20); // Rounded rectangle background
            
            sketch.fill('white')

            sketch.text("[CORRECTION] STT : "+results["correction_stt"], sketch.width / 2,(sketch.height / 20)*8);
            sketch.text("[RESULT] STT : "+results["stt"], sketch.width / 2, (sketch.height / 20)*9);


            if (results.emo_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}
            
            if (("[CORRECTION] EMO : "+results["correction_emo"]).length < ("[RESULT] EMO : "+results["emo"]).length){
                chooseCharactersBgWidth = sketch.textWidth("[RESULT] EMO : "+results["emo"]) + 20;
            }
            else {
                chooseCharactersBgWidth = sketch.textWidth("[CORRECTION] EMO : "+results["correction_emo"]) + 20;
            }

            sketch.rect(sketch.width / 2, sketch.height * 11.5 / 20, chooseCharactersBgWidth, 100, 20); // Rounded rectangle background
            
            sketch.fill('white')

            sketch.text("[CORRECTION] EMO : "+results["correction_emo"], sketch.width / 2,(sketch.height / 20)*11);
            sketch.text("[RESULT] EMO : "+results["emo"], sketch.width / 2, (sketch.height / 20)*12);


            if (results.emb_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}


            if (("[CORRECTION] EMB : "+results["correction_emb"]).length < ("[RESULT] EMB : "+results["emb"]).length){
                chooseCharactersBgWidth = sketch.textWidth("[RESULT] EMB : "+results["emb"]) + 20;
            }
            else {
                chooseCharactersBgWidth = sketch.textWidth("[CORRECTION] EMB : "+results["correction_emb"]) + 20;
            }

            sketch.rect(sketch.width / 2, sketch.height * 14.5 / 20, chooseCharactersBgWidth, 100, 20); // Rounded rectangle background
            
            sketch.fill('white')


            sketch.text("[CORRECTION] EMB : "+results["correction_emb"], sketch.width / 2, (sketch.height / 20)*14);
            sketch.text("[RESULT] EMB : "+results["emb"], sketch.width / 2, (sketch.height / 20)*15);
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