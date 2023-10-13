from core.application import BaseApplication


class Application(BaseApplication):
    """Show Transcript"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["speech_to_text"] = ["transcription"]

    def listener(self, source, event, data):
        super().listener(source, event, data)

        if source == "speech_to_text" and event == "transcription" and data is not None:
            self.server.send_data(self.name, data)
