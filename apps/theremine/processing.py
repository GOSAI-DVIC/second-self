from core.application import BaseApplication


class Application(BaseApplication):
    """Theremine"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["pose_to_mirror"] = ["mirrored_data"]
        self.requires["synthesizer"] = ["synthesizing"]
        self.is_exclusive = True
        self.applications_allowed = ["menu", "hands"]
        self.applications_required = ["menu", "hands"]

        @self.server.sio.on("score_player_synthesize")
        def synthesize(data):
            self.execute("synthesizer", "add_to_queue", data)

        @self.server.sio.on("score_player_stop_music")
        def synthesize(data):
            self.execute("synthesizer", "empty_queue", data)

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
