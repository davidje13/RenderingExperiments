class WebGL {
	constructor(options = {}) {
		this.canvas = document.createElement('canvas');
		this.resize(options.width, options.height);

		this.gl = this.canvas.getContext('webgl2', options);
		if (!this.gl) {
			throw new Error('WebGL 2 not available');
		}

		// proxy gl.* methods and properties which we don't override
		return new Proxy(this, {
			get(obj, prop) {
				if (!obj[prop] && !obj.hasOwnProperty(prop)) {
					if (typeof obj.gl[prop] === 'function') {
						obj[prop] = obj.gl[prop].bind(obj.gl);
					} else {
						obj[prop] = obj.gl[prop];
					}
				}
				return obj[prop];
			}
		});
	}

	resize(width, height) {
		const w = Math.max(Math.round(width), 1);
		const h = Math.max(Math.round(height), 1);
		if (w !== this.width || h !== this.height) {
			this.canvas.width = this.width = w;
			this.canvas.height = this.height = h;
			this.gl?.viewport(0, 0, this.width, this.height);
		}
	}

	resetFramebuffer() {
		this.gl.bindFramebuffer(WebGL.FRAMEBUFFER, null);
		this.gl.viewport(0, 0, this.width, this.height);
	}

	clear(mode) {
		if (typeof mode === 'number') {
			this.gl.clear(mode);
			return;
		}

		if (!mode) {
			throw new Error('nothing to clear');
		}

		const { color, depth, stencil } = mode;
		let mask;
		if (color) {
			this.gl.clearColor(color[0], color[1], color[2], color[3]);
			mask |= WebGL.COLOR_BUFFER_BIT;
		}
		if (depth !== undefined) {
			this.gl.clearDepth(depth);
			mask |= WebGL.DEPTH_BUFFER_BIT;
		}
		if (stencil !== undefined) {
			this.gl.clearStencil(stencil);
			mask |= WebGL.STENCIL_BUFFER_BIT;
		}
		this.gl.clear(mask);
	}

	clearBuffer(buffer, drawbuffer, values, stencil) {
		// drawbuffer = index in most recent drawBuffers call
		if (buffer === WebGL.DEPTH_STENCIL) {
			if (typeof values === 'number') {
				this.gl.clearBufferfi(buffer, drawbuffer, values, stencil);
			} else {
				this.gl.clearBufferfi(buffer, drawbuffer, values[0], values[1]);
			}
		} else if (values instanceof Int32Array) {
			this.gl.clearBufferiv(buffer, drawbuffer, values);
		} else if (values instanceof Uint32Array) {
			this.gl.clearBufferuiv(buffer, drawbuffer, values);
		} else {
			this.gl.clearBufferfv(buffer, drawbuffer, values);
		}
	}

	clearBuffers(configs) {
		let maxIndex = -1;
		Object.keys(configs).forEach((key) => {
			const target = Number(key);
			if (target >= WebGL.COLOR_ATTACHMENT0 && target < WebGL.COLOR_ATTACHMENT0 + 16) {
				maxIndex = Math.max(maxIndex, target - WebGL.COLOR_ATTACHMENT0);
			}
		});

		if (maxIndex >= 0) {
			// cannot have buffer n go to non-n color attachment,
			// so must bind lots of buffers!
			const buffers = [];
			for (let i = 0; i <= maxIndex; ++ i) {
				buffers.push(WebGL.COLOR_ATTACHMENT0 + i);
			}
			this.gl.drawBuffers(buffers);
		}

		Object.keys(configs).forEach((key) => {
			const target = Number(key);
			const value = configs[key];
			switch (target) {
				case WebGL.DEPTH_ATTACHMENT:
					this.clearBuffer(WebGL.DEPTH, 0, value);
					break;
				case WebGL.STENCIL_ATTACHMENT:
					this.clearBuffer(WebGL.STENCIL, 0, value);
					break;
				case WebGL.DEPTH_STENCIL_ATTACHMENT:
					this.clearBuffer(WebGL.DEPTH_STENCIL, 0, value);
					break;
				default:
					if (target >= WebGL.COLOR_ATTACHMENT0 && target < WebGL.COLOR_ATTACHMENT0 + 16) {
						this.clearBuffer(WebGL.COLOR, target - WebGL.COLOR_ATTACHMENT0, value);
					} else {
						this.clearBuffer(target, 0, value);
					}
			}
		});
	}

	setBlend(
		equation = WebGL.FUNC_ADD,
		srcFunc = WebGL.ONE,
		destFunc = WebGL.ONE,
		color = null,
	) {
		this.gl.blendEquation(equation);
		this.gl.blendFunc(srcFunc, destFunc);
		if (color) {
			this.gl.blendColor(color[0], color[1], color[2], color[3]);
		}
	}
}

WebGL.debugWarn = function(message) {
	if (message) {
		console.warn(message);
	}
}

Object.assign(WebGL, WebGL2RenderingContext);
