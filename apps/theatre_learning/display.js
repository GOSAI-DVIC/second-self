
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
    let content_mode = ""
    let characterColors_init = false
    let characterColors = {};
    let starting_correction = false 

    let longest = 0
    
    function getTextSize(text) {
        // Split the text into lines
        const lines = text.split('\n');
      
        // Calculate the maximum width among all lines
        const maxWidth = lines.reduce((maxWidth, line) => {
          const lineWidth = sketch.textWidth(line);
          return Math.max(maxWidth, lineWidth);
        }, 0);
      
        // Calculate the total height of all lines
        const totalHeight = lines.length * sketch.textAscent();
      
        return { width: maxWidth, height: totalHeight };
      }




    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);

        socket.on(sketch.name, (data) => {
            
            //console.log('receiving')
           // console.log(Object.keys(data)[0])
            
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
                theatre_plays_scene_init = false
                //scenes_info_received = false
                theatre_play_title_init = true
            }
            
            if (Object.keys(data)[0] == "scenes_info"){
                console.log('scenes_info');
                console.log(data);
                scenes_info = data["scenes_info"]
                scenes_info_received = true 
                theatre_play_title_init = false
                theatre_plays_scene_init = true
                choosing_characters_bool = false
            }

            if (Object.keys(data)[0] == "characters"){

                characters = data["characters"]
                transcription = data["transcription"]
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

                //console.log(characterColors)
                theatre_plays_scene_init = false
                choosing_characters_bool = true
            }

            if (Object.keys(data)[0] == "state"){

                state = data["state"]
                state_received = true 
            }
            if (Object.keys(data)[0] == "instruction"){

                instruct = data["instruction"]
                instruct_received = true
                choosing_characters_bool = false
                
               
            }
            if (Object.keys(data)[0] == "next_char"){

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
            // sketch.fill("green")
            // sketch.rectMode(sketch.CENTER);
            
            // let textSize = getTextSize("************** AVAILABLE THEATRE PLAYS **************");
            // let txtWidth = textSize.width + 0.2*textSize.width ;
            // let txtHeigh = textSize.height + 0.2*textSize.width ;
            // console.log(txtHeigh)
            // console.log(txtWidth)
            // sketch.rect( sketch.width / 2, sketch.height * 2 / (40) , txtWidth, txtHeigh ,20); // Rounded rectangle background

            // sketch.fill("white")
            // sketch.text(" AVAILABLE THEATRE PLAYS ", sketch.width / 2, sketch.height * 2 / (40));
            displayTitle(sketch, "AVAILABLES THEATRE PLAYS")



            displayContent(sketch, available_theatre_plays, content_mode = "play_choice")
            sketch.text("COMMAND RECEIVED : "+transcription, sketch.width / 2,  sketch.height*(36) / (40))
            
        }

        if ((scenes_info_received)&&(theatre_plays_scene_init)){
            
            displayTitle(sketch, "AVAILABLE SCENES")
            displayContent(sketch, scenes_info, content_mode = 'scene_choice')
              
            sketch.text("COMMAND RECEIVED : "+transcription, sketch.width / 2,  sketch.height*(36) / (40))

            

        }


        if (choosing_characters_bool){
           
            sketch.fill("green");  // Green color for section title

            
            displayTitle(sketch, "CHOOSE THE CHARACTERS")
                
            displayContent(sketch, characters, content_mode = 'character_choice')
            //     k = k + 1
            // }

            sketch.text("COMMAND RECEIVED : "+transcription, sketch.width / 2, sketch.height*(36) / (40))
           
            // ... (remaining code)
        }




        

        if ((!starting_correction)&&(instruct_received)){

            sketch.text(instruct, sketch.width / 2,sketch.height / 2);

            
            

        }
        
         
        


        if (starting_correction){ 
           // console.log(results)

            sketch.fill(50)
            
            
            let next_reply = "**************[NEXT REPLY (in "+results["sentences_to_wait"]+" replies)]**************\n"+"NEXT REPLY : "+results["next_sentence"]+"\n"+"NEXT CHAR : "+results["next_char"]+"\n"+"NEXT EMO : "+results["next_emo"]
            let textSize = getTextSize(next_reply);
            let txtWidth = textSize.width + 0.1*textSize.width ;
            let txtHeigh = textSize.height + 0.1*textSize.width ;
         


            sketch.rect(sketch.width / 2, sketch.height * 3 / 40, txtWidth, txtHeigh, 20); // Rounded rectangle background
            sketch.fill("white")
            sketch.text(next_reply, sketch.width / 2,(sketch.height / 40)*3);
            
            
            if (Object.keys(results).length > 3){
            sketch.text("**************[CORRECTION]**************", sketch.width / 2,(sketch.height / 15)*6);
            if (results.stt_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}

            let correction_stt = "[CORRECTION] STT : "+results["correction_stt"] +"\n"+"[RESULT] STT : "+results["stt"]
            textSize = getTextSize(correction_stt);
            txtWidth = textSize.width + 20 ;
            txtHeigh = textSize.height + 20 ;

            sketch.rect(sketch.width / 2, sketch.height * 8 / 20, txtWidth, txtHeigh, 20); // Rounded rectangle background
            
            sketch.fill('white')

            sketch.text(correction_stt, sketch.width / 2,(sketch.height / 20)*8);
            

            if (results.emo_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}
            
            let correction_emo = "[CORRECTION] EMO : "+results["correction_emo"]+"\n"+"[RESULT] EMO : "+results["emo"]
            textSize = getTextSize(correction_emo);
            txtWidth = textSize.width + 20 ;
            txtHeigh = textSize.height + 20 ;
           

            sketch.rect(sketch.width / 2, sketch.height * 11 / 20, txtWidth, txtHeigh, 20); // Rounded rectangle background
            
            sketch.fill('white')

            sketch.text(correction_emo, sketch.width / 2,(sketch.height / 20)*11);
            


            if (results.emb_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}

            let correction_emb = "[CORRECTION] EMB : "+results["correction_emb"]+"\n"+"[RESULT] EMB : "+results["emb"]
            textSize = getTextSize(correction_emb);
            txtWidth = textSize.width + 20 ;
            txtHeigh = textSize.height + 20 ;


            sketch.rect(sketch.width / 2, sketch.height * 14 / 20, txtWidth, txtHeigh, 20); // Rounded rectangle background
            
            sketch.fill('white')


            sketch.text(correction_emb, sketch.width / 2, (sketch.height / 20)*14);
          
                        }
            }
            sketch.fill("white")



        if (state_received) {

        sketch.text("STATE : "+state, sketch.width / 2,(sketch.height / 40)*38);
        }
        
        //     bar_height = sketch.map(rfft[i], 0, 750, 0, sketch.height);
        //     bar_color = sketch.map(bar_height, 0, 150, 120, 255);
        //     sketch.stroke(bar_color, 255, 255);
        //     sketch.line(i*mul, sketch.height, i*mul, sketch.height - bar_height);        for(let i = 0; i < results.length; i++){
        // }



function displayTitle(sketch, text) {

  
    sketch.fill("green")
    sketch.rectMode(sketch.CENTER);
    
    let textSize = getTextSize(text);
    let txtWidth = textSize.width + 0.3*textSize.width ;
    let txtHeigh = textSize.height + 0.3*textSize.height ;

    sketch.rect( sketch.width / 2, sketch.height * 2 / (40) , txtWidth, txtHeigh ,20); // Rounded rectangle background

    sketch.fill("white")
    sketch.text(text, sketch.width / 2, sketch.height * 2 / (40));
    
  }

    

function displayContent(sketch, text_array, mode){
 
    if (mode=="scene_choice"){
    var lgth = 0
    for (const [key, value] of Object.entries(text_array)) {
        if (String(value).length > lgth){
            lgth = String(value).length;
            longest = String(value);
        }
        }
    
    let j = 0 
    console.log('longest : ', longest)
    let textSize = getTextSize(longest);
    let txtWidth = textSize.width + 0.2*textSize.width ;
    let txtHeigh = textSize.height + 0.2*textSize.height ;
    for (const [key, value] of Object.entries(text_array)) {

    
        


        sketch.fill(50)
        
        sketch.rect( sketch.width / 2, ((j*3 + 0.5)*sketch.height / (40))+(sketch.height * 2 / (40) +  txtHeigh*2), 2*txtWidth, txtHeigh ,20); // Rounded rectangle background
        sketch.fill("white")
        sketch.text(key, sketch.width / 2, ((j*3)*sketch.height / (40))+sketch.height * 2 / (40) +  txtHeigh*2)
        sketch.text(value, sketch.width / 2, ((j*3 + 1)*sketch.height / (40))+sketch.height * 2 / (40) +  txtHeigh*2)
        console.log(key + value)

        j = j + 1
    }

    }
    if (mode == "play_choice") {
    var lgth = 0
    for (var i = 0; i < text_array.length; i++) {
        if (text_array[i].length > lgth) {
          lgth = text_array[i].length;
          longest = text_array[i];
        }
      }
    let textSize = getTextSize(longest);
    let txtWidth = textSize.width + 0.3*textSize.width ;
    let txtHeigh = textSize.height + 0.3*textSize.height  ;
    for (let i = 0; i < text_array.length; i++) {
        sketch.fill(50)



        sketch.rect( sketch.width / 2, ((i*2)*sketch.height / (40))+(sketch.height * 2 / (40) +  txtHeigh*2), txtWidth, txtHeigh ,20); // Rounded rectangle background
        sketch.fill("white")
        sketch.text(text_array[i], sketch.width / 2, ((i*2)*sketch.height / (40))+(sketch.height * 2 / (40) +  txtHeigh*2))
       
    }

    }
    if (mode == "character_choice"){

        sketch.fill(0, 0, 255);  // Blue color for character rectangles

            var lgth = 0
            for (var i = 0; i < text_array.length; i++) {
                if (text_array[i].length > lgth) {
                  lgth = text_array[i].length;
                  longest = text_array[i];
                  
                }
              }
            console.log("logest : " ,longest)
            let characterName = ""
            let characterColor = ""
            let k = 0
            let textSize = getTextSize(longest);
            let txtWidth = textSize.width + 0.2*textSize.width ;
            let txtHeigh = textSize.height + 0.2*textSize.height ;
            
            for (const [key, value] of Object.entries(characterColors)) {
                characterName = key;
                characterColor = value;
               
                



                sketch.fill(value)
                sketch.rect( sketch.width / 2, ((k*2)*sketch.height / (40))+(sketch.height * 2 / (40) +  txtHeigh*2), txtWidth, txtHeigh ,20); // Rounded rectangle background
                sketch.fill("white")
                sketch.text(key, sketch.width / 2, ((k*2)*sketch.height / (40))+(sketch.height * 2 / (40) +  txtHeigh*2))
                

                k = k + 1
            }

        if (mode == "correction"){

            sketch.fill(50)

            let next_reply = "**************[NEXT REPLY]**************\n"+"NEXT REPLY : "+results["next_sentence"]+"\n"+"NEXT CHAR : "+results["next_char"]+"\n"+"NEXT EMO : "+results["next_emo"]
            let textSize = getTextSize(next_reply);
            let txtWidth = textSize.width + 0.3*textSize.width ;
            let txtHeigh = textSize.height + 0.3*textSize.height ;
         


            sketch.rect(sketch.width / 2, sketch.height * 9 / 40, txtWidth, txtHeigh, 20); // Rounded rectangle background
            sketch.fill("white")
            sketch.text(next_reply, sketch.width / 2,(sketch.height / 40)*9);
            
            
            if (Object.keys(results).length > 3){
            sketch.text("**************[CORRECTION]**************", sketch.width / 2,(sketch.height / 40)*18);
            if (results.stt_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}

            let correction_stt = "[CORRECTION] STT : "+results["correction_stt"] +"\n"+"[RESULT] STT : "+results["stt"]
            textSize = getTextSize(correction_stt);
            txtWidth = textSize.width + 20 ;
            txtHeigh = textSize.height + 20 ;

            sketch.rect(sketch.width / 2, sketch.height * 20 / 40, txtWidth, txtHeigh, 20); // Rounded rectangle background
            
            sketch.fill('white')

            sketch.text(correction_stt, sketch.width / 2,(sketch.height / 40)*22);
            

            if (results.emo_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}
            
            let correction_emo = "[CORRECTION] EMO : "+results["correction_emo"]+"\n"+"[RESULT] EMO : "+results["emo"]
            textSize = getTextSize(correction_emo);
            txtWidth = textSize.width + 0.3*textSize.width ;
            txtHeigh = textSize.height + 0.3*textSize.height ;
           

            sketch.rect(sketch.width / 2, sketch.height * 24 / 40, txtWidth, txtHeigh, 20); // Rounded rectangle background
            
            sketch.fill('white')

            sketch.text(correction_emo, sketch.width / 2,(sketch.height / 40)*24);
            


            if (results.emb_correction_bool){
                sketch.fill("green")
            }
            else {sketch.fill("red")}

            let correction_emb = "[CORRECTION] EMB : "+results["correction_emb"]+"\n"+"[RESULT] EMB : "+results["emb"]
            textSize = getTextSize(correction_emb);
            txtWidth = textSize.width + 0.3*textSize.width ;
            txtHeigh = textSize.height + 0.3*textSize.height ;


            sketch.rect(sketch.width / 2, sketch.height * 26 / 40, txtWidth, txtHeigh, 20); // Rounded rectangle background
            
            sketch.fill('white')


            sketch.text(correction_emb, sketch.width / 2, (sketch.height / 26)*40);
          
                        }
            }
            sketch.fill("white")

        }


    }



    };
});

