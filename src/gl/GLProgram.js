function isIntArray(x) {
	return (x instanceof Int8Array || x instanceof Int16Array || x instanceof Int32Array);
}

function setUniform(gl, locn, value) {
	if (typeof value === 'number') {
		return gl.uniform1f(locn, value);
	}
	if (Array.isArray(value)) {
		if (value.length === 1) {
			if (isIntArray(value)) {
				return gl.uniform1iv(locn, value);
			} else {
				return gl.uniform1fv(locn, value);
			}
		} else if (value.length === 2) {
			if (isIntArray(value)) {
				return gl.uniform2iv(locn, value);
			} else {
				return gl.uniform2fv(locn, value);
			}
		} else if (value.length === 3) {
			if (isIntArray(value)) {
				return gl.uniform3iv(locn, value);
			} else {
				return gl.uniform3fv(locn, value);
			}
		} else if (value.length === 4) {
			if (isIntArray(value)) {
				return gl.uniform4iv(locn, value);
			} else {
				// TODO: uniform4fv
				return gl.uniformMatrix2fv(locn, false, value);
			}
		} else if (value.length === 6) {
			// TODO: 2x3
			return gl.uniformMatrix3x2fv(locn, false, value);
		} else if (value.length === 8) {
			// TODO: 2x4
			return gl.uniformMatrix4x2fv(locn, false, value);
		} else if (value.length === 9) {
			return gl.uniformMatrix3fv(locn, false, value);
		} else if (value.length === 12) {
			// TODO: 3x4
			return gl.uniformMatrix4x3fv(locn, false, value);
		} else if (value.length === 16) {
			return gl.uniformMatrix4fv(locn, false, value);
		} else {
			throw new Error('Unknown array length');
		}
	}
	throw new Error(`Unknown uniform type ${value}`);
}

class GLProgram {
	constructor(gl, ...shaders) {
		const program = gl.createProgram();
		shaders.forEach((shader) => gl.attachShader(program, shader.shader));
		// TODO:
		//  support bindAttribLocation https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindAttribLocation
		gl.linkProgram(program);
		WebGL.debugWarn(gl.getProgramInfoLog(program));
		this.gl = gl;
		this.program = program;
		this.uniforms = new Map();
		this.attributes = new Map();
	}

	getUniformLocationNullable(name) {
		let locn = this.uniforms.get(name);
		if (locn === undefined) {
			locn = this.gl.getUniformLocation(this.program, name);
			this.uniforms.set(name, locn);
		}
		return locn;
	}

	getUniformLocation(name) {
		const locn = this.getUniformLocationNullable(name);
		if (locn === null) {
			throw new Error(`failed to find uniform ${name}`);
		}
		return locn;
	}

	getAttribLocationNullable(name) {
		let locn = this.attributes.get(name);
		if (locn === undefined) {
			locn = this.gl.getAttribLocation(this.program, name);
			this.attributes.set(name, locn);
		}
		return locn;
	}

	getAttribLocation(name) {
		const locn = this.getAttribLocationNullable(name);
		if (locn === null) {
			throw new Error(`failed to find attribute ${name}`);
		}
		return locn;
	}

	use(uniforms = {}) {
		// TODO: https://webgl2fundamentals.org/webgl/lessons/webgl2-whats-new.html#uniform-buffer-objects
		this.gl.useProgram(this.program);

		let textureCount = 0;
		Object.keys(uniforms).forEach((key) => {
			const value = uniforms[key];
			const locn = this.getUniformLocationNullable(key);
			if (!locn) {
				return;
			}
			try {
				if (value instanceof GLTexture) {
					this.gl.activeTexture(WebGL.TEXTURE0 + textureCount);
					this.gl.bindTexture(value.target, value.object);
					this.gl.uniform1i(locn, textureCount);
					textureCount ++;
				} else {
					setUniform(this.gl, locn, value);
				}
			} catch (e) {
				throw new Error(`${e.message} for ${key}`);
			}
		});
	}

	delete() {
		this.gl.deleteProgram(this.program);
	}
}

Object.assign(WebGL.prototype, {
	createProgram(...args) {
		return new GLProgram(this.gl, ...args);
	},
});
