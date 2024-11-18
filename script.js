// Init / Variables | Start

let matrix = [];
let mouseDown = false;
let currentcolor = {r:0,g:0,b:0};
let actions = [];
let tool = "pen";
let brushSize = 1;
let brushOpacity = 0;
let border = false;
let animationOn = false;
let currentFrame = 0;
let animation = {
    1: [],
}

for(let i = 0; i < 16; i++){
    matrix[i] = []
    for(let j = 0; j < 16; j++){
        $("#matrix").append("<div class='cell' id='" + i + "-" + j + "' style='background-color: white;'></div>");
        matrix[i][j] = {r:255,g:255,b:255};
    }
}

// Init / Variables | End


// Drag Events | Start

$(document).mousedown(function () { 
    mouseDown = true;
});
$(document).mouseup(function () {
    mouseDown = false;
});
$(".cell").hover(function () {
    if(mouseDown){
        draw(this.id.split("-")[0], this.id.split("-")[1])
    }
});
$(".cell").mousedown(function () { 
    draw(this.id.split("-")[0], this.id.split("-")[1])
});

// Drag Events | End


// Click Events | Start

$("#Copy").click(function () { 
    CopyToClipboard()
});
$("#DownloadJSON").click(function () {
    DownloadToFile();
});
$("#DownloadPNG").click(function () {
    DownloadToPNG();
});
$("#Fill").click(function () { 
    Fill()
});
$("#Back").click(function () { 
    RevertOneAction();
});
$("#Send").click(function() {
    let json = arrayToArduinoArray(matrix);

    const jsonBlob = new Blob([json], { type: 'plain/text' });

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify({
        username: "16x16 Game Matrix Picture Creator Image Sugestor",
        content: "Here is your picture!"
    }));
    formData.append('file', jsonBlob, 'matrix.txt');

    const request = new XMLHttpRequest();
    request.open("POST", "https://discord.com/api/webhooks/1306360908804657203/JZ469TcGNEaql-NNKm3Muzvqi4IV9gOKauwZnRZt-_ABBO6GzNt1-V6VHH_pIWPaL2Wy");
    
    request.send(formData);
});
$("#Paste").click(function () { 
    navigator.clipboard.readText().then((clipboard) => {
        let array = arduinoArrayToArray(clipboard);

        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array[i].length; j++) {
                setCell(i, j, array[i][j]);
            }
        }

    }).catch((error) => {
        console.error("Failed to read clipboard:", error);
    });
});
$(".ToolSelection").click(function () {
    tool = this.id;
});
$("#Grid").click(function () {
    if (border) {
        border = false;
        $(".cell").css("border-width", "0px");
    } else {
        border = true;
        $(".cell").css("border-width", "1px");
    }
});

// Click Events | End


// Functions | Start

function CopyToClipboard() {
    let copytext = arrayToArduinoArray(matrix);
    navigator.clipboard.writeText(copytext);
}
function arrayToArduinoArray(array) {
    let arduinoArray = ""; // Fixed spelling
    let totalLength = array.length * array[0].length; // Fixed logic for total length

    for (let i = 0; i < totalLength; ) { // No increment here; increment handled inside the loop
        let x = Math.floor(i / array[0].length);
        let y = i % array[0].length;

        let color = array[x][y];
        let adjacent = 1;
        let j = i + 1;

        while (j < totalLength) {
            let x2 = Math.floor(j / array[0].length);
            let y2 = j % array[0].length;

            if (colorsMatch(color, array[x2][y2])) {
                adjacent++;
                j++;
            } else {
                break;
            }
        }

        // Advance `i` by the number of adjacent pixels processed
        i += adjacent;

        // Append to the Arduino array string
        arduinoArray += `{${adjacent},${color.r},${color.g},${color.b}}`;

        // Add a comma unless it's the last entry
        if (i < totalLength) {
            arduinoArray += ",";
        }
    }

    return arduinoArray;
}
function arduinoArrayToArray(arduinoArrayString) {
    // Parse the Arduino array string
    const regex = /\{(\d+),(\d+),(\d+),(\d+)\}/g;
    let matches;
    const array = Array.from({ length: 16 }, () => Array(16).fill(null));

    let currentIndex = 0;

    while ((matches = regex.exec(arduinoArrayString)) !== null) {
        let adjacent = parseInt(matches[1], 10);
        let r = parseInt(matches[2], 10);
        let g = parseInt(matches[3], 10);
        let b = parseInt(matches[4], 10);

        // Create color object
        const color = { r, g, b };

        // Fill adjacent cells
        for (let i = 0; i < adjacent; i++) {
            let x = Math.floor(currentIndex / 16);
            let y = currentIndex % 16;
            array[x][y] = color;
            currentIndex++;
        }
    }
    
    console.log(array);

    return array;
}

function DownloadToFile() {
    let copytext = arrayToArduinoArray(matrix);
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
function setCurrentColor(color) {
    currentcolor = color;
    return;
}

function setCurrentColorRGB(r,g,b) {
    currentcolor.r = r;
    currentcolor.g = g;
    currentcolor.b = b;
    return;
}
function RevertOneAction() {
    if(actions.length > 0){
        let action = actions.pop();
        if (action.type == "SetCell") {
            actions.pop(1);
            setCell(action.x, action.y, action.colorbefore, false);
        }
        if (action.type == "Fill") {
            actions.pop(1);
            action.cells.forEach(element => {
                setCell(element.x, element.y, action.colorbefore, false);
            });
        }
    }
}
function setCell(x, y, color, track = true){
    let colorbefore = {r: matrix[x][y].r, g: matrix[x][y].g, b: matrix[x][y].b};
    
    let darkness = Math.round(0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
    if (darkness < 255/2) {
        $("#" + x + "-" + y).css("border-color", "white");
    } else {
        $("#" + x + "-" + y).css("border-color", "black");
    }
    $("#" + x + "-" + y).css("background-color", `rgb(${color.r},${color.g},${color.b})`);

    matrix[x][y] = {...color};

    if (track) {
        if (colorbefore.r == color.r && colorbefore.g == color.g && colorbefore.b == color.b) {
            return;
        }
        actions.push(
            {
                type: "SetCell",
                x: x,
                y: y,
                color: color,
                colorbefore: colorbefore
            }
        )
    }

    return;
}
function colorsMatch(color1, color2) {
    return color1.r == color2.r && color1.g == color2.g && color1.b == color2.b;
}
function floodFill(startX, startY, targetColor, replacementColor) {
    const queue = [{ x: (startX-0), y: (startY-0) }];

    let checkedCells = {}
    let changedCells = []

    const width = matrix.length;
    const height = matrix[0].length;

    while (queue.length > 0) {
        const { x, y } = queue.shift()
        if (typeof(x) == "String")  {
            x = parseInt(x); 
        }
        if (typeof(y) == "String")  {
            y = parseInt(y); 
        }

        if (x < 0 || x >= width || y < 0 || y >= height) {
            continue;
        }

        if (checkedCells[`${x},${y}`]) {
            continue;
        }
        checkedCells[`${x},${y}`] = true;

        const currentCellColor = matrix[x][y];

        if (colorsMatch(currentCellColor, targetColor)) {
            setCell(x, y, replacementColor, false);
            changedCells.push({x: x, y:y})
        } else {
            continue;
        }

        queue.push({ x: (x-0) + 1, y: (y-0) });
        queue.push({ x: x - 1, y: (y-0) });
        queue.push({ x: (x-0), y: (y-0) + 1 });
        queue.push({ x: (x-0), y: y - 1 });
    }

    actions.push(
        {
            type: "Fill",
            cells: changedCells,
            color: replacementColor,
            colorbefore: targetColor
        }
    )
}
function draw(x, y) {
    if (tool == "pen") {
        setCell(x, y, currentcolor);
        return;
    }
    if (tool == "eraser") {
        setCell(x, y, { r: 255, g: 255, b: 255});
        return;
    }
    if (tool == "fill") {
        const targetColor = matrix[x][y];  // Get the initial color to replace
        const fillColor = currentcolor;    // Color to fill with
        
        // If the target color is already the fill color, no need to fill
        if (colorsMatch(targetColor, fillColor)) {
            return;
        }

        floodFill(x, y, targetColor, currentcolor);
        return;
    }
}
function DownloadToPNG() {
    html2canvas(document.querySelector("#matrix")).then(canvas => {
        Canvas2Image.saveAsImage(canvas)
    });
}

// Functions | End


// Keyboard Shortcuts | Start

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

// Keyboard Shortcuts | End


// Pickr | Start

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
    setCurrentColorRGB(Math.floor(color[0]), Math.floor(color[1]), Math.floor(color[2]));
});

// Pickr | End