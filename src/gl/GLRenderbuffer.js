const bindRenderbuffer = (gl, object) => gl.bindRenderbuffer(WebGL.RENDERBUFFER, object);
const getBoundRenderbufferParam = () => WebGL.RENDERBUFFER_BINDING;
const deleteRenderbuffer = (gl, object) => gl.deleteRenderbuffer(object);

class GLRenderbuffer extends GLBindable {
	constructor(gl, internalFormat, width, height, { multisampleSamples = 0 } = {}) {
		super(gl, gl.createRenderbuffer(), bindRenderbuffer, getBoundRenderbufferParam, deleteRenderbuffer);
		this.internalFormat = internalFormat;
		this.multisampleSamples = multisampleSamples;
		this.resize(width, height);
	}

	resize(width, height) {
		this.doBound(() => {
			if (this.multisampleSamples > 0) {
				this.gl.renderbufferStorageMultisample(
					WebGL.RENDERBUFFER,
					this.multisampleSamples,
					this.internalFormat,
					Math.max(width, 1),
					Math.max(height, 1),
				);
			} else {
				this.gl.renderbufferStorage(
					WebGL.RENDERBUFFER,
					this.internalFormat,
					Math.max(width, 1),
					Math.max(height, 1),
				);
			}
		});
	}
}

Object.assign(WebGL.prototype, {
	createRenderbuffer(...args) {
		return new GLRenderbuffer(this.gl, ...args);
	},
});
