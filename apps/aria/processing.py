from core.application import BaseApplication
import time

class Application(BaseApplication):
    """Aria"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["pose_to_mirror"] = ["mirrored_data"]

    def listener(self, source, event, data):
        super().listener(source, event, data)
        
        if source == "pose_to_mirror" and event == "mirrored_data" and data is not None:
            self.data = data

            self.server.send_data(self.name, self.data)
            self.data = {
                "face_mesh": self.data["face_mesh"],
                "body_pose": self.data["body_pose"],
                "right_hand_pose": self.data["right_hand_pose"],
                "left_hand_pose": self.data["left_hand_pose"],
            }