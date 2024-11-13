let matrix = [];

let mouseDown = false;

let currentcolor = {r:0,g:0,b:0,a:1.0};

let actions = [];
let coloractions = [];

$(document).ready(function(){
    for(let i = 0; i < 16; i++){
        matrix[i] = []
        for(let j = 0; j < 16; j++){
            $("#matrix").append("<div class='cell' id='" + i + "-" + j + "' style='background-color: white;'></div>");
            matrix[i][j] = {r:255,g:255,b:255,a:1.0};
        }
    }
    $(".cell").hover(function () {
        if(mouseDown){
            setCell(this.id.split("-")[0], this.id.split("-")[1], currentcolor);
        }
    });
    $(".cell").mousedown(function () { 
        setCell(this.id.split("-")[0], this.id.split("-")[1], currentcolor);
    });
});

$(document).mousedown(function () { 
    mouseDown = true;
});

$(document).mouseup(function () {
    mouseDown = false;
});

function setCell(x, y, color, track = true){
    let colorbefore = {r: matrix[x][y].r, g: matrix[x][y].g, b: matrix[x][y].b, a: matrix[x][y].a};
    if (color.a > 1){
        color.a = 255%color.a;
    }
    
    $("#" + x + "-" + y).css("background-color", `rgba(${color.r},${color.g},${color.b},${color.a})`);

    matrix[x][y].r = color.r;
    matrix[x][y].g = color.g;
    matrix[x][y].b = color.b;
    matrix[x][y].a = color.a;

    if (track) {
        if (colorbefore.r == color.r && colorbefore.g == color.g && colorbefore.b == color.b && colorbefore.a == color.a) {
            return;
        }
        actions[actions.length+1] = {
            x: x,
            y: y,
            color: color,
            colorbefore: colorbefore
        }
    }

    return;
}

function setCurrentColor(color) {
    currentcolor = color;
    return;
}

function setCurrentColorRGB(r,g,b,a) {
    currentcolor.r = r;
    currentcolor.g = g;
    currentcolor.b = b;
    currentcolor.a = a;
    return;
}

function RevertOneAction() {
    if(actions.length > 0){
        let action = actions.pop();
        actions.pop(1);
        setCell(action.x, action.y, action.colorbefore, false);
    }
}

const pickr = Pickr.create({
    el: '#color-picker',
    theme: 'classic',

    default: '#000000',
    swatches: [
        '#F44336', '#E91E63', '#9C27B0', '#673AB7',
        '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
        '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
        '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
    ],
    components: {
        preview: true,
        opacity: true,
        hue: true,

        interaction: {
            rgba: true,
            hex: true,
            hsla: true,
            hsva: true,
            cmyk: true,
            input: true,
            clear: true,
            save: true
        }
    }
});

pickr.on('save', (color, instance) => {
    color = color.toRGBA();
    setCurrentColorRGB(Math.floor(color[0]), Math.floor(color[1]), Math.floor(color[2]), color[3]);
});

$("#Copy").click(function () { 
    CopyToClipboard()
});

$("#Download").click(function () { 
    DownloadToFile();
});

$("#Fill").click(function () { 
    Fill()
});

$("#Back").click(function () { 
    RevertOneAction();
});

$("#Send").click(function() {
    let json = arrayToJSON(matrix);
    json = json.replace(/\n/g, ''); // Remove all newline characters if present

    const jsonBlob = new Blob([json], { type: 'application/json' }); // Directly use `json` here

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify({
        username: "16x16 Game Matrix Picture Creator Image Sugestor",
        content: "Here is your picture!"
    }));
    formData.append('file', jsonBlob, 'matrix.json');  // Attaching the JSON file

    const request = new XMLHttpRequest();
    request.open("POST", "https://discord.com/api/webhooks/1306360908804657203/JZ469TcGNEaql-NNKm3Muzvqi4IV9gOKauwZnRZt-_ABBO6GzNt1-V6VHH_pIWPaL2Wy");
    
    request.send(formData);  // Send the FormData with the JSON file
});

$("#Paste").click(function () { 
    navigator.clipboard.readText().then((clipboard) => {
        clipboard = clipboard.replace("/", '');
        try {
            let json = JSON.parse(clipboard);

            // Loop through the JSON and set cells
            for (let i = 0; i < json.length; i++) {
                for (let j = 0; j < json[i].length; j++) {
                    setCell(i, j, json[i][j]);
                }
            }
        } catch (error) {
            console.error("Failed to parse JSON from clipboard:", error);
        }
    }).catch((error) => {
        console.error("Failed to read clipboard:", error);
    });
});

function CopyToClipboard() {
    let copytext = arrayToJSON(matrix);
    navigator.clipboard.writeText(copytext);
}

function DownloadToFile() {
    let copytext = arrayToJSON(matrix);
    let blob = new Blob([copytext], {type: "text/plain;charset=utf-8"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "16x16GameMatrixPictureCreator.txt";
    a.click();
    URL.revokeObjectURL(url);
}

function Fill() {
    for(let i = 0; i < matrix.length; i++){
        for(let j = 0; j < matrix[i].length; j++){
            setCell(i, j, currentcolor);
        }
    }
}

function arrayToJSON(array) {
    let json = JSON.stringify(array);
    return json;
}

let ctrl = false;
function KeyPress(e) {
    var evtobj = window.event? event : e

    if (evtobj.ctrlKey) {
        ctrl = true;
    }

    console.log(evtobj.keyCode)

    if ((evtobj.keyCode == 90 && ctrl == true) || (evtobj.keyCode == 8)) {
        RevertOneAction();
        return;
    }

    if (evtobj.keyCode == 67 && ctrl == true) {
        CopyToClipboard();
        return;
    }

    if (evtobj.keyCode == 68 && ctrl == true) {
        DownloadToFile();
        return;
    }

    if (evtobj.keyCode == 70 && ctrl == true) {
        Fill();
        return;
    }
}
function KeyRelease(e) {
    var evtobj = window.event? event : e
    if (evtobj.ctrlKey) {
        setTimeout(() => {
            ctrl = false;
        }, 200);
    }
}
document.onkeydown = KeyPress;
document.onkeyup = KeyRelease;