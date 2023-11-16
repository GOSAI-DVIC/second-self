from typing import Any
import re

class Correction():

    def __init__(self,):
        #anger, fear, neutral, joy, sadness, surprise, disgust -> sad, Fearful, disgusted, neutral, happy, angry
        self.emo_mapping = {'anger': 'Angry', 'fear':'Fearful','neutral':'Neutral', 'joy':'Happy', 'sadness':'Sad', 'surprise':'Neutral', 'disgust':'Disgusted'}

    def txt_correction(self, txt_1 : str, txt_2 : str):
        return re.sub(r'[^\w\s]', '', txt_1.lower()) == re.sub(r'[^\w\s]', '', txt_2.lower())

    def emo_correction(self, emo_1 : str, emo_2 : str):
        return self.emo_mapping[emo_1]==emo_2