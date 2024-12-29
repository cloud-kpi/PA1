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
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        console.log(e.message);
        return;
    }
    try {
        spaceball = new TrackballRotator(canvas, draw, 0);
        initGL();  // initialize the WebGL graphics context
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    document.addEventListener('keydown', handleKeyboard);
    draw();
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();
    
    shProgram.iAttribVertex              	= gl.getAttribLocation(prog, "vertex");
    shProgram.iColor                     	= gl.getUniformLocation(prog, "color");
    shProgram.iAttribNormal                 = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTangent                = gl.getAttribLocation(prog, "tangent");
	
	shProgram.iAttribTexCoords              = gl.getAttribLocation(prog, "tex");
	shProgram.iTMU0                         = gl.getUniformLocation(prog, "iTMU0");
    shProgram.iTMU1                         = gl.getUniformLocation(prog, "iTMU1");
    shProgram.iTMU2                         = gl.getUniformLocation(prog, "iTMU2");

    shProgram.iUniformLightPosition         = gl.getUniformLocation(prog, "lightPosition");
    shProgram.iUniformAmbientLight          = gl.getUniformLocation(prog, "ambientLight");
	
    shProgram.iUniformViewPosition          = gl.getUniformLocation(prog, "viewPosition");
    shProgram.iNormalMatrix                 = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iModelViewMatrix              = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iModelViewProjectionMatrix 	= gl.getUniformLocation(prog, "ModelViewProjectionMatrix");

    gl.uniform3fv(shProgram.iUniformLightPosition, [2, 22, 8.0]);
    gl.uniform3fv(shProgram.iUniformAmbientLight, [0.3, 0.1, 0.4]);
    gl.uniform3fv(shProgram.iUniformViewPosition, [0, 0, 10.0]);

	shProgram.iTransformed 					= gl.getUniformLocation(prog, "tex_new");
    shProgram.iPivot 						= gl.getUniformLocation(prog, "pivot_coords");
    shProgram.iPivotRadius 					= gl.getUniformLocation(prog, "pivot_radius");
    shProgram.iNormalMatrix 				= gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iModelViewMatrix 				= gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iModelViewProjectionMatrix 	= gl.getUniformLocation(prog, "ModelViewProjectionMatrix");


    let data = {};
    CreateSurfaceData(data);

    surface = new Model('Surface');
    surface.BufferData(data.verticesF32, data.normalsF32, data.trianglesU16, data.texcoordsF32, data.tangentsF32);

    surface.idTextureDiffuse = LoadTexture("tex_diff.png");
    surface.idTextureSpecular = LoadTexture("tex_spec.png");
    surface.idTextureNormal = LoadTexture("tex_norm.png");

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

function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    this.iAttribVertex = -1;
	this.iAttribTexCoords = -1;
    this.iColor = -1;
    this.iModelViewProjectionMatrix = -1;
	
	this.iModelViewMatrix = -1;
    this.iTMU0 = gl.getUniformLocation(program, "iTMU0");
	this.iTMU1 = gl.getUniformLocation(program, "iTMU1");
	this.iTMU2 = gl.getUniformLocation(program, "iTMU2");

    this.Use = function() { gl.useProgram(this.prog); }
}

function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // VIEW
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    let modelView = spaceball.getViewMatrix();
    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    let modelViewProjection = m4.multiply(projection, matAccum1);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum1);

    // NORMALS
    let normalMatrix = m4.identity();
    m4.multiply(modelView, matAccum1, normalMatrix);
    m4.inverse(normalMatrix, normalMatrix);
    m4.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);

    // COLOR AND TEXTURE
    gl.uniform4fv(shProgram.iColor, [1, 1, 1, 1]);

    // Update texture transformation matrix
    updateTextureTransform();

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, surface.idTextureDiffuse);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, surface.idTextureSpecular);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, surface.idTextureNormal);

    // Draw the surface
    surface.Draw();
}

let texRot = 0;
let pivot = [0.5, 0.5];

function updateTextureTransform() {
    const rotMat = [
		Math.cos(texRot), 	-Math.sin(texRot), 	0,
        Math.sin(texRot), 	Math.cos(texRot), 	0,
        0,           		0,  				1,
    ];

    gl.uniformMatrix3fv(shProgram.iTransformed, false, rotMat);
    gl.uniform2fv(shProgram.iPivot, pivot);    
    gl.uniform1f(shProgram.iPivotRadius, 1.0);
}

function handleKeyboard(event) {
    const step = 0.05;
    switch (event.key) {
        case 'a': pivot[0] -= step; break; // Move pivot left
        case 'd': pivot[0] += step; break; // Move pivot right
        case 'w': pivot[1] -= step; break; // Move pivot up
        case 's': pivot[1] += step; break; // Move pivot down
        case 'q': texRot -= Math.PI / 18; break; // Rotate counter-clockwise
        case 'e': texRot += Math.PI / 18; break; // Rotate clockwise
    }
	console.log(event.key + " pressed.\nPivot: " + pivot + "\nRot: " + texRot);
	
    updateTextureTransform();
    draw();
}


