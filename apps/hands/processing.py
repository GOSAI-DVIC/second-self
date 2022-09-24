from core.application import BaseApplication

class Application(BaseApplication):
    """Reflection"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["pose_to_mirror"] = ["mirrored_data"]

    def listener(self, source, event, data):
        super().listener(source, event, data)

        if source == "pose_to_mirror" and event == "mirrored_data":
            self.data = data
            self.server.send_data(self.name, {
                "right_hand_pose": data["right_hand_pose"], 
                "left_hand_pose": data["left_hand_pose"]
            })
