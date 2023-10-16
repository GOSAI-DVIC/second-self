from core.application import BaseApplication
import numpy as np 
import samplerate


class Application(BaseApplication):
    """Theatre play"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)

        
        self.requires["microphone"] = ["audio_stream"]
        self.requires["speech_activity_detection"] = ["activity"]

        self.blocks = []
        activity_detected = False

    def listener(self, source, event, data):
        super().listener(source, event, data)

        if source == "microphone" and event == "audio_stream" and data is not None:
            frame = data["block"][:, 0]
          
            sample_rate = data["samplerate"]

            frame = samplerate.resample(frame, 16000 * 1.0 / sample_rate, 'sinc_best')  

            if len(self.blocks) < 16000:
                
                self.blocks.extend(frame)

            else:
                onesec = self.blocks[:16000]
                self.blocks = self.blocks[16000:]
          
                self.data = {
                "onesec": onesec
            }
               
                
                self.execute("speech_activity_detection", "predict", self.data)  
               
                
        if source == "speech_activity_detection" and event == "activity" and data is not None:

            print(data)


    # def normalize(self, liste : list):
    #     return [str(x) for x in liste]