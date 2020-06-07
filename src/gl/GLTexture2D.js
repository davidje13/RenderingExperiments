class GLTexture2D extends GLTexture {
	constructor(gl, internalFormat, width, height, {
		format = null,
		type = null,
		data = null,
		unpackAlignment = 1,
		mipmapLevels = 1,
		parameters = {},
	} = {}) {
		super(gl, gl.createTexture(), WebGL.TEXTURE_2D, internalFormat);
		this.setParameters(parameters);
		this.mipmapLevels = mipmapLevels;
		this.parameters = parameters;
		this.immutable = false;
		if (data) {
			this.loadImage(data, width, height, { format, type, unpackAlignment });
			if (mipmapLevels > 1) {
				throw new Error('unimplemented');
			}
		} else {
			this.resize(width, height, { immutable: true });
		}
	}

	rebuild() {
		this.delete();
		this.object = this.gl.createTexture();
		this.setParameters(this.parameters);
	}

	resize(width, height, { immutable = null } = {}) {
		const w = Math.max(width, 1);
		const h = Math.max(height, 1);
		if (w === this.width && h === this.height) {
			return;
		}
		if (this.immutable) {
			this.rebuild();
		}
		if (immutable !== null) {
			this.immutable = immutable;
		}
		this.width = w;
		this.height = h;
		if (this.immutable) {
			this.doBound(() => this.gl.texStorage2D(
				this.target,
				this.mipmapLevels,
				this.internalFormat,
				this.width,
				this.height,
			));
		} else {
			this.loadImage(null, this.width, this.height);
		}
	}

	loadImage(data, width, height, {
		format = null,
		type = null,
		unpackAlignment = 1,
		mipmapLevel = 0,
	} = {}) {
		if (this.immutable) {
			if (
				(width << mipmapLevel) !== this.width ||
				(height << mipmapLevel) !== this.height
			) {
				throw new Error('Cannot load data of different size into immutable texture');
			}
			return this.loadSubImage(data, 0, 0, width, height, {
				format,
				type,
				unpackAlignment,
				mipmapLevel,
			});
		}

		if (data && (width <= 0 || height <= 0)) {
			throw new Error(`Invalid image dimension ${width} x ${height}`);
		}
		this.width = Math.max(width << mipmapLevel, 1);
		this.height = Math.max(height << mipmapLevel, 1);
		const match = GLTexture.getFormatType(this.internalFormat, format, type);
		this.gl.pixelStorei(WebGL.UNPACK_ALIGNMENT, unpackAlignment);

		this.doBound(() => this.gl.texImage2D(
			this.target,
			mipmapLevel,
			this.internalFormat,
			this.width >> mipmapLevel,
			this.height >> mipmapLevel,
			0,
			match.format,
			match.type,
			data,
		));
	}

	loadSubImage(data, xoff, yoff, width, height, {
		format = null,
		type = null,
		unpackAlignment = 1,
		mipmapLevel = 0,
	} = {}) {
		const match = GLTexture.getFormatType(this.internalFormat, format, type);
		this.gl.pixelStorei(WebGL.UNPACK_ALIGNMENT, unpackAlignment);

		this.doBound(() => this.gl.texSubImage2D(this.target, mipmapLevel, xoff, yoff, width, height, match.format, match.type, data));
	}
}

Object.assign(WebGL.prototype, {
	createTexture2D(...args) {
		return new GLTexture2D(this.gl, ...args);
	},
});
