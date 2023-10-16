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

        self.target_sr = 16000

        #Activity config
        self.activity_treshold = 0.5
        self.activity_duration = 1
        self.activity_blocks = []
        
        #Audio extraction config
        self.blocks = []
        self.duration_treshold = 2
        self.activity_detected = False

      
    def listener(self, source, event, data):
        super().listener(source, event, data)
 
        if source == "microphone" and event == "audio_stream" and data is not None:

            frame = data["block"][:, 0]
            sample_rate = data["samplerate"]
            frame = samplerate.resample(frame, self.target_sr * 1.0 / sample_rate, 'sinc_best')  
            
            # if self.activity_detected :
            #     self.blocks.extend(onesec) 

            if not self.activity_detected :
                if len(self.blocks)/self.target_sr >self.duration_treshold :
                        self.data = {
                            "onesec_audio": self.onesec,
                            "full_audio" : self.blocks
                                    }
                        self.execute("speech_to_text", "transcribe", self.data)
                           
                self.blocks = []

            self.blocks.extend(frame) 
            self.activity_blocks.extend(frame)


            # if len(self.activity_blocks) < 16000: 
            #     self.activity_blocks.extend(frame)

            if len(self.activity_blocks) >= self.target_sr*self.activity_duration:
                self.onesec = self.activity_blocks[:self.target_sr*self.activity_duration]
                self.activity_blocks = self.activity_blocks[self.target_sr*self.activity_duration:]

                self.data = {
                "onesec_audio": self.onesec,
                "full_audio" : self.blocks
            }
                self.execute("speech_activity_detection", "predict", self.data) 
                # if self.activity_detected :
                #     self.compt_for_stt += 1
                #     self.blocks.extend(onesec) 
                #     print(f'STT numb of sec : {self.compt_for_stt}')
                # else :
                #     if self.compt_for_stt > 3 :
                #         self.execute("speech_to_text", "transcribe", self.data)
                        
                #     self.compt_for_stt = 0
                #     self.blocks = []
                #     self.blocks.extend(self.activity_blocks) 

          
                
               
                
                 
               
                
        if source == "speech_activity_detection" and event == "activity" and data is not None:
            
            print(f'Activity confidence : {data["confidence"]}')
            if data["confidence"] > self.activity_treshold :

                self.activity_detected = True

            else : 
                
                self.activity_detected = False


    # def normalize(self, liste : list):
    #     return [str(x) for x in liste]