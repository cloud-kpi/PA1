'use strict';
let gl;                         // The webgl context.
let surU, surV;  // Separate surfaces for U and V

let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mou
function deg2rad(angle) {
	return angle * Math.PI / 180;
}

// Constructor
function Model(name) {
	this.name = name;
	this.iVertexBuffer = gl.createBuffer();
	this.count = 0;

	this.BufferData = function (vertices) {

		gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

		this.count = vertices.length / 3;
	}

	this.Draw = function () {

		gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
		gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribVertex);

		gl.drawArrays(gl.LINES, 0, this.count);
	}
}

// Constructor
function ShaderProgram(name, program) {

	this.name = name;
	this.prog = program;

	// Location of the attribute variable in the shader program.
	this.iAttribVertex = -1;
	// Location of the uniform specifying a color for the primitive.
	this.iColor = -1;
	// Location of the uniform matrix representing the combined transformation.
	this.iModelViewProjectionMatrix = -1;

	this.Use = function () {
		gl.useProgram(this.prog);
	}
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	/* Set the values of the projection transformation */
	let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

	/* Get the view matrix from the SimpleRotator object. */
	let modelView = spaceball.getViewMatrix();

	let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
	let translateToPointZero = m4.translation(0, 0, -10);

	let matAccum0 = m4.multiply(rotateToPointZero, modelView);
	let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

	/* Multiply the projection matrix times the modelview matrix to give the
	   combined transformation matrix, and send that to the shader program. */
	let modelViewProjection = m4.multiply(projection, matAccum1);
	gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);


	gl.uniform4fv(shProgram.iColor, [1, 0, 1, 1]);
	surV.Draw();

	gl.uniform4fv(shProgram.iColor, [1, 0.75, 0.2, 1]);
	surU.Draw();
}

function CreateNeoviusSurfaceData() {
	let verticesU = [];
	let verticesV = [];

	let detail = Math.PI / 40; //detail
	let scale = 0.4; //scale

	let uR = [-Math.PI, Math.PI]; // Fig1
	// let uR = [-Math.PI / 2, Math.PI / 2]; // Fig2
	let vR = uR;

	// Function to apply a rotation matrix to a vertex
	function rotateVertex(vertex, matrix) {
		let [x, y, z] = vertex;
		return [
			matrix[0] * x + matrix[1] * y + matrix[2] * z,
			matrix[3] * x + matrix[4] * y + matrix[5] * z,
			matrix[6] * x + matrix[7] * y + matrix[8] * z
		];
	}

	// Rotation matrices
	let rotateX = [
		1, 0, 0,
		0, 0, -1,
		0, 1, 0
	];

	let rotateY = [
		0, 0, 1,
		0, 1, 0,
		-1, 0, 0
	];

	let rotateZ = [
		0, -1, 0,
		1, 0, 0,
		0, 0, 1
	];

	let rotate180 = [
		1, 0, 0,
		0, -1, 0,
		0, 0, -1
	];

	// U
	{
		// Top
		for (let v = vR[0]; v <= vR[1]; v += detail) {
			let lastPos = null;

			for (let u = uR[0]; u <= uR[1]; u += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;


					// U curve
					if (lastPos != null) {
						verticesU.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesU.push(x, z, y);
					}

					lastPos = [x, z, y];
				}
				// limit 1
				//if (u == uR[0] + 1 * detail) break;
			}
			// limit 2
			//if (v == vR[0] + detail) break;
		}

		// Bottom
		for (let v = vR[0]; v <= vR[1]; v += detail) {
			let lastPos = null;

			for (let u = uR[0]; u <= uR[1]; u += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;

					let rotatedPos180 = rotateVertex([x, z, y], rotate180);

					x = rotatedPos180[0];
					y = rotatedPos180[2];
					z = rotatedPos180[1];

					// U curve
					if (lastPos != null) {
						verticesU.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesU.push(x, z, y);
					}

					lastPos = [x, z, y];
				}
			}
		}
	}


	{
		// Front
		for (let v = vR[0]; v <= vR[1]; v += detail) {
			let lastPos = null;

			for (let u = uR[0]; u <= uR[1]; u += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;

					let rotatedPosX = rotateVertex([x, z, y], rotateX);

					x = rotatedPosX[0];
					y = rotatedPosX[2];
					z = rotatedPosX[1];

					if (lastPos != null) {
						verticesU.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesU.push(x, z, y);
					}

					lastPos = [x, z, y];
				}
			}
		}

		// Back
		for (let v = vR[0]; v <= vR[1]; v += detail) {
			let lastPos = null;

			for (let u = uR[0]; u <= uR[1]; u += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;


					let rotatedPosX = rotateVertex([x, z, y], rotateX);

					x = rotatedPosX[0];
					y = rotatedPosX[2];
					z = rotatedPosX[1];

					let rotatedPos180 = rotateVertex([x, z, y], rotate180);

					x = rotatedPos180[0];
					y = rotatedPos180[2];
					z = rotatedPos180[1];


					if (lastPos != null) {
						verticesU.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesU.push(x, z, y);
					}

					lastPos = [x, z, y];
				}
			}
		}
	}


	{
		// Left
		for (let v = vR[0]; v <= vR[1]; v += detail) {
			let lastPos = null;

			for (let u = uR[0]; u <= uR[1]; u += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;


					let rotatedPosY = rotateVertex([x, z, y], rotateY);
					let rotatedPosZ = rotateVertex(rotatedPosY, rotateZ);

					x = rotatedPosZ[0];
					y = rotatedPosZ[2];
					z = rotatedPosZ[1];


					if (lastPos != null) {
						verticesU.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesU.push(x, z, y);
					}

					lastPos = [x, z, y];
				}
			}
		}


		// Right
		for (let v = vR[0]; v <= vR[1]; v += detail) {
			let lastPos = null;

			for (let u = uR[0]; u <= uR[1]; u += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;


					let rotatedPosZ = rotateVertex([x, z, y], rotateZ);

					x = rotatedPosZ[0];
					y = rotatedPosZ[2];
					z = rotatedPosZ[1];



					if (lastPos != null) {
						verticesU.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesU.push(-x, -z, -y);
					}

					lastPos = [-x, -z, -y];
				}
			}
		}

	}


	//V
	{
		// Top
		for (let u = uR[0]; u <= uR[1]; u += detail) {
			let lastPos = null;

			for (let v = vR[0]; v <= vR[1]; v += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;



					if (lastPos != null) {
						verticesV.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesV.push(x, z, y);
					}

					lastPos = [x, z, y];
				}
			}
		}

		// Bottom
		for (let u = uR[0]; u <= uR[1]; u += detail) {
			let lastPos = null;

			for (let v = vR[0]; v <= vR[1]; v += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;

					let rotatedPos180 = rotateVertex([x, z, y], rotate180);

					x = rotatedPos180[0];
					y = rotatedPos180[2];
					z = rotatedPos180[1];


					if (lastPos != null) {
						verticesV.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesV.push(x, z, y);
					}

					lastPos = [x, z, y];
				}
			}
		}
	}


	{
		// Front
		for (let u = uR[0]; u <= uR[1]; u += detail) {
			let lastPos = null;

			for (let v = vR[0]; v <= vR[1]; v += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;


					let rotatedPosX = rotateVertex([x, z, y], rotateX);

					x = rotatedPosX[0];
					y = rotatedPosX[2];
					z = rotatedPosX[1];


					if (lastPos != null) {
						verticesV.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesV.push(x, z, y);
					}

					lastPos = [x, z, y];
				}
			}
		}

		// Back
		for (let u = uR[0]; u <= uR[1]; u += detail) {
			let lastPos = null;

			for (let v = vR[0]; v <= vR[1]; v += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;


					let rotatedPosX = rotateVertex([x, z, y], rotateX);

					x = rotatedPosX[0];
					y = rotatedPosX[2];
					z = rotatedPosX[1];

					let rotatedPos180 = rotateVertex([x, z, y], rotate180);

					x = rotatedPos180[0];
					y = rotatedPos180[2];
					z = rotatedPos180[1];


					if (lastPos != null) {
						verticesV.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesV.push(x, z, y);
					}

					lastPos = [x, z, y];
				}
			}
		}
	}


	{
		// Left
		for (let u = uR[0]; u <= uR[1]; u += detail) {
			let lastPos = null;

			for (let v = vR[0]; v <= vR[1]; v += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;


					let rotatedPosY = rotateVertex([x, z, y], rotateY);
					let rotatedPosZ = rotateVertex(rotatedPosY, rotateZ);

					x = rotatedPosZ[0];
					y = rotatedPosZ[2];
					z = rotatedPosZ[1];


					if (lastPos != null) {
						verticesV.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesV.push(x, z, y);
					}
					lastPos = [x, z, y];
				}
			}
		}


		// Right
		for (let u = uR[0]; u <= uR[1]; u += detail) {
			let lastPos = null;
			for (let v = vR[0]; v <= vR[1]; v += detail) {
				let cosU = Math.cos(u);
				let cosV = Math.cos(v);
				let denominator = 3 + 4 * cosU * cosV;
				let numerator = -3 * (cosU + cosV);

				if (denominator !== 0) {
					let z = Math.acos(numerator / denominator) * scale;
					let x = u * scale;
					let y = v * scale;


					let rotatedPosZ = rotateVertex([x, z, y], rotateZ);

					x = rotatedPosZ[0];
					y = rotatedPosZ[2];
					z = rotatedPosZ[1];


					if (lastPos != null) {
						verticesV.push(lastPos[0], lastPos[1], lastPos[2]);
						verticesV.push(-x, -z, -y);
					}

					lastPos = [-x, -z, -y];
				}
			}
		}

	}



	return [verticesU, verticesV];
}

function initGL() {
	let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
	shProgram = new ShaderProgram('Basic', prog);
	shProgram.Use();

	shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
	shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
	shProgram.iColor = gl.getUniformLocation(prog, "color");

	// Get U and V vertices separately
	let vertices = CreateNeoviusSurfaceData();

	surU = new Model('surU');
	surU.BufferData(vertices[0]);

	surV = new Model('surV');
	surV.BufferData(vertices[1]);

	gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
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


/**
 * initialization function that will be called when the page has loaded
 */
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
		initGL();  // initialize the WebGL graphics context
	}
	catch (e) {
		document.getElementById("canvas-holder").innerHTML =
			"<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
		return;
	}

	spaceball = new TrackballRotator(canvas, draw, 0);

	draw();
}

window.onload = () => {
	init();
};