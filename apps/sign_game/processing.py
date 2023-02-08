from core.application import BaseApplication
import os, os.path
import time
import threading


class Application(BaseApplication):
    """SL GAME"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["slr"] = ["new_sign"]
        # self.requires["pose_to_mirror"] = ["mirrored_data"]

        self.is_exclusive = True
        self.applications_allowed = ["menu", "hands"]
        self.applications_required = ["menu", "hands"]

        # self.sent_actions_once = False

        self.characters = {}
        characters_path = os.path.join(os.path.dirname(__file__), "components/characters")
        
        for character in os.listdir(characters_path):
            self.characters[character] = []
            self.characters[character] = {
                "sprites": [],
                "animations": []
            }

            sprites_path = os.path.join(characters_path, character, "sprites")
            if os.path.exists(sprites_path):
                for image in os.listdir(sprites_path):
                    self.characters[character]["sprites"].append(image)
            
            animations_path = os.path.join(characters_path, character, "animations")
            if os.path.exists(animations_path):
                for video in os.listdir(animations_path):
                    self.characters[character]["animations"].append(video)

        threading.Thread(target=self.send_data).start()

        self.SLR_ACTIONS = [
            "nothing",
            "empty",
            "ok",
            "yes",
            "no",
            "left",
            "right",
            "house",
            "store",
            "hello",
            "goodbye",
            "television",
            "leave",
            "eat",
            "apple",
            "peach",
            "skip"
        ]
        
        threading.Thread(target=self.set_slr_actions).start()
        threading.Thread(target=self.send_data).start()

    def set_slr_actions(self):
        time.sleep(0.1)
        self.execute("slr", "set_actions", self.SLR_ACTIONS)

    def send_data(self):
        time.sleep(0.3)
        self.server.send_data(f'applications-{self.name}-characters', self.characters)

    def listener(self, source, event, data):
        super().listener(source, event, data)

        if self.started and source == "slr" and event == "new_sign":
            self.data = data
            if self.data is not None:
                self.data = {
                    "guessed_sign": self.data["guessed_sign"], 
                    "probability": self.data["probability"],
                    "actions": self.SLR_ACTIONS,
                }
                self.server.send_data(f'applications-{self.name}-{event}', self.data)

                # if (self.sent_actions_once == False):
                #     self.server.send_data(f'applications-{self.name}-actions', self.SLR_ACTIONS )
                #     self.sent_actions_once = True

        # if source == "pose_to_mirror" and event == "mirrored_data":
        #     self.data = {
        #         "right_hand_pose": data["right_hand_pose"],
        #         "left_hand_pose": data["left_hand_pose"],
        #         "body_pose": data["body_pose"]
        #     }
        #     self.server.send_data(f'applications-{self.name}-{event}', self.data)