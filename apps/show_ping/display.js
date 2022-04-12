export const show_ping = new p5((sketch) => {
    sketch.name = "show_ping";
    sketch.z_index = 0
    sketch.activated = false;

    let ping = [0];
    let pong = [0];

    sketch.set = (width, height, socket) => {
        sketch.width = 200;
        sketch.height = 200;
        sketch.x = 0;
        sketch.y = 0;
        sketch.selfCanvas = sketch.createCanvas(
            sketch.width,
            sketch.height
        ).position(
            sketch.x,
            sketch.y
        ).style("z-index", sketch.z_index);

        sketch.emit = (event_name, data = undefined) => {
            if (data == undefined) socket.emit(event_name);
            else socket.emit(event_name, data);
        }

        socket.on("pong", (data) => {
            ping.push(data["ping"]);
            if (ping.length > 100) ping.shift();
            pong.push((performance.timeOrigin + performance.now()) - data["pong"]);
            if (pong.length > 100) pong.shift();
        })


        sketch.activated = true;
    };

    sketch.resume = () => {};

    sketch.pause = () => {};

    sketch.update = () => {
        sketch.emit("ping", {"ping": (performance.timeOrigin + performance.now())});
    };

    sketch.show = () => {
        sketch.clear();
        sketch.push();
        sketch.textSize(20);
        sketch.textAlign(sketch.CENTER);
        sketch.fill(255);
        sketch.noStroke();
        sketch.text("Ping: " + Math.floor(100 * mean(ping))/100 + "ms", 100, 75);
        sketch.text("Pong: " + Math.floor(100 * mean(pong))/100 + "ms", 100, 125);
        sketch.pop();
    };
});

function mean(arr) {
    return arr.reduce((a, b) => a + b) / arr.length;
}
