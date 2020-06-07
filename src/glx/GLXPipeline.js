// Thanks (ish), https://www.khronos.org/opengl/wiki/Cubemap_Texture#Upload_and_orientation
const CUBE_FACE_DIRS = {
	[WebGL.TEXTURE_CUBE_MAP_POSITIVE_X]: [ 0, 0,-1,  0,-1, 0,  1, 0, 0],
	[WebGL.TEXTURE_CUBE_MAP_NEGATIVE_X]: [ 0, 0, 1,  0,-1, 0, -1, 0, 0],
	[WebGL.TEXTURE_CUBE_MAP_POSITIVE_Y]: [ 1, 0, 0,  0, 0, 1,  0, 1, 0],
	[WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: [ 1, 0, 0,  0, 0,-1,  0,-1, 0],
	[WebGL.TEXTURE_CUBE_MAP_POSITIVE_Z]: [ 1, 0, 0,  0,-1, 0,  0, 0, 1],
	[WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: [-1, 0, 0,  0,-1, 0,  0, 0,-1],
};

class GLXPipeline {
	constructor(gl, width, height) {
		this.gl = gl;
		this.width = width;
		this.height = height;
		this.buffers = [];
		this.stages = [];
		this.ownedProgs = [];

		this.vertFullscreen = gl.createShader(WebGL.VERTEX_SHADER, `
			#version 300 es
			precision highp float;
			precision highp int;

			smooth out vec2 uv;

			void main() {
				uv = vec2(gl_VertexID % 2, gl_VertexID / 2);
				gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
			}
		`);

		this.vertFullscreenCubeMap = gl.createShader(WebGL.VERTEX_SHADER, `
			#version 300 es
			precision highp float;
			precision highp int;

			uniform mat3 glx_face;
			smooth out vec3 uvw;

			void main() {
				vec2 uv = vec2(gl_VertexID % 2, gl_VertexID / 2) * 2.0 - 1.0;
				uvw = glx_face * vec3(uv, 1.0);
				gl_Position = vec4(uv, 0.0, 1.0);
			}
		`);
	}

	resize(width, height) {
		if (this.width === width && this.height === height) {
			return;
		}

		this.width = width;
		this.height = height;
		this.buffers.forEach(({ bufferSet, scale, width, height, size }) => {
			if (bufferSet instanceof GLXCubeBufferSet) {
				bufferSet.resize(Math.round((size || Math.max(this.width, this.height)) * scale));
			} else {
				bufferSet.resize(
					Math.round((width || this.width) * scale),
					Math.round((height || this.height) * scale),
				);
			}
		});
	}

	createBufferSet(bufferConfigs, { scale = 1.0, width = 0, height = 0 } = {}) {
		const bufferSet = new GLXBufferSet(
			this.gl,
			Math.round((width || this.width) * scale),
			Math.round((height || this.height) * scale),
			bufferConfigs,
		);
		this.buffers.push({ bufferSet, scale, width, height });
		return bufferSet;
	}

	createCubeBufferSet(bufferConfigs, { scale = 1.0, size = 0 } = {}) {
		const bufferSet = new GLXCubeBufferSet(
			this.gl,
			Math.round((size || Math.max(this.width, this.height)) * scale),
			bufferConfigs,
		);
		this.buffers.push({ bufferSet, scale, size });
		return bufferSet;
	}

	addRenderStage(fn, toBuffer) {
		if (toBuffer) {
			this.stages.push(() => toBuffer.doBound(() => fn(toBuffer.width, toBuffer.height)));
		} else {
			this.stages.push(() => fn(this.width, this.height));
		}
	}

	addBlitStage(fromBuffer, toBuffer, { channels, interpolation } = {}) {
		if (fromBuffer === toBuffer) {
			throw new Error('Blitting within same buffer is not permitted');
		}
		const binding = GLBindable.of({
			[WebGL.READ_FRAMEBUFFER]: fromBuffer,
			[WebGL.DRAW_FRAMEBUFFER]: toBuffer,
		});
		this.stages.push(() => binding.doBound(() => this.gl.blitFramebuffer(
			0, 0, fromBuffer.width, fromBuffer.height,
			0, 0, toBuffer.width, toBuffer.height,
			channels || (fromBuffer.channels & toBuffer.channels),
			interpolation || WebGL.NEAREST,
		)));
	}

	_compileShaderProgram(vert, shader) {
		if (shader instanceof GLProgram) {
			return shader;
		}
		if (shader instanceof GLShader) {
			const prog = this.gl.createProgram(vert, shader);
			this.ownedProgs.push(prog);
			return prog;
		}
		if (typeof shader === 'string') {
			const frag = this.gl.createShader(WebGL.FRAGMENT_SHADER, shader);
			const prog = this.gl.createProgram(vert, frag);
			frag.delete();
			this.ownedProgs.push(prog);
			return prog;
		}
		throw new Error(`Unknown shader type ${shader}`);
	}

	addShaderStage(shader, progOptions = {}, toBuffer = null, {
		drawBuffers = null,
		blendSource = null,
		blendDestination = null,
		blendEquation = null,
		depthTest = null,
	} = {}) {
		if (progOptions instanceof GLXBufferSet) {
			throw new Error('missing program options argument');
		}
		const prog = this._compileShaderProgram(this.vertFullscreen, shader);
		const fn = () => {
			if (drawBuffers) {
				this.gl.drawBuffers(drawBuffers);
			}
			if (blendSource !== null || blendDestination !== null || blendEquation !== null) {
				this.gl.setBlend(blendEquation, blendSource, blendDestination);
				this.gl.enable(WebGL.BLEND);
			}
			if (depthTest !== null) {
				this.gl.depthFunc(depthTest);
				this.gl.enable(WebGL.DEPTH_TEST);
			}
			if (typeof progOptions === 'function') {
				prog.use(progOptions());
			} else {
				prog.use(progOptions);
			}
			this.gl.drawArrays(WebGL.TRIANGLE_STRIP, 0, 4);
			if (blendSource !== null || blendDestination !== null || blendEquation !== null) {
				this.gl.disable(WebGL.BLEND);
			}
			if (depthTest !== null) {
				this.gl.disable(WebGL.DEPTH_TEST);
			}
		};
		if (toBuffer) {
			this.stages.push(() => toBuffer.doBound(fn));
		} else {
			this.stages.push(fn);
		}
	}

	addCubeShaderStage(shader, progOptions, toBuffer, options = {}) {
		const prog = this._compileShaderProgram(this.vertFullscreenCubeMap, shader);
		GLXCubeBufferSet.FACES.forEach((faceId) => {
			const faceProgOptions = {
				glx_face: CUBE_FACE_DIRS[faceId],
			};
			let fullProgOptions;
			if (typeof progOptions === 'function') {
				fullProgOptions = (...args) => ({
					...progOptions(...args),
					...faceProgOptions,
				});
			} else {
				fullProgOptions = {
					...progOptions,
					...faceProgOptions,
				};
			}
			this.addShaderStage(prog, fullProgOptions, toBuffer.getFace(faceId), options);
		});
	}

	addClearStage(toBuffer, drawBuffers, options) {
		this.addRenderStage(() => {
			this.gl.drawBuffers(drawBuffers);
			this.gl.clear(options);
		}, toBuffer);
	}

	addClearBuffersStage(toBuffer, configs) {
		this.addRenderStage(() => this.gl.clearBuffers(configs), toBuffer);
	}

	createMultisampleBufferSets(bufferConfigs, {
		multisampleSamples = 1,
		outputs = null,
		...options
	} = {}) {
		if (multisampleSamples <= 0) {
			const buffer = this.createBufferSet(bufferConfigs, options);

			return {
				input: buffer,
				output: buffer,
				addMultisampleBlitStage: () => null,
			};
		}

		const multisampleConfigs = {};
		const blitConfigs = {};
		let targetCount = 0;
		Object.keys(bufferConfigs).forEach((key) => {
			const config = bufferConfigs[key];
			multisampleConfigs[key] = {
				...config,
				textureParameters: null,
				renderbufferOptions: {
					...config.renderbufferOptions,
					multisampleSamples,
				},
			};
			if (!outputs || outputs.includes(Number(key))) {
				blitConfigs[key] = config;
				++ targetCount;
			}
		});
		if (outputs && targetCount !== outputs.length) {
			throw new Error('outputs mismatch');
		}

		const inputBuffer = this.createBufferSet(multisampleConfigs, options);
		const outputBuffer = this.createBufferSet(blitConfigs, options);

		return {
			input: inputBuffer,
			output: outputBuffer,

			// cannot use render target as texture or resize while blitting, so if
			// multisample is active we must blit into a texture for the next operation
			addMultisampleBlitStage: () => this.addBlitStage(inputBuffer, outputBuffer, {
				interpolation: WebGL.NEAREST,
			}),
		};
	}

	run() {
		this.stages.forEach((stage) => stage());
	}

	delete() {
		this.buffers.forEach((buffer) => buffer.bufferSet.delete());
		this.buffers.length = 0;
		this.stages.length = 0;
		this.vertFullscreen.delete();
		this.vertFullscreen = null;
		this.vertFullscreenCubeMap.delete();
		this.vertFullscreenCubeMap = null;
		this.ownedProgs.forEach((prog) => prog.delete());
		this.ownedProgs.length = 0;
	}
}
