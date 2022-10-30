from core.application import BaseApplication


class Application(BaseApplication):
    """music_training"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["frequency_analysis"] = ["frequency"]
        self.requires["synthesizer"] = ["synthesizing"]
        @self.server.sio.on("score_player_synthesize")
        def synthesize(data):
            self.execute("synthesizer", "add_to_queue", data)

        @self.server.sio.on("score_player_stop_music")
        def synthesize(data):
            self.execute("synthesizer", "empty_queue", data)

    def listener(self, source, event, data):
        super().listener(source, event, data)

        if source == "frequency_analysis" and event == "frequency" and data is not None:
            self.server.send_data(self.name, data)
