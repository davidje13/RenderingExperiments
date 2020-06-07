class GLShader {
	constructor(gl, type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source.replace(/^\s+/, ''));
		gl.compileShader(shader);
		WebGL.debugWarn(gl.getShaderInfoLog(shader));
		this.gl = gl;
		this.shader = shader;
	}

	delete() {
		this.gl.deleteShader(this.shader);
	}
}

Object.assign(WebGL.prototype, {
	createShader(...args) {
		return new GLShader(this.gl, ...args);
	},
});
