function makeNoiseTex(gl, width, height) {
	const data = new Uint8Array(width * height);
	crypto.getRandomValues(data);
	return gl.createTexture2D(WebGL.LUMINANCE, width, height, { data, parameters: {
		[WebGL.TEXTURE_MIN_FILTER]: WebGL.NEAREST,
		[WebGL.TEXTURE_MAG_FILTER]: WebGL.NEAREST,
		[WebGL.TEXTURE_WRAP_S]: WebGL.REPEAT,
		[WebGL.TEXTURE_WRAP_T]: WebGL.REPEAT,
	} });
}

const MAX_DISPLAY_RES = 1.0;
const MAX_RENDER_RES = 1.0;

document.addEventListener('DOMContentLoaded', () => {
	const screenRes = window.devicePixelRatio || 1;
	const displayRes = Math.min(screenRes, MAX_DISPLAY_RES);
	const renderRes = Math.min(screenRes, MAX_RENDER_RES);
	const gl = new WebGL({
		alpha: false,
		desynchronized: false,
		antialias: false,
		depth: false,
		failIfMajorPerformanceCaveat: true,
		powerPreference: 'high-performance',
		premultipliedAlpha: true,
		preserveDrawingBuffer: false,
		stencil: false,
	});
	gl.canvas.style.width = '100%';
	gl.canvas.style.height = '100%';
	document.body.appendChild(gl.canvas);

	gl.disable(WebGL.DITHER);

	//const colorBufferFloatExt = gl.getExtension('EXT_color_buffer_float');
	//if (!colorBufferFloatExt) {
	//	throw new Error('no EXT_color_buffer_float');
	//}

	//const textureFloatLinearExt = gl.getExtension('OES_texture_float_linear');
	//if (!textureFloatLinearExt) {
	//	throw new Error('no OES_texture_float_linear');
	//}

	const vertWorld = gl.createShader(WebGL.VERTEX_SHADER, `
		#version 300 es
		precision highp float;
		precision highp int;

		uniform mat4 mv;
		uniform mat4 p;
		uniform float t;

		in vec3 pos;
		//in vec3 dp;
		flat out vec3 basecol;
		smooth out vec3 modelpos;
		smooth out vec3 worldpos;

		const int size = 40;

		void main() {
			vec3 centre = (vec3(
				gl_InstanceID / (size * size),
				(gl_InstanceID / size) % size,
				gl_InstanceID % size
			) - float(size) * 0.5);
			centre += sin(centre.yzx);

			//float scale = 0.02 + smoothstep(15.0, 20.0, length(centre)) * 0.33 - smoothstep(18.0, 20.0, length(centre)) * 0.3 - smoothstep(20.0, 23.0, length(centre)) * 0.05;
			//float scale = sin(dot(centre, vec3(0.2, 0.5, 0.05))) * 0.15 + 0.15;
			//float scale = (sin(length(centre) * 2.0 - t * 6.0) * 0.5 + 0.5) * (smoothstep(20.0, 5.0, length(centre))) * 0.4;
			float scale = (smoothstep(20.0, 18.0, length(centre)) - smoothstep(17.0, 16.0, length(centre))) * 0.7;
			float noiseBase = sin(dot(centre, vec3(12.9898, 78.233, 236.326)));
			basecol = vec3(
				fract(noiseBase * 43758.5453),
				fract(noiseBase * 43757.5453),
				fract(noiseBase * 43756.5453)
			);
			modelpos = pos;
			vec3 rotZ = normalize(centre);
			vec3 rotX = normalize(cross(vec3(0.0, 1.0, 0.0), rotZ));
			mat3 rot = mat3(rotX, cross(rotZ, rotX), rotZ);
			vec4 resolvedLocn = vec4(rot * pos * scale + centre, 1.0);
			worldpos = (mv * resolvedLocn).xyz;
			gl_Position = p * mv * resolvedLocn;
		}
	`);

	//const vertLandscape = gl.createShader(WebGL.VERTEX_SHADER, `
	//	#version 300 es
	//	precision highp float;
	//	precision highp int;
	//	uniform mat4 mv;
	//	uniform mat4 p;
	//	uniform sampler2D heightmap;
	//	uniform ivec2 dim;
	//	void main() {
	//		vec2 xy = vec2(
	//			gl_VertexID % dim.x,
	//			gl_VertexID / dim.x
	//		) / (vec2(dim) - 1.0);
	//		float height = texture(heightmap, xy).r;
	//		gl_Position = p * mv * vec4(xy, height, 1.0);
	//	}
	//`);

	const fragFlat = gl.createShader(WebGL.FRAGMENT_SHADER, `
		#version 300 es
		precision highp float;
		precision highp int;

		smooth in vec3 modelpos;
		smooth in vec3 worldpos;
		flat in vec3 basecol;
		layout(location = 0) out vec4 matt;
		layout(location = 1) out vec4 material;
		layout(location = 2) out vec4 norm;

		void main() {
			matt = vec4(basecol + modelpos * 0.1 + 1.2 * smoothstep(1.99, 2.01, dot(smoothstep(0.8, 0.9, abs(modelpos)), vec3(1.0))), 1.0);
			material = vec4(0.0, 1.0, 0.01, 0.0);
			vec3 fdx = vec3(dFdx(worldpos.x), dFdx(worldpos.y), dFdx(worldpos.z));
			vec3 fdy = vec3(dFdy(worldpos.x), dFdy(worldpos.y), dFdy(worldpos.z));
			norm = vec4(normalize(cross(fdx, fdy)) * 0.5 + 0.5, 0.0);
		}
	`);

	const progFlat = gl.createProgram(vertWorld, fragFlat);
	vertWorld.delete();
	fragFlat.delete();

	const noiseTex = makeNoiseTex(gl, 64, 64);

	const cubeBuffer = gl.createBuffer(WebGL.ARRAY_BUFFER, new Float32Array([
		-1.0, -1.0, -1.0, // 0 -> 0 -> 0
		-1.0, -1.0,  1.0, // 1 -> 4 -> 2
		-1.0,  1.0, -1.0, // 2 -> 1 -> 4
		-1.0,  1.0,  1.0, // 3 -> 5 -> 6
		 1.0, -1.0, -1.0, // 4 -> 2 -> 1
		 1.0, -1.0,  1.0, // 5 -> 6 -> 3
		 1.0,  1.0, -1.0, // 6 -> 3 -> 5
		 1.0,  1.0,  1.0, // 7 -> 7 -> 7
	]), WebGL.STATIC_DRAW);

	const cubeIdxBuffer = gl.createBuffer(WebGL.ELEMENT_ARRAY_BUFFER, new Uint8Array([
		0, 1, 2,  3, 2, 1,
		0, 4, 1,  5, 1, 4,
		0, 2, 4,  6, 4, 2,
		7, 6, 3,  6, 2, 3,
		7, 3, 5,  3, 1, 5,
		7, 5, 6,  5, 4, 6,
	]), WebGL.STATIC_DRAW);

	//const colBuffer = gl.createBuffer(WebGL.ARRAY_BUFFER, new Float32Array([
	//	0.0, 0.0, 0.0,
	//	0.0, 3.5, 0.0,
	//	0.0, -3.5, 0.0,
	//	0.0, 0.0, 3.5,
	//	0.0, 2.5, 2.5,
	//	0.0, -2.5, 2.5,
	//	0.0, 0.0, -3.5,
	//	0.0, 2.5, -2.5,
	//	0.0, -2.5, -2.5,
	//	3.5, 0.0, 0.0,
	//	2.5, 2.5, 0.0,
	//	2.5, -2.5, 0.0,
	//	2.5, 0.0, 2.5,
	//	2.5, 2.5, 2.5,
	//	2.5, -2.5, 2.5,
	//	2.5, 0.0, -2.5,
	//	2.5, 2.5, -2.5,
	//	2.5, -2.5, -2.5,
	//	-3.5, 0.0, 0.0,
	//	-2.5, 2.5, 0.0,
	//	-2.5, -2.5, 0.0,
	//	-2.5, 0.0, 2.5,
	//	-2.5, 2.5, 2.5,
	//	-2.5, -2.5, 2.5,
	//	-2.5, 0.0, -2.5,
	//	-2.5, 2.5, -2.5,
	//	-2.5, -2.5, -2.5,
	//]), WebGL.STATIC_DRAW);

	const cubeVerts = gl.createVertexArray([
		{ location: progFlat.getAttribLocation('pos'), buffer: cubeBuffer, size: 3, type: WebGL.FLOAT },
		//{ location: progFlat.getAttribLocation('dp'), buffer: colBuffer, size: 3, type: WebGL.FLOAT, divisor: 1 },
	], cubeIdxBuffer);

	let projection = [];

	function render(w, h) {
		const hfov = 100.0;
		const n = 5.0;
		const r = Math.tan(hfov * 0.5 * Math.PI / 180.0);
		const t = r * h / w;
		const z = 50.0;
		const a = Date.now() * 0.0005;
		// matrices are transposed as used by webgl
		const modelview = [
			Math.cos(a), 0.0, -Math.sin(a), 0.0,
			0.0, 1.0, 0.0, 0.0,
			Math.sin(a), 0.0, Math.cos(a), 0.0,
			0.0, 0.0, -z, 1.0,
		];
		// projection optimised for float depth buffer
		// depth = near / -z
		// -> 1 = near, 0 = infinity, decays exponentially giving uniform float precision throughout
		// note: in the depth buffer itself this is rescaled from [0, 1] to [-1, 1]
		projection = [
			1/r, 0.0, 0.0, 0.0,
			0.0, 1/t, 0.0, 0.0,
			0.0, 0.0, 0.0, -1.0,
			0.0, 0.0, n, 0.0,
		];
		progFlat.use({
			'mv': modelview,
			'p': projection,
			't': (Date.now() * 0.001) % (Math.PI * 2),
		});
		gl.enable(WebGL.CULL_FACE);
		gl.cullFace(WebGL.BACK);
		gl.enable(WebGL.DEPTH_TEST);
		gl.depthFunc(WebGL.GEQUAL);
		gl.drawBuffers([WebGL.COLOR_ATTACHMENT0, WebGL.COLOR_ATTACHMENT1, WebGL.COLOR_ATTACHMENT2]);
		cubeVerts.doBound(() => {
			//gl.drawElements(WebGL.TRIANGLES, 36, WebGL.UNSIGNED_BYTE, 0);
			gl.drawElementsInstanced(WebGL.TRIANGLES, 36, WebGL.UNSIGNED_BYTE, 0, Math.pow(40, 3));
		});
		gl.disable(WebGL.CULL_FACE);
		gl.disable(WebGL.DEPTH_TEST);
	}

	const multisampleSamples = 0; // in Chrome: appears to be an on-or-off toggle (0 = off, >0 = on)

	// WebGL.R11F_G11F_B10F WebGL.RGBA16F
	const colFormat = WebGL.RGB10_A2; // red, green, blue, unused (2 bits)
	const materialFormat = WebGL.RGBA8; // spec matt col component, spec light col component, roughness, glow
	const normalFormat = WebGL.RGB10_A2; // x, y, z, unused (2 bits)

	const pipeline = new GLXPipeline(gl, 0, 0);

	const skyBox = pipeline.createCubeBufferSet({
		[WebGL.COLOR_ATTACHMENT0]: { format: colFormat },
	}, { size: 256 });

	//const shadowMap = pipeline.createBufferSet({
	//	[WebGL.DEPTH_ATTACHMENT]: { format: WebGL.DEPTH_COMPONENT32F },
	//}, { width: 512, height: 512 });

	const scene = pipeline.createMultisampleBufferSets({
		[WebGL.COLOR_ATTACHMENT0]: { format: colFormat },
		[WebGL.COLOR_ATTACHMENT1]: { format: materialFormat },
		[WebGL.COLOR_ATTACHMENT2]: { format: normalFormat },
		[WebGL.DEPTH_ATTACHMENT]: { format: WebGL.DEPTH_COMPONENT32F },
	}, {
		scale: 1.0,
		outputs: [
			WebGL.COLOR_ATTACHMENT0,
			WebGL.COLOR_ATTACHMENT1,
			WebGL.COLOR_ATTACHMENT2,
			WebGL.DEPTH_ATTACHMENT,
		],
		multisampleSamples,
	});

	const lighting = pipeline.createBufferSet({
		[WebGL.COLOR_ATTACHMENT0]: { format: colFormat, textureParameters: {
			[WebGL.TEXTURE_MAG_FILTER]: WebGL.LINEAR,
		} },
	}, { scale: 1.0 });

	const downBuffer = pipeline.createBufferSet({
		[WebGL.COLOR_ATTACHMENT0]: { format: colFormat },
	}, { scale: 0.5 });

	const postBuffer1 = pipeline.createBufferSet({
		[WebGL.COLOR_ATTACHMENT0]: { format: colFormat, textureParameters: {
			[WebGL.TEXTURE_MAG_FILTER]: WebGL.LINEAR,
		} },
	}, { scale: 0.25 });
	const postBuffer2 = pipeline.createBufferSet({
		[WebGL.COLOR_ATTACHMENT0]: { format: colFormat, textureParameters: {
			[WebGL.TEXTURE_MAG_FILTER]: WebGL.LINEAR,
		} },
	}, { scale: 0.25 });

	// render sky
	pipeline.addCubeShaderStage(srcSky, {}, skyBox);

	// render
	pipeline.addClearBuffersStage(scene.input, {
		//[WebGL.COLOR_ATTACHMENT0]: [0, 0, 1, 1],
		[WebGL.COLOR_ATTACHMENT1]: [0, 0, 0, 1],
		[WebGL.COLOR_ATTACHMENT2]: [0.5, 0.5, 0.5, 1],
		[WebGL.DEPTH_ATTACHMENT]: [0],
	});
	pipeline.addRenderStage(render, scene.input);
	pipeline.addShaderStage(srcSkybox, () => ({
		'sky': skyBox.getTexture(WebGL.COLOR_ATTACHMENT0),
		'rot': [
			Math.cos(Date.now() * 0.0001), 0, -Math.sin(Date.now() * 0.0001),
			0, 1, 0,
			Math.sin(Date.now() * 0.0001), 0, Math.cos(Date.now() * 0.0001),
		],
		'perspectiveScale': [projection[14] / projection[0], projection[14] / projection[5], projection[14]],
	}), scene.input, {
		drawBuffers: [WebGL.COLOR_ATTACHMENT0],
		depthTest: WebGL.GEQUAL,
	});
	//pipeline.addShaderStage(srcGradient, {}, scene.input, {
	//	drawBuffers: [WebGL.COLOR_ATTACHMENT0],
	//	depthTest: WebGL.GEQUAL,
	//});
	scene.addMultisampleBlitStage();

	// lighting
	pipeline.addShaderStage(srcLightingAmbient, () => ({
		'texMatt': scene.output.getTexture(WebGL.COLOR_ATTACHMENT0),
		'texMaterial': scene.output.getTexture(WebGL.COLOR_ATTACHMENT1),
		'ambient': 0.2,
	}), lighting);

	const lights = [
		{ position: [20.0, 20.0, -10.0], color: [800.0, 800.0, 800.0] },
		{ position: [-40.0, 10.0, -40.0], color: [1000.0, 400.0, 200.0] },
		{ position: [0.0, -50.0, -30.0], color: [200.0, 200.0, 1000.0] },
	];
	for (const light of lights) {
		pipeline.addShaderStage(srcLighting, () => ({
			'perspectiveScale': [projection[14] / projection[0], projection[14] / projection[5], projection[14]],
			'texMatt': scene.output.getTexture(WebGL.COLOR_ATTACHMENT0),
			'texMaterial': scene.output.getTexture(WebGL.COLOR_ATTACHMENT1),
			'texNormal': scene.output.getTexture(WebGL.COLOR_ATTACHMENT2),
			'texDepth': scene.output.getTexture(WebGL.DEPTH_ATTACHMENT),
			'lightPos': light.position,
			'lightCol': light.color,
		}), lighting, {
			blendSource: WebGL.ONE,
			blendDestination: WebGL.ONE,
			blendEquation: WebGL.FUNC_ADD,
		});
	}

	function calcFisheyeIFov(px, py) {
		// normalize(1.0 / p) * atan(length(1.0 / p))
		const ipx = 1 / px;
		const ipy = 1 / py;
		const ipl = Math.sqrt(ipx * ipx + ipy * ipy);
		const m = Math.atan(ipl);
		return [m * ipx / ipl, m * ipy / ipl];
	}

	// fisheye
	pipeline.addShaderStage(srcFisheye, () => ({
		'source': lighting.getTexture(WebGL.COLOR_ATTACHMENT0),
		'p': [projection[0], projection[5]],
		'ifov': calcFisheyeIFov(projection[0], projection[5]),
	}), scene.output, { drawBuffers: [WebGL.COLOR_ATTACHMENT0] });
	//pipeline.addBlitStage(lighting, scene.output);

	// downscale 1
	pipeline.addBlitStage(scene.output, downBuffer, {
		channels: WebGL.COLOR_BUFFER_BIT,
		interpolation: WebGL.LINEAR,
	});

	// downscale 2
	pipeline.addBlitStage(downBuffer, postBuffer1, {
		channels: WebGL.COLOR_BUFFER_BIT,
		interpolation: WebGL.LINEAR,
	});

	// bloom
	pipeline.addShaderStage(srcBloomThresh, {
		'source': postBuffer1.getTexture(WebGL.COLOR_ATTACHMENT0),
		'threshLow': 0.9,
		'threshHigh': 1.0,
	}, postBuffer2);

	pipeline.addShaderStage(srcBlurX, {
		'source': postBuffer2.getTexture(WebGL.COLOR_ATTACHMENT0),
	}, postBuffer1);

	pipeline.addShaderStage(srcBlurY, {
		'source': postBuffer1.getTexture(WebGL.COLOR_ATTACHMENT0),
	}, postBuffer2);

	// combine
	pipeline.addShaderStage(srcDither, {
		'source': scene.output.getTexture(WebGL.COLOR_ATTACHMENT0),
		'bloom': postBuffer2.getTexture(WebGL.COLOR_ATTACHMENT0),
		'noise': noiseTex,
	}, null);

	function frame() {
		const displayW = gl.canvas.clientWidth;
		const displayH = gl.canvas.clientHeight;
		gl.resize(displayW * displayRes, displayH * displayRes);
		const bufW = Math.round(displayW * renderRes / 8) * 8;
		const bufH = Math.round(displayH * renderRes / 8) * 8;
		pipeline.resize(bufW, bufH);
		pipeline.run();
		window.requestAnimationFrame(frame);
	}

	frame();
});
