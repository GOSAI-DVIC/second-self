from core.application import BaseApplication


class Application(BaseApplication):
    """music_training"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["audio_stream"] =  ["core_driver_get_audio_stream"]


    def listener(self, source, event, data):
        super().listener(source, event, data)

        if self.started and source == "audio_stream" and event == "core_driver_get_audio_stream":
            self.data = self.hal.get_driver_event_data("audio_stream", "core_driver_get_audio_stream")
            self.server.send_data(self.name, self.data)
