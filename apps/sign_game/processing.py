from core.application import BaseApplication
import os, os.path

class Application(BaseApplication):
    """SL GAME"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["slr"] = ["new_sign"]
        # self.requires["pose_to_mirror"] = ["mirrored_data"]

        self.is_exclusive = True
        self.applications_allowed = ["menu", "hands"]
        self.applications_required = ["menu", "hands"]

        self.executed_once = False

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

    def execute_once(self):
        self.server.send_data(f'applications-{self.name}-characters', self.characters)
        self.executed_once = True

    def listener(self, source, event, data):
        super().listener(source, event, data)
        if not self.executed_once: self.execute_once()
        # self.server.send_data(f'applications-{self.name}-characters', self.characters)
        # if self.characters is not None: 
        #     self.server.send_data("applications-sign_game-characters", self.characters)

        # if self.started and source == "slr" and event == "new_sign":
        #     self.data = data
        #     if self.data is not None:
        #         self.data = {
        #             "guessed_sign": self.data["guessed_sign"], 
        #             "probability": self.data["probability"], 
        #             "actions": self.data["actions"] 
        #         }
        #         self.server.send_data(f'applications-{self.name}-{event}', self.data)

        # if source == "pose_to_mirror" and event == "mirrored_data":
        #     self.data = {
        #         "right_hand_pose": data["right_hand_pose"],
        #         "left_hand_pose": data["left_hand_pose"],
        #         "body_pose": data["body_pose"]
        #     }
        #     self.server.send_data(f'applications-{self.name}-{event}', self.data)