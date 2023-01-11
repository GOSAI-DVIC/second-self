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
            
            this.activated = true;
        }
        
        this.selfCanvas = new Object();

        this.selfCanvas.hide = () => {
            this.scene.canvasElement.style.display = "none"
        };
        this.selfCanvas.show = () => {
            this.scene.canvasElement.style.display = "block"
        };
    }

    resume = () => {
        this.scene.reset();
        this.selfCanvas.show();
    };
    
    windowResized = () => {}
    
    
    pause = () => {
        this.selfCanvas.hide();
    };
    
    update = () => {
        this.scene.update()
    
    }
    
    show = () => {
        if (!this.activated) return;
        
        this.scene.render();
    }
    
}

export const aria = new Aria();
