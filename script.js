let matrix = [];

let mouseDown = false;

let currentcolor = {r:0,g:0,b:0,a:1.0};

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

function setCell(x, y, color){
    if (color.a > 1){
        color.a = 255%color.a;
    }
    
    $("#" + x + "-" + y).css("background-color", `rgba(${color.r},${color.g},${color.b},${color.a})`);

    matrix[x][y].r = color.r;
    matrix[x][y].g = color.g;
    matrix[x][y].b = color.b;
    matrix[x][y].a = color.a;
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


// Initialize the Pickr instance
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

// Add event listener for color change
pickr.on('change', (color, instance) => {
    color = color.toRGBA();
    setCurrentColorRGB(color[0], color[1], color[2], color[3]);
});

$("#Copy").click(function () { 
    let copytext = arrayToJSON(matrix);
    navigator.clipboard.writeText(copytext);
});

$("#Download").click(function () { 
    let copytext = arrayToJSON(matrix);
    let blob = new Blob([copytext], {type: "text/plain;charset=utf-8"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "16x16GameMatrixPictureCreator.txt";
    a.click();
    URL.revokeObjectURL(url);
});

function arrayToJSON(array) {
    let json = "{\n";
    for(let i = 0; i < array.length; i++){
        json += "{";
        for(let j = 0; j < array[i].length; j++){
            json += `{${array[i][j].r},${array[i][j].g},${array[i][j].b},${array[i][j].a}},`;
        }
        json = json.slice(0, -1);
        json += "},\n"
    }
    json = json.slice(0, -2);
    json += "\n}"
    return json;
}