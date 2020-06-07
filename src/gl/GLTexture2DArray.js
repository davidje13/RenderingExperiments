class GLTexture2DArray extends GLTexture3D {
	constructor(gl, internalFormat, width, height, depth, opts) {
		super(gl, internalFormat, width, height, depth, opts, WebGL.TEXTURE_2D_ARRAY);
	}

	loadLayerImage(layer, data, width, height, options) {
		this.loadSubImage(data, 0, 0, layer, width, height, 1, options);
	}

	loadLayerSubImage(layer, data, xoff, yoff, width, height, options) {
		this.loadSubImage(data, xoff, yoff, layer, width, height, 1, options);
	}
}

Object.assign(WebGL.prototype, {
	createTexture2DArray(...args) {
		return new GLTexture2DArray(this.gl, ...args);
	},
});
