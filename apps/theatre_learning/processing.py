from core.application import BaseApplication
import numpy as np 
import samplerate

class Application(BaseApplication):
    """Theatre play"""

        
    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)

        self.requires["microphone"] = ["audio_stream"]
        self.requires["speech_activity_detection"] = ["activity"]
        self.requires["speech_to_text"] = ["transcription"]
        self.requires["speech_speaker_extraction"] = ["speaker_emb"]
        self.requires["speech_emo_extraction"] = ["speech_emotion"]
        #self.requires["speech_speaker_extraction"] = ["speaker_verification"]

        self.target_sr = 16000
        self.is_listening_for_sentence = False

        #Activity config
        self.activity_treshold = 0.6
        self.activity_duration = 1
        self.previous_processed_activity_buffer = []
        self.processed_activity_buffer = []
        self.activity_buffer = []
    

        #INITIALIZATION SCRIPT
        self.script_init()
        

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
        

    def script_init(self):
        #ASK TO THE USER WHICH THEATRE PLAY TO USE 
        #AND ALSO WHICH SCENE 
        #GET THE NUMBER OF USER AND THEIR NAME 

        #Exemples
        self.characters = ["Romeo", "Juliette"]


    def clear_audio_buffer(self):
        self.audio['audio_buffer'] = []
        self.activity_buffer = []
        self.processed_activity_buffer = []
        self.previous_processed_activity_buffer = []





    def store_character_embedding(self, source, event, data):

        if not self.is_listening_for_sentence:
            if self.character_registered_index < len(self.characters):
                self.audio["char_name"] = self.characters[self.character_registered_index]
                self.log(f"\nThe User who is playing for {self.characters[self.character_registered_index]} needs to read this sentence :\n 'I am living near the best town in France'\n",3)
            else : 
                self.character_embedding_stored = True
                self.audio["char_name"] = None
                self.audio["new_user"] = False
                self.clear_audio_buffer()
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

        if not self.character_embedding_stored : 
            self.store_character_embedding(source, event, data)

        else : 
            if self.module_results['speech_to_text_reception'] and self.module_results['speech_speaker_extraction_reception'] and self.module_results['speech_emo_extraction_reception'] :
                self.log(f'Results [EMB]: {self.module_results["speech_speaker_extraction"]}',3)
                compt = 0
                for segment in self.module_results['speech_to_text'] :
                    compt += 1
                    self.log(f"""Results [STT]:({compt}/{len(self.module_results['speech_to_text'])}) : {segment.text}""",3)  
            
            
                self.is_listening_for_sentence = True
                self.module_results['speech_to_text_reception'] = False
                self.module_results['speech_speaker_extraction_reception'] = False
                self.module_results['speech_emo_extraction_reception'] = False

            if source == "microphone" and event == "audio_stream" and data is not None and self.is_listening_for_sentence:
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
                for emo in data['results']:
                    self.log(f'Results [SEE]: Emotion : {emo["label"]} with {emo["score"]*100}%', 3)
                self.module_results['speech_emo_extraction_reception'] = True





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
                print(self.audio['new_user'], self.audio['char_name'])
                self.execute("speech_speaker_extraction", "speaker_verification", self.audio)
                if self.audio['new_user']==True : 
                    self.character_registered_index += 1
                else : 
                    self.execute("speech_to_text", "transcribe", self.audio)
                    self.execute("speech_emo_extraction", "predict", self.audio) 
                self.is_listening_for_sentence = False

            elif not self.audio['previous_activity_detected'] and self.audio['activity_detected']:
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


    #                         data,
    #                         new_users : bool = False,
    #                         sentence_duration_treshold : float = 2, 
    #                         activity_duration : float = 2, 
    #                         target_sr : int = 16000, ):
            
    #         frame = data["block"][:, 0]
    #         sample_rate = self.audio["samplerate"]
    #         frame = samplerate.resample(frame, target_sr * 1.0 / sample_rate, 'sinc_best')  
            
    #         self.audio["audio_buffer"].extend(frame) 
    #         self.audio["activity_buffer"].extend(frame)

    #         if not self.audio["activity_detected"] :
    #             if len(self.audio["audio_buffer"])/target_sr > sentence_duration_treshold :


    #                     self.execute("speech_speaker_extraction", "speaker_verification", self.audio)
    #                     self.listening_spk = False

    #                     if new_users : 
                            
    #                         self.character_registered_index += 1
    #                         #return 
                        
    #                     else :
    #                         self.execute("speech_to_text", "transcribe", self.audio)
    #                         #self.execute("speech_to_text", "transcribe", self.audio)
    #                         return


    #             self.audio["audio_buffer"] = []

    #         elif len(self.audio["audio_buffer"]) == 0 :
    #             self.audio["audio_buffer"].extend(self.audio["activity_buffer"])





    #         if len(self.audio["activity_buffer"]) >= target_sr*activity_duration:
    #             onesec_activity = self.audio["activity_buffer"][:target_sr*activity_duration]
    #             self.audio["activity_buffer"] = self.audio["activity_buffer"][target_sr*activity_duration:]

                
    #             self.execute("speech_activity_detection", "predict", onesec_activity) 






