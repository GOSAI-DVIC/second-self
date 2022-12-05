import { Engine } from "./components/engine.js"

export const sign_game = new  p5(( sketch ) => {
    sketch.name = "sign_game"
    sketch.z_index = 0
    sketch.activated = false
    
    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch.createCanvas(width, height).position(0, 0).style("z-index", sketch.z_index);

        sketch.sign_game = new Engine()
        socket.on(`applications-${sketch.name}-new_sign`, (data) => {
            sketch.sign_game.update_sign_data(
                data["guessed_sign"],
                data["probability"],
                data["actions"],
            )
        });

        socket.on(`applications-${sketch.name}-mirrored_data`, (data) => {
            sketch.sign_game.update_pose_data(
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
        sketch.sign_game.reset();
    };

    sketch.pause = () => {
        sketch.clear();
    };

    sketch.update = () => {
        sketch.sign_game.update(sketch)   
    }

    sketch.show = () => {
        if (!sketch.activated) return;
        sketch.clear();
        sketch.sign_game.show(sketch);
    }
});
