import { Correction } from "./components/correction.js"

export const slr_correction_cables = new  p5(( sketch ) => {
    sketch.name = "slr_correction_cables"
    sketch.z_index = 0
    sketch.activated = false
    
    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch.createCanvas(width, height).position(0, 0).style("z-index", sketch.z_index);

        sketch.correction = new Correction(sketch)
        socket.on("applications-slr_correction_cables-raw_data_cables", (data) => {
            sketch.correction.update_data(
                data["right_hand_pose"], 
                data["left_hand_pose"],
                data["body_pose"]
            )
        });

        sketch.emit = (name, data) => {
            socket.emit(name, data);
        };
        
        sketch.activated = true;
    }
    
    sketch.resume = () => {
        sketch.correction.reset();
    };

    sketch.pause = () => {
        
    };

    sketch.update = () => {
        console.log(sketch.correction.frameIdx)
        sketch.emit("applications-slr_correction_cables-slr_correction", {
            "action": sketch.correction.actions[sketch.correction.actionIdx],
            "frame_idx": sketch.correction.frameIdx,
            "right_hand_diff": sketch.correction.right_hand_diff,
            "left_hand_diff": sketch.correction.left_hand_diff,
            "body_diff": sketch.correction.body_diff,
        });
        sketch.correction.update(sketch)   
    }

    sketch.show = () => {

    }
});
