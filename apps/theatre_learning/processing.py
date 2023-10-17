from core.application import BaseApplication
import numpy as np 
import samplerate
from home.apps.theatre_learning.utils import listen_for_one_sentence

class Application(BaseApplication):
    """Theatre play"""

        
    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)

        self.requires["microphone"] = ["audio_stream"]
        self.requires["speech_activity_detection"] = ["activity"]
        self.requires["speech_to_text"] = ["transcription"]
        self.requires["speech_speaker_extraction"] = ["speaker_emb"]
        #self.requires["speech_speaker_extraction"] = ["speaker_verification"]

        self.target_sr = 16000

        #Activity config
        self.activity_treshold = 0.6
        self.activity_duration = 1
        self.activity_detected = False
    

        #INITIALIZATION SCRIPT
        self.script_init()
        

        #INITIALIZATION OF THE USERS 
        self.init_bool = False
        self.char_numb = 0
        self.listening_spk = False


        self.audio = {
        "activity_buffer": [],
        "audio_buffer" : [],
        "char_name" : None,
        "activity_detected" : False
            }


    def script_init(self):
        #ASK TO THE USER WHICH THEATRE PLAY TO USE 
        #AND ALSO WHICH SCENE 
        #GET THE NUMBER OF USER AND THEIR NAME 

        #Exemples
        self.characters = ["Romeo", "Juliette"]





    def init(self, source, event, data):

        if not self.listening_spk :
            if self.char_numb < len(self.characters):
                self.audio["char_name"] = self.characters[self.char_numb]
                self.log(f"\nThe User who is playing for {self.char} needs to read this sentence :\n 'I am living near the best town in France'\n",3)
                self.listening_spk = True
                
        else :

            if source == "microphone" and event == "audio_stream" and data is not None:
                self.listen_for_one_sentence(data, new_users=True)

                if self.audio["char_name"] == self.characters[-1] :
                    self.init_bool = True
                    return 
            
            if source == "speech_activity_detection" and event == "activity" and data is not None:
                
                if data["confidence"] > self.activity_treshold :
                    if not self.activity_detected :
                        print('Activity detected : starting recording')
                    self.activity_detected = True
                else :    
                    self.activity_detected = False




    def listener(self, source, event, data):
        super().listener(source, event, data)

        if not self.init_bool : 
            self.init(source, event, data)

        else : 

            if source == "microphone" and event == "audio_stream" and data is not None:
                self.listen_for_one_sentence(data)
            
            if source == "speech_activity_detection" and event == "activity" and data is not None:
    
                print(f'Activity confidence : {data["confidence"]}')
                if data["confidence"] > self.activity_treshold :
                    self.activity_detected = True
                else :    
                    self.activity_detected = False

            if source == "speech_speaker_extraction" and event == "speaker_emb" and data is not None :
                print(f'Results : {data["comparaison"]}')


    def listen_for_one_sentence(self,
                            data,
                            new_users : bool = False,
                            sentence_duration_treshold : float = 2, 
                            activity_duration : float = 2, 
                            target_sr : int = 16000, ):
            
            frame = data["block"][:, 0]
            sample_rate = self.audio["samplerate"]
            frame = samplerate.resample(frame, target_sr * 1.0 / sample_rate, 'sinc_best')  
            
            self.audio["audio_buffer"].extend(frame) 
            self.audio["activity_buffer"].extend(frame)

            if not self.audio["activity_detected"] :
                if len(self.audio["audio_buffer"])/target_sr > sentence_duration_treshold :
                        
                        # data = {
                        #     "activity_buffer": self.onesec,
                        #     "audio_buffer" : self.blocks,
                        #     "new_user" : False,
                        #     "speaker_name" : None
                        #     "activity_detected" : False
                        #             }

                        self.execute("speech_speaker_extraction", "speaker_verification", self.audio)
                        
                        if new_users : 
                            self.char_numb += 1
                            self.listening_spk = False
                            return 
                        
                        self.execute("speech_to_text", "transcribe", self.audio)
                       #self.execute("speech_to_text", "transcribe", self.data)

                self.audio["audio_buffer"] = []

            elif len(self.audio["audio_buffer"]) == 0 :
                self.audio["audio_buffer"].extend(self.audio["activity_buffer"])





            if len(self.audio["activity_buffer"]) >= target_sr*activity_duration:
                onesec_activity = self.audio["activity_buffer"][:target_sr*activity_duration]
                self.audio["activity_buffer"] = self.audio["activity_buffer"][target_sr*activity_duration:]

                
                self.execute("speech_activity_detection", "predict", onesec_activity) 







        # if self.listening_init_spk :
        #     if source == "microphone" and event == "audio_stream" and data is not None:
        #         frame = data["block"][:, 0]
        #         sample_rate = data["samplerate"]
        #         frame = samplerate.resample(frame, self.target_sr * 1.0 / sample_rate, 'sinc_best')  

        #         if not self.activity_detected :

        #             if len(self.blocks)/self.target_sr >self.duration_treshold :
        #                     self.data = {
        #                         "onesec_audio": self.onesec,
        #                         "full_audio" : self.blocks,
        #                         "new_user" : True,
        #                         "speaker_name" : self.char
        #                                 }
        #                     self.execute("speech_speaker_extraction", "speaker_verification", self.data)
        #                     #print('\n\n\nUser added with success \n\n\n')
        #                     self.listening_init_spk = False
        #                     if self.char == self.characters[-1]:
        #                         self.init_bool = True 
        #                         self.activity_blocks = []
        #                         self.activity_detected = False
        #                     self.char_numb += 1
        #                     self.blocks = []
        #                     return
        #                     print("SHOULD NOT BE PRINTED")
                
        #             #     print("audio not long enough")
        #             self.blocks = []


        #         self.blocks.extend(frame) 
        #         self.activity_blocks.extend(frame)
                
        #         if len(self.activity_blocks) >= self.target_sr*self.activity_duration:
        #             self.onesec = self.activity_blocks[:self.target_sr*self.activity_duration]
        #             self.activity_blocks = self.activity_blocks[self.target_sr*self.activity_duration:]

        #             self.data = {
        #             "onesec_audio": self.onesec,
        #             "full_audio" : self.blocks
        #                         }
        #             self.execute("speech_activity_detection", "predict", self.data)
        #             #print(f"The User who is playing for {self.char} needs to read this sentence :\n 'I am living near the best town in France'")







# frame = data["block"][:, 0]
#                 sample_rate = data["samplerate"]
#                 frame = samplerate.resample(frame, self.target_sr * 1.0 / sample_rate, 'sinc_best')  
                
    
#                 if not self.activity_detected :
#                     if len(self.blocks)/self.target_sr >self.duration_treshold :
#                             self.data = {
#                                 "onesec_audio": self.onesec,
#                                 "full_audio" : self.blocks,
#                                 "new_user" : False,
#                                 "speaker_name" : None
#                                         }
#                             self.execute("speech_speaker_extraction", "speaker_verification", self.data)
#                             self.execute("speech_to_text", "transcribe", self.data)
                            
#                     # else : 
#                     #     print("audio not long enough")
#                     self.blocks = []

#                 self.blocks.extend(frame) 
#                 self.activity_blocks.extend(frame)



#                 if len(self.activity_blocks) >= self.target_sr*self.activity_duration:
#                     self.onesec = self.activity_blocks[:self.target_sr*self.activity_duration]
#                     self.activity_blocks = self.activity_blocks[self.target_sr*self.activity_duration:]

#                     self.data = {
#                     "onesec_audio": self.onesec,
#                     "full_audio" : self.blocks
#                 }
#                     self.execute("speech_activity_detection", "predict", self.data) 
                