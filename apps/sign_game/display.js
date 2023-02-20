import { Engine } from "./components/engine.js"

export const sign_game = new p5((sketch) => {
    sketch.name = "sign_game";
    sketch.z_index = 0;
    sketch.activated = false;

    sketch.characters = undefined;
    sketch.actions = undefined;

    sketch.setup_game = () => {
        sketch.sign_game = new Engine(sketch);
        
        (new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(sketch.characters != undefined && sketch.actions != undefined);
            }, 100);
        })).then((areCharActionsAvaible) => {
            if (areCharActionsAvaible) 
            {
                sketch.sign_game.setup(sketch.characters, sketch.actions);
                sketch.activated = true;
            }
            else sketch.setup_game()
        });
        
    };

    sketch.set = (width, height, socket) => {
        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);
            
        socket.on("applications-sign_game-characters", (data) => {
            sketch.characters = data;
        });

        socket.on(`applications-${sketch.name}-new_sign`, (data) => {
            sketch.sign_game.update_sign_data(
                data["guessed_sign"],
                data["probability"],
                data["actions"]
            );
            // console.log(data["guessed_sign"], data["probability"], data["actions"])
            sketch.actions = data["actions"];
        });

        socket.on(`applications-${sketch.name}-mirrored_data`, (data) => {
            sketch.sign_game.update_pose_data(
                data["right_hand_pose"],
                data["left_hand_pose"],
                data["body_pose"]
            );
        });

        sketch.emit = (name, data) => {
            socket.emit(name, data);
        };

        sketch.font = sketch.loadFont(
            "./platform/home/apps/sign_game/components/fonts/PressStart2P.ttf"
        );
        sketch.inputFile = sketch.loadStrings(
            "./platform/home/apps/sign_game/components/script.txt",
            sketch.setup_game
        );
    };

    sketch.windowResized = () => {
        sketch.resizeCanvas(windowWidth, windowHeight);
    };

    sketch.resume = () => {
        if (!sketch.activated) return;
        sketch.sign_game.reset();
    };

    sketch.pause = () => {
        sketch.sign_game.stop();
        sketch.clear();
    };

    sketch.update = () => {
        if (!sketch.activated) return;
        sketch.sign_game.update()
    };

    sketch.show = () => {
        if (!sketch.activated) return;
        sketch.sign_game.show();
    };

});
