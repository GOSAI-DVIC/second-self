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
