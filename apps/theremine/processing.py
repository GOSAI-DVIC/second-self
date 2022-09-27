from core.application import BaseApplication


class Application(BaseApplication):
    """Theremine"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        # self.requires["pose_to_mirror"] = ["mirrored_data"]
        self.requires["pose"] = ["raw_data"]
        self.requires["synthesizer"] = ["synthesizing"]
        self.is_exclusive = True
        self.applications_to_keep = ["hands"]

        @self.server.sio.on("synthesize")
        def synthesize(data):
            self.execute("synthesizer", "play", data)            

    def listener(self, source, event, data):
        super().listener(source, event, data)

        if source == "pose_to_mirror" and event == "mirrored_data" and data is not None:
            self.data = {
                "right_hand_pose": data["right_hand_pose"],
                "left_hand_pose": data["left_hand_pose"]
            }
            self.server.send_data(self.name, self.data)

        if source == "pose" and event == "raw_data" and data is not None:
            self.data = {
                "right_hand_pose": data["right_hand_pose"],
                "left_hand_pose": data["left_hand_pose"]
            }
            self.server.send_data(self.name, self.data)
