let granularityU = parseInt(document.getElementById("granularityU").value);
let granularityV = parseInt(document.getElementById("granularityV").value);

document.getElementById("granularityU").addEventListener("input", function () {
	granularityU = parseInt(this.value);
	redraw();
});

document.getElementById("granularityV").addEventListener("input", function () {
	granularityV = parseInt(this.value);
	redraw();
});

function deg2rad(angle) {
	return angle * Math.PI / 180;
}

function Vertex(p) {
	this.p = p;
	this.normal = [];
	this.triangles = [];
}

function Triangle(v0, v1, v2) {
	this.v0 = v0;
	this.v1 = v1;
	this.v2 = v2;
	this.normal = [];
	this.tangent = [];
}

// Constructor
function Model(name) {
	this.name = name;
	this.iVertexBuffer = gl.createBuffer();
	this.iIndexBuffer = gl.createBuffer();
	this.count = 0;

	this.BufferData = function (vertices, normals, triangles) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribVertex);

		let normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribNormal);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangles, gl.STREAM_DRAW);

		this.count = triangles.length;
	};

	this.Draw = function () {
		gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
	}
}

function CreateSurfaceData(data) {
	let vertices = [];
	let normals = [];
	let triangles = [];

	let scale = 0.5;
	const PI = Math.PI;

	function calc(x, y, z, uTangent, vTangent) {
		x *= scale;
		y *= scale;
		z *= scale;

		vertices.push(x, y, z);

		let nx = uTangent[1] * vTangent[2] - uTangent[2] * vTangent[1];
		let ny = uTangent[2] * vTangent[0] - uTangent[0] * vTangent[2];
		let nz = uTangent[0] * vTangent[1] - uTangent[1] * vTangent[0];

		let length = Math.sqrt(nx * nx + ny * ny + nz * nz);
		if (length > 0) {
			nx /= length;
			ny /= length;
			nz /= length;
		}

		normals.push(nx, ny, nz);

		return x, y, z;
	}

	let row = 0;
	for (let j = -PI / 2; j <= PI / 2; j += PI / granularityV, row++) {
		let col = 0;
		let v = j;
		for (let i = -PI / 2; i <= PI / 2; i += PI / granularityU, col++) {
			let u = i;
			// Bell Pepper
			// let x = Math.cos(u) * Math.sin(v);
			// let y = Math.sin(u) * Math.sin(v);
			// let z = Math.cos(v) + 0.5 * Math.cos(3 * u) * Math.sin(3 * v);

			// Neovius surface
			let x = u;
			let y = v;
			let z = Math.acos(-3 * (Math.cos(u) + Math.cos(v)) / (3 + 4 * Math.cos(u) * Math.cos(v)));


			let tangentU = [1, 0, 0];
			let tangentV = [0, 1, -Math.sin(v)];

			// Tangent Normalization
			let lengthTangentU = Math.sqrt(tangentU[0] * tangentU[0] + tangentU[1] * tangentU[1] + tangentU[2] * tangentU[2]);
			let lengthTangentV = Math.sqrt(tangentV[0] * tangentV[0] + tangentV[1] * tangentV[1] + tangentV[2] * tangentV[2]);

			// Normalize the tangent vectors
			tangentU = [tangentU[0] / lengthTangentU, tangentU[1] / lengthTangentU, tangentU[2] / lengthTangentU];
			tangentV = [tangentV[0] / lengthTangentV, tangentV[1] / lengthTangentV, tangentV[2] / lengthTangentV];


			calc(x, y, z, tangentU, tangentV); // front
			// calc(x, y, -z,  tangentU, tangentV); // back
			// calc(x, z, y,  tangentU, tangentV); // top
			//calc(x, -z, y,  tangentU, tangentV); // bot
			//calc(z, x, y,  tangentU, tangentV); // right
			//calc(-z, x, y,  tangentU, tangentV); // left

			push_triangles(row, col);
		}
	}

	function push_triangles(row, col) {
		if (row < granularityV && col < granularityU) {
			let v0 = row * (granularityU + 1) + col;
			let v1 = v0 + 1;
			let v2 = v0 + (granularityU + 1);
			let v3 = v2 + 1;

			triangles.push(v0, v1, v2);
			triangles.push(v1, v3, v2);
		}
	}

	data.verticesF32 = new Float32Array(vertices);
	data.normalsF32 = new Float32Array(normals);
	data.trianglesU16 = new Uint16Array(triangles);
}

function redraw() {
	let data = {};
	CreateSurfaceData(data);
	surface.BufferData(data.verticesF32, data.normalsF32, data.trianglesU16);
	draw();
}
