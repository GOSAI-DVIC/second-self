from core.application import BaseApplication
import os, os.path
import time
import threading


class Application(BaseApplication):
    """SL TRAINING"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["slr"] = ["new_sign"]
        self.requires["pose_to_mirror"] = ["mirrored_data"]

        self.is_exclusive = True
        self.applications_allowed = ["menu", "face", "body", "hands"]
        self.applications_required = ["menu", "face", "body", "hands"]

        # self.SLR_ACTIONS = [
        #     "nothing",
        #     "empty",
        #     "hello",
        #     "thanks",
        #     "iloveyou",
        #     "what's up",
        #     "hey",
        #     "my",
        #     "name",
        #     "nice",
        #     "to meet you",
        #     "ok", 
        #     "left", 
        #     "right"
        # ]

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

    def set_slr_actions(self):
        time.sleep(0.1)
        self.execute("slr", "set_actions", self.SLR_ACTIONS)

    def listener(self, source, event, data):
        super().listener(source, event, data)
        
        if self.started and source == "slr" and event == "new_sign":
            self.data = data
            if self.data is not None:
                self.data = {
                    "guessed_sign": self.data["guessed_sign"], 
                    "probability": self.data["probability"], 
                    "actions": self.SLR_ACTIONS 
                }
                self.server.send_data(f'applications-{self.name}-{event}', self.data)

        if source == "pose_to_mirror" and event == "mirrored_data":
            self.data = {
                "right_hand_pose": data["right_hand_pose"],
                "left_hand_pose": data["left_hand_pose"],
                "body_pose": data["body_pose"]
            }
            self.server.send_data(f'applications-{self.name}-{event}', self.data)