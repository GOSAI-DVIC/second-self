import {
    Menu
} from "../menu/components/menu2.js";

export const menu = new p5((sketch) => {
    sketch.name = "menu";
    sketch.z_index = 5;
    sketch.activated = false;

    sketch.right_hand;
    sketch.left_hand;
    sketch.menu;

    sketch.set = (width, height, socket) => {
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
            sketch.menu.update_data(
                data["right_hand_pose"], 
                data["left_hand_pose"]
            );
        });
        
        socket.on("core-app_manager-available_applications", (data) => {
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
                    sketch.menu.add_select_bar(0, apps[i]["name"], Boolean(apps[i]["started"]));
                }
            }
        });

        socket.on("core-app_manager-started_applications", (data) => {
            let started_apps = data["applications"];
            started_apps.sort((a, b) => {
                if (a["name"] < b["name"]) {
                    return -1;
                }
                if (a["name"] > b["name"]) {
                    return 1;
                }
                return 0;
            });
            sketch.menu.started_applications = started_apps;
        });

        sketch.emit = (name, data) => {
            socket.emit(name, data);
        };

        socket.emit("core-app_manager-get_init_sub_menu")

        socket.emit("core-app_manager-get_available_applications")

        socket.emit("core-app_manager-get_started_applications")
        
        socket.on("core-app_manager-init_sub_menu", (data) => {
            let sub_menu = data["sub_menu"];
            let started_apps = data["available_applications"];
            started_apps.forEach(app => {
                if(sub_menu[app.name] != undefined) {
                    sketch.menu.add_sub_menu(app.name, sub_menu[app.name])
                }
            });
        });

        socket.on("core-app_manager-add_sub_menu", (data) => {
            let sub_menu = data["sub_menu"];
            let app_name = data["app_name"];
            
            if(sub_menu != undefined) {
                sketch.menu.add_sub_menu(app_name, sub_menu)
            }
        });

        socket.on("core-app_manager-remove_sub_menu", (data) => {
            sketch.menu.remove_element(data.element_name);
        });

        sketch.activated = true;
    };

    sketch.resume = () => {};

    sketch.pause = () => {
        sketch.clear();
    };

    sketch.windowResized = () => {
        sketch.resizeCanvas(windowWidth, windowHeight);
    };

    sketch.update = () => {
        sketch.menu.update(sketch);
    };

    sketch.show = () => {
        sketch.clear();
        sketch.menu.show(sketch);
    };
});