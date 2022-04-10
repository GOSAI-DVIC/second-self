import { Face } from "./components/face.js";
import { Hand } from "./components/hand.js";
import { Body } from "./components/body.js";
import { Menu } from "./components/menu2.js";

export const menu = new p5((sketch) => {
    sketch.name = "menu";
    sketch.z_index = 5;
    sketch.activated = false;

    sketch.face;
    sketch.body;
    sketch.right_hand;
    sketch.left_hand;
    sketch.menu;

    sketch.set = (width, height, socket) => {
        sketch.face = new Face("face");
        sketch.body = new Body("body");
        sketch.right_hand = new Hand("right_hand");
        sketch.left_hand = new Hand("left_hand");
        sketch.menu = new Menu(0, 0, 150, sketch);

        sketch.selfCanvas = sketch
            .createCanvas(width, height)
            .position(0, 0)
            .style("z-index", sketch.z_index);

        sketch.angleMode(RADIANS);
        sketch.textAlign(CENTER, CENTER);
        sketch.textStyle(BOLD);
        sketch.imageMode(CENTER);

        socket.on(sketch.name, (data) => {
            sketch.face.update_data(data["face_mesh"]);
            sketch.body.update_data(data["body_pose"]);
            sketch.right_hand.update_data(
                data["right_hand_pose"],
                data["right_hand_sign"]
            );
            sketch.left_hand.update_data(
                data["left_hand_pose"],
                data["left_hand_sign"]
            );
            sketch.menu.update_data(sketch.left_hand, sketch.right_hand);
        });

        socket.on("available_applications", (data) => {
            let apps = data["applications"];
            apps.sort((a, b) => {
                if (a["name"] < b["name"]) {
                    return -1;
                }
                if (a["name"] > b["name"]) {
                    return 1;
                }
                return 0;
            });
            sketch.menu.remove_all_from(0);
            for (let i = 0; i < apps.length; i++) {
                if (
                    apps[i]["name"] != sketch.name
                ) {
                    sketch.menu.add_application(0, apps[i][name], Boolean(apps[i]["started"]));
                }
            }
        });

        sketch.emit = (name, data) => {
            socket.emit(name, data);
        };

        sketch.activated = true;
    };

    sketch.resume = () => {};

    sketch.pause = () => {};

    sketch.windowResized = () => {
        sketch.resizeCanvas(windowWidth, windowHeight);
    };

    sketch.update = () => {
        sketch.face.update();
        sketch.body.update();
        sketch.right_hand.update();
        sketch.left_hand.update();
        sketch.menu.update();
    };

    sketch.show = () => {
        sketch.clear();
        sketch.face.show(sketch);
        sketch.body.show(sketch);
        sketch.right_hand.show(sketch);
        sketch.left_hand.show(sketch);
        sketch.menu.show(sketch);
    };
});
