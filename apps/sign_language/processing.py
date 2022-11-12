from core.application import BaseApplication

class Application(BaseApplication):
    """SLR"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.requires["slr"] = ["new_sign"]
        
        self.is_exclusive = True
        self.applications_allowed = ["menu", "hands", "body", "face"]
        self.applications_required = ["menu", "hands", "body", "face"]

    def listener(self, source, event, data):
        super().listener(source, event, data)

        if source == "slr" and event == "new_sign":
            if data is not None:
                data = {
                    "guessed_sign": data["guessed_sign"], "probability": data["probability"]
                }
                self.server.send_data(self.name, data)