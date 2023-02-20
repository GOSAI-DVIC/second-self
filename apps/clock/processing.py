from core.application import BaseApplication


class Application(BaseApplication):
    """Clock"""
    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        self.is_exclusive = True
        self.applications_allowed = ["menu", "face", "body", "hands", "aria", "bounce", "poke_it"]
        self.applications_required = ["menu"]
