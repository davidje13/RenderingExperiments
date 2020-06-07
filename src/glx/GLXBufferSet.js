const DEFAULT_TEXTURE_PARAMS = {
	[WebGL.TEXTURE_MIN_FILTER]: WebGL.NEAREST,
	[WebGL.TEXTURE_MAG_FILTER]: WebGL.NEAREST,
	[WebGL.TEXTURE_WRAP_R]: WebGL.CLAMP_TO_EDGE,
	[WebGL.TEXTURE_WRAP_S]: WebGL.CLAMP_TO_EDGE,
	[WebGL.TEXTURE_WRAP_T]: WebGL.CLAMP_TO_EDGE,
};

const DEFAULT_CUBE_TEXTURE_PARAMS = {
	[WebGL.TEXTURE_MIN_FILTER]: WebGL.LINEAR,
	[WebGL.TEXTURE_MAG_FILTER]: WebGL.LINEAR,
};

function mapObject(o, fn) {
	const r = {};
	Object.keys(o).forEach((k) => (r[k] = fn(o[k])));
	return r;
}

function makeTarget(gl, width, height, config) {
	if (config.renderbufferOptions) {
		return gl.createRenderbuffer(config.format, width, height, config.renderbufferOptions);
	}

	return gl.createTexture2D(config.format, width, height, {
		parameters: Object.assign({}, DEFAULT_TEXTURE_PARAMS, config.textureParameters),
	});
}

function getChannel(target) {
	switch (target) {
		case WebGL.DEPTH_ATTACHMENT:
			return WebGL.DEPTH_BUFFER_BIT;
		case WebGL.STENCIL_ATTACHMENT:
			return WebGL.STENCIL_BUFFER_BIT;
		case WebGL.DEPTH_STENCIL_ATTACHMENT:
			return WebGL.DEPTH_BUFFER_BIT | WebGL.STENCIL_BUFFER_BIT;
		default:
			if (target >= WebGL.COLOR_ATTACHMENT0 && target < WebGL.COLOR_ATTACHMENT0 + 16) {
				return WebGL.COLOR_BUFFER_BIT;
			}
			throw new Error(`Unknown channel type ${target}`);
	}
}

class GLXBufferSet {
	constructor(gl, width, height, bufferConfigs) {
		this.gl = gl;
		this.width = width;
		this.height = height;
		this.ownedTargets = [];
		this.keyedTargets = {};
		this.lastBoundTargets = {};
		this.channels = 0;

		Object.keys(bufferConfigs).forEach((key) => {
			const config = bufferConfigs[key];

			if (!config) {
				return;
			}

			this.channels |= getChannel(Number(key));

			if (config instanceof GLTexture || config instanceof GLRenderbuffer) {
				this.keyedTargets[key] = config;
				this.lastBoundTargets[key] = config.object;
			} else {
				const target = makeTarget(gl, width, height, config);
				this.ownedTargets.push(target);
				this.keyedTargets[key] = target;
				this.lastBoundTargets[key] = target.object;
			}
		});
		this.framebuffer = gl.createFramebuffer(this.keyedTargets);
	}

	getTexture(target) {
		return this.keyedTargets[target];
	}

	resize(width, height) {
		if (this.width === width && this.height === height) {
			return;
		}

		this.width = width;
		this.height = height;

		this.ownedTargets.forEach((target) => target.resize(width, height));

		this.refreshTargets();
	}

	refreshTargets() {
		const updatedTargets = {};
		Object.keys(this.lastBoundTargets).forEach((key) => {
			const target = this.keyedTargets[key];
			if (this.lastBoundTargets[key] !== target.object) {
				this.lastBoundTargets[key] = target.object;
				updatedTargets[key] = target;
			}
		});
		this.framebuffer.setAttachments(updatedTargets);
	}

	doBound(target, fn) {
		if (!this.framebuffer) {
			throw new Error('incomplete BufferSet');
		}
		const oldViewport = this.gl.getParameter(WebGL.VIEWPORT);
		this.gl.viewport(0, 0, this.width, this.height);
		try {
			return this.framebuffer.doBound(target, fn);
		} finally {
			this.gl.viewport(...oldViewport);
		}
	}

	delete() {
		this.framebuffer?.delete();
		this.ownedTargets.forEach((target) => target.delete());
		this.framebuffer = null;
		this.ownedTargets.length = 0;
		this.keyedTargets = {};
		this.lastBoundTargets = {};
	}
}

class GLXCubeBufferSet {
	constructor(gl, size, bufferConfigs) {
		this.gl = gl;
		this.size = size;
		this.ownedTargets = [];
		this.keyedTargets = {};
		this.lastBoundTargets = {};
		this.channels = 0;

		Object.keys(bufferConfigs).forEach((key) => {
			const config = bufferConfigs[key];

			if (!config) {
				return;
			}

			this.channels |= getChannel(Number(key));

			if (config instanceof GLTexture) {
				if (!config instanceof GLTextureCubeMap) {
					throw new Error('GLXCubeBufferSet textures must be cube maps');
				}
				this.keyedTargets[key] = config;
				this.lastBoundTargets[key] = config.object;
			} else {
				const target = gl.createTextureCubeMap(config.format, size, {
					parameters: Object.assign({}, DEFAULT_CUBE_TEXTURE_PARAMS, config.textureParameters),
				});
				this.ownedTargets.push(target);
				this.keyedTargets[key] = target;
				this.lastBoundTargets[key] = target.object;
			}
		});
		this.framebuffers = {};
		GLXCubeBufferSet.FACES.forEach((faceId) => {
			this.framebuffers[faceId] = gl.createFramebuffer(mapObject(this.keyedTargets, (target) => target.getFace(faceId)));
		});
	}

	getTexture(target) {
		return this.keyedTargets[target];
	}

	resize(size) {
		if (this.size === size) {
			return;
		}

		this.size = size;

		this.ownedTargets.forEach((target) => target.resize(size));

		this.refreshTargets();
	}

	refreshTargets() {
		const updatedTargets = {};
		Object.keys(this.lastBoundTargets).forEach((key) => {
			const target = this.keyedTargets[key];
			if (this.lastBoundTargets[key] !== target.object) {
				this.lastBoundTargets[key] = target.object;
				updatedTargets[key] = target;
			}
		});
		GLXCubeBufferSet.FACES.forEach((faceId) => {
			this.framebuffers[faceId].setAttachments(mapObject(updatedTargets, (target) => target.getFace(faceId)));
		});
	}

	getFace(faceId) {
		return {
			doBound: (target, fn) => {
				if (!this.framebuffers) {
					throw new Error('incomplete BufferSet');
				}
				const oldViewport = this.gl.getParameter(WebGL.VIEWPORT);
				this.gl.viewport(0, 0, this.size, this.size);
				try {
					return this.framebuffers[faceId].doBound(target, fn);
				} finally {
					this.gl.viewport(...oldViewport);
				}
			}
		};
	}

	delete() {
		GLXCubeBufferSet.FACES.forEach((faceId) => {
			this.framebuffers[faceId].delete();
		});
		this.ownedTargets.forEach((target) => target.delete());
		this.framebuffers = null;
		this.ownedTargets.length = 0;
		this.keyedTargets = {};
		this.lastBoundTargets = {};
	}
}

GLXCubeBufferSet.FACES = GLTextureCubeMap.FACES;
