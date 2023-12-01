export class Menu {
    constructor(x, y, d, sketch) {
        this.x = x;
        this.y = y;
        this.d = d;
        this.sketch = sketch;

        this.anchor = [0, 0];
        this.cursor = [0, 0];

        this.left_hand_pose = undefined;
        this.right_hand_pose = undefined;

        //this.started_applications = [];

        this.display_tips = false;
        this.last_interraction_time = sketch.millis();

        this.bubbles = [];

        this.display_bubbles = false;

        //let bubble_demo = new Bubble("Play", "play.svg", 150);
        //let bubble_description = new Bubble("Info", "info.svg", 150);
        // let bubble_settings = new Bubble("Settings", "settings.svg", 150);

        //this.add(bubble_demo);
        //this.add(bubble_description);
        // this.add(bubble_settings);

        let description = `This is the alpha version of the theatre learning application. alpha-0.1`;
        let description_panel = new InfoPanel(description, 300, 300);

        bubble_description.add(description_panel, 0);

        let main_button = new BubbleMenu(this);
        this.main_button = main_button;

        this.sub_menu = {};
    }

    add_sub_menu(app_name, options) {
        for (let bubble of this.bubbles) {
            if (bubble.bubble_name == app_name) return
        }
            
        let bubble = new Bubble(app_name, app_name+".svg", 150);
        this.add(bubble);
        for(var option_name of Object.keys(options)) {
            bubble.add_select_bar(option_name, options[option_name]["defaultly_activated"], "option", options[option_name]["trigger_type"]);
        }
    }

    remove_element(element_name) {
        for (var i = 0; i<this.bubbles.length; i++) 
        {
            if (this.bubbles[i].bubble_name == element_name) {
                this.bubbles.splice(i, 1);
            }
        }
    }

    add(element) {
        element.x = this.x;
        element.y = this.y;
        element.d = this.d;
        element.yoffset = this.d * this.bubbles.length;
        this.bubbles.push(element);
        element.parent = this;
    }

    add_select_bar(bubble_id, name, isStarted) {
        this.bubbles[bubble_id].add_select_bar(name, isStarted, "application", "toggle", false);
    }

    remove_all_from(bubble_id) {
        this.bubbles[bubble_id].remove_all();
    }

    unselect() {
        for (let i = 0; i < this.bubbles.length; i++) {
            if (this.bubbles[i].isSelected) {
                this.bubbles[i].isSelected = false;
                for (let j = 0; j < this.bubbles[i].bars.length; j++) {
                    this.bubbles[i].bars[j].per = 0;
                }
            }
        }
    }

    update_data(right_hand_pose, left_hand_pose) {
        this.right_hand_pose = right_hand_pose;
        this.left_hand_pose = left_hand_pose;
    }

    update(sketch) {
        // si il y a n'y a pas d'autres applications que menu, body, face, ou hands dans le menu
        // alors on affiche les tips
        this.display_tips = true;
        for (let app in this.started_applications) 
        {
            const app_name = this.started_applications[app].name;
            if (app_name != "menu" && app_name != "body" && app_name != "face" && app_name != "hands" || sketch.millis() - this.last_interraction_time < 10000) this.display_tips = false;    
        }

        if (
            this.right_hand_pose !== undefined &&
            this.right_hand_pose[8] !== undefined
        ) {
            // if (
            //     this.left_hand.sign[0] == "OPEN_HAND" && this.left_hand.sign[1] > 0.8
            // ) {
            //     this.display_bubbles = true;
            // } else {
            //     this.display_bubbles = false;
            // }
            // this.anchor = this.left_hand.hand_pose[8];
            this.main_button.update(this.right_hand_pose[8]);
            this.anchor = this.main_button.anchor;
            this.cursor = this.right_hand_pose[8];
        }

        for (let i = 0; i < this.bubbles.length; i++) {
            this.bubbles[i].update(this.anchor, this.cursor);
        }
        
    }

    show(sketch) {
        sketch.push();
        this.main_button.show(sketch);
        for (let i = 0; i < this.bubbles.length; i++) {
            this.bubbles[i].show(sketch);
        }
        sketch.pop();
        if (this.display_tips) {
            sketch.fill(155);
            sketch.strokeWeight(2);
            sketch.textSize(60);
            sketch.text(`Activate the bubble with the right`, width/2 - 25, height-100);
            sketch.text(`index finger to launch applications`, width/2 - 25, height-50);
        }
        
    }
}

class Bubble {
    constructor(bubble_name, icon, d) {
        this.icon = loadImage("./platform/home/apps/menu/components/icons/" + icon);
        this.d = d;

        this.x = 0;
        this.y = 0;
        this.yoffset = 0;
        this.parent = undefined;

        this.rx = 0;
        this.ry = 0;
        this.r = this.d / 2;
        this.per = 0;
        this.mul = 0.92;
        this.c = 0;
        this.isSelected = false;
        
        this.bubble_name = bubble_name

        this.slots = [
            0,
            // -this.d * 3 / 4,
            (this.d * 3) / 4,
            (this.d * 6) / 4,
            (this.d * 9) / 4,
            (this.d * 12) / 4,
            (this.d * 15) / 4,
            (this.d * 18) / 4,
            (this.d * 21) / 4,
            (this.d * 24) / 4,
        ];

        this.bars = [];
    }

    add(element, slot) {
        element.x = this.rx;
        element.y = this.ry;
        element.yoffset = this.slots[slot]; // Children offset
        element.ypoffset = this.yoffset; // This offset
        element.parent = this;
        this.bars.push(element);
    }

    add_select_bar(name, started, type, trigger_type="toggle") {
        let select_bar = new SelectBar(name, 300, 75, type, trigger_type, started);
        this.add(select_bar, this.bars.length);
        // select_bar.isSelected = started;
    }

    remove_all() {
        this.bars = [];
    }
    
    show(sketch) {
        sketch.stroke(255);
        sketch.strokeWeight(6);
        if (this.isSelected) {
            sketch.fill(255, 129, 0);
        } else {
            sketch.fill(100, 0.7);
        }
        if (this.per > 0.1) {
            sketch.ellipse(this.rx, this.ry, this.r * this.per);
            sketch.image(
                this.icon,
                this.rx,
                this.ry,
                (this.r * this.per * 1) / 2,
                (this.r * this.per * 1) / 2
            );
        }
        if (this.isSelected) {
            for (let i = 0; i < this.bars.length; i++) {
                this.bars[i].show(sketch);
            }
        }
        if (
            this.parent.display_bubbles &&
            !this.isSelected &&
            dist(this.rx, this.ry, this.parent.cursor[0], this.parent.cursor[1]) <
            this.r
        ) {
            sketch.stroke(255);
            sketch.strokeWeight(4);
            sketch.noFill();
            sketch.arc(
                this.rx,
                this.ry,
                2 * this.r,
                2 * this.r,
                0,
                (2 * Math.PI * this.c) / 40
            );
        }
    }

    update(anchor, cursor) {
        this.x = lerp(this.x, anchor[0], 0.4);
        this.y = lerp(this.y, anchor[1], 0.4);
        this.rx = this.x + (this.per * this.d) * 0.85;
        this.ry = this.y + this.per * this.yoffset;
        if (!this.parent.display_bubbles) {
            this.per *= this.mul;
        } else {
            if (this.per < 1) {
                this.per += 0.04;
            } else {
                if (
                    !this.isSelected &&
                    dist(this.rx, this.ry, cursor[0], cursor[1]) < this.r
                ) {
                    this.c += 0.8;

                    if (this.c >= 40) {
                        this.parent.unselect();
                        this.isSelected = true;

                        if (typeof this.name !== "object") {
                            chooseAction(
                                this.name,
                                this.isSelected,
                                "bubble",
                                this.trigger_type,
                                this.parent.sketch,
                                this
                            );
                        }
                    }
                } else {
                    this.c = 0;
                }
            }
        }
        if (this.isSelected) {
            for (let i = 0; i < this.bars.length; i++) {
                this.bars[i].update(anchor, cursor);
            }
        }
    }

    unselect() {
        for (let i = 0; i < this.bars.length; i++) {
            this.bars[i].isSelected = false;
        }
    }
}

class SelectBar {
    constructor(choice, w, h, type, trigger_type, isSelected = false) {
        
        if (trigger_type == "button") isSelected = false;
        this.choice = choice;
        this.w = w;
        this.h = h;

        this.x = 0;
        this.y = 0;
        this.yoffset = 0;
        this.ypoffset = 0; // Parent offset
        this.parent = undefined;
        this.type = type;
        this.trigger_type = trigger_type;

        this.hidden = true;
        this.isSelected = isSelected;

        this.c = 0;

        this.per = 0;
        this.mul = 0.92;
        this.selection_time = 60;

        this.sketch;
        this.show_selection = false;

        
    }

    show(sketch) {
        // if (this.choice = "Activate bars") console.log(this.choice, this.isSelected)
        this.sketch = sketch;
        if ((this.parent.isSelected || !this.hidden) && this.per > 0.1) {
            sketch.stroke(255);
            sketch.strokeWeight(2);
            sketch.fill(0);
            sketch.rect(
                this.rx,
                this.ry - (this.h / 2) * this.per,
                this.w * this.per,
                this.h * this.per
            );
            if (this.isSelected) {
                sketch.fill(255, 129, 0);
                sketch.stroke(255, 129, 0);
            } else {
                sketch.fill(255);
                sketch.stroke(255);
            }

            sketch.noStroke();
            sketch.textSize((this.per * this.h) / 2);
            sketch.text(this.choice, this.rx + (this.per * this.w) / 2, this.ry);

            if (this.yoffset == 0) {
                sketch.fill(255);
                sketch.stroke(255);
                sketch.triangle(
                    this.rx,
                    this.ry - (this.per * this.h) / 4,
                    this.rx,
                    this.ry + (this.per * this.h) / 4,
                    this.rx - (1.7 * this.per * this.h) / 4,
                    this.ry
                );
            }

            if (this.show_selection) {
                sketch.stroke(255);
                sketch.strokeWeight(4);

                sketch.noFill();

                if (this.c < this.selection_time / 20) {
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry,
                        this.rx + this.w + this.h / 4,
                        this.ry - (((3 * this.h) / 4) * this.c) / (this.selection_time / 20)
                    );
                } else if (this.c < (9 * this.selection_time) / 20) {
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry,
                        this.rx + this.w + this.h / 4,
                        this.ry - (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry - (3 * this.h) / 4,
                        this.rx +
                        this.w +
                        this.h / 4 -
                        ((this.w + this.h / 2) * (this.c - this.selection_time / 20)) /
                        ((8 * this.selection_time) / 20),
                        this.ry - (3 * this.h) / 4
                    );
                } else if (this.c < (11 * this.selection_time) / 20) {
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry,
                        this.rx + this.w + this.h / 4,
                        this.ry - (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry - (3 * this.h) / 4,
                        this.rx - this.h / 4,
                        this.ry - (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx - this.h / 4,
                        this.ry - (3 * this.h) / 4,
                        this.rx - this.h / 4,
                        this.ry -
                        (3 * this.h) / 4 +
                        (((3 * this.h) / 4) * (this.c - (9 * this.selection_time) / 20)) /
                        ((2 * this.selection_time) / 20)
                    );
                } else if (this.c < (19 * this.selection_time) / 20) {
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry,
                        this.rx + this.w + this.h / 4,
                        this.ry - (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry - (3 * this.h) / 4,
                        this.rx - this.h / 4,
                        this.ry - (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx - this.h / 4,
                        this.ry - (3 * this.h) / 4,
                        this.rx - this.h / 4,
                        this.ry + (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx - this.h / 4,
                        this.ry + (3 * this.h) / 4,
                        this.rx -
                        this.h / 4 +
                        ((this.w + this.h / 2) *
                            (this.c - (11 * this.selection_time) / 20)) /
                        ((8 * this.selection_time) / 20),
                        this.ry + (3 * this.h) / 4
                    );
                } else if (this.c < this.selection_time) {
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry,
                        this.rx + this.w + this.h / 4,
                        this.ry - (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry - (3 * this.h) / 4,
                        this.rx - this.h / 4,
                        this.ry - (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx - this.h / 4,
                        this.ry - (3 * this.h) / 4,
                        this.rx - this.h / 4,
                        this.ry + (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx - this.h / 4,
                        this.ry + (3 * this.h) / 4,
                        this.rx + this.w + this.h / 4,
                        this.ry + (3 * this.h) / 4
                    );
                    sketch.line(
                        this.rx + this.w + this.h / 4,
                        this.ry + (3 * this.h) / 4,
                        this.rx + this.w + this.h / 4,
                        this.ry +
                        (3 * this.h) / 4 -
                        (((3 * this.h) / 4) *
                            (this.c - (19 * this.selection_time) / 20)) /
                        (this.selection_time / 20)
                    );
                }
            }
        }
    }

    update(anchor, cursor) {
        this.x = anchor[0];
        this.y = anchor[1];
        this.rx = this.x + 3 * this.per * 75;
        this.ry = this.y + this.per * (this.yoffset + this.ypoffset);
        this.show_selection = false;

        if (
            (!this.parent.isSelected && this.hidden) ||
            !this.parent.parent.display_bubbles
        ) {
            this.per *= this.mul;
        } else {
            if (this.per < 1) {
                this.per += 0.1;
                if (this.per > 1) {
                    this.per = 1;
                }
            } else {
                if (
                    cursor[0] > this.rx - this.h / 4 &&
                    cursor[0] < this.rx + this.w + this.h / 4 &&
                    cursor[1] > this.ry - (3 * this.h) / 4 &&
                    cursor[1] < this.ry + (3 * this.h) / 4
                ) {
                    this.show_selection = true;
                    this.c += 1;
                    if (this.c == this.selection_time) {
                        // this.parent.unselect();
                        this.isSelected = !this.isSelected;
                        chooseAction(
                            this.choice,
                            this.isSelected,
                            this.type,
                            this.trigger_type,
                            this.parent.parent.sketch,
                            this
                        );

                        // if (this.parent.parent.sub_menu[this.choice] !== undefined && this.isSelected && this.parent.parent.bubbles[this.choice] == undefined) 
                        // {
                        //     this.parent.parent.add_sub_menu(this.choice, this.parent.parent.sub_menu[this.choice])
                        //     console.log("adding sub menu")
                        // }
                        // else if (this.parent.parent.sub_menu[this.choice] !== undefined && !this.isSelected && this.parent.parent.bubbles[this.choice] != undefined) 
                        // {
                        //     this.parent.parent.remove_element(this.choice)
                        //     console.log("removing sub menu")
                        // }

                    }
                } else {
                    this.c = 0;
                }
            }
        }
    }
}

class InfoPanel {
    constructor(content, w, h) {
        this.content = content;
        this.w = w;
        this.h = h;

        this.x = 0;
        this.y = 0;
        this.xoffset = 225;
        this.parent = undefined;
        this.size = 25;

        this.per = 0; // To animate the display when showing / hidding
        this.mul = 0.92;
    }

    show(sketch) {
        if (this.parent.isSelected && this.per > 0.5) {
            sketch.stroke(255);
            sketch.strokeWeight(4);
            sketch.noFill();
            sketch.rect(this.x + this.xoffset, this.y - this.h / 2, this.w, this.h);

            sketch.stroke(255);
            sketch.fill(255);
            sketch.strokeWeight(2);
            sketch.textSize(this.size);
            sketch.text(
                this.content,
                this.x + this.xoffset + this.w * 0.05,
                this.y - 0.45 * this.h,
                this.w * 0.9,
                this.h * 0.9
            );
        }
    }

    update(anchor) {
        this.x = anchor[0];
        this.y = anchor[1] + this.h / 2;
        // this.rx = this.x + this.per * this.offset;
        // this.ry = this.y;

        if (!this.parent.isSelected || !this.parent.parent.display_bubbles) {
            this.per *= this.mul;
        } else {
            this.per = 1;
        }
    }
}

function chooseAction(choice, isSelected, type, trigger_type, sketch, element) {
    
    sketch.emit("home-apps-menu","core-app_manager-get_started_applications")
    sketch.menu.last_interraction_time = sketch.millis();

    switch (type) {
        case "application":
            if (isSelected) {
                sketch.menu.main_button.isSelected = false;
                
                sketch.emit("core-app_manager-start_application", {
                    application_name: choice,
                });
            } else {
                sketch.emit("core-app_manager-stop_application", {
                    application_name: choice,
                });
            }
            break;
        case "option":
            if(trigger_type == "toggle"){
                if (isSelected) {
                    sketch.menu.main_button.isSelected = false;
                    sketch.emit("core-app_manager-start_option", {
                        option_name: choice, app_name: element.parent.bubble_name
                    });
                } else {
                    sketch.menu.main_button.isSelected = false;
                    sketch.emit("core-app_manager-stop_option", {
                        option_name: choice, app_name: element.parent.bubble_name
                    });
                }
                break;
            }
            else if(trigger_type == "button"){
                sketch.emit("core-app_manager-trigger_option", {
                    option_name: choice, app_name: element.parent.bubble_name
                });
                element.isSelected = false
            }
    }
}

class BubbleMenu {
    constructor(menu) {
        this.icon = loadImage("./platform/home/apps/menu/components/icons/menu.svg");
        // this.d = d;

        this.x = width / 2;
        this.y = 90;
        this.anchor = [this.x, this.y];

        this.menu = menu;
        this.r = 80;
        this.c = 0;
        this.isSelected = false;
        this.selection_time = 40;
    }

    show(sketch) {
        sketch.stroke(255);
        sketch.strokeWeight(6);
        if (this.isSelected) {
            sketch.fill(255, 129, 0);
            this.menu.display_bubbles = true;
        } else {
            sketch.noFill();
            this.menu.display_bubbles = false;
        }
        sketch.ellipse(this.x, this.y, this.r);
        sketch.image(this.icon, this.x, this.y, this.r * 0.8, this.r * 0.8);
        if (this.c > 0 && this.c <= this.selection_time) {
            sketch.stroke(255);
            sketch.strokeWeight(4);
            sketch.noFill();
            sketch.arc(
                this.x,
                this.y,
                2 * this.r,
                2 * this.r,
                0,
                (2 * Math.PI * this.c) / this.selection_time
            );
        }
    }

    update(cursor) {
        if (dist(this.x, this.y, cursor[0], cursor[1]) < this.r) {
            this.c += 1;
            if (this.c == this.selection_time) {
                this.isSelected = !this.isSelected;
            }
        } else {
            this.c = 0;
        }
    }
}