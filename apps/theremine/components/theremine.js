export class Theremine{
    constructor() {
        this.frequency = 0;
        this.length = 0.01;
        this.bitrate = 48000;
        this.amplitude = 0;

    }
    synthesize() {
        
    }

    reset() {}

    update_data(right_hand_pose, left_hand_pose) {
        this.right_hand_pose = right_hand_pose;
        this.left_hand_pose = left_hand_pose;
        if(this.right_hand_pose.length !== 0){
            var x_pos_array = [];
            for(var point_coor of this.right_hand_pose) x_pos_array.push(point_coor[0]);
            this.frequency = Math.max(...x_pos_array);
        }
        if(this.left_hand_pose.length !== 0){
            var y_pos_array = [];
            for(var point_coor of this.left_hand_pose) y_pos_array.push(point_coor[1]);
            this.amplitude = (Math.min(...y_pos_array) - 250) * (0 - 1) / (650 - 250) + 1;
            console.log("this.amplitude", this.amplitude);
        }
    }

    show(sketch) {
        var x_pos_array = [];
        var y_pos_array = [];
        for(var point_coor of this.right_hand_pose) 
        {
            x_pos_array.push(point_coor[0]);
            y_pos_array.push(point_coor[1]+40);
        }
        sketch.point(Math.max(...x_pos_array), Math.min(...y_pos_array));

    }

    update(sketch) {
    }
}