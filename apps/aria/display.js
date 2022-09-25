import { myScene } from "./components/scene.js";


class Aria {
    constructor() {
        this.name = "aria"
        this.z_index = 0
        this.activated = false

        this.set = (width, height, socket) => {
            console.log("Calling new scene")
            this.scene = new myScene();
            socket.on(this.name, (data) => {
                this.scene.update_data(data)
            });

            this.emit = (event_name, data = undefined) => {
                if (data == undefined) socket.emit(event_name);
                else socket.emit(event_name, data);
            }
            
            this.emit("stop_application", { application_name: "body",});
            this.emit("stop_application", { application_name: "face",});
            // this.emit("stop_application", { application_name: "hands",});

            this.activated = true;
    
        }
        
        this.selfCanvas = new Object();

        this.selfCanvas.hide = () => {
            this.scene.canvasElement.style.display = "none"
            this.emit("start_application", { application_name: "body",});
            this.emit("start_application", { application_name: "face",});
            // this.emit("start_application", { application_name: "hands",});
        };
        this.selfCanvas.show = () => {
            this.scene.canvasElement.style.display = "block"
        };
    }

    resume = () => {
        this.scene.reset();
    };
    
    windowResized = () => {}
    
    
    pause = () => {};
    
    update = () => {
        this.scene.update()
    
    }
    
    show = () => {
        if (!this.activated) return;
        
        this.scene.render();
    }
    
}

export const aria = new Aria();
