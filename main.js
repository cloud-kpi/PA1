'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        spaceball = new TrackballRotator(canvas, draw, 0);
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    draw();
}

function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;

    this.iAttribVertex = -1;
    this.iColor = -1;
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}

function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    let modelView = spaceball.getViewMatrix();
    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    let modelViewProjection = m4.multiply(projection, matAccum1);
    let normalMatrix = m4.identity();
    m4.multiply(modelView, matAccum1, normalMatrix);
    m4.inverse(normalMatrix, normalMatrix);
    m4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    gl.uniform4fv(shProgram.iColor, [0.7, 0, 0.7, 1]);

    surface.Draw();
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex                 = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix    = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor                        = gl.getUniformLocation(prog, "color");

    shProgram.iAttribNormal                 = gl.getAttribLocation(prog, "normal");
    shProgram.iUniformLightPosition         = gl.getUniformLocation(prog, "lightPosition");
    shProgram.iUniformAmbientLight          = gl.getUniformLocation(prog, "ambientLight");

    shProgram.iUniformViewPosition          = gl.getUniformLocation(prog, "viewPosition");
    shProgram.iNormalMatrix                 = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iModelViewMatrix              = gl.getUniformLocation(prog, "ModelViewMatrix");

    gl.uniform3fv(shProgram.iUniformLightPosition, [2, 22, 8.0]);
    gl.uniform3fv(shProgram.iUniformAmbientLight, [0.3, 0.7, 0.4]);
    gl.uniform3fv(shProgram.iUniformViewPosition, [0, 0, 10.0]);

    let data = {};
    CreateSurfaceData(data);
    surface = new Model('Surface');
    surface.BufferData(data.verticesF32, data.normalsF32, data.trianglesU16);
    gl.enable(gl.DEPTH_TEST);
}

function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

