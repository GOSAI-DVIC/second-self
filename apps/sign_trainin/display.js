import { Guessing } from "./components/guessing.js"

export const sign_training = new  p5(( sketch ) => {
    sketch.name = "sign_training"
    sketch.z_index = 0
    sketch.activated = false
    
    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch.createCanvas(width, height).position(0, 0).style("z-index", sketch.z_index);

        sketch.slr_training = new Guessing()
        socket.on(`applications-${sketch.name}-new_sign`, (data) => {
            // console.log("new sign", data)
            sketch.slr_training.update_sign_data(
                data["guessed_sign"],
                data["probability"],
                data["actions"]
            )
        });

        socket.on(`applications-${sketch.name}-mirrored_data`, (data) => {
            sketch.slr_training.update_pose_data(
                data["right_hand_pose"], 
                data["left_hand_pose"],
                data["body_pose"],
            )
        });

        sketch.emit = (name, data) => {
            socket.emit(name, data);
        };
        
        sketch.activated = true;
    }
    
    sketch.resume = () => {
        sketch.slr_training.reset();
    };

    sketch.pause = () => {
        sketch.clear();
    };

    sketch.update = () => {
        sketch.slr_training.update(sketch)   
    }

    sketch.show = () => {
        if (!sketch.activated) return;
        sketch.clear();
        sketch.slr_training.show(sketch);
    }
});
