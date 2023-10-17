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
        #self.requires["speech_speaker_extraction"] = ["speaker_verification"]

        self.target_sr = 16000

        #Activity config
        self.activity_treshold = 0.3
        self.activity_duration = 1
        self.activity_blocks = []
        
        #Audio extraction config
        self.blocks = []
        self.duration_treshold = 2
        self.activity_detected = False

        #INITIALIZATION SCRIPT
        self.script_init_bool = False
        self.script_init()
        self.char_numb = 0

        #INITIALIZATION OF THE USERS 
        self.init_bool = False
        self.listening_init_spk = False
  
    def script_init(self):
        #ASK TO THE USER WHICH THEATRE PLAY TO USE 
        #AND ALSO WHICH SCENE 
        #GET THE NUMBER OF USER AND THEIR NAME 

        #Exemples
        self.characters = ["Romeo", "Juliette"]
        self.script_init_bool = True




    def init(self, source, event, data):

        if not self.listening_init_spk :
            if self.char_numb < len(self.characters):
                self.char = self.characters[self.char_numb]
                print(f"\n\n\nThe User who is playing for {self.char} needs to read this sentence :\n 'I am living near the best town in France'\n\n\n")
                self.listening_init_spk = True
                self.char_numb += 1
            else :
                return

        if self.listening_init_spk :
            if source == "microphone" and event == "audio_stream" and data is not None:
                frame = data["block"][:, 0]
                sample_rate = data["samplerate"]
                frame = samplerate.resample(frame, self.target_sr * 1.0 / sample_rate, 'sinc_best')  

                if not self.activity_detected :

                    if len(self.blocks)/self.target_sr >self.duration_treshold :
                            self.data = {
                                "onesec_audio": self.onesec,
                                "full_audio" : self.blocks,
                                "new_user" : True,
                                "speaker_name" : self.char
                                        }
                            self.execute("speech_verification_extraction", "speaker_verification", self.data)
                            self.log('\n\n\nUser added with success \n\n\n',3)
                            self.listening_init_spk = False
                            if self.char == self.characters[-1]:
                                self.init_bool = True 
                            return
                            print("SHOULD NOT BE PRINTED")
                
                    #     print("audio not long enough")
                    self.blocks = []


                self.blocks.extend(frame) 
                self.activity_blocks.extend(frame)
                
                if len(self.activity_blocks) >= self.target_sr*self.activity_duration:
                    self.onesec = self.activity_blocks[:self.target_sr*self.activity_duration]
                    self.activity_blocks = self.activity_blocks[self.target_sr*self.activity_duration:]

                    self.data = {
                    "onesec_audio": self.onesec,
                    "full_audio" : self.blocks
                }
                    self.execute("speech_activity_detection", "predict", self.data)
                    #print(f"The User who is playing for {self.char} needs to read this sentence :\n 'I am living near the best town in France'")


            if source == "speech_activity_detection" and event == "activity" and data is not None:
                
                #print(f'Activity confidence : {data["confidence"]}')
                if data["confidence"] > self.activity_treshold :
                    if not self.activity_detected :
                        print('Activity detected : starting recording')
                    self.activity_detected = True
                else :    
                    self.activity_detected = False




    def listener(self, source, event, data):
        super().listener(source, event, data)

        if self.script_init_bool and not self.init_bool : 
            self.init(source, event, data)

        if self.script_init_bool and self.init_bool : 
            if source == "microphone" and event == "audio_stream" and data is not None:

                frame = data["block"][:, 0]
                sample_rate = data["samplerate"]
                frame = samplerate.resample(frame, self.target_sr * 1.0 / sample_rate, 'sinc_best')  
                
    
                if not self.activity_detected :
                    if len(self.blocks)/self.target_sr >self.duration_treshold :
                            self.data = {
                                "onesec_audio": self.onesec,
                                "full_audio" : self.blocks,
                                "new_user" : False,
                                "speaker_name" : None
                                        }
                            self.execute("speech_to_text", "transcribe", self.data)
                            self.execute("speech_verification_extraction", "speaker_verification", self.data)
                    # else : 
                    #     print("audio not long enough")
                    self.blocks = []

                self.blocks.extend(frame) 
                self.activity_blocks.extend(frame)



                if len(self.activity_blocks) >= self.target_sr*self.activity_duration:
                    self.onesec = self.activity_blocks[:self.target_sr*self.activity_duration]
                    self.activity_blocks = self.activity_blocks[self.target_sr*self.activity_duration:]

                    self.data = {
                    "onesec_audio": self.onesec,
                    "full_audio" : self.blocks
                }
                    self.execute("speech_activity_detection", "predict", self.data) 
                
                    
                
                    
                    
                
                    
            if source == "speech_activity_detection" and event == "activity" and data is not None:
                
                print(f'Activity confidence : {data["confidence"]}')
                if data["confidence"] > self.activity_treshold :
                    self.activity_detected = True
                else :    
                    self.activity_detected = False

            #if source == "speech_speaker_extraction" and event == "speaker_verification" and data is not None :
