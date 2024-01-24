from typing import Any
from fuzzywuzzy import fuzz
import re
import pandas as pd

def preprocess_script(df: pd.DataFrame) -> pd.DataFrame:
    # Create a new column 'count_column' using a loop
    counts = {}
    count_column = []

    df = df.dropna("character")

    for value in df['character']:
        if value in counts:
            counts[value] += 1
        else:
            counts[value] = 1
        count_column.append(counts[value])

    df['count_column'] = count_column
    return df

class Correction():

    def __init__(self,txt_sim_treshold = 80):
        #anger, fear, neutral, joy, sadness, surprise, disgust -> sad, Fearful, disgusted, neutral, happy, angry
        self.emo_mapping = {'anger': 'Angry', 'fear':'Fearful','neutral':'Neutral', 'joy':'Happy', 'sadness':'Sad', 'surprise':'Neutral', 'disgust':'Disgusted'}
        
        self.txt_sim_treshold = txt_sim_treshold

    def txt_correction(self, txt_1 : str, txt_2 : str, scorebool : bool = False,  mode:str="fuzzywuzzy"):

        if mode == 'fuzzywuzzy':
            #score = fuzz.partial_token_set_ratio(txt_1, txt_2)
            score_a = fuzz.token_set_ratio(txt_1,txt_2)
            score_b = fuzz.token_set_ratio(txt_2,txt_1)
            score = min(score_b, score_a)
            print('txt1 : ',txt_1, 'txt2',txt_2 ,'score : ', score)
            if score > self.txt_sim_treshold:
                verif = True
            else :
                verif = False


        else :

            print(re.sub(r'[^\w\s]', '', txt_1.lower()))
            print(re.sub(r'[^\w\s]', '', txt_2.lower()))
            txt_1 = re.sub(r'[^\w\s]', '', txt_1.lower()).replace(' ','')
            txt_2 = re.sub(r'[^\w\s]', '', txt_2.lower()).replace(' ','')
            verif = txt_1==txt_2
        if scorebool :
            return verif, score
        return verif
    def emo_correction(self, emo_1 : str, emo_2 : str):
        return self.emo_mapping[emo_1]==emo_2