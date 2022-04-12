import time

from core.application import BaseApplication

class Application(BaseApplication):
    """Displays the ping between the back and the front"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)

        @self.server.sio.on("ping")
        def ping(data):
            self.server.sio.emit("pong", {
                "ping": time.time()*1000 - data["ping"],
                "pong": time.time()*1000,
            })
