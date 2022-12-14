from core.application import BaseApplication
import os, os.path
import time


class Application(BaseApplication):
    """SL CORRECTION FOR CABLES"""

    def __init__(self, name, hal, server, manager):
        super().__init__(name, hal, server, manager)
        # self.requires["pose_callback"] = ["raw_data"]
        # self.requires["pose_callback"] = ["raw_data_cables"]

        self.is_exclusive = False

        # @self.server.sio.on("applications-slr_correction_cables-video_frame")
        # def estimate_pose(data):
        #     global start_time
        #     # print("received data from client")
        #     self.execute(
        #         "pose_callback",
        #         "estimate_pose",
        #         data["frame"]
        #     )
        @self.server.sio.on("applications-slr_correction_cables-raw_data_cables")
        def get_raw_data_cables(data):
            self.server.send_data(f'applications-{self.name}-raw_data_cables', data)

        @self.server.sio.on("applications-slr_correction_cables-slr_correction")
        def emit_correction(data):
            self.server.send_data(f'applications-{self.name}-slr_correction', data)

    def listener(self, source, event, data):
        super().listener(source, event, data)

        # if source == "pose_callback" and event == "raw_data" and data is not None:
        #     self.server.send_data(f'applications-{self.name}-raw_data', data)

        # if source == "pose_callback" and event == "raw_data_cables" and data is not None:
        #     self.server.send_data(f'applications-{self.name}-raw_data_cables', data)