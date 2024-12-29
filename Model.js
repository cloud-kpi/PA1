// Initialize granularity values
let granularityU = parseInt(document.getElementById("granularityU").value);
let granularityV = parseInt(document.getElementById("granularityV").value);

// Update granularity when sliders are adjusted
document.getElementById("granularityU").addEventListener("input", function () {
    granularityU = parseInt(this.value);
	console.log("U: " + granularityU + "; V: " + granularityV);
	
    redraw();
});

document.getElementById("granularityV").addEventListener("input", function () {
    granularityV = parseInt(this.value);
	console.log("U: " + granularityU + "; V: " + granularityV);
    redraw();
});

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function Vertex(p, t)
{
    this.p = p;
    this.t = t;
    this.normal = [];
    this.triangles = [];
}

function Triangle(v0, v1, v2)
{
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
    this.iTexCoordsBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices, normals, triangles, texcoords, tangents) {
		console.log("Vertices: " + vertices.length);
		console.log("Normals: " + normals.length);
		console.log("Tangents: " + tangents.length);
		console.log("triangles: " + triangles.length);
		console.log("Texcoords: " + texcoords.length);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribVertex);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangles, gl.STREAM_DRAW);

		let normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribNormal);

		let tangentBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, tangents, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribTangent, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribTangent);
		
		this.count = triangles.length;
	};

    this.Draw = function() {

		gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureDiffuse);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureSpecular);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordsBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexCoords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoords);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);

        //gl.drawArrays(gl.LINE_STRIP, 0, this.count);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}

// Update the sliders to control granularity
function redraw() {
    let data = {};
    CreateSurfaceData(data);
    surface.BufferData(data.verticesF32, data.normalsF32, data.trianglesU16, data.texcoordsF32, data.tangentsF32);
    draw();
}


function CreateSurfaceData(data) {
    let vertices = [];
    let texcoords = [];
    let normals = [];
    let triangles = [];
	
	let scale = 0.5;
    const PI = Math.PI;

	function calc(x, y, z, uTangent, vTangent, u, v) {
		x *= scale;
		y *= scale;
		z *= scale;

		vertices.push(x, y, z);
		texcoords.push(u/3 + 0.5, (1 - v)/3 + 0.2);

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
	for (let j = -PI/2; j <= PI/2; j+=PI/granularityV, row++) {
		let col = 0;
        let v = j;
        for (let i = -PI/2; i <= PI/2; i+=PI/granularityU, col++) {
            let u = i;
            // Bell Pepper
            // let x = Math.cos(u) * Math.sin(v);
            // let y = Math.sin(u) * Math.sin(v);
            // let z = Math.cos(v) + 0.5 * Math.cos(3 * u) * Math.sin(3 * v);
			
			// Neovius surface
			let x = u;
            let y = v;
            let z = Math.acos(-3 * (Math.cos(u) + Math.cos(v)) / (3 + 4 * Math.cos(u) * Math.cos(v)));

			
			let tangentU = [ 1, 0, 0 ];
			let tangentV = [ 0, 1, -Math.sin(v) ];

			// Tangent Normalization
			let lengthTangentU = Math.sqrt(tangentU[0] * tangentU[0] + tangentU[1] * tangentU[1] + tangentU[2] * tangentU[2]);
			let lengthTangentV = Math.sqrt(tangentV[0] * tangentV[0] + tangentV[1] * tangentV[1] + tangentV[2] * tangentV[2]);

			// Normalize the tangent vectors
			tangentU = [tangentU[0] / lengthTangentU, tangentU[1] / lengthTangentU, tangentU[2] / lengthTangentU];
			tangentV = [tangentV[0] / lengthTangentV, tangentV[1] / lengthTangentV, tangentV[2] / lengthTangentV];

			
			calc(x, y, z, tangentU, tangentV, u, v); // front
			//calc(x, y, -z); // back
			//calc(x, z, y); // top
			//calc(x, -z, y); // bot
			//calc(z, x, y); // right
			//calc(-z, x, y); // left
			
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
	
	const tangents = calculateTangents(vertices, normals, texcoords, triangles);

    data.verticesF32 = new Float32Array(vertices);
    data.texcoordsF32 = new Float32Array(texcoords);
    data.normalsF32 = new Float32Array(normals);
    data.tangentsF32 = new Float32Array(tangents);
	data.trianglesU16 = new Uint16Array(triangles);
}

function calculateTangents(vertices, normals, texcoords, triangles) {
    const tangents = new Array(vertices.length / 3).fill(0).map(() => [0, 0, 0]);

    for (let i = 0; i < triangles.length; i += 3) {
        const i0 = triangles[i];
        const i1 = triangles[i + 1];
        const i2 = triangles[i + 2];

        const p0 = vertices.slice(i0 * 3, i0 * 3 + 3);
        const p1 = vertices.slice(i1 * 3, i1 * 3 + 3);
        const p2 = vertices.slice(i2 * 3, i2 * 3 + 3);

        const uv0 = texcoords.slice(i0 * 2, i0 * 2 + 2);
        const uv1 = texcoords.slice(i1 * 2, i1 * 2 + 2);
        const uv2 = texcoords.slice(i2 * 2, i2 * 2 + 2);

        const edge1 = p1.map((v, j) => v - p0[j]);
        const edge2 = p2.map((v, j) => v - p0[j]);

        const deltaUV1 = uv1.map((v, j) => v - uv0[j]);
        const deltaUV2 = uv2.map((v, j) => v - uv0[j]);

        const f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);
        const tangent = [
            f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]),
            f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]),
            f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]),
        ];

        [i0, i1, i2].forEach((index) => {
            tangents[index] = tangents[index].map((v, j) => v + tangent[j]);
        });
    }

    // Normalize tangents
    return tangents.flat().map((v, i) => v / Math.sqrt(tangents[Math.floor(i / 3)].reduce((acc, val) => acc + val ** 2, 0)));
}