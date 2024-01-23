from core.application import BaseApplication
import numpy as np 
import samplerate
import pandas as pd 
from home.apps.theatre_learning.utils import Correction
import time 
import os
import soundfile as sf
import time

class Application(BaseApplication):
    """Theatre play"""

        
    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)

        self.time = 0

        self.corrector = Correction()
        self.corrector_for_cmd = Correction(80)

        #FOR JS
        self.recording_sent = False
        self.processing_sent = False
        self.delayed_bool = False

        #self.requires["hand_pose"] = ["raw_data"]
        self.requires["microphone"] = ["audio_stream"]
        self.requires["speech_activity_detection"] = ["activity"]
        self.requires["speech_to_text"] = ["transcription"]
        self.requires["speech_speaker_extraction"] = ["speaker_emb"]
        self.requires["speech_emo_extraction"] = ["speech_emotion"]
        self.requires["speaker"] = ["play"]
        
        #self.requires["speech_speaker_extraction"] = ["speaker_verification"]

        self.target_sr = 16000
        self.is_listening_for_sentence = False

        #Activity config
        self.activity_treshold = 0.9    
        self.activity_duration = 1
        self.previous_processed_activity_buffer = []
        self.processed_activity_buffer = []
        self.activity_buffer = []
    

        #INITIALIZATION SCRIPT
        # self.str_scene_title = "TWATC"
        # script_path = "home/apps/theatre_learning/scripts/TWATC_processed.csv"
        # self.script_init(script_path, )
        self.audio_path = ""
        self.waiting_result_bool = False
        self.command_recognized_bool = True
        self.theatre_play_scene_init_bool = False
        self.theatre_play_title_init_bool = False
        self.theatre_play_character_init_bool = False
        self.title_choosen = ""
        self.changing_mode_character = None
        self.return_command_str = "go back"
        self.changing_mode_character = []
        self.script_info = {
            "idx" : 0,
            "sentence" : "",
            "next_sentence" : "",
            "next_emo" : "",
            "next_char" : "",
            "character" : "",
            "emo" : ""
        }
        #self.script_idx = 0 
        self.initialisation_bool = False
        self.audio_to_read_idx = []
        self.iteration = True
        self.is_speaking = False
        

        #INITIALIZATION OF THE USERS 
        self.character_embedding_stored = False 
        self.character_registered_index = 0
        


        self.audio = {
        #"activity_buffer": [],
        "audio_buffer" : [],
        "char_name" : None,
        "new_user" : True,
        "activity_detected" : False,
       "previous_activity_detected" : False
            }

        self.activity_detection_reception = False

        #module results
        self.module_results = {
            "speech_to_text_reception" : False,
            "speech_speaker_extraction_reception" : False,
            "speech_emo_extraction_reception" : False
        }

    def preprocess_script(self, df: pd.DataFrame) -> pd.DataFrame:
        # Create a new column 'count_column' using a loop
        counts = {}
        count_column = []
        for value in df['character']:
            if value in counts:
                counts[value] += 1
            else:
                counts[value] = 1
            count_column.append(counts[value])

        df['count_column'] = count_column
        return df

    def get_all_scenes(self, theatre_play):
        self.script = pd.read_csv('home/apps/theatre_learning/scripts/'+theatre_play)
        self.audio_path = os.path.join("home/apps/theatre_learning/audio", theatre_play.split('.')[0])
        
        self.scene_list = []
        self.theatre_play_scene_info = dict()
        new_scene = 0
        idx = 0
        self.script = self.preprocess_script(self.script)
        self.script = self.script.fillna("NaN")
        if str(theatre_play) == "Pursuit of happiness.csv" :

            for i, row in self.script.iterrows():

                # self.log(str(i)+str(len(self.scene_list)), 3)
                if type(new_scene) != int: 
                    new_scene.at[idx, "character"] = row["character"]
                    new_scene.at[idx, "type"] = row["type"]
                    new_scene.at[idx, "sentence"] = row["sentence"]
                    new_scene.at[idx, "emo"] = row["j-hartmann/emotion-english-distilroberta-base"]
                    new_scene.at[idx, "count_column"] = row["count_column"]
                    idx += 1

                if row['sentence'][:6] == 'Scene:' : 
                    
                    if type(new_scene) != int: 
                       
                        new_scene = new_scene[new_scene['type'] == "speech"]
                        
                        self.scene_list.append(new_scene)
                        print("appending new scene")

                    new_scene = pd.DataFrame(columns = ['character', 'type', 'sentence', 'emo', 'count_column'])
            new_scene = new_scene[new_scene['type'] == "speech"]
           
            self.scene_list.append(new_scene)
           
         


            
        if str(theatre_play) == "The window across the courtyard.csv" :
            new_scene = pd.DataFrame(columns = ['character', 'type', 'sentence','emo', 'count_column'])
            for i, row in self.script.iterrows():
                new_scene.at[idx, "character"] = row["character"]
                new_scene.at[idx, "type"] = row["type"]
                new_scene.at[idx, "sentence"] = row["sentence"]
                new_scene.at[idx, "emo"] = row["michellejieli/emotion_text_classifier"]
                new_scene.at[idx, "count_column"] = row["count_column"]

                idx += 1
            new_scene = new_scene[new_scene['type'] == "speech"]
            self.scene_list = [new_scene]
        compt = 1

        for scene in self.scene_list : 
            
            characters = scene["character"].unique().tolist()
            if 'NaN' in characters :
                characters.remove('NaN')

            self.theatre_play_scene_info["scene - "+str(compt)] = characters
            compt+=1
        

            


        


        
        

    def script_init(self, source, event, data):


        if self.command_recognized_bool : 


            #if self.command_recognized_bool :
            if self.theatre_play_title_init_bool and not self.theatre_play_scene_init_bool :
            
                
                path = self.title_choosen+'.csv'
                self.get_all_scenes(path)
                self.log(self.theatre_play_scene_info,3)
                self.data = {
                            "scenes_info" : self.theatre_play_scene_info
                        }
                self.server.send_data(self.name, self.data)

                self.data = {
                    "state" : "Listening..."
                }   
                self.server.send_data(self.name, self.data)
            
            elif self.theatre_play_title_init_bool and self.theatre_play_scene_init_bool :
                self.data = {
                    "characters" : self.characters,
                    "changing_mode_character" : self.changing_mode_character,
                    "transcription" : self.command
                   
                }
             
                self.server.send_data(self.name, self.data)

            else :
                self.available_theatre_plays = [f.split('.')[0] for f in os.listdir(os.getcwd()+'/home/apps/theatre_learning/scripts') if os.path.isfile(os.path.join(os.getcwd()+'/home/apps/theatre_learning/scripts', f))]
                self.data = {
                            "available_theatre_plays" : self.available_theatre_plays
                        }
                self.server.send_data(self.name, self.data)
                print('info sent')
                
            self.data = {
                    "state" : "Listening..."
                }   
            self.server.send_data(self.name, self.data)

            self.is_listening_for_sentence = True
            self.command_recognized_bool = False

        else : 
            if source == "microphone" and event == "audio_stream" and data is not None and not self.waiting_result_bool :


                
                self.listen_for_one_sentence(data)
               



            
            if source == "speech_activity_detection" and event == "activity" and data is not None:
                
                self.activity_detection_reception = True  
                self.audio['previous_activity_detected'] = self.audio['activity_detected']
                if data["confidence"] > self.activity_treshold :
                    
                    self.audio['activity_detected'] = True
                else :    
                    self.audio['activity_detected'] = False
                print(self.audio['previous_activity_detected'] ,self.audio['activity_detected'] )

            if source == "speech_to_text" and event == "transcription" and data is not None :
                self.command = ""
                #command_recognized_bool = False
                self.command_recognized = ""

                self.log(data['transcription_segments'],3)
                self.command = data['transcription_segments']
                if not self.theatre_play_title_init_bool and not self.theatre_play_scene_init_bool:
                    for txt in self.available_theatre_plays :
                        if self.corrector_for_cmd.txt_correction(self.command, txt) :
                            self.theatre_play_title_init_bool = True 
                            self.command_recognized_bool = True
                            self.command_recognized = txt
                            self.title_choosen = txt
                            print('self.command_recognized = ', txt)
                                  
                            
                    self.data = {
                    "command_recognized_bool" : self.theatre_play_title_init_bool,
                    "command_recognized" : self.command_recognized,
                    "transcription" : self.command
                     }
                    

                elif self.theatre_play_title_init_bool and not self.theatre_play_scene_init_bool : 


                    if self.corrector_for_cmd.txt_correction(self.command, "go back") :
                        self.theatre_play_character_init_bool = False
                        self.theatre_play_scene_init_bool = False
                        self.theatre_play_title_init_bool = False
                        self.command_recognized_bool = True
                    
                    else :
                        best_score = 0
                        for txt in self.theatre_play_scene_info.keys() :

                            numb_mapping = {1:"one", 2:"two", 3:"three", 4:"four", 5:"five", 6:"six", 7:"seven", 8:"eight"}
                            lit_bool, lit_score = self.corrector_for_cmd.txt_correction(self.command, txt[:5]+' '+str(numb_mapping[int(txt[-1])]), scorebool=True)
                            dec_bool, dec_score = self.corrector_for_cmd.txt_correction(self.command, txt[:5]+' '+txt[-1], scorebool = True)
                            if (lit_bool or dec_bool) and (lit_score > best_score or dec_score > best_score) :
                                best_score = max(lit_score, dec_score)
                                self.theatre_play_scene_init_bool = True
                                self.command_recognized_bool = True 
                                self.command_recognized = txt

                            
                                self.characters = self.theatre_play_scene_info[self.command_recognized]
                                self.characters_to_keep = []
                    
                                self.scene_script = self.scene_list[int(self.command_recognized[-1])-1]

                         

                else :

                    if self.corrector_for_cmd.txt_correction(self.command, "go back") :
                        self.theatre_play_character_init_bool = False
                        self.theatre_play_scene_init_bool = False
                        self.theatre_play_title_init_bool = True
                        self.command_recognized_bool = True

                    elif self.corrector_for_cmd.txt_correction(self.command, "let's start") :
                        self.initialisation_bool = True
                        self.theatre_play_scene_init_bool = True
                        
                        
                       
                    else :
                        for txt in self.characters :
                            if self.corrector_for_cmd.txt_correction(self.command, txt) :
                                
                                self.changing_mode_character.append(txt)

                                if txt in self.characters_to_keep :
                                    self.characters_to_keep.remove(txt)
                                elif txt not in self.characters_to_keep :
                                    self.characters_to_keep.append(txt)

                           

                            self.command_recognized_bool = True 
                                             
                        
    
                    self.log(self.command,3)                            
                    self.data = {
                    "characters" : self.characters,
                    "changing_mode_character" : self.changing_mode_character,
                    "transcription" : self.command
                    }

                self.server.send_data(self.name, self.data)
                self.processing_sent = False

                self.changing_mode_character = []

                self.waiting_result_bool = False

                self.data = {
                    "state" : "Listening..."
                }   
                self.server.send_data(self.name, self.data)
                



       


    def clear_audio_buffer(self):
        self.audio['audio_buffer'] = []
        self.activity_buffer = []
        self.processed_activity_buffer = []
        self.previous_processed_activity_buffer = []

    def script_iter(self,):


        if self.script_info["idx"] >= len(self.scene_script):
            self.log("Script finished !", 3)
            
        else : 
            if self.iteration == True : 
                self.iteration = False
                self.script_info["idx"] += 1
                
                while self.scene_script['character'].iloc[self.script_info['idx']] == "NaN" or self.scene_script['character'].iloc[self.script_info['idx']] not in self.characters_to_keep :
                    if self.scene_script['character'].iloc[self.script_info['idx']] not in self.characters_to_keep : #Enter when user is not register
                        self.log("Character not in the scene",3)
                        self.audio_to_read_idx.append(self.script_info['idx'])
                        print(self.audio_to_read_idx)
                

                    
                    self.script_info["idx"] += 1 
                    #else : 
                self.script_info["sentence"] = self.scene_script['sentence'].iloc[self.script_info['idx']]
                
                self.script_info["character"] = self.scene_script['character'].iloc[self.script_info['idx']]

                self.script_info["emo"] = self.scene_script['emo'].iloc[self.script_info['idx']]
            

                idx = self.script_info["idx"] + 1
                sentences_to_wait = 0
                while self.scene_script['character'].iloc[idx] == "NaN" or self.scene_script['character'].iloc[idx] not in self.characters_to_keep :
                    if self.scene_script['character'].iloc[idx] not in self.characters_to_keep  :
                        sentences_to_wait += 1
                    idx += 1 

                self.script_info["next_sentence"] = self.scene_script['sentence'].iloc[idx]
                self.script_info["next_emo"] = self.scene_script['emo'].iloc[idx]
                self.script_info["next_char"] = self.scene_script['character'].iloc[idx]
                self.script_info["sentences_to_wait"] = sentences_to_wait
            




    def correction(self, mode = "") :

        if mode=="script_init":
            self.log(f'Correction [STT]: {self.script_info["sentence"]}',3)
            
           
            sentence = self.module_results['speech_to_text']


        else : 
            self.log(f'Correction [EMB]: {self.script_info["character"]}',3)
            self.log(f'Results [EMB]: {self.module_results["speech_speaker_extraction"]}',3)
            best_emb_score = 0
            best_emb = ""
            for i, emb in self.module_results["speech_speaker_extraction"].items():
                if float(emb[1].item()) > best_emb_score :
                    best_emb_score = float(emb[1].item())
                    best_emb = i

            self.log(f'Correction [STT]: {self.script_info["sentence"]}',3)
        
            sentence = self.module_results['speech_to_text']
            self.log(f'Correction [SEE]: {self.script_info["emo"]}',3)

            best_conf = 0
            for emo in self.module_results['speech_emo_extraction'] :
                self.log(f'Results [SEE]: Emotion : {emo["label"]} with {emo["score"]*100}%', 3)
                if float(emo["score"]*100) > best_conf :
                    best_emo = emo["label"]
                    best_conf = float(emo["score"]*100)

            self.log(self.script_info["next_sentence"], 3)
            self.log(sentence, 3)

            sttcorrection, sttscore = self.corrector.txt_correction(self.script_info["sentence"],sentence, scorebool=True)
            self.log(sttcorrection, 3)

           
            self.data_correction = {
                        "next_char": self.script_info["next_char"], 
                        "next_emo": self.script_info["next_emo"], 
                        "next_sentence": self.script_info["next_sentence"],           
                        "correction_emb": self.script_info["character"] , 
                        "correction_stt": self.script_info["sentence"], 
                        "correction_emo": self.script_info["emo"] ,
                        "emo" : best_emo + " Score : "+str(best_conf)+"%",
                        "emb" : best_emb + " Score : "+str(best_emb_score*100)+"%",
                        "stt" : sentence + " Score : "+str(sttscore)+"%",
                        "emo_correction_bool":self.corrector.emo_correction(self.script_info["emo"],best_emo),
                        "emb_correction_bool":best_emb==self.script_info["character"],
                        "stt_correction_bool":sttcorrection,
                        "sentences_to_wait": self.script_info["sentences_to_wait"]
                    }
            self.server.send_data(self.name, self.data_correction)
            self.iteration = True
                
            # if correction good : 


        self.data = {
                        "state" : "Listening..."
                    }
        self.server.send_data(self.name, self.data)
        self.processing_sent = False


    def store_character_embedding(self, source, event, data):

        if not self.is_listening_for_sentence:
            if self.character_registered_index < len(self.characters):
                self.audio["char_name"] = self.characters[self.character_registered_index]
                txt = "\nThe User who is playing for "+str(self.characters[self.character_registered_index])+" needs to read this sentence :\n 'Today is a beautiful sunny day'\n"
                
                


                self.data = {
                    "instruction" : txt
                }
                self.server.send_data(self.name, self.data)

                self.log(txt,3)

                self.data = {
                    "state" : "Listening..."
                }
                self.server.send_data(self.name, self.data)
            
            
            else : 
                self.character_embedding_stored = True
                self.audio["char_name"] = None
                self.audio["new_user"] = False
                self.clear_audio_buffer()


                self.script_iter()
                self.data = {
                    "next_char": self.script_info["character"], 
                    "next_emo": self.script_info["emo"], 
                    "next_sentence": self.script_info["sentence"],  
                    "sentences_to_wait": self.script_info["sentences_to_wait"]
                }
                self.server.send_data(self.name, self.data)

                self.play_audio()
                


            self.is_listening_for_sentence = True
            
        
                
        else :

            if source == "microphone" and event == "audio_stream" and data is not None :


                
                self.listen_for_one_sentence(data)#, new_users=True)
                

                # if self.audio["char_name"] == self.characters[-1] and not self.is_listening_for_sentence :
                #     self.character_embedding_stored = True
                #     self.audio["char_name"] = None
                #     self.audio["new_user"] = False
                #     self.clear_audio_buffer()
                #     return 
            
            if source == "speech_activity_detection" and event == "activity" and data is not None:
                
                self.activity_detection_reception = True  
                self.audio['previous_activity_detected'] = self.audio['activity_detected']
                if data["confidence"] > self.activity_treshold :
                    
                    self.audio['activity_detected'] = True
                else :    
                    self.audio['activity_detected'] = False
                print(self.audio['previous_activity_detected'] ,self.audio['activity_detected'] )



    def listener(self, source, event, data):
        super().listener(source, event, data)

        if not self.delayed_bool : 
            time.sleep(5)
            print("Finished sleeping xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
            self.delayed_bool = True

        if not self.initialisation_bool :
           self.script_init(source, event, data)
           

        elif not self.character_embedding_stored and self.initialisation_bool: 
            self.characters = self.characters_to_keep
            self.store_character_embedding(source, event, data)

        else : 
            if self.module_results['speech_to_text_reception'] and self.module_results['speech_speaker_extraction_reception'] and self.module_results['speech_emo_extraction_reception'] :
                self.correction()
                    

                self.is_listening_for_sentence = True
                self.module_results['speech_to_text_reception'] = False
                self.module_results['speech_speaker_extraction_reception'] = False
                self.module_results['speech_emo_extraction_reception'] = False


            if source == "microphone" and event == "audio_stream" and data is not None and self.is_listening_for_sentence and not self.is_speaking:
                self.script_iter()
                self.play_audio()
                
                self.listen_for_one_sentence(data)

                
            
            if source == "speech_activity_detection" and event == "activity" and data is not None:
                
                self.activity_detection_reception = True
                self.log(f'Activity confidence : {data["confidence"]}',3)
                self.audio['previous_activity_detected'] = self.audio['activity_detected']
                if data["confidence"] > self.activity_treshold :
                    
                    self.audio['activity_detected'] = True
                else :    
                    self.audio['activity_detected'] = False
                
                print(self.audio['previous_activity_detected'] ,self.audio['activity_detected'] )


            if source == "speech_speaker_extraction" and event == "speaker_emb" and data is not None :
                #self.log(f'Results : {data["comparaison"]}',3)
                self.module_results[source] = data["comparaison"]
                self.module_results['speech_speaker_extraction_reception'] = True
            
            if source == "speech_to_text" and event == "transcription" and data is not None :
                # compt = 0 
                # for segment in data["transcription_segments"]:
                #     compt += 1
                #     self.log(f'Results ({compt}/{len(data["transcription_segments"])}) : {segment.text}',3) 
                self.module_results[source] = data['transcription_segments']
                self.module_results['speech_to_text_reception'] = True

            if source == "speech_emo_extraction" and event == "speech_emotion" and data is not None :
                
                self.module_results['speech_emo_extraction'] = data['results']
                self.module_results['speech_emo_extraction_reception'] = True
            


    def play_audio(self, init = False):
        
        while len(self.audio_to_read_idx)!=0:
            self.server.send_data(self.name, {"state" : "Computer Speaking..."})
            self.is_speaking = True
            idx = self.audio_to_read_idx.pop()
            print(self.audio_to_read_idx)
            char = self.scene_script['character'].iloc[idx]
            column_count = self.scene_script["count_column"].iloc[idx]
            audio = os.path.join(self.audio_path, f'{char}_{str(column_count)}.wav')
            self.log(audio,3)
            audio, sr = sf.read(audio)
            self.log(f'Audio duration : {len(audio)/sr}',3)
            self.log(f'Audio sample rate : {sr}',3)
            self.execute("speaker", "play", audio)
            time.sleep(len(audio)/sr)
            if init :
                self.data = {
                            "next_char": self.data["next_char"], 
                            "next_emo": self.data["next_emo"], 
                            "next_sentence": self.data["next_sentence"],           
                            "sentences_to_wait": self.data["sentences_to_wait"] - 1
                        }
            else :
                self.data_correction["sentences_to_wait"] -=1
                self.server.send_data(self.name, self.data_correction)
            if len(self.audio_to_read_idx)==0:
                self.server.send_data(self.name, {"state" : "Listening..."})
                self.is_speaking = False




    def listen_for_one_sentence(self, 
                                data,
                                target_sr : int = 16000,
                                activity_duration : int = 1):
        
        mic_chunk = data["block"][:, 0]
        sample_rate = data["samplerate"]
        mic_chunk = samplerate.resample(mic_chunk, target_sr * 1.0 / sample_rate, 'sinc_best')  
        
        if self.activity_detection_reception == True :

            self.activity_detection_reception = False
            if not self.audio['previous_activity_detected'] and not self.audio['activity_detected']:
                pass

            elif self.audio['previous_activity_detected'] and not self.audio['activity_detected']:
             
                
                # Displaying "Processing..."
                if not self.processing_sent : 
                    self.data = {
                        "state" : "Processing..."
                    }
                    self.server.send_data(self.name, self.data)
                    self.processing_sent = True
                    self.recording_sent = False

                if self.initialisation_bool : 
                    self.execute("speech_speaker_extraction", "speaker_verification", self.audio)
                    if self.audio['new_user']==True : 
                        self.character_registered_index += 1
                    else : 
                        self.execute("speech_to_text", "transcribe", self.audio)
                        self.execute("speech_emo_extraction", "predict", self.audio) 
                if (not self.character_embedding_stored and not self.initialisation_bool) or (self.character_embedding_stored and self.initialisation_bool) :
                   
                    self.execute("speech_to_text", "transcribe", self.audio)

                self.is_listening_for_sentence = False

            elif not self.audio['previous_activity_detected'] and self.audio['activity_detected']:

                if not self.recording_sent :
                    self.data = {
                        "state" : "Recording..."
                    }
                    self.server.send_data(self.name, self.data)
                    self.recording_sent = True
                
                self.audio['audio_buffer'] = self.previous_processed_activity_buffer # Adding the false activity buffer (to be sure not too loose any audio information)
                self.audio['audio_buffer'].extend(self.processed_activity_buffer) # Then adding the true one -> the last one 

            elif self.audio['previous_activity_detected'] and self.audio['activity_detected']:
                self.audio['audio_buffer'].extend(self.processed_activity_buffer) # Adding the true one -> last one 

        

        self.activity_buffer.extend(mic_chunk)
        #print('activity buffer duration : ', len(self.activity_buffer)/16000)


        if len(self.activity_buffer)> target_sr * activity_duration :

            self.previous_processed_activity_buffer = self.processed_activity_buffer
            self.processed_activity_buffer = self.activity_buffer[:target_sr * activity_duration]
            self.execute("speech_activity_detection", "predict", self.processed_activity_buffer)
            self.activity_buffer = self.activity_buffer[target_sr * activity_duration:] 


   
